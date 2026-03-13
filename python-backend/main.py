from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from services.ocr_service import extract_bill_data
from services.ml_service import calculate_fraud_score
from services.graph_service import update_fraud_network, get_hospital_risk

app = FastAPI(title="Fraud Intelligence API", version="1.0")

class ClaimResponse(BaseModel):
    claim_id: str
    extracted_data: dict
    fraud_score: float
    risk_level: str
    explainable_reasons: List[str]

@app.post("/api/claims/submit", response_model=ClaimResponse)
async def submit_claim(file: UploadFile = File(...)):
    """
    Real-time claim submission endpoint.
    Accepts hospital bills, performs OCR, runs ML anomaly detection, and updates the fraud network.
    """
    try:
        # 1. OCR Extraction
        image_bytes = await file.read()
        extracted_data = extract_bill_data(image_bytes)
        
        # 2. ML Fraud Scoring (Isolation Forest / Autoencoder)
        fraud_analysis = calculate_fraud_score(extracted_data)
        
        # 3. Network Graph Update (NetworkX)
        update_fraud_network(extracted_data, fraud_analysis['score'])
        
        return ClaimResponse(
            claim_id="CLM-" + str(hash(extracted_data.get('patient_id', 'unknown')))[1:9],
            extracted_data=extracted_data,
            fraud_score=fraud_analysis['score'],
            risk_level=fraud_analysis['risk_level'],
            explainable_reasons=fraud_analysis['reasons']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hospitals/{hospital_id}/risk")
async def get_hospital_risk_score(hospital_id: str):
    """
    Dynamically calculates fraud risk scores for hospitals based on past suspicious claims, 
    anomaly scores, and fraud network connections.
    """
    risk_data = get_hospital_risk(hospital_id)
    return risk_data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
