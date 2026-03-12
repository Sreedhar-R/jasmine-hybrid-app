"""
Seeds 2 sample users, each with 2 addresses (one primary).
Run: python seed_users.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone
from database import get_db
from models import get_password_hash

db = get_db()


def _now():
    return datetime.now(timezone.utc).isoformat()


def clear_collections():
    print("Clearing users and addresses...")
    for col in ["users", "addresses"]:
        for doc in db.collection(col).stream():
            doc.reference.delete()
    print("  Done.")


def seed():
    clear_collections()

    users_data = [
        {
            "firstName": "Priya",
            "lastName": "Sharma",
            "email": "priya.sharma@example.com",
            "phone": "+91-9876543210",
            "role": "user",
            "hashedPassword": get_password_hash("Priya@1234"),
            "primaryAddressId": None,
            "createdAt": _now(),
            "updatedAt": _now(),
        },
        {
            "firstName": "Admin",
            "lastName": "User",
            "email": "admin@example.com",
            "phone": "+91-9000000000",
            "role": "admin",
            "hashedPassword": get_password_hash("Admin@1234"),
            "primaryAddressId": None,
            "createdAt": _now(),
            "updatedAt": _now(),
        },
    ]

    addresses_data = {
        "priya": [
            {
                "label": "Home",
                "street": "12, MG Road",
                "city": "Bengaluru",
                "state": "Karnataka",
                "zipCode": "560001",
                "country": "India",
                "isPrimary": True,
            },
            {
                "label": "Work",
                "street": "45, Whitefield Tech Park",
                "city": "Bengaluru",
                "state": "Karnataka",
                "zipCode": "560066",
                "country": "India",
                "isPrimary": False,
            },
        ],
        "admin": [
            {
                "label": "Home",
                "street": "7, Brigade Road",
                "city": "Bengaluru",
                "state": "Karnataka",
                "zipCode": "560025",
                "country": "India",
                "isPrimary": True,
            },
        ],
    }

    user_keys = ["priya", "admin"]

    for i, user_payload in enumerate(users_data):
        _, user_ref = db.collection("users").add(user_payload)
        user_id = user_ref.id
        primary_addr_id = None

        for addr in addresses_data[user_keys[i]]:
            addr_payload = {**addr, "userId": user_id, "createdAt": _now()}
            _, addr_ref = db.collection("addresses").add(addr_payload)

            if addr["isPrimary"]:
                primary_addr_id = addr_ref.id
            print(f"  Created address '{addr['label']}' for {user_payload['firstName']}")

        # Update user with primaryAddressId
        db.collection("users").document(user_id).update({
            "primaryAddressId": primary_addr_id
        })
        print(f"Created user: {user_payload['firstName']} {user_payload['lastName']} (role={user_payload['role']})")

    print("\nSeeding complete!")


if __name__ == "__main__":
    seed()
