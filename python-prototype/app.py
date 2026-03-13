import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import json

API_URL = "http://localhost:8000"

st.set_page_config(page_title="Fraud Intelligence Platform", layout="wide")

st.title("ðŸ ¥ Hybrid Healthcare Fraud Intelligence Platform")
st.markdown("Detecting complex healthcare insurance fraud using ML, Graph Analytics, and Explainable AI.")

tabs = st.tabs(["Fraud Claim Detector", "Fraud Analytics", "Fraud Network Graph", "Hospital Risk Ranking"])

with tabs[0]:
    st.header("Module 1 & 3: Cross-Verification AI & Explainability")
    
    col1, col2 = st.columns(2)
    with col1:
        claim_amount = st.number_input("Claim Amount ($)", value=5000.0)
        abnormal_claim_amount = st.slider("Abnormal Claim Ratio (Claim / Avg Cost)", 0.1, 10.0, 3.5)
        claim_freq = st.number_input("Patient Claim Frequency", value=12)
        hosp_avg = st.number_input("Hospital Avg Claim Cost", value=2500.0)
        mismatch = st.selectbox("Treatment-Diagnosis Mismatch", [0, 1])
        presc_patterns = st.number_input("Repeated Prescription Patterns", value=4)
        
        if st.button("Analyze Claim"):
            payload = {
                "claim_amount": claim_amount,
                "abnormal_claim_amount": abnormal_claim_amount,
                "claim_frequency_per_patient": claim_freq,
                "hospital_avg_claim_cost": hosp_avg,
                "treatment_diagnosis_mismatch": mismatch,
                "repeated_prescription_patterns": presc_patterns
            }
            try:
                res = requests.post(f"{API_URL}/predict", json=payload).json()
                
                with col2:
                    st.subheader("Analysis Results")
                    prob = res['fraud_probability']
                    
                    if prob > 0.7:
                        st.error(f"High Fraud Risk: {prob:.1%} Probability")
                    elif prob > 0.4:
                        st.warning(f"Medium Fraud Risk: {prob:.1%} Probability")
                    else:
                        st.success(f"Low Fraud Risk: {prob:.1%} Probability")
                        
                    st.markdown("### Explainable AI (SHAP)")
                    st.write("Top reasons for this prediction:")
                    for reason in res['top_reasons']:
                        st.markdown(f"- **{reason}**")
                        
                    # Plot SHAP
                    exp_df = pd.DataFrame(res['explanations'])
                    fig = px.bar(exp_df, x='contribution', y='feature', orientation='h', 
                                 title="Feature Contributions to Fraud Score",
                                 color='contribution', color_continuous_scale='RdBu_r')
                    st.plotly_chart(fig)
            except Exception as e:
                st.error(f"API Connection Error: {e}. Make sure the FastAPI backend is running.")

with tabs[1]:
    st.header("Module 3: Fraud Analytics Dashboard")
    try:
        df = pd.read_csv('processed_features.csv').head(1000)
        fig1 = px.scatter(df, x='claim_amount', y='abnormal_claim_amount', color='fraud_label', 
                          title="Claim Amount vs Abnormal Ratio by Fraud Status")
        st.plotly_chart(fig1, use_container_width=True)
    except:
        st.info("Run data_simulator.py and preprocessing.py first to view analytics.")

with tabs[2]:
    st.header("Module 2: Fraud Network Detection")
    st.markdown("Visualizing suspicious clusters between Patients, Doctors, Hospitals, and Pharmacies.")
    try:
        res = requests.get(f"{API_URL}/network").json()
        st.success(f"Loaded network with {len(res['nodes'])} entities and {len(res['links'])} connections.")
        st.info("In a full Streamlit app, we would use streamlit-agraph to render this JSON interactively.")
        st.json(res['nodes'][:5]) # Preview
    except:
        st.info("Run network_analysis.py and ensure API is running to view the network.")

with tabs[3]:
    st.header("Module 4: Hospital Fraud Risk Ranking")
    try:
        df = pd.read_csv('processed_features.csv')
        hosp_risk = df.groupby('hospital_id').agg(
            total_claims=('claim_amount', 'count'),
            fraud_claims=('fraud_label', 'sum'),
            avg_cost_deviation=('abnormal_claim_amount', 'mean')
        ).reset_index()
        
        hosp_risk['fraud_rate'] = hosp_risk['fraud_claims'] / hosp_risk['total_claims']
        
        # Determine Risk Level
        def get_risk(rate):
            if rate > 0.1: return 'High Risk'
            if rate > 0.05: return 'Medium Risk'
            return 'Low Risk'
            
        hosp_risk['Risk Category'] = hosp_risk['fraud_rate'].apply(get_risk)
        hosp_risk = hosp_risk.sort_values('fraud_rate', ascending=False).head(15)
        
        st.dataframe(hosp_risk.style.background_gradient(subset=['fraud_rate', 'avg_cost_deviation'], cmap='Reds'))
    except:
        st.info("Run data generation scripts first.")
