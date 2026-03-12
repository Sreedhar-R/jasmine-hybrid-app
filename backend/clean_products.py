from database import get_db

db = get_db()
docs = db.collection('products').get()
for d in docs:
    d.reference.delete()
print(f"Deleted {len(docs)} products.")
