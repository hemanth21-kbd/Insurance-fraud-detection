import React from 'react';
import { Database, Server, Cpu, Network, LayoutDashboard, FileText, ArrowRight } from 'lucide-react';

export default function Architecture() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Architecture</h1>
        <p className="text-slate-500 mt-2">Real-time Data Pipeline, Model Workflow, and API Endpoints</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Frontend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Frontend (React)</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Explainable AI Dashboard visualizing fraud networks, hospital risk scores, and claim risk levels.
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center"><ArrowRight className="w-4 h-4 mr-2 text-slate-400" /> Real-time Claim Submission UI</li>
            <li className="flex items-center"><ArrowRight className="w-4 h-4 mr-2 text-slate-400" /> Fraud Network Graph (D3/ForceGraph)</li>
            <li className="flex items-center"><ArrowRight className="w-4 h-4 mr-2 text-slate-400" /> Explainable AI Highlighting</li>
          </ul>
        </div>

        {/* Backend API */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Server className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Backend API (FastAPI)</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            REST API endpoints for claim submission and real-time data pipeline orchestration.
          </p>
          <ul className="space-y-2 text-sm text-slate-700 font-mono text-xs">
            <li className="flex items-center"><span className="text-emerald-600 font-bold mr-2">POST</span> /api/claims/submit</li>
            <li className="flex items-center"><span className="text-blue-600 font-bold mr-2">GET</span> /api/hospitals/&#123;id&#125;/risk</li>
            <li className="flex items-center"><span className="text-blue-600 font-bold mr-2">GET</span> /api/network/graph</li>
          </ul>
        </div>

        {/* ML & OCR Engine */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">ML & OCR Engine</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Python-based inference engine using Scikit-learn, TensorFlow, and NetworkX.
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center"><ArrowRight className="w-4 h-4 mr-2 text-slate-400" /> OCR Bill Extraction (Tesseract)</li>
            <li className="flex items-center"><ArrowRight className="w-4 h-4 mr-2 text-slate-400" /> Isolation Forest / Autoencoder</li>
            <li className="flex items-center"><ArrowRight className="w-4 h-4 mr-2 text-slate-400" /> NetworkX Graph Analysis</li>
          </ul>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Real-Time Fraud Scoring Pipeline</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          
          <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200 w-full md:w-1/5">
            <FileText className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="font-semibold text-sm">1. Claim Upload</h3>
            <p className="text-xs text-slate-500 mt-1">Hospital/Insurance submits bill image & data</p>
          </div>

          <ArrowRight className="hidden md:block w-6 h-6 text-slate-300 flex-shrink-0" />

          <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200 w-full md:w-1/5">
            <Cpu className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="font-semibold text-sm">2. OCR Extraction</h3>
            <p className="text-xs text-slate-500 mt-1">Extracts patient ID, diagnosis, medicines, total</p>
          </div>

          <ArrowRight className="hidden md:block w-6 h-6 text-slate-300 flex-shrink-0" />

          <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200 w-full md:w-1/5">
            <Database className="w-8 h-8 text-emerald-500 mb-2" />
            <h3 className="font-semibold text-sm">3. Cross-Verification</h3>
            <p className="text-xs text-slate-500 mt-1">Checks against medical guidelines & cost datasets</p>
          </div>

          <ArrowRight className="hidden md:block w-6 h-6 text-slate-300 flex-shrink-0" />

          <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200 w-full md:w-1/5">
            <Network className="w-8 h-8 text-purple-500 mb-2" />
            <h3 className="font-semibold text-sm">4. ML & NetworkX</h3>
            <p className="text-xs text-slate-500 mt-1">Isolation Forest anomaly & graph relationship check</p>
          </div>

          <ArrowRight className="hidden md:block w-6 h-6 text-slate-300 flex-shrink-0" />

          <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200 w-full md:w-1/5">
            <LayoutDashboard className="w-8 h-8 text-rose-500 mb-2" />
            <h3 className="font-semibold text-sm">5. Explainable AI</h3>
            <p className="text-xs text-slate-500 mt-1">Assigns Low/Medium/High risk & triggers alerts</p>
          </div>

        </div>
      </div>

      {/* Database Schema */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Database Schema (PostgreSQL / Neo4j)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium text-slate-700 mb-3 border-b pb-2">Relational Data (Claims & Entities)</h3>
            <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto font-mono">
{`Table Claims {
  id varchar [primary key]
  hospital_id varchar
  patient_id varchar
  doctor_id varchar
  diagnosis_code varchar
  total_amount decimal
  submission_date timestamp
  fraud_score float
  risk_level varchar
}

Table Medical_Guidelines {
  diagnosis_code varchar [primary key]
  standard_procedures jsonb
  avg_cost decimal
}`}
            </pre>
          </div>
          <div>
            <h3 className="font-medium text-slate-700 mb-3 border-b pb-2">Graph Data (NetworkX / Neo4j)</h3>
            <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto font-mono">
{`Node Patient { id, name, risk_score }
Node Hospital { id, name, risk_score }
Node Doctor { id, name, specialty }
Node Agent { id, name }

Edge TREATED_AT (Patient -> Hospital)
Edge FILED_BY (Claim -> Agent)
Edge DIAGNOSED_BY (Patient -> Doctor)

// Cypher/NetworkX Query Example:
// Detect patients visiting multiple high-risk hospitals
MATCH (p:Patient)-[:TREATED_AT]->(h:Hospital)
WHERE h.risk_score > 80
WITH p, count(h) as hospital_count
WHERE hospital_count > 3
RETURN p`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
