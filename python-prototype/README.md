# Hybrid Healthcare Fraud Intelligence Platform

This folder contains the complete Python backend and Streamlit dashboard for the hackathon project.

## System Architecture

```mermaid
graph TD
    A[Data Sources: Claims, Hospitals, Prescriptions] --> B[Data Integration]
    B --> C[Data Preprocessing]
    C --> D[Feature Engineering]
    D --> E[ML Fraud Detection: XGBoost + Isolation Forest]
    D --> F[Graph Network Analysis: NetworkX]
    E --> G[Explainable AI: SHAP]
    E --> H[FastAPI Backend]
    F --> H
    G --> H
    H --> I[Streamlit Dashboard]
```

## Folder Structure

```
python-prototype/
â”œâ”€â”€ data_simulator.py      # Generates synthetic healthcare datasets
â”œâ”€â”€ preprocessing.py       # Cleans and merges datasets, feature engineering
â”œâ”€â”€ model_training.py      # Trains XGBoost and Isolation Forest models
â”œâ”€â”€ network_analysis.py    # Builds and analyzes patient-doctor-hospital graphs
â”œâ”€â”€ explainability.py      # Generates SHAP values for model predictions
â”œâ”€â”€ api.py                 # FastAPI backend serving predictions and graphs
â”œâ”€â”€ app.py                 # Streamlit interactive dashboard
â”œâ”€â”€ requirements.txt       # Python dependencies
â””â”€â”€ README.md              # Instructions
```

## Instructions for Running Locally

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Generate Data and Train Models:**
   ```bash
   python data_simulator.py
   python preprocessing.py
   python model_training.py
   ```

4. **Run the FastAPI Backend (Terminal 1):**
   ```bash
   uvicorn api:app --reload --port 8000
   ```

5. **Run the Streamlit Dashboard (Terminal 2):**
   ```bash
   streamlit run app.py
   ```

## Deployment Steps (Streamlit Cloud / Render)

### Streamlit Cloud (Frontend)
1. Push this repository to GitHub.
2. Go to [share.streamlit.io](https://share.streamlit.io/).
3. Click "New app", select your repository, branch, and set the main file path to `python-prototype/app.py`.
4. Click "Deploy".

### Render (FastAPI Backend)
1. Go to [Render.com](https://render.com/) and create a new "Web Service".
2. Connect your GitHub repository.
3. Set the Build Command to: `pip install -r python-prototype/requirements.txt`
4. Set the Start Command to: `cd python-prototype && uvicorn api:app --host 0.0.0.0 --port $PORT`
5. Click "Create Web Service".
6. Update the `API_URL` in `app.py` to point to your new Render URL.
