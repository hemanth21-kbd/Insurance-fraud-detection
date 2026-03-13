from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import pickle
import json
from explainability import generate_explanations

app = FastAPI(title="Healthcare Fraud Intelligence API")

# Load Models
try:
    with open('xgb_model.pkl', 'rb') as f:
        xgb_model = pickle.load(f)
except:
    xgb_model = None

class ClaimInput(BaseModel):
    claim_amount: float
    cost_ratio: float
    claim_frequency_per_patient: int
    doctor_claim_density: int
    hospital_cost_deviation: float

@app.get("/")
def read_root():
    return {"status": "API is running"}

@app.post("/predict")
def predict_fraud(claim: ClaimInput):
    if xgb_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    df = pd.DataFrame([claim.dict()])
    
    # Predict Probability
    prob = xgb_model.predict_proba(df)[0][1]
    
    # Generate Explanations
    explanations = generate_explanations(df)
    
    # Determine reasons
    reasons = [exp['feature'] for exp in explanations if exp['contribution'] > 0][:3]
    
    return {
        "fraud_probability": float(prob),
        "is_fraud": bool(prob > 0.7),
        "explanations": explanations,
        "top_reasons": reasons
    }

@app.get("/network")
def get_network():
    try:
        with open('network_data.json', 'r') as f:
            data = json.load(f)
        return data
    except:
        raise HTTPException(status_code=404, detail="Network data not found")
