import requests
import os

def train_model_with_csv(csv_path: str, api_url: str = "http://localhost:8000/api/model/train"):
    """
    Upload and train model with CSV file
    """
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return None

    try:
        print(f"Uploading {csv_path} to {api_url}...")

        with open(csv_path, 'rb') as f:
            files = {'file': (os.path.basename(csv_path), f, 'text/csv')}
            response = requests.post(api_url, files=files, timeout=120)

        print(f"Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("Training successful!")
            print(f"Accuracy: {result['training_metrics']['accuracy']:.4f}")
            print(f"Trained on {result['training_metrics']['trained_on']} samples")
            return result
        else:
            print(f"Training failed: {response.text}")
            return None

    except Exception as e:
        print(f"Error during training: {str(e)}")
        return None

if __name__ == "__main__":
    csv_path = r"c:\Users\hp\Desktop\dataset2\processed_medicare_data.csv"
    result = train_model_with_csv(csv_path)

    if result:
        print("\nModel training completed successfully!")
        print("The fraud detection system is now using your Medicare data.")
    else:
        print("\nModel training failed.")