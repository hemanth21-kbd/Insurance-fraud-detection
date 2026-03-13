import shap
import pickle
import pandas as pd
import numpy as np

def generate_explanations(claim_data_df):
    """
    Generate SHAP values for a given claim to explain the fraud probability.
    """
    with open('xgb_model.pkl', 'rb') as f:
        model = pickle.load(f)
        
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(claim_data_df)
    
    # Format output for API
    feature_names = claim_data_df.columns.tolist()
    explanations = []
    
    for i, feature in enumerate(feature_names):
        explanations.append({
            "feature": feature,
            "value": float(claim_data_df.iloc[0][feature]),
            "contribution": float(shap_values[0][i])
        })
        
    # Sort by absolute contribution
    explanations = sorted(explanations, key=lambda x: abs(x['contribution']), reverse=True)
    return explanations
