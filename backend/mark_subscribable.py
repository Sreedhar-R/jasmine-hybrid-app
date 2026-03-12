"""
mark_subscribable.py
Marks specific products in Firestore as subscriptionAvailable=True
so they show up in the Subscription screen's Browse tab.
Run once: python mark_subscribable.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import get_db
from crud import get_all_documents, update_document

# Keywords to match — any product whose name contains any of these gets flagged
KEYWORDS = [
    'tomato', 'spinach', 'carrot', 'milk', 'rose', 'sunflower',
    'strawberry', 'mango', 'banana', 'onion', 'potato', 'lettuce',
    'broccoli', 'tulip', 'orchid', 'lily', 'jasmine', 'marigold',
]

SUBSCRIPTION_BADGE_MAP = {
    'daily':   'DAILY',
    'fresh':   'FRESH',
    'milk':    'DAILY',
    'weekly':  'WEEKLY',
}

def main():
    get_db()
    products = get_all_documents("products")
    updated = 0
    for p in products:
        name_lower = p.get("name", "").lower()
        if any(kw in name_lower for kw in KEYWORDS):
            badge = "POPULAR" if updated % 3 == 0 else ("FRESH" if updated % 3 == 1 else "SAVE 10%")
            update_document("products", p["id"], {
                "subscriptionAvailable": True,
                "subscriptionBadge": badge,
            })
            print(f"  ✓ {p['name']} [{badge}]")
            updated += 1

    print(f"\nDone. {updated} product(s) marked as subscribable.")

if __name__ == "__main__":
    main()
