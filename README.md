# 🛡️ Health Insurance Fraud Detection System

> AI-Powered De-Siloed Fraud Intelligence Platform with Explainable AI, Risk Heatmaps, Real-time Alerts, and ML-based Fraud Scoring.

<div align="center">

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Vercel-black?style=for-the-badge)](https://insurance-fraud-detection.vercel.app)
[![Backend API](https://img.shields.io/badge/🔧_API-Render-46E3B7?style=for-the-badge)](https://health-insurance-fraud-backend.onrender.com/api/health)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)

</div>

## ✨ Features

| Feature | Description |
|---------|------------|
| 🔍 **Real-Time Claim Submission** | Upload medical bills for instant OCR extraction and fraud scoring using Gemini AI |
| 📊 **Fraud Analytics Dashboard** | Interactive charts and network graph visualization |
| 🗺️ **Fraud Risk Heatmap** | Geographic visualization of hospital fraud patterns using Leaflet maps |
| 🤖 **AI Claim Explanation** | Explainable AI with SHAP/LIME feature importance analysis |
| 🔔 **Real-Time Fraud Alerts** | Continuous monitoring with configurable thresholds and notifications |
| 🎮 **Fraud Risk Simulator** | Predict fraud probability for hypothetical claim scenarios |
| 🏗️ **System Architecture** | Visual overview of the complete system architecture |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                     │
│           Deployed on Vercel • TailwindCSS + Recharts          │
├────────────────────────┬─────────────────────────────────────┤
│   Vercel API Routes    │          Vite Dev Proxy              │
│   /api/* → Python BE   │      localhost:5173 → :8000          │
├────────────────────────┴─────────────────────────────────────┤
│              Python Backend (FastAPI)                          │
│         Deployed on Render • ML Models + Graph Analytics       │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ ML Service│ │Graph Svc │ │Heatmap   │ │Alert Svc │       │
│   │ XGBoost  │ │NetworkX  │ │Service   │ │Real-time │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

### 1. Clone & Install

```bash
git clone https://github.com/hemanth21-kbd/Insurance-fraud-detection.git
cd Insurance-fraud-detection
npm install
```

### 2. Set Up Python Backend

```bash
cd python-backend
pip install -r requirements.txt
python main.py
```

### 3. Start Frontend (Development)

```bash
# In the root directory
npm run dev
```

The app will be available at `http://localhost:5173` with API proxy to `http://localhost:8000`.

### 4. Environment Variables

Create `.env.local` in the root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PYTHON_BACKEND_URL=http://localhost:8000
```

## 🌐 Deployment

### Frontend → Vercel
- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `PYTHON_BACKEND_URL` → Your Render backend URL
  - `GEMINI_API_KEY` → Your Gemini API key

### Backend → Render
- Root Directory: `python-backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  - `GEMINI_API_KEY` → Your Gemini API key

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 📁 Project Structure

```
├── api/                    # Vercel serverless API routes (proxy to Python BE)
│   └── [...path].ts        # Catch-all API proxy handler
├── python-backend/         # FastAPI Python backend
│   ├── main.py             # Main FastAPI application
│   ├── services/           # Service modules
│   │   ├── ml_service.py   # XGBoost fraud scoring + SHAP
│   │   ├── graph_service.py # NetworkX graph analytics
│   │   ├── heatmap_service.py # Geographic risk mapping
│   │   ├── alert_service.py   # Real-time alert system
│   │   └── ocr_service.py     # OCR text extraction
│   ├── Dockerfile          # Docker containerization
│   ├── requirements.txt    # Python dependencies
│   ├── render.yaml         # Render deployment config
│   └── railway.toml        # Railway deployment config
├── src/                    # React frontend source
│   ├── App.tsx             # Main application with sidebar navigation
│   ├── pages/              # Page components
│   │   ├── ClaimDetector.tsx       # Bill upload + OCR + fraud analysis
│   │   ├── Dashboard.tsx           # Analytics dashboard
│   │   ├── FraudRiskHeatmap.tsx    # Leaflet map visualization
│   │   ├── FraudRiskSimulator.tsx  # What-if scenario simulator
│   │   ├── RealTimeFraudAlerts.tsx # Alert monitoring system
│   │   ├── AIClaimExplanation.tsx  # Explainable AI page
│   │   ├── NetworkGraph.tsx        # Force-directed graph
│   │   ├── HospitalRanking.tsx     # Hospital risk rankings
│   │   └── Architecture.tsx        # System architecture diagram
│   ├── data/               # Mock data
│   └── lib/                # Utility functions
├── server.ts               # Express server (local dev + Vercel legacy)
├── vite.config.ts          # Vite configuration with API proxy
├── vercel.json             # Vercel deployment configuration
├── index.html              # HTML entry point
├── package.json            # Node.js dependencies
└── tsconfig.json           # TypeScript configuration
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/claims/submit` | Submit claim for fraud analysis |
| `POST` | `/api/ml/score` | Score claim with ML model |
| `GET` | `/api/heatmap` | Get fraud risk heatmap data |
| `GET` | `/api/alerts` | Get fraud alerts |
| `POST` | `/api/alerts/monitoring/start` | Start real-time monitoring |
| `POST` | `/api/alerts/monitoring/stop` | Stop monitoring |
| `POST` | `/api/simulator/predict` | Run fraud simulation |
| `GET` | `/api/simulator/scenarios` | Get predefined scenarios |

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Recharts, Leaflet, Lucide Icons, Motion
- **Backend**: Python, FastAPI, XGBoost, Scikit-learn, NetworkX, SHAP, LIME
- **AI/ML**: Google Gemini AI (OCR), XGBoost (fraud scoring), Isolation Forest, Autoencoders
- **Deployment**: Vercel (frontend), Render (backend), Docker

## 📄 License

MIT License

---

<div align="center">
  <b>Built with ❤️ for healthcare fraud prevention</b>
</div>
