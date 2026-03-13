import networkx as nx

# Initialize global fraud network graph
fraud_graph = nx.Graph()

def update_fraud_network(claim_data: dict, fraud_score: float):
    """
    Constructs a graph of patients, hospitals, doctors, and insurance agents 
    using NetworkX to detect suspicious relationships or repeated fraud patterns.
    """
    patient = claim_data.get("patient_id")
    hospital = claim_data.get("hospital_name")
    doctor = claim_data.get("doctor_id")
    
    if patient and hospital:
        fraud_graph.add_node(patient, type="patient")
        fraud_graph.add_node(hospital, type="hospital")
        # Edge weight increases with fraud score
        fraud_graph.add_edge(patient, hospital, weight=fraud_score)
        
    if doctor and hospital:
        fraud_graph.add_node(doctor, type="doctor")
        fraud_graph.add_edge(doctor, hospital, weight=fraud_score)

def get_hospital_risk(hospital_id: str):
    """
    Calculates risk based on network centrality and connected suspicious nodes.
    """
    if hospital_id not in fraud_graph:
        return {"hospital_id": hospital_id, "risk_score": 0.0, "connections": 0}
        
    # Example: Use degree centrality as a basic risk multiplier
    centrality = nx.degree_centrality(fraud_graph).get(hospital_id, 0)
    
    return {
        "hospital_id": hospital_id,
        "risk_score": min(100, centrality * 1000), # Scaled for example
        "connections": len(list(fraud_graph.neighbors(hospital_id)))
    }
