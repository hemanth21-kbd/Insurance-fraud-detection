import pandas as pd
import numpy as np

def preprocess_and_engineer_features():
    print("Preprocessing data and engineering features...")
    claims = pd.read_csv('claims.csv')
    hospitals = pd.read_csv('hospitals.csv')
    medical_costs = pd.read_csv('medical_costs.csv')
    prescriptions = pd.read_csv('prescriptions.csv')
    
    # Merge datasets
    df = claims.merge(hospitals[['hospital_id', 'avg_treatment_cost']], on='hospital_id', how='left')
    df = df.merge(medical_costs[['treatment_code', 'average_cost', 'disease_type']], on='treatment_code', how='left')
    
    # Feature Engineering
    
    # 1. claim_frequency_per_patient
    patient_claim_counts = df.groupby('patient_id').size().reset_index(name='claim_frequency_per_patient')
    df = df.merge(patient_claim_counts, on='patient_id', how='left')
    
    # 2. hospital_avg_claim_cost
    hospital_avg_cost = df.groupby('hospital_id')['claim_amount'].mean().reset_index(name='hospital_avg_claim_cost')
    df = df.merge(hospital_avg_cost, on='hospital_id', how='left')
    
    # 3. abnormal_claim_amount (Statistical threshold: Z-score > 2 or simple ratio)
    df['abnormal_claim_amount'] = df['claim_amount'] / df['average_cost']
    
    # 4. treatment_diagnosis_mismatch (Mock logic: if diagnosis doesn't match disease type)
    # In a real scenario, this would use NLP or ICD-10 code mapping.
    df['treatment_diagnosis_mismatch'] = np.where(df['diagnosis'].str.contains('Diag'), 0, 1) 
    
    # 5. repeated_prescription_patterns
    presc_counts = prescriptions.groupby('patient_id').size().reset_index(name='repeated_prescription_patterns')
    df = df.merge(presc_counts, on='patient_id', how='left')
    
    # Fill NAs
    df.fillna(0, inplace=True)
    
    # Select features for modeling
    features = [
        'claim_amount', 'abnormal_claim_amount', 'claim_frequency_per_patient', 
        'hospital_avg_claim_cost', 'treatment_diagnosis_mismatch', 'repeated_prescription_patterns'
    ]
    
    df.to_csv('processed_features.csv', index=False)
    print("Feature engineering complete. Saved to processed_features.csv")
    return df

if __name__ == "__main__":
    preprocess_and_engineer_features()
