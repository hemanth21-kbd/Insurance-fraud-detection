import 'dotenv/config';
import express from 'express';
import serverless from 'serverless-http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

// If you want to use Hugging Face instead of Gemini for OCR / text inference,
// set these env vars in Render/Vercel:
//   HUGGINGFACE_API_KEY
//   HUGGINGFACE_MODEL (optional, default: 'microsoft/trocr-base-printed')
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'microsoft/trocr-base-printed';

async function runHuggingFaceOCR(base64Data: string): Promise<string> {
  if (!HF_API_KEY) throw new Error('Hugging Face API key is not configured');

  const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: base64Data, options: { wait_for_model: true } }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face inference error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data.length > 0 && typeof data[0].generated_text === 'string') {
    return data[0].generated_text;
  }

  // Some models return raw text directly
  if (typeof data.text === 'string') return data.text;

  return JSON.stringify(data);
}

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

// Mock heatmap data
const mockHeatmapData = [
  {
    hospital_name: "City General Hospital",
    location: [-74.006, 40.7128],
    address: "123 Main St, New York, NY",
    avg_fraud_probability: 0.85,
    risk_level: "High Risk",
    risk_color: "#ef4444",
    claim_count: 1250,
    avg_claim_amount: 8500,
    total_claim_amount: 10625000,
    hospital_rating: 3.2,
    coordinates: { lat: 40.7128, lng: -74.006 }
  },
  {
    hospital_name: "Metro Medical Center",
    location: [-87.6298, 41.8781],
    address: "456 Health Ave, Chicago, IL",
    avg_fraud_probability: 0.65,
    risk_level: "Medium Risk",
    risk_color: "#f59e0b",
    claim_count: 980,
    avg_claim_amount: 6200,
    total_claim_amount: 6087600,
    hospital_rating: 4.1,
    coordinates: { lat: 41.8781, lng: -87.6298 }
  },
  {
    hospital_name: "Valley Health System",
    location: [-118.2437, 34.0522],
    address: "789 Care Blvd, Los Angeles, CA",
    avg_fraud_probability: 0.25,
    risk_level: "Low Risk",
    risk_color: "#10b981",
    claim_count: 750,
    avg_claim_amount: 4200,
    total_claim_amount: 3150000,
    hospital_rating: 4.8,
    coordinates: { lat: 34.0522, lng: -118.2437 }
  }
];

// Mock alerts data
let mockAlerts: any[] = [
  {
    alert_id: "ALT-001",
    claim_id: "CLM-12345",
    hospital_name: "City General Hospital",
    fraud_score: 0.92,
    risk_level: "Critical",
    timestamp: new Date().toISOString(),
    suspicious_indicators: ["Unusual claim frequency", "High-value procedures"],
    status: "active",
    escalation_level: "High"
  },
  {
    alert_id: "ALT-002",
    claim_id: "CLM-12346",
    hospital_name: "Metro Medical Center",
    fraud_score: 0.78,
    risk_level: "High",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    suspicious_indicators: ["Duplicate billing codes"],
    status: "active",
    escalation_level: "Medium"
  }
];

let monitoringActive = false;

// Mock Isolation Forest / Autoencoder scoring
async function calculateMLFraudScore(extractedData: any) {
  try {
    // Map extracted data to ML model features
    const claimData = {
      treatment_cost: extractedData.totalAmount * 0.8 || 0, // Estimate treatment cost as 80% of total
      claim_amount: extractedData.totalAmount || 0,
      admission_days: extractedData.admissionDays || 0,
      test_count: extractedData.testCount || 0,
      age: extractedData.patientAge || 45,
      hospital_rating: extractedData.hospitalRating || 3.0,
      previous_claims: extractedData.previousClaims || 0,
      diagnosis_complexity: extractedData.diagnosisCount || 5.0,
      medicines: extractedData.medicines || [],
      procedure_codes: extractedData.procedures || []
    };

    // Call the trained Python model for real ML scoring
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonBackendUrl}/api/ml/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        claim_data: claimData
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        score: result.fraud_score,
        reasons: result.reasons || ['ML model prediction']
      };
    } else {
      console.error('Python ML API failed, falling back to mock scoring');
      // Fallback to mock scoring
      return calculateMockFraudScore(extractedData);
    }
  } catch (error) {
    console.error('Error calling Python ML API:', error);
    // Fallback to mock scoring
    return calculateMockFraudScore(extractedData);
  }
}

function calculateMockFraudScore(extractedData: any) {
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

function setupApiRoutes(app: express.Express) {
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

      const useHF = !!HF_API_KEY;
      let extractedData: any = {};
      let aiFraudScore = 50;
      let aiReasons: string[] = [];

      if (useHF) {
        // Use Hugging Face Inference to OCR the image
        const ocrText = await runHuggingFaceOCR(imageBase64);

        // Basic heuristic extraction from OCR output
        const amountMatch = ocrText.match(/\$?\s*([0-9]+(?:\.[0-9]{2})?)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        const patientIdMatch = ocrText.match(/Patient\s*ID[:\s]*([A-Za-z0-9-]+)/i);
        const patientId = patientIdMatch ? patientIdMatch[1] : "unknown";

        extractedData = {
          hospitalName: "Unknown Hospital",
          patientId,
          diagnosis: ocrText.slice(0, 150),
          totalAmount: amount,
          medicines: []
        };

        aiFraudScore = amount > 5000 ? 75 : 30;
        aiReasons = [
          "OCR via Hugging Face Inference",
          `Detected total amount: $${amount.toFixed(2)}`
        ];
      } else {
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
        extractedData = aiResult.extractedData || {};
        aiFraudScore = aiResult.aiFraudScore;
        aiReasons = aiResult.explainableReasons || [];
      }

      // 2. ML Models (Isolation Forest / Autoencoder simulation)
      const mlResult = await calculateMLFraudScore(extractedData);

      // 3. Combine Scores
      const finalScore = Math.min(100, Math.max(0, (aiFraudScore * 0.6) + (mlResult.score * 0.4)));
      
      let finalRiskLevel = "Low Risk";
      if (finalScore > 75) finalRiskLevel = "High Risk";
      else if (finalScore > 40) finalRiskLevel = "Medium Risk";

      const allReasons = [...aiReasons, ...mlResult.reasons];

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

  // Heatmap endpoint
  app.get('/api/heatmap', (req, res) => {
    try {
      const { hospital, claim_type, risk_level, date_from, date_to } = req.query;
      
      let filteredData = [...mockHeatmapData];
      
      if (hospital) {
        const hospitals = Array.isArray(hospital) ? hospital : [hospital];
        filteredData = filteredData.filter(h => hospitals.includes(h.hospital_name));
      }
      
      if (risk_level) {
        const levels = Array.isArray(risk_level) ? risk_level : [risk_level];
        filteredData = filteredData.filter(h => levels.includes(h.risk_level));
      }
      
      // Mock filtering by date (not implemented in detail)
      if (date_from && date_to) {
        // In a real implementation, filter by date range
      }
      
      res.json({
        heatmap_data: filteredData,
        total_hospitals: filteredData.length,
        high_risk_hospitals: filteredData.filter(h => h.risk_level === 'High Risk').length,
        summary: {
          avg_fraud_probability: filteredData.reduce((sum, h) => sum + h.avg_fraud_probability, 0) / filteredData.length,
          total_claims: filteredData.reduce((sum, h) => sum + h.claim_count, 0),
          total_amount: filteredData.reduce((sum, h) => sum + h.total_claim_amount, 0)
        }
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Alerts endpoints
  app.get('/api/alerts', (req, res) => {
    try {
      const { threshold = 0.5, limit = 50, status } = req.query;
      let filteredAlerts = mockAlerts.filter(alert => alert.fraud_score >= parseFloat(threshold as string));
      
      if (status) {
        filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
      }
      
      filteredAlerts = filteredAlerts.slice(0, parseInt(limit as string));
      
      res.json({
        alerts: filteredAlerts,
        total: filteredAlerts.length,
        active: filteredAlerts.filter(a => a.status === 'active').length
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.get('/api/alerts/monitoring/status', (req, res) => {
    try {
      res.json({ monitoring_active: monitoringActive });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/alerts/monitoring/start', (req, res) => {
    try {
      const { threshold = 0.75 } = req.body;
      monitoringActive = true;
      // Simulate starting monitoring
      setTimeout(() => {
        // Add a new mock alert periodically
        const newAlert = {
          alert_id: `ALT-${Date.now()}`,
          claim_id: `CLM-${Math.floor(Math.random() * 10000)}`,
          hospital_name: mockHeatmapData[Math.floor(Math.random() * mockHeatmapData.length)].hospital_name,
          fraud_score: Math.random() * 0.5 + 0.5,
          risk_level: "High",
          timestamp: new Date().toISOString(),
          suspicious_indicators: ["Automated detection"],
          status: "active",
          escalation_level: "Medium",
          notes: ""
        };
        mockAlerts.unshift(newAlert);
        if (mockAlerts.length > 20) mockAlerts = mockAlerts.slice(0, 20);
      }, 10000); // Add alert after 10 seconds
      
      res.json({ status: 'started', threshold });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/alerts/monitoring/stop', (req, res) => {
    try {
      monitoringActive = false;
      res.json({ status: 'stopped' });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.put('/api/alerts/:alertId', (req, res) => {
    try {
      const { alertId } = req.params;
      const { status, notes } = req.body;
      
      const alertIndex = mockAlerts.findIndex(a => a.alert_id === alertId);
      if (alertIndex !== -1) {
        mockAlerts[alertIndex].status = status;
        mockAlerts[alertIndex].notes = notes;
        res.json({ status: 'updated' });
      } else {
        res.status(404).json({ error: 'Alert not found' });
      }
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Simulator proxy endpoints
  app.post('/api/simulator/predict', async (req, res) => {
    try {
      const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${pythonBackendUrl}/api/simulator/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Simulator API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.get('/api/simulator/scenarios', async (req, res) => {
    try {
      const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${pythonBackendUrl}/api/simulator/scenarios`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Simulator scenarios API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0',
      services: {
        ml_model: 'not_loaded',
        database: 'connected'
      }
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });
}

const isVercel = !!process.env.VERCEL;
const app = express();
setupApiRoutes(app);

if (!isVercel) {
  // Local development: start Vite dev server + Express for APIs
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  })
    .then((vite) => {
      app.use(vite.middlewares);

      const PORT = 3000;
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start Vite dev server:', err);
    });
}

export default serverless(app);
