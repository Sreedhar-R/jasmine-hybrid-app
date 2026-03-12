"""Seeds sample orders for seeded users. Run: python seed_orders.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from database import get_db

db = get_db()

def _dt(days_ago):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()

def clear():
    print("Clearing orders...")
    for d in db.collection('orders').stream():
        d.reference.delete()

def seed():
    clear()

    # Get all users
    users = [{'id': d.id, **d.to_dict()} for d in db.collection('users').stream()]
    if not users:
        print("No users found. Run seed_users.py first.")
        return

    sample_orders = [
        {
            "items": [
                {"productId": "p1", "name": "Fresh Tomatoes",  "unit": "1 kg",  "qty": 2, "price": 40.0,  "image": "🍅"},
                {"productId": "p2", "name": "Baby Spinach",    "unit": "250 g", "qty": 1, "price": 55.0,  "image": "🥬"},
            ],
            "status": "Delivered",
            "paymentMethod": "UPI",
            "deliveryAddress": "12, MG Road, Bengaluru",
            "createdAt": _dt(30),
        },
        {
            "items": [
                {"productId": "p3", "name": "Alphonso Mangoes","unit": "1 dozen","qty": 1, "price": 320.0, "image": "🥭"},
                {"productId": "p4", "name": "Organic Milk",    "unit": "500 ml","qty": 3, "price": 35.0,  "image": "🥛"},
            ],
            "status": "Delivered",
            "paymentMethod": "Card",
            "deliveryAddress": "12, MG Road, Bengaluru",
            "createdAt": _dt(15),
        },
        {
            "items": [
                {"productId": "p5", "name": "Brown Bread",     "unit": "400 g", "qty": 1, "price": 45.0,  "image": "🍞"},
                {"productId": "p6", "name": "Free-range Eggs", "unit": "6 pcs", "qty": 2, "price": 72.0,  "image": "🥚"},
                {"productId": "p7", "name": "Cheddar Cheese",  "unit": "200 g", "qty": 1, "price": 180.0, "image": "🧀"},
            ],
            "status": "Out for Delivery",
            "paymentMethod": "COD",
            "deliveryAddress": "12, MG Road, Bengaluru",
            "createdAt": _dt(1),
        },
    ]

    for user in users:
        for i, order in enumerate(sample_orders[:2 if user['role'] == 'admin' else 3]):
            total = sum(it['price'] * it['qty'] for it in order['items'])
            payload = {**order, "userId": user['id'], "total": total}
            _, ref = db.collection('orders').add(payload)
            print(f"  Order {ref.id[:8]}… for {user['firstName']} — ₹{total:.0f} [{order['status']}]")

    print("\nOrders seeded!")

if __name__ == '__main__':
    seed()
