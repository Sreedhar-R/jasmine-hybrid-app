"""Seed the 'categories' collection in Firestore with 9 items."""
from database import get_db

db = get_db()

categories = [
    {
        'name': 'Vegetables',
        'image': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400',
        'order': 1
    },
    {
        'name': 'Fruits',
        'image': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
        'order': 2
    },
    {
        'name': 'Dairy',
        'image': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        'order': 3
    },
    {
        'name': 'Bakery',
        'image': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
        'order': 4
    },
    {
        'name': 'Meat',
        'image': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
        'order': 5
    },
    {
        'name': 'Seafood',
        'image': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400',
        'order': 6
    },
    {
        'name': 'Grains',
        'image': 'https://images.unsplash.com/photo-1568347877321-f8935c7dc5f5?w=400',
        'order': 7
    },
    {
        'name': 'Beverages',
        'image': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
        'order': 8
    },
    {
        'name': 'Snacks',
        'image': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400',
        'order': 9
    },
]

col = db.collection('categories')
for cat in categories:
    _, ref = col.add(cat)
    print(f"Added category: '{cat['name']}' -> ID: {ref.id}")

print(f"\n✅ Categories collection created with {len(categories)} documents.")
