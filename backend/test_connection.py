"""
Quick Firestore connection test.
Run: python test_connection.py
"""
import os
import sys

def test_firestore_connection():
    # 1. Check service account key
    key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH", "serviceAccountKey.json")
    if not os.path.exists(key_path):
        print(f"❌ Service account key not found at: '{key_path}'")
        print()
        print("To fix this:")
        print("  1. Go to Firebase Console → Project Settings → Service Accounts")
        print("  2. Click 'Generate New Private Key'")
        print("  3. Save the JSON as: backend/serviceAccountKey.json")
        sys.exit(1)

    # 2. Try to initialize Firebase
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("❌ firebase-admin is not installed.")
        print("   Run: pip install -r requirements.txt")
        sys.exit(1)

    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)

        db = firestore.client()
        print("✅ Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"❌ Failed to initialize Firebase: {e}")
        sys.exit(1)

    # 3. Try a simple Firestore read (list collections)
    try:
        collections = list(db.collections())
        print(f"✅ Connected to Firestore. Found {len(collections)} collection(s).")
        if collections:
            print("   Collections:", [col.id for col in collections])
        else:
            print("   (No collections yet — that's OK for a fresh database)")
    except Exception as e:
        print(f"❌ Firestore query failed: {e}")
        sys.exit(1)

    print()
    print("🎉 Database connection is working!")

if __name__ == "__main__":
    # Load .env if present
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass  # python-dotenv optional for the test

    test_firestore_connection()
