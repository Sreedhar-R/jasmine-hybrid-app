"""Seed the 'banners' collection in Firestore (clears existing docs first)."""
from database import get_db

db = get_db()

# Clear existing docs
print("Clearing existing banners...")
for doc in db.collection('banners').stream():
    doc.reference.delete()
    print(f"  Deleted: {doc.id}")

banners = [
    {
        'name': 'Summer Sale',
        'description': 'Up to 50% off on fresh organic fruits and vegetables',
        'image': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
        'link': '/products?category=fruits',
        'order': 1
    },
    {
        'name': 'New Arrivals',
        'description': 'Discover our latest organic dairy and grain products',
        'image': 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800',
        'link': '/products?tag=new',
        'order': 2
    },
    {
        'name': 'Subscribe & Save',
        'description': 'Get 20% off every order with a weekly subscription plan',
        'image': 'https://images.unsplash.com/photo-1553546895-531931aa1aa8?w=800',
        'link': '/subscription',
        'order': 3
    }
]

col = db.collection('banners')
for banner in banners:
    _, ref = col.add(banner)
    print(f"Added banner: '{banner['name']}' -> ID: {ref.id}")

print(f"\n✅ Banners collection seeded with {len(banners)} documents.")
