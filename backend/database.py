import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

_db = None

def get_db() -> firestore.AsyncClient:
    """Returns the Firestore client, initializing it if necessary."""
    global _db
    if _db is None:
        _initialize_firebase()
    return _db

def _initialize_firebase():
    """Initialize Firebase Admin SDK using a service account key file."""
    global _db

    if firebase_admin._apps:
        # App already initialized
        _db = firestore.client()
        return

    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH", "serviceAccountKey.json")

    if not os.path.exists(service_account_path):
        raise FileNotFoundError(
            f"Firebase service account key not found at: '{service_account_path}'. "
            "Please download it from your Firebase console and set "
            "FIREBASE_SERVICE_ACCOUNT_KEY_PATH in your .env file."
        )

    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)
    _db = firestore.client()
    print("✅ Connected to Firestore successfully.")
