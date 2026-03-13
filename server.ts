import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

// Simple Graph implementation to simulate NetworkX
class FraudGraph {
  nodes: Map<string, any> = new Map();
  edges: Map<string, any[]> = new Map();

  addNode(id: string, type: string, data: any = {}) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { type, ...data });
      this.edges.set(id, []);
    }
  }

  addEdge(source: string, target: string, weight: number = 1) {
    if (this.nodes.has(source) && this.nodes.has(target)) {
      this.edges.get(source)?.push({ target, weight });
      this.edges.get(target)?.push({ target: source, weight }); // Undirected
    }
  }

  getDegreeCentrality(nodeId: string) {
    if (!this.nodes.has(nodeId)) return 0;
    const edges = this.edges.get(nodeId) || [];
    return edges.length / (this.nodes.size - 1 || 1);
  }
}

const fraudGraph = new FraudGraph();
const recentClaims: any[] = [];

// Mock Isolation Forest / Autoencoder scoring
function calculateMLFraudScore(extractedData: any) {
  let score = 0;
  const reasons = [];

  // Simulate Isolation Forest anomaly detection
  if (extractedData.totalAmount > 10000) {
    score += 30;
    reasons.push("Isolation Forest: Total amount is statistically anomalous compared to historical claims.");
  }

  // Simulate Autoencoder reconstruction error
  if (extractedData.medicines && extractedData.medicines.length > 10) {
    score += 25;
    reasons.push("Autoencoder: High reconstruction error detected for medicine quantity vs diagnosis.");
  }

  if (extractedData.diagnosis && extractedData.diagnosis.toLowerCase().includes("routine") && extractedData.totalAmount > 1000) {
    score += 40;
    reasons.push("Rule Engine: Mismatch between 'routine' diagnosis and high billing amount.");
  }

  return {
    score: Math.min(score, 100),
    reasons
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post('/api/claims/submit', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      let apiKey = req.headers['x-api-key'] || process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (Array.isArray(apiKey)) apiKey = apiKey[0];
      console.log('API Key length:', apiKey?.length, 'Starts with:', typeof apiKey === 'string' ? apiKey.substring(0, 4) : '');
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(500).json({ error: 'API Key is not configured on the server or provided in the request.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
      You are an advanced Fraud Intelligence AI. Analyze this medical bill image.
      1. Perform OCR to extract: hospitalName, patientId, diagnosis, procedureCodes, medicines, quantities, dates, and totalAmount.
      2. Perform automated cross-verification: Check for inflated billing, duplicate procedures, unnecessary treatments, abnormal medicine quantities, or mismatches between diagnosis and procedures.
      3. Calculate an initial fraud probability score from 0 to 100 based on your analysis.
      4. Classify the risk level as "Low Risk", "Medium Risk", or "High Risk".
      5. Provide explainable AI reasons for your score.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: prompt + '\n\nIMPORTANT: You must return the response as a valid JSON object with the following structure: { "extractedData": { "hospitalName": "string", "patientId": "string", "diagnosis": "string", "totalAmount": number, "medicines": ["string"] }, "aiFraudScore": number, "riskLevel": "string", "explainableReasons": ["string"] }' }
          ]
        },
        config: {
          responseMimeType: "application/json",
        }
      });

      let responseText = response.text || "{}";
      // Clean up potential markdown formatting from the response
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const aiResult = JSON.parse(responseText);
      const extractedData = aiResult.extractedData || {};

      // 2. ML Models (Isolation Forest / Autoencoder simulation)
      const mlResult = calculateMLFraudScore(extractedData);

      // 3. Combine Scores
      const finalScore = Math.min(100, Math.max(0, (aiResult.aiFraudScore * 0.6) + (mlResult.score * 0.4)));
      
      let finalRiskLevel = "Low Risk";
      if (finalScore > 75) finalRiskLevel = "High Risk";
      else if (finalScore > 40) finalRiskLevel = "Medium Risk";

      const allReasons = [...aiResult.explainableReasons, ...mlResult.reasons];

      // 4. Fraud Network Detection (NetworkX simulation)
      const hospitalId = extractedData.hospitalName || "Unknown Hospital";
      const patientId = extractedData.patientId || "Unknown Patient";
      
      fraudGraph.addNode(hospitalId, 'hospital');
      fraudGraph.addNode(patientId, 'patient');
      fraudGraph.addEdge(patientId, hospitalId, finalScore / 100);

      const hospitalRiskScore = fraudGraph.getDegreeCentrality(hospitalId) * 100;

      const newClaim = {
        id: `CLM-${Math.floor(Math.random() * 100000)}`,
        hospitalId: hospitalId,
        amount: extractedData.totalAmount || 0,
        fraudProb: finalScore / 100,
        timestamp: new Date().toISOString()
      };
      recentClaims.unshift(newClaim);
      if (recentClaims.length > 50) recentClaims.pop();

      res.json({
        success: true,
        extractedData,
        fraudScore: finalScore,
        riskLevel: finalRiskLevel,
        reasons: allReasons,
        networkAnalysis: {
          hospitalRiskScore,
          connections: fraudGraph.edges.get(hospitalId)?.length || 0
        }
      });

    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.get('/api/network/hospital-risk', (req, res) => {
    try {
      const risks = Array.from(fraudGraph.nodes.entries())
        .filter(([_, data]) => data.type === 'hospital')
        .map(([id, _]) => ({
          hospitalName: id,
          riskScore: fraudGraph.getDegreeCentrality(id) * 100,
          connections: fraudGraph.edges.get(id)?.length || 0
        }))
        .sort((a, b) => b.riskScore - a.riskScore);
      
      res.json(risks);
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.get('/api/claims/recent', (req, res) => {
    try {
      res.json(recentClaims.slice(0, 10)); // Return top 10 recent claims
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
