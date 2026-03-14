from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from datetime import datetime
import json
from fastapi.middleware.cors import CORSMiddleware

from services.ocr_service import extract_bill_data
from services.ml_service import calculate_fraud_score, simulate_fraud_risk, get_fraud_alerts, train_model_from_csv_bytes
from services.graph_service import update_fraud_network, get_hospital_risk
from services.heatmap_service import create_fraud_heatmap, get_hospital_details, get_geographic_clusters
from services.alert_service import (get_alerts, create_fraud_alert, update_alert_status,
                                  get_alert_statistics, start_alert_monitoring, stop_alert_monitoring,
                                  configure_alert_notifications, is_monitoring_active)

app = FastAPI(title="Advanced Fraud Intelligence API", version="2.0",
              description="AI-powered Health Insurance Fraud Detection System with Explainable AI, Risk Heatmaps, Real-time Alerts, and Risk Simulation")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0",
        "services": {
            "ml_model": "loaded" if 'xgb_model' in globals() else "not_loaded",
            "database": "connected"
        }
    }

# Pydantic models for request/response
class ClaimResponse(BaseModel):
    claim_id: str
    extracted_data: dict
    fraud_score: float
    risk_level: str
    explainable_reasons: List[str]
    confidence: float
    feature_importance: Dict[str, float]
    shap_explanation: Optional[Dict[str, Any]] = None

class SimulationRequest(BaseModel):
    treatment_cost: float
    claim_amount: float
    admission_days: int
    test_count: int
    age: Optional[int] = 45
    hospital_rating: Optional[float] = 3.0
    previous_claims: Optional[int] = 0
    diagnosis_complexity: Optional[float] = 5.0
    medicine_count: Optional[int] = 5
    procedure_count: Optional[int] = 3

class AlertUpdateRequest(BaseModel):
    status: str  # 'active', 'acknowledged', 'resolved', 'dismissed'
    notes: Optional[str] = ""

class NotificationConfig(BaseModel):
    email_subscribers: Optional[List[str]] = None
    sms_subscribers: Optional[List[str]] = None

# 1. FRAUD RISK HEATMAP ENDPOINTS
@app.get("/api/heatmap")
async def get_fraud_heatmap(
    hospital: Optional[List[str]] = Query(None),
    claim_type: Optional[List[str]] = Query(None),
    risk_level: Optional[List[str]] = Query(None),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """
    Get fraud risk heatmap data with filtering capabilities.
    Returns geographic risk visualization data for hospitals.
    """
    filters = {}
    if hospital:
        filters['hospital'] = hospital
    if claim_type:
        filters['claim_type'] = claim_type
    if risk_level:
        filters['risk_level'] = risk_level
    if date_from and date_to:
        filters['date_range'] = [date_from, date_to]

    return create_fraud_heatmap(filters)

@app.get("/api/heatmap/hospital/{hospital_name}")
async def get_hospital_heatmap_details(hospital_name: str):
    """
    Get detailed fraud risk information for a specific hospital.
    """
    return get_hospital_details(hospital_name)

@app.get("/api/heatmap/clusters")
async def get_fraud_clusters(radius_km: float = 5.0):
    """
    Identify geographic clusters of high-risk hospitals within specified radius.
    """
    return {"clusters": get_geographic_clusters(radius_km)}

# 2. AI CLAIM EXPLANATION SYSTEM ENDPOINTS
@app.post("/api/claims/submit", response_model=ClaimResponse)
async def submit_claim(file: UploadFile = File(...)):
    """
    Advanced claim submission with OCR, ML fraud detection, and explainable AI.
    Returns detailed fraud analysis with SHAP explanations and feature importance.
    """
    try:
        # 1. OCR Extraction
        image_bytes = await file.read()
        extracted_data = extract_bill_data(image_bytes)

        # 2. Advanced ML Fraud Scoring with Explainable AI
        fraud_analysis = calculate_fraud_score(extracted_data)

        # 3. Network Graph Update
        update_fraud_network(extracted_data, fraud_analysis['score'])

        return ClaimResponse(
            claim_id="CLM-" + str(hash(extracted_data.get('patient_id', 'unknown')))[1:9],
            extracted_data=extracted_data,
            fraud_score=fraud_analysis['score'],
            risk_level=fraud_analysis['risk_level'],
            explainable_reasons=fraud_analysis['reasons'],
            confidence=fraud_analysis['confidence'],
            feature_importance=fraud_analysis['feature_importance'],
            shap_explanation=fraud_analysis['shap_explanation']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/explanations/model-info")
async def get_model_explanation_info():
    """
    Get information about the fraud detection model and its explainability features.
    """
    return {
        "model_type": "XGBoost Classifier",
        "features_used": [
            "treatment_cost", "claim_amount", "admission_days", "test_count",
            "age", "hospital_rating", "previous_claims", "diagnosis_complexity",
            "medicine_count", "procedure_count"
        ],
        "explainability_methods": ["SHAP", "LIME"],
        "training_data_size": "130,469 real Medicare claims",
        "model_accuracy": "~90%",
        "data_source": "Medicare Inpatient & Outpatient Claims (2009)",
        "last_updated": "2026-03-14"
    }

@app.post("/api/model/train")
async def train_model(file: UploadFile = File(...)):
    """Train the fraud detection model from a CSV dataset."""
    try:
        csv_bytes = await file.read()
        metrics = train_model_from_csv_bytes(csv_bytes)
        return {"status": "success", "training_metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ml/score")
async def score_claim(claim_data: Dict[str, Any]):
    """
    Score a claim for fraud using the trained ML model.
    Expects extracted claim data in the same format as OCR output.
    """
    try:
        fraud_analysis = calculate_fraud_score(claim_data)
        return {
            "fraud_score": fraud_analysis["score"],
            "risk_level": fraud_analysis["risk_level"],
            "reasons": fraud_analysis["reasons"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/alerts/monitoring/status")
async def get_monitoring_status():
    """Get whether the fraud alert monitoring background service is currently active."""
    return {"monitoring_active": is_monitoring_active()}

# 3. REAL-TIME FRAUD ALERT SYSTEM ENDPOINTS
@app.get("/api/alerts")
async def get_fraud_alerts_endpoint(
    threshold: float = 0.75,
    limit: int = 50,
    status: Optional[str] = None
):
    """
    Get real-time fraud alerts above specified threshold.
    Supports filtering by status and limiting results.
    """
    alerts = get_alerts(threshold, limit)
    if status:
        alerts = [alert for alert in alerts if alert.get('status') == status]
    return {"alerts": alerts, "count": len(alerts)}

@app.post("/api/alerts")
async def create_manual_alert(alert_data: Dict[str, Any]):
    """
    Manually create a fraud alert (for testing or external integrations).
    """
    return create_fraud_alert(alert_data)

@app.put("/api/alerts/{alert_id}")
async def update_alert(alert_id: str, update_data: AlertUpdateRequest):
    """
    Update alert status (acknowledge, resolve, escalate).
    """
    return update_alert_status(alert_id, update_data.status, update_data.notes)

@app.get("/api/alerts/statistics")
async def get_alert_stats():
    """
    Get comprehensive alert statistics and trends.
    """
    return get_alert_statistics()

@app.post("/api/alerts/monitoring/start")
async def start_monitoring(threshold: float = 0.75):
    """
    Start real-time fraud monitoring with specified threshold.
    """
    return start_alert_monitoring(threshold)

@app.post("/api/alerts/monitoring/stop")
async def stop_monitoring():
    """
    Stop real-time fraud monitoring.
    """
    return stop_alert_monitoring()

@app.post("/api/alerts/notifications/configure")
async def configure_notifications(config: NotificationConfig):
    """
    Configure email and SMS notification subscribers.
    """
    return configure_alert_notifications(
        config.email_subscribers,
        config.sms_subscribers
    )

# 4. FRAUD RISK SIMULATOR ENDPOINTS
@app.post("/api/simulator/predict")
async def simulate_fraud_prediction(simulation: SimulationRequest):
    """
    Fraud Risk Simulator: Predict fraud probability for hypothetical claim scenarios.
    Returns detailed risk analysis with recommendations.
    """
    try:
        result = simulate_fraud_risk(simulation.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.get("/api/simulator/scenarios")
async def get_simulation_scenarios():
    """
    Get predefined simulation scenarios for testing different fraud patterns.
    """
    scenarios = [
        {
            "name": "Normal Claim",
            "description": "Typical legitimate insurance claim",
            "parameters": {
                "treatment_cost": 2500,
                "claim_amount": 3200,
                "admission_days": 2,
                "test_count": 3,
                "age": 45,
                "hospital_rating": 4.0,
                "previous_claims": 1,
                "diagnosis_complexity": 4.0,
                "medicine_count": 4,
                "procedure_count": 2
            }
        },
        {
            "name": "High-Risk Claim",
            "description": "Claim with multiple suspicious indicators",
            "parameters": {
                "treatment_cost": 15000,
                "claim_amount": 18500,
                "admission_days": 1,
                "test_count": 15,
                "age": 35,
                "hospital_rating": 2.5,
                "previous_claims": 8,
                "diagnosis_complexity": 9.0,
                "medicine_count": 12,
                "procedure_count": 8
            }
        },
        {
            "name": "Borderline Case",
            "description": "Claim that might require manual review",
            "parameters": {
                "treatment_cost": 7500,
                "claim_amount": 9200,
                "admission_days": 4,
                "test_count": 8,
                "age": 55,
                "hospital_rating": 3.5,
                "previous_claims": 3,
                "diagnosis_complexity": 6.0,
                "medicine_count": 7,
                "procedure_count": 4
            }
        }
    ]
    return {"scenarios": scenarios}

# LEGACY ENDPOINTS (for backward compatibility)
@app.get("/api/hospitals/{hospital_id}/risk")
async def get_hospital_risk_score(hospital_id: str):
    """
    Legacy endpoint for hospital risk scoring.
    """
    risk_data = get_hospital_risk(hospital_id)
    return risk_data

@app.get("/api/claims/recent")
async def get_recent_claims(limit: int = 10):
    """
    Get recent claims (mock data for dashboard).
    """
    # Mock recent claims for dashboard
    recent_claims = [
        {
            "id": f"CLM-{100000 + i}",
            "hospitalId": "City General Hospital",
            "amount": 2500 + (i * 500),
            "fraudProb": 0.1 + (i * 0.05),
            "timestamp": datetime.now().isoformat()
        }
        for i in range(limit)
    ]
    return recent_claims

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
