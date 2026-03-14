import pandas as pd
import numpy as np
from datetime import datetime
import os

def preprocess_medicare_data(inpatient_path: str, outpatient_path: str) -> pd.DataFrame:
    """
    Preprocess Medicare inpatient and outpatient claim data for fraud detection training.
    """

    # Load datasets
    print("Loading inpatient data...")
    inpatient_df = pd.read_csv(inpatient_path)
    print(f"Inpatient data shape: {inpatient_df.shape}")

    print("Loading outpatient data...")
    outpatient_df = pd.read_csv(outpatient_path)
    print(f"Outpatient data shape: {outpatient_df.shape}")

    # Standardize column names and create common structure
    def process_inpatient_data(df):
        processed = pd.DataFrame()

        # Basic claim info
        processed['claim_id'] = df['ClaimID']
        processed['bene_id'] = df['BeneID']
        processed['provider'] = df['Provider']
        processed['claim_amount'] = pd.to_numeric(df['InscClaimAmtReimbursed'], errors='coerce')

        # Calculate admission days
        df['AdmissionDt'] = pd.to_datetime(df['AdmissionDt'], errors='coerce')
        df['DischargeDt'] = pd.to_datetime(df['DischargeDt'], errors='coerce')
        processed['admission_days'] = (df['DischargeDt'] - df['AdmissionDt']).dt.days.fillna(0).astype(int)

        # Diagnosis complexity (count of non-null diagnosis codes)
        diagnosis_cols = [f'ClmDiagnosisCode_{i}' for i in range(1, 11)]
        processed['diagnosis_complexity'] = df[diagnosis_cols].notna().sum(axis=1)

        # Procedure count
        procedure_cols = [f'ClmProcedureCode_{i}' for i in range(1, 7)]
        processed['procedure_count'] = df[procedure_cols].notna().sum(axis=1)

        # Treatment cost (estimate as 80% of claim amount)
        processed['treatment_cost'] = processed['claim_amount'] * 0.8

        # Test count (estimate based on procedures and diagnoses)
        processed['test_count'] = processed['procedure_count'] + (processed['diagnosis_complexity'] * 0.5)
        processed['test_count'] = processed['test_count'].astype(int)

        # Age (synthetic - Medicare beneficiaries are typically 65+)
        processed['age'] = np.random.normal(72, 8, len(processed))
        processed['age'] = processed['age'].clip(65, 100)

        # Hospital rating (synthetic based on provider)
        provider_ratings = {}
        for provider in processed['provider'].unique():
            provider_ratings[provider] = np.random.uniform(2.5, 5.0)
        processed['hospital_rating'] = processed['provider'].map(provider_ratings)

        # Previous claims (synthetic)
        bene_claim_counts = processed.groupby('bene_id').size()
        processed['previous_claims'] = processed['bene_id'].map(bene_claim_counts) - 1
        processed['previous_claims'] = processed['previous_claims'].clip(0, 20)

        # Medicine count (estimate based on diagnosis complexity)
        processed['medicine_count'] = (processed['diagnosis_complexity'] * 0.7).astype(int) + np.random.poisson(2, len(processed))

        # Claim type
        processed['claim_type'] = 'inpatient'

        return processed

    def process_outpatient_data(df):
        processed = pd.DataFrame()

        # Basic claim info
        processed['claim_id'] = df['ClaimID']
        processed['bene_id'] = df['BeneID']
        processed['provider'] = df['Provider']
        processed['claim_amount'] = pd.to_numeric(df['InscClaimAmtReimbursed'], errors='coerce')

        # Outpatient claims have no admission days
        processed['admission_days'] = 0

        # Diagnosis complexity
        diagnosis_cols = [f'ClmDiagnosisCode_{i}' for i in range(1, 11)]
        processed['diagnosis_complexity'] = df[diagnosis_cols].notna().sum(axis=1)

        # Procedure count
        procedure_cols = [f'ClmProcedureCode_{i}' for i in range(1, 7)]
        processed['procedure_count'] = df[procedure_cols].notna().sum(axis=1)

        # Treatment cost (estimate as 60% of claim amount for outpatient)
        processed['treatment_cost'] = processed['claim_amount'] * 0.6

        # Test count (lower for outpatient)
        processed['test_count'] = processed['procedure_count'] + (processed['diagnosis_complexity'] * 0.3)
        processed['test_count'] = processed['test_count'].astype(int)

        # Age (synthetic)
        processed['age'] = np.random.normal(70, 6, len(processed))
        processed['age'] = processed['age'].clip(65, 95)

        # Hospital rating
        provider_ratings = {}
        for provider in processed['provider'].unique():
            provider_ratings[provider] = np.random.uniform(3.0, 5.0)
        processed['hospital_rating'] = processed['provider'].map(provider_ratings)

        # Previous claims
        bene_claim_counts = processed.groupby('bene_id').size()
        processed['previous_claims'] = processed['bene_id'].map(bene_claim_counts) - 1
        processed['previous_claims'] = processed['previous_claims'].clip(0, 15)

        # Medicine count
        processed['medicine_count'] = (processed['diagnosis_complexity'] * 0.5).astype(int) + np.random.poisson(1, len(processed))

        # Claim type
        processed['claim_type'] = 'outpatient'

        return processed

    # Process both datasets
    inpatient_processed = process_inpatient_data(inpatient_df)
    outpatient_processed = process_outpatient_data(outpatient_df)

    # Combine datasets
    combined_df = pd.concat([inpatient_processed, outpatient_processed], ignore_index=True)

    # Generate fraud labels based on suspicious patterns
    def generate_fraud_labels(df):
        fraud_indicators = []

        # High claim amounts
        fraud_indicators.append(df['claim_amount'] > df['claim_amount'].quantile(0.95))

        # Many procedures/diagnoses
        fraud_indicators.append(df['procedure_count'] > 4)
        fraud_indicators.append(df['diagnosis_complexity'] > 7)

        # High medicine count
        fraud_indicators.append(df['medicine_count'] > 8)

        # Many previous claims
        fraud_indicators.append(df['previous_claims'] > 10)

        # Low hospital rating with high claim amount
        fraud_indicators.append((df['hospital_rating'] < 3.0) & (df['claim_amount'] > df['claim_amount'].quantile(0.90)))

        # Combine indicators
        fraud_score = sum(fraud_indicators)
        fraud_score = fraud_score / len(fraud_indicators)  # Normalize

        # Add some randomness to make it realistic
        fraud_score += np.random.normal(0, 0.1, len(df))
        fraud_score = np.clip(fraud_score, 0, 1)

        # Classify as fraud if score > 0.6
        is_fraud = (fraud_score > 0.6).astype(int)

        # Ensure we have some fraud cases (at least 10%)
        fraud_rate = is_fraud.mean()
        if fraud_rate < 0.1:
            # Add more fraud cases
            additional_fraud_indices = np.random.choice(
                len(df), size=int(len(df) * 0.1), replace=False
            )
            is_fraud.iloc[additional_fraud_indices] = 1

        return is_fraud

    combined_df['is_fraud'] = generate_fraud_labels(combined_df)

    # Clean data
    combined_df = combined_df.dropna()
    combined_df = combined_df[combined_df['claim_amount'] > 0]

    # Select final columns for training
    final_columns = [
        'treatment_cost', 'claim_amount', 'admission_days', 'test_count',
        'age', 'hospital_rating', 'previous_claims', 'diagnosis_complexity',
        'medicine_count', 'procedure_count', 'is_fraud'
    ]

    final_df = combined_df[final_columns].copy()

    print(f"Final dataset shape: {final_df.shape}")
    print(f"Fraud rate: {final_df['is_fraud'].mean():.3f}")
    print(f"Columns: {list(final_df.columns)}")

    return final_df

if __name__ == "__main__":
    # File paths
    inpatient_path = r"c:\Users\hp\Desktop\dataset2\Test_Inpatientdata-1542969243754.csv"
    outpatient_path = r"c:\Users\hp\Desktop\dataset2\Test_Outpatientdata-1542969243754.csv"

    # Process data
    processed_data = preprocess_medicare_data(inpatient_path, outpatient_path)

    # Save processed data
    output_path = r"c:\Users\hp\Desktop\dataset2\processed_medicare_data.csv"
    processed_data.to_csv(output_path, index=False)
    print(f"Processed data saved to: {output_path}")