import pandas as pd
import numpy as np
import folium
import json
from typing import Dict, List, Any, Tuple
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import time

# Mock hospital data with geographic information
HOSPITAL_DATA = {
    "City General Hospital": {
        "location": [40.7128, -74.0060],  # NYC coordinates
        "address": "123 Main St, New York, NY",
        "rating": 4.2,
        "total_claims": 1250,
        "fraud_rate": 0.12
    },
    "Metro Medical Center": {
        "location": [40.7589, -73.9851],  # Manhattan
        "address": "456 Health Ave, New York, NY",
        "rating": 3.8,
        "total_claims": 980,
        "fraud_rate": 0.18
    },
    "Regional Hospital": {
        "location": [40.7282, -73.7949],  # Queens
        "address": "789 Care Blvd, Queens, NY",
        "rating": 4.5,
        "total_claims": 750,
        "fraud_rate": 0.08
    },
    "University Medical Center": {
        "location": [40.7831, -73.9712],  # Upper East Side
        "address": "321 Research Dr, New York, NY",
        "rating": 4.8,
        "total_claims": 1500,
        "fraud_rate": 0.06
    },
    "Community Health Hospital": {
        "location": [40.6501, -73.9496],  # Brooklyn
        "address": "654 Community St, Brooklyn, NY",
        "rating": 3.9,
        "total_claims": 620,
        "fraud_rate": 0.15
    }
}

def generate_mock_claims_data(n_claims: int = 1000) -> pd.DataFrame:
    """Generate mock claims data for heatmap visualization"""
    np.random.seed(42)

    hospitals = list(HOSPITAL_DATA.keys())
    hospital_weights = [data['total_claims'] for data in HOSPITAL_DATA.values()]
    hospital_weights = np.array(hospital_weights) / sum(hospital_weights)

    claims = []
    for i in range(n_claims):
        hospital = np.random.choice(hospitals, p=hospital_weights)
        base_fraud_rate = HOSPITAL_DATA[hospital]['fraud_rate']

        # Add some randomness and temporal patterns
        temporal_factor = np.random.normal(1, 0.2)
        claim_amount = np.random.exponential(5000) * temporal_factor

        # Fraud probability influenced by hospital baseline + claim characteristics
        fraud_prob = base_fraud_rate
        if claim_amount > 8000:
            fraud_prob += 0.1
        if np.random.random() < 0.1:  # 10% chance of additional fraud factors
            fraud_prob += np.random.uniform(0.05, 0.15)

        fraud_prob = min(0.95, max(0.01, fraud_prob))

        claim = {
            'claim_id': f'CLM-{100000 + i}',
            'hospital_name': hospital,
            'hospital_location': HOSPITAL_DATA[hospital]['location'],
            'patient_id': f'PT-{10000 + np.random.randint(1, 5000)}',
            'treatment_cost': claim_amount * 0.8,
            'claim_amount': claim_amount,
            'admission_days': max(1, int(np.random.exponential(3))),
            'test_count': max(1, int(np.random.poisson(5))),
            'fraud_probability': fraud_prob,
            'date': pd.Timestamp('2026-01-01') + pd.Timedelta(days=np.random.randint(0, 90)),
            'diagnosis': np.random.choice([
                'Acute Bronchitis', 'Pneumonia', 'Cardiac Arrest', 'Fracture',
                'Diabetes Management', 'Hypertension', 'Back Pain', 'Migraine'
            ]),
            'claim_type': np.random.choice(['Inpatient', 'Outpatient', 'Emergency', 'Surgery'])
        }
        claims.append(claim)

    return pd.DataFrame(claims)

def get_risk_color(probability: float) -> str:
    """Get color based on fraud probability"""
    if probability >= 0.6:
        return 'red'
    elif probability >= 0.3:
        return 'yellow'
    else:
        return 'green'

def get_risk_level(probability: float) -> str:
    """Get risk level description"""
    if probability >= 0.6:
        return 'High Risk'
    elif probability >= 0.3:
        return 'Medium Risk'
    else:
        return 'Low Risk'

def create_fraud_heatmap(filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Create fraud risk heatmap data with filtering capabilities
    """
    # Generate mock data
    claims_df = generate_mock_claims_data(1000)

    # Apply filters
    if filters:
        if 'hospital' in filters and filters['hospital']:
            claims_df = claims_df[claims_df['hospital_name'].isin(filters['hospital'])]

        if 'claim_type' in filters and filters['claim_type']:
            claims_df = claims_df[claims_df['claim_type'].isin(filters['claim_type'])]

        if 'date_range' in filters and filters['date_range']:
            start_date = pd.to_datetime(filters['date_range'][0])
            end_date = pd.to_datetime(filters['date_range'][1])
            claims_df = claims_df[(claims_df['date'] >= start_date) & (claims_df['date'] <= end_date)]

        if 'risk_level' in filters and filters['risk_level']:
            risk_map = {'Low Risk': (0, 0.3), 'Medium Risk': (0.3, 0.6), 'High Risk': (0.6, 1.0)}
            if filters['risk_level'][0] in risk_map:
                min_prob, max_prob = risk_map[filters['risk_level'][0]]
                claims_df = claims_df[(claims_df['fraud_probability'] >= min_prob) &
                                    (claims_df['fraud_probability'] <= max_prob)]

    # Aggregate by hospital
    hospital_stats = claims_df.groupby('hospital_name').agg({
        'fraud_probability': ['mean', 'count', 'std'],
        'claim_amount': ['mean', 'sum'],
        'claim_id': 'count'
    }).round(4)

    hospital_stats.columns = ['avg_fraud_prob', 'claim_count', 'fraud_std', 'avg_claim_amount', 'total_claim_amount', 'total_claims']
    hospital_stats = hospital_stats.reset_index()

    # Create heatmap data points
    heatmap_data = []
    for _, row in hospital_stats.iterrows():
        hospital_info = HOSPITAL_DATA.get(row['hospital_name'], {})
        if hospital_info:
            point = {
                'hospital_name': row['hospital_name'],
                'location': hospital_info['location'],
                'address': hospital_info.get('address', ''),
                'avg_fraud_probability': row['avg_fraud_prob'],
                'risk_level': get_risk_level(row['avg_fraud_prob']),
                'risk_color': get_risk_color(row['avg_fraud_prob']),
                'claim_count': int(row['claim_count']),
                'avg_claim_amount': float(row['avg_claim_amount']),
                'total_claim_amount': float(row['total_claim_amount']),
                'hospital_rating': hospital_info.get('rating', 0),
                'coordinates': {
                    'lat': hospital_info['location'][0],
                    'lng': hospital_info['location'][1]
                }
            }
            heatmap_data.append(point)

    # Sort by fraud probability
    heatmap_data.sort(key=lambda x: x['avg_fraud_probability'], reverse=True)

    return {
        'heatmap_data': heatmap_data,
        'summary_stats': {
            'total_hospitals': len(heatmap_data),
            'total_claims': int(claims_df.shape[0]),
            'avg_fraud_rate': float(claims_df['fraud_probability'].mean()),
            'high_risk_hospitals': len([h for h in heatmap_data if h['risk_level'] == 'High Risk']),
            'total_claim_amount': float(claims_df['claim_amount'].sum())
        },
        'filters_applied': filters or {}
    }

def get_hospital_details(hospital_name: str) -> Dict[str, Any]:
    """Get detailed information about a specific hospital"""
    claims_df = generate_mock_claims_data(1000)
    hospital_claims = claims_df[claims_df['hospital_name'] == hospital_name]

    if hospital_claims.empty:
        return {'error': 'Hospital not found'}

    hospital_info = HOSPITAL_DATA.get(hospital_name, {})

    # Calculate detailed statistics
    stats = {
        'hospital_name': hospital_name,
        'location': hospital_info.get('location', []),
        'address': hospital_info.get('address', ''),
        'rating': hospital_info.get('rating', 0),
        'total_claims': len(hospital_claims),
        'avg_fraud_probability': float(hospital_claims['fraud_probability'].mean()),
        'risk_level': get_risk_level(hospital_claims['fraud_probability'].mean()),
        'total_claim_amount': float(hospital_claims['claim_amount'].sum()),
        'avg_claim_amount': float(hospital_claims['claim_amount'].mean()),
        'fraud_distribution': {
            'low_risk': len(hospital_claims[hospital_claims['fraud_probability'] < 0.3]),
            'medium_risk': len(hospital_claims[(hospital_claims['fraud_probability'] >= 0.3) &
                                             (hospital_claims['fraud_probability'] < 0.6)]),
            'high_risk': len(hospital_claims[hospital_claims['fraud_probability'] >= 0.6])
        },
        'top_diagnoses': hospital_claims['diagnosis'].value_counts().head(5).to_dict(),
        'claim_types': hospital_claims['claim_type'].value_counts().to_dict(),
        'monthly_trend': hospital_claims.groupby(hospital_claims['date'].dt.month)['fraud_probability'].mean().to_dict()
    }

    return stats

def get_geographic_clusters(radius_km: float = 5.0) -> List[Dict[str, Any]]:
    """Identify geographic clusters of high-risk hospitals"""
    heatmap_data = create_fraud_heatmap()['heatmap_data']

    clusters = []
    processed = set()

    for hospital in heatmap_data:
        if hospital['hospital_name'] in processed or hospital['risk_level'] != 'High Risk':
            continue

        cluster = {
            'center_hospital': hospital['hospital_name'],
            'center_location': hospital['coordinates'],
            'cluster_members': [hospital],
            'avg_fraud_rate': hospital['avg_fraud_probability'],
            'total_claims': hospital['claim_count']
        }

        # Find nearby high-risk hospitals
        for other_hospital in heatmap_data:
            if (other_hospital['hospital_name'] != hospital['hospital_name'] and
                other_hospital['risk_level'] == 'High Risk' and
                other_hospital['hospital_name'] not in processed):

                distance = geodesic(
                    (hospital['coordinates']['lat'], hospital['coordinates']['lng']),
                    (other_hospital['coordinates']['lat'], other_hospital['coordinates']['lng'])
                ).km

                if distance <= radius_km:
                    cluster['cluster_members'].append(other_hospital)
                    cluster['avg_fraud_rate'] = (cluster['avg_fraud_rate'] + other_hospital['avg_fraud_probability']) / 2
                    cluster['total_claims'] += other_hospital['claim_count']
                    processed.add(other_hospital['hospital_name'])

        if len(cluster['cluster_members']) > 1:
            clusters.append(cluster)
        processed.add(hospital['hospital_name'])

    return clusters