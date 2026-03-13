import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_datasets(num_claims=10000, num_patients=2000, num_hospitals=50, num_doctors=200):
    print("Simulating datasets...")
    
    # 1. Hospitals
    hospitals = pd.DataFrame({
        'hospital_id': [f'H{str(i).zfill(3)}' for i in range(num_hospitals)],
        'hospital_name': [f'Hospital_{i}' for i in range(num_hospitals)],
        'location': np.random.choice(['North', 'South', 'East', 'West', 'Central'], num_hospitals),
        'avg_treatment_cost': np.random.uniform(500, 5000, num_hospitals),
        'total_claims': np.random.randint(100, 5000, num_hospitals)
    })
    
    # 2. Medical Costs
    treatments = [f'T{str(i).zfill(3)}' for i in range(50)]
    medical_costs = pd.DataFrame({
        'treatment_code': treatments,
        'average_cost': np.random.uniform(200, 10000, 50),
        'disease_type': np.random.choice(['Cardiology', 'Neurology', 'Orthopedics', 'General', 'Oncology'], 50)
    })
    
    # 3. Claims
    patient_ids = [f'P{str(i).zfill(4)}' for i in range(num_patients)]
    doctor_ids = [f'D{str(i).zfill(3)}' for i in range(num_doctors)]
    
    claims_data = []
    for i in range(num_claims):
        treatment = random.choice(treatments)
        base_cost = medical_costs[medical_costs['treatment_code'] == treatment]['average_cost'].values[0]
        
        # Inject Fraud (approx 5%)
        is_fraud = np.random.rand() < 0.05
        if is_fraud:
            # Inflated bill or duplicate
            claim_amount = base_cost * np.random.uniform(2.5, 5.0)
        else:
            claim_amount = base_cost * np.random.uniform(0.8, 1.2)
            
        claims_data.append({
            'claim_id': f'C{str(i).zfill(5)}',
            'patient_id': random.choice(patient_ids),
            'hospital_id': random.choice(hospitals['hospital_id']),
            'doctor_id': random.choice(doctor_ids),
            'treatment_code': treatment,
            'diagnosis': f'Diag_{random.randint(1, 100)}',
            'claim_amount': round(claim_amount, 2),
            'claim_date': datetime.now() - timedelta(days=random.randint(0, 365)),
            'fraud_label': 1 if is_fraud else 0
        })
        
    claims = pd.DataFrame(claims_data)
    
    # 4. Prescriptions
    prescriptions = pd.DataFrame({
        'patient_id': np.random.choice(patient_ids, int(num_claims * 0.8)),
        'drug_name': np.random.choice(['DrugA', 'DrugB', 'DrugC', 'DrugD', 'DrugE'], int(num_claims * 0.8)),
        'prescription_date': [datetime.now() - timedelta(days=random.randint(0, 365)) for _ in range(int(num_claims * 0.8))],
        'pharmacy_id': np.random.choice([f'PH{str(i).zfill(2)}' for i in range(20)], int(num_claims * 0.8))
    })
    
    # Save to CSV
    hospitals.to_csv('hospitals.csv', index=False)
    medical_costs.to_csv('medical_costs.csv', index=False)
    claims.to_csv('claims.csv', index=False)
    prescriptions.to_csv('prescriptions.csv', index=False)
    print("Datasets generated successfully.")

if __name__ == "__main__":
    generate_datasets()
