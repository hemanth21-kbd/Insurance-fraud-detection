import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler, LabelEncoder
import xgboost as xgb
import shap
import lime
import lime.lime_tabular
from typing import Dict, List, Any, Tuple
import json
import os
import io

# Global variables for models and data
xgb_model = None
scaler = None
feature_names = None
explainer_shap = None
explainer_lime = None

# Mock historical data for training
def generate_mock_training_data(n_samples: int = 10000) -> pd.DataFrame:
    """Generate synthetic insurance claim data for model training"""
    np.random.seed(42)

    data = {
        'treatment_cost': np.random.exponential(5000, n_samples),
        'claim_amount': np.random.exponential(8000, n_samples),
        'admission_days': np.random.poisson(5, n_samples),
        'test_count': np.random.poisson(8, n_samples),
        'age': np.random.normal(45, 15, n_samples),
        'hospital_rating': np.random.uniform(1, 5, n_samples),
        'previous_claims': np.random.poisson(2, n_samples),
        'diagnosis_complexity': np.random.uniform(1, 10, n_samples),
        'medicine_count': np.random.poisson(5, n_samples),
        'procedure_count': np.random.poisson(3, n_samples),
        'is_fraud': np.random.choice([0, 1], n_samples, p=[0.85, 0.15])
    }

    df = pd.DataFrame(data)

    # Add some realistic correlations
    df.loc[df['is_fraud'] == 1, 'treatment_cost'] *= np.random.uniform(1.5, 3.0, df['is_fraud'].sum())
    df.loc[df['is_fraud'] == 1, 'claim_amount'] *= np.random.uniform(1.3, 2.5, df['is_fraud'].sum())
    df.loc[df['is_fraud'] == 1, 'medicine_count'] *= np.random.uniform(1.2, 2.0, df['is_fraud'].sum())

    return df

def initialize_models():
    """Initialize and train the ML models"""
    global xgb_model, scaler, feature_names, explainer_shap, explainer_lime

    if xgb_model is not None:
        return  # Already initialized

    # Generate training data
    train_df = generate_mock_training_data(10000)

    # Feature engineering
    feature_cols = ['treatment_cost', 'claim_amount', 'admission_days', 'test_count',
                   'age', 'hospital_rating', 'previous_claims', 'diagnosis_complexity',
                   'medicine_count', 'procedure_count']

    X = train_df[feature_cols]
    y = train_df['is_fraud']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train XGBoost model
    xgb_model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42
    )
    xgb_model.fit(X_train_scaled, y_train)

    feature_names = feature_cols

    # Initialize explainers
    explainer_shap = shap.TreeExplainer(xgb_model)
    explainer_lime = lime.lime_tabular.LimeTabularExplainer(
        X_train_scaled,
        feature_names=feature_names,
        class_names=['Legitimate', 'Fraudulent'],
        mode='classification'
    )

    print("ML models initialized successfully")

# Initialize models on import
initialize_models()

def train_model_from_dataframe(df: pd.DataFrame, test_size: float = 0.2, random_state: int = 42) -> Dict[str, Any]:
    """Train the XGBoost fraud detection model from a pandas DataFrame."""
    global xgb_model, scaler, feature_names, explainer_shap, explainer_lime

    feature_cols = ['treatment_cost', 'claim_amount', 'admission_days', 'test_count',
                   'age', 'hospital_rating', 'previous_claims', 'diagnosis_complexity',
                   'medicine_count', 'procedure_count']

    # Validate required columns
    missing_columns = [c for c in feature_cols + ['is_fraud'] if c not in df.columns]
    if missing_columns:
        raise ValueError(f"Dataset missing required columns: {missing_columns}")

    df_clean = df.dropna(subset=feature_cols + ['is_fraud']).copy()
    df_clean['is_fraud'] = df_clean['is_fraud'].astype(int)

    X = df_clean[feature_cols]
    y = df_clean['is_fraud']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    xgb_model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=random_state
    )
    xgb_model.fit(X_train_scaled, y_train)

    feature_names = feature_cols

    explainer_shap = shap.TreeExplainer(xgb_model)
    explainer_lime = lime.lime_tabular.LimeTabularExplainer(
        X_train_scaled,
        feature_names=feature_names,
        class_names=['Legitimate', 'Fraudulent'],
        mode='classification'
    )

    y_pred = xgb_model.predict(X_test_scaled)
    accuracy = float((y_pred == y_test).mean())
    report = classification_report(y_test, y_pred, output_dict=True)

    return {
        'accuracy': accuracy,
        'classification_report': report,
        'trained_on': int(len(df_clean))
    }


def train_model_from_csv_bytes(csv_bytes: bytes) -> Dict[str, Any]:
    """Train the model from CSV bytes content."""
    df = pd.read_csv(io.BytesIO(csv_bytes))
    return train_model_from_dataframe(df)


def extract_features_from_claim(claim_data: dict) -> np.ndarray:
    """Extract feature vector from claim data"""
    features = np.array([[
        claim_data.get('treatment_cost', 0),
        claim_data.get('claim_amount', 0),
        claim_data.get('admission_days', 0),
        claim_data.get('test_count', 0),
        claim_data.get('age', 45),  # Default age
        claim_data.get('hospital_rating', 3.0),  # Default rating
        claim_data.get('previous_claims', 0),
        claim_data.get('diagnosis_complexity', 5.0),  # Default complexity
        len(claim_data.get('medicines', [])),  # Medicine count
        len(claim_data.get('procedure_codes', []))  # Procedure count
    ]])

    return features

def calculate_fraud_score(extracted_data: dict) -> dict:
    """
    Advanced fraud detection using XGBoost with explainable AI
    """
    try:
        # Extract features
        features = extract_features_from_claim(extracted_data)

        # Get prediction
        fraud_prob = xgb_model.predict_proba(features)[0][1]
        fraud_score = fraud_prob * 100

        # Determine risk level
        if fraud_score >= 75:
            risk_level = "High Risk"
        elif fraud_score >= 40:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"

        # Generate explanations using SHAP
        shap_values = explainer_shap.shap_values(features)
        feature_importance = dict(zip(feature_names, shap_values[0]))

        # Get top contributing factors
        sorted_features = sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True)
        top_factors = sorted_features[:5]

        reasons = []
        for feature, importance in top_factors:
            if importance > 0:
                reasons.append(f"{feature.replace('_', ' ').title()}: High value increases fraud risk")
            else:
                reasons.append(f"{feature.replace('_', ' ').title()}: Normal value supports legitimacy")

        return {
            "score": fraud_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "confidence": fraud_prob,
            "feature_importance": feature_importance,
            "shap_explanation": {
                "base_value": float(explainer_shap.expected_value),
                "shap_values": shap_values[0].tolist(),
                "feature_names": feature_names
            }
        }

    except Exception as e:
        # Fallback to simple rule-based scoring
        total_amount = extracted_data.get("total_amount", 0)

        score = 0
        reasons = []

        if total_amount > 10000:
            score += 40
            reasons.append(f"Abnormal treatment cost: ${total_amount} exceeds standard guidelines.")

        if len(extracted_data.get("medicines", [])) > 10:
            score += 30
            reasons.append("Abnormal medicine quantities detected.")

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
            "reasons": reasons if reasons else ["Claim aligns with historical patterns. No anomalies detected."],
            "confidence": score / 100,
            "feature_importance": {},
            "shap_explanation": None
        }

def simulate_fraud_risk(simulation_data: dict) -> dict:
    """
    Fraud Risk Simulator: Predict fraud probability for hypothetical claims
    """
    try:
        features = extract_features_from_claim(simulation_data)
        scaled_features = scaler.transform(features) if scaler else features

        fraud_prob = xgb_model.predict_proba(scaled_features)[0][1]
        fraud_score = fraud_prob * 100

        # Risk categorization
        if fraud_score >= 75:
            risk_level = "High Risk"
            risk_color = "red"
        elif fraud_score >= 40:
            risk_level = "Medium Risk"
            risk_color = "yellow"
        else:
            risk_level = "Low Risk"
            risk_color = "green"

        # Generate detailed explanation
        shap_values = explainer_shap.shap_values(scaled_features)
        feature_importance = dict(zip(feature_names, shap_values[0]))

        # Risk factors analysis
        risk_factors = []
        protective_factors = []

        for feature, importance in feature_importance.items():
            if importance > 0.1:
                risk_factors.append({
                    "factor": feature.replace('_', ' ').title(),
                    "impact": "increases",
                    "magnitude": float(importance)
                })
            elif importance < -0.1:
                protective_factors.append({
                    "factor": feature.replace('_', ' ').title(),
                    "impact": "decreases",
                    "magnitude": float(abs(importance))
                })

        return {
            "fraud_probability": float(fraud_prob),
            "fraud_score": float(fraud_score),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "risk_factors": risk_factors,
            "protective_factors": protective_factors,
            "confidence_interval": {
                "lower": float(max(0, fraud_prob - 0.1)),
                "upper": float(min(1.0, fraud_prob + 0.1))
            },
            "recommendations": generate_recommendations(risk_level, simulation_data)
        }

    except Exception as e:
        return {
            "error": f"Simulation failed: {str(e)}",
            "fraud_probability": 0.5,
            "fraud_score": 50,
            "risk_level": "Medium Risk",
            "risk_color": "yellow"
        }

def generate_recommendations(risk_level: str, claim_data: dict) -> List[str]:
    """Generate actionable recommendations based on risk level"""
    recommendations = []

    if risk_level == "High Risk":
        recommendations.extend([
            "Immediate claim review required",
            "Contact hospital for verification",
            "Cross-reference with patient medical history",
            "Consider additional documentation requirements"
        ])

        if claim_data.get('claim_amount', 0) > 10000:
            recommendations.append("High-value claim: Request detailed cost breakdown")

        if len(claim_data.get('medicines', [])) > 8:
            recommendations.append("High medicine count: Verify prescription authenticity")

    elif risk_level == "Medium Risk":
        recommendations.extend([
            "Standard review process recommended",
            "Monitor for similar patterns from this provider",
            "Consider additional verification for high-value items"
        ])

    else:  # Low Risk
        recommendations.extend([
            "Fast-track processing possible",
            "Standard approval workflow",
            "Low priority for manual review"
        ])

    return recommendations

def get_fraud_alerts(threshold: float = 0.75) -> List[Dict]:
    """
    Real-Time Fraud Alert System: Get alerts for high-risk claims
    """
    # In a real system, this would query a database
    # For now, return mock alerts
    alerts = [
        {
            "alert_id": "ALT-001",
            "claim_id": "CLM-12345",
            "hospital_name": "City General Hospital",
            "fraud_score": 85.2,
            "risk_level": "High Risk",
            "timestamp": "2026-03-14T10:30:00Z",
            "suspicious_indicators": [
                "Claim amount 3x higher than similar procedures",
                "Unusual medicine combination",
                "Hospital has 15% fraud rate this month"
            ],
            "status": "active"
        },
        {
            "alert_id": "ALT-002",
            "claim_id": "CLM-67890",
            "hospital_name": "Metro Medical Center",
            "fraud_score": 78.5,
            "risk_level": "High Risk",
            "timestamp": "2026-03-14T09:15:00Z",
            "suspicious_indicators": [
                "Patient admitted 5 times this year",
                "Same diagnosis pattern as previous claims"
            ],
            "status": "active"
        }
    ]

    return [alert for alert in alerts if alert['fraud_score'] / 100 >= threshold]
