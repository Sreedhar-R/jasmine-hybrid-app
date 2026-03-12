"""
Idempotent seed script for categories and products.
Clears existing docs in each collection then writes fresh data.
"""
from database import get_db

db = get_db()

# ──────────────────────────────────────────────────────────────────────────────
# Helper: clear a collection before re-seeding
# ──────────────────────────────────────────────────────────────────────────────
def clear_collection(name):
    docs = db.collection(name).stream()
    for doc in docs:
        doc.reference.delete()
    print(f"  Cleared '{name}' collection.")

# ──────────────────────────────────────────────────────────────────────────────
# Categories  (9 items — fills 3×3 mobile grid / single row on desktop)
# ──────────────────────────────────────────────────────────────────────────────
CATEGORIES = [
    {"name": "Vegetables", "image": "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400", "order": 1},
    {"name": "Fruits",     "image": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400", "order": 2},
    {"name": "Dairy",      "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400", "order": 3},
    {"name": "Bakery",     "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "order": 4},
    {"name": "Meat",       "image": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400", "order": 5},
    {"name": "Seafood",    "image": "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400", "order": 6},
    {"name": "Grains",     "image": "https://images.unsplash.com/photo-1568347877321-f8935c7dc5f5?w=400", "order": 7},
    {"name": "Beverages",  "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400", "order": 8},
    {"name": "Snacks",     "image": "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400", "order": 9},
]

# ──────────────────────────────────────────────────────────────────────────────
# Products  (12 items — horizontal featured scroll)
# ──────────────────────────────────────────────────────────────────────────────
PRODUCTS = [
    {"name": "Organic Tomatoes",  "price": 2.99, "originalPrice": 3.99,  "discountedPrice": 2.99, "category": "Vegetables", "unit": "500g",        "inStock": True,
     "image": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400",
     "images": [
         "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400",
         "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400",
         "https://images.unsplash.com/photo-1561136594-7f68413baa99?w=400",
         "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400",
     ],
     "description": "Fresh vine-ripened organic tomatoes"},
    {"name": "Alphonso Mangoes",  "price": 5.49, "originalPrice": 7.49,  "discountedPrice": 5.49, "category": "Fruits",     "unit": "1kg",         "inStock": True, "image": "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=400", "description": "Sweet and aromatic Alphonso mangoes"},
    {"name": "Whole Milk",        "price": 1.89, "originalPrice": 2.49,  "discountedPrice": 1.89, "category": "Dairy",      "unit": "1L",          "inStock": True, "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400", "description": "Farm-fresh whole milk"},
    {"name": "Sourdough Bread",   "price": 3.99, "originalPrice": 4.99,  "discountedPrice": 3.99, "category": "Bakery",     "unit": "400g loaf",   "inStock": True, "image": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400", "description": "Artisan sourdough baked fresh daily"},
    {"name": "Chicken Breast",    "price": 6.99, "originalPrice": 9.49,  "discountedPrice": 6.99, "category": "Meat",       "unit": "500g",        "inStock": True, "image": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400", "description": "Free-range boneless chicken breast"},
    {"name": "Atlantic Salmon",   "price": 9.99, "originalPrice": 13.99, "discountedPrice": 9.99, "category": "Seafood",    "unit": "300g",        "inStock": True, "image": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400", "description": "Fresh Atlantic salmon fillet"},
    {"name": "Basmati Rice",      "price": 4.49, "originalPrice": 5.99,  "discountedPrice": 4.49, "category": "Grains",     "unit": "1kg",         "inStock": True, "image": "https://images.unsplash.com/photo-1536304993881-ff86e6920f6c?w=400", "description": "Premium long-grain Basmati rice"},
    {"name": "Orange Juice",      "price": 2.49, "originalPrice": 3.29,  "discountedPrice": 2.49, "category": "Beverages",  "unit": "1L",          "inStock": True, "image": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400", "description": "Freshly squeezed orange juice"},
    {"name": "Mixed Nuts",        "price": 7.99, "originalPrice": 10.99, "discountedPrice": 7.99, "category": "Snacks",     "unit": "250g",        "inStock": True, "image": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400", "description": "Premium roasted mixed nuts"},
    {"name": "Broccoli",          "price": 1.99, "originalPrice": 2.79,  "discountedPrice": 1.99, "category": "Vegetables", "unit": "400g",        "inStock": True, "image": "https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=400", "description": "Crisp and fresh green broccoli"},
    {"name": "Greek Yogurt",      "price": 3.29, "originalPrice": 4.49,  "discountedPrice": 3.29, "category": "Dairy",      "unit": "400g",        "inStock": True, "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400", "description": "Thick and creamy Greek yogurt"},
    {"name": "Strawberries",      "price": 3.49, "originalPrice": 4.99,  "discountedPrice": 3.49, "category": "Fruits",     "unit": "250g punnet", "inStock": True, "image": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400", "description": "Sweet, ripe fresh strawberries"},
]

# ──────────────────────────────────────────────────────────────────────────────
# Seed categories
# ──────────────────────────────────────────────────────────────────────────────
print("\n--- Seeding Categories ---")
clear_collection("categories")
col = db.collection("categories")
for item in CATEGORIES:
    _, ref = col.add(item)
    print(f"  + {item['name']} -> {ref.id}")
print(f"Seeded {len(CATEGORIES)} categories.\n")

# ──────────────────────────────────────────────────────────────────────────────
# Seed products
# ──────────────────────────────────────────────────────────────────────────────
print("--- Seeding Products ---")
clear_collection("products")
col = db.collection("products")
for item in PRODUCTS:
    _, ref = col.add(item)
    print(f"  + {item['name']} (${item['price']}) -> {ref.id}")
print(f"Seeded {len(PRODUCTS)} products.\n")

print("All done!")
