import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import pickle

def train_models():
    print("Training Hybrid Fraud Detection Model...")
    df = pd.read_csv('processed_features.csv')
    
    features = [
        'claim_amount', 'cost_ratio', 'claim_frequency_per_patient', 
        'doctor_claim_density', 'hospital_cost_deviation'
    ]
    
    X = df[features]
    y = df['fraud_label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 1. Supervised Model: XGBoost
    xgb_model = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    xgb_model.fit(X_train, y_train)
    
    xgb_preds = xgb_model.predict(X_test)
    print("XGBoost Performance:")
    print(classification_report(y_test, xgb_preds))
    
    # 2. Unsupervised Model: Isolation Forest (Anomaly Detection)
    iso_forest = IsolationForest(contamination=0.05, random_state=42)
    iso_forest.fit(X_train)
    
    # Save models
    with open('xgb_model.pkl', 'wb') as f:
        pickle.dump(xgb_model, f)
    with open('iso_forest.pkl', 'wb') as f:
        pickle.dump(iso_forest, f)
        
    print("Models trained and saved successfully.")

if __name__ == "__main__":
    train_models()
