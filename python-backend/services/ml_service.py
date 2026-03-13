import numpy as np
from sklearn.ensemble import IsolationForest
# import tensorflow as tf # For Autoencoder

# Dummy pre-trained Isolation Forest model for anomaly detection
iso_forest = IsolationForest(contamination=0.1, random_state=42)
# In a real scenario, this would be loaded from a saved model file
# iso_forest.fit(historical_claim_features)

def calculate_fraud_score(extracted_data: dict) -> dict:
    """
    Compares current claims with historical claim patterns to detect anomalies 
    using machine learning models such as Isolation Forest or Autoencoder.
    """
    # 1. Feature Engineering (mocked)
    # Convert extracted_data into a feature vector (cost, quantity, diagnosis_code_freq, etc.)
    features = np.random.rand(1, 10) 
    
    # 2. Anomaly Prediction
    # -1 for outliers (fraud), 1 for inliers (normal)
    # prediction = iso_forest.predict(features)
    # anomaly_score = iso_forest.decision_function(features)
    
    # Mocking the ML output based on typical extracted data
    total_amount = extracted_data.get("total_amount", 0)
    
    score = 0
    reasons = []
    
    if total_amount > 10000:
        score += 40
        reasons.append(f"Abnormal treatment cost: ${total_amount} exceeds standard guidelines.")
        
    if len(extracted_data.get("medicines", [])) > 10:
        score += 30
        reasons.append("Abnormal medicine quantities detected.")
        
    # Add random variance to simulate ML model confidence
    score += np.random.randint(0, 30)
    score = min(100, score)
    
    if score >= 75:
        risk_level = "High Risk"
    elif score >= 40:
        risk_level = "Medium Risk"
    else:
        risk_level = "Low Risk"
        
    return {
        "score": score,
        "risk_level": risk_level,
        "reasons": reasons if reasons else ["Claim aligns with historical patterns. No anomalies detected."]
    }
