"""Seed the 'products' collection in Firestore with 12 featured products."""
from database import get_db

db = get_db()

products = [
    {
        'name': 'Organic Tomatoes',
        'originalPrice': 3.99,
        'discountedPrice': 2.99,
        'price': 2.99,
        'image': 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
        'category': 'Vegetables',
        'description': 'Fresh vine-ripened organic tomatoes',
        'unit': '500g',
        'inStock': True
    },
    {
        'name': 'Alphonso Mangoes',
        'originalPrice': 7.49,
        'discountedPrice': 5.49,
        'price': 5.49,
        'image': 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=400',
        'category': 'Fruits',
        'description': 'Sweet and aromatic Alphonso mangoes',
        'unit': '1kg',
        'inStock': True
    },
    {
        'name': 'Whole Milk',
        'originalPrice': 2.49,
        'discountedPrice': 1.89,
        'price': 1.89,
        'image': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
        'category': 'Dairy',
        'description': 'Farm-fresh whole milk',
        'unit': '1L',
        'inStock': True
    },
    {
        'name': 'Sourdough Bread',
        'originalPrice': 4.99,
        'discountedPrice': 3.99,
        'price': 3.99,
        'image': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400',
        'category': 'Bakery',
        'description': 'Artisan sourdough baked fresh daily',
        'unit': '400g loaf',
        'inStock': True
    },
    {
        'name': 'Chicken Breast',
        'originalPrice': 9.49,
        'discountedPrice': 6.99,
        'price': 6.99,
        'image': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
        'category': 'Meat',
        'description': 'Free-range boneless chicken breast',
        'unit': '500g',
        'inStock': True
    },
    {
        'name': 'Atlantic Salmon',
        'originalPrice': 13.99,
        'discountedPrice': 9.99,
        'price': 9.99,
        'image': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
        'category': 'Seafood',
        'description': 'Fresh Atlantic salmon fillet',
        'unit': '300g',
        'inStock': True
    },
    {
        'name': 'Basmati Rice',
        'originalPrice': 5.99,
        'discountedPrice': 4.49,
        'price': 4.49,
        'image': 'https://images.unsplash.com/photo-1536304993881-ff86e6920f6c?w=400',
        'category': 'Grains',
        'description': 'Premium long-grain Basmati rice',
        'unit': '1kg',
        'inStock': True
    },
    {
        'name': 'Orange Juice',
        'originalPrice': 3.29,
        'discountedPrice': 2.49,
        'price': 2.49,
        'image': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
        'category': 'Beverages',
        'description': 'Freshly squeezed orange juice',
        'unit': '1L',
        'inStock': True
    },
    {
        'name': 'Mixed Nuts',
        'originalPrice': 10.99,
        'discountedPrice': 7.99,
        'price': 7.99,
        'image': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
        'category': 'Snacks',
        'description': 'Premium roasted mixed nuts',
        'unit': '250g',
        'inStock': True
    },
    {
        'name': 'Broccoli',
        'originalPrice': 2.79,
        'discountedPrice': 1.99,
        'price': 1.99,
        'image': 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=400',
        'category': 'Vegetables',
        'description': 'Crisp and fresh green broccoli',
        'unit': '400g',
        'inStock': True
    },
    {
        'name': 'Greek Yogurt',
        'originalPrice': 4.49,
        'discountedPrice': 3.29,
        'price': 3.29,
        'image': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
        'category': 'Dairy',
        'description': 'Thick and creamy Greek yogurt',
        'unit': '400g',
        'inStock': True
    },
    {
        'name': 'Strawberries',
        'originalPrice': 4.99,
        'discountedPrice': 3.49,
        'price': 3.49,
        'image': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
        'category': 'Fruits',
        'description': 'Sweet, ripe fresh strawberries',
        'unit': '250g punnet',
        'inStock': True
    },
]

col = db.collection('products')
for product in products:
    _, ref = col.add(product)
    print(f"Added product: '{product['name']}' (${product['price']}) -> ID: {ref.id}")

print(f"\n✅ Products collection created with {len(products)} documents.")
