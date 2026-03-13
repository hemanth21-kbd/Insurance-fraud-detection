import pandas as pd
import networkx as nx
import json

def analyze_fraud_network():
    print("Building and analyzing Fraud Network Graph...")
    claims = pd.read_csv('claims.csv')
    prescriptions = pd.read_csv('prescriptions.csv')
    
    # Filter for suspicious claims (for prototype, just take a sample)
    suspicious_claims = claims[claims['fraud_label'] == 1].head(100)
    
    # Merge with prescriptions to get pharmacy links
    suspicious_df = suspicious_claims.merge(prescriptions, on='patient_id', how='left')
    
    G = nx.Graph()
    
    for _, row in suspicious_df.iterrows():
        patient = row['patient_id']
        doctor = row['doctor_id']
        hospital = row['hospital_id']
        pharmacy = row['pharmacy_id'] if pd.notna(row['pharmacy_id']) else None
        
        # Add nodes
        G.add_node(patient, type='Patient', group=1)
        G.add_node(doctor, type='Doctor', group=2)
        G.add_node(hospital, type='Hospital', group=3)
        
        # Add edges
        G.add_edge(patient, doctor, weight=1)
        G.add_edge(doctor, hospital, weight=1)
        G.add_edge(patient, hospital, weight=1)
        
        if pharmacy:
            G.add_node(pharmacy, type='Pharmacy', group=4)
            G.add_edge(patient, pharmacy, weight=1)
            G.add_edge(doctor, pharmacy, weight=1)
        
    # Calculate centrality to find highly connected (suspicious) nodes
    degree_dict = dict(G.degree(G.nodes()))
    nx.set_node_attributes(G, degree_dict, 'degree')
    
    # Export to JSON for frontend visualization
    data = nx.node_link_data(G)
    
    # Format for react-force-graph
    formatted_data = {
        "nodes": [{"id": n, "label": f"{G.nodes[n]['type']} {n}", "group": G.nodes[n]['group'], "val": G.nodes[n]['degree']} for n in G.nodes()],
        "links": [{"source": u, "target": v, "value": d['weight']} for u, v, d in G.edges(data=True)]
    }
    
    with open('network_data.json', 'w') as f:
        json.dump(formatted_data, f)
        
    print("Network analysis complete. Saved to network_data.json.")
    return G

if __name__ == "__main__":
    analyze_fraud_network()
