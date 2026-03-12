"""
One-off script: add `images` array to the Organic Tomatoes product in Firestore.
Run: python update_tomato_images.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from database import get_db

db = get_db()

TOMATO_IMAGES = [
    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400",  # vine tomatoes (existing)
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400",  # red cluster tomatoes
    "https://images.unsplash.com/photo-1561136594-7f68413baa99?w=400",  # cherry tomatoes
    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400",  # sliced tomatoes
]

# Find the Organic Tomatoes document
docs = db.collection("products").where("name", "==", "Organic Tomatoes").stream()
updated = 0
for doc in docs:
    doc.reference.update({"images": TOMATO_IMAGES})
    print(f"Updated '{doc.to_dict().get('name')}' (ID: {doc.id}) with {len(TOMATO_IMAGES)} images.")
    updated += 1

if updated == 0:
    print("No 'Organic Tomatoes' product found. Run seed_all.py first.")
else:
    print(f"\n✅ Done — added {len(TOMATO_IMAGES)} images to {updated} product(s).")
