# import pytesseract
# from PIL import Image
# import cv2

def extract_bill_data(image_bytes: bytes) -> dict:
    """
    Uses OCR to extract information from uploaded bills such as hospital name, 
    patient ID, diagnosis, procedure codes, medicines, quantities, dates, and total bill amount.
    """
    # In a real implementation:
    # image = Image.open(io.BytesIO(image_bytes))
    # text = pytesseract.image_to_string(image)
    # parsed_data = nlp_parse_medical_text(text)
    
    # Mocking the OCR extraction for architectural demonstration
    return {
        "hospital_name": "City General Hospital",
        "patient_id": "PT-88291",
        "diagnosis": "Acute Bronchitis",
        "procedure_codes": ["99214", "71045"],
        "medicines": [
            {"name": "Azithromycin", "quantity": 30},
            {"name": "Albuterol Sulfate", "quantity": 2}
        ],
        "date": "2026-03-12",
        "total_amount": 12500.00
    }
