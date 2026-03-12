"""
Generic CRUD helpers for Firestore.
Each function takes a collection name and operates on documents in that collection.
"""
from typing import Any, Optional
from google.cloud.firestore_v1.base_query import FieldFilter
from database import get_db


# ── CREATE ──────────────────────────────────────────────────────────────────

def create_document(collection: str, data: dict, doc_id: Optional[str] = None) -> str:
    """
    Add a document to a collection.
    - If doc_id is given, use it as the document ID.
    - Otherwise Firestore auto-generates an ID.
    Returns the document ID.
    """
    db = get_db()
    col_ref = db.collection(collection)
    if doc_id:
        col_ref.document(doc_id).set(data)
        return doc_id
    else:
        _, doc_ref = col_ref.add(data)
        return doc_ref.id


# ── READ ─────────────────────────────────────────────────────────────────────

def get_document(collection: str, doc_id: str) -> Optional[dict]:
    """Fetch a single document by ID. Returns None if not found."""
    db = get_db()
    doc = db.collection(collection).document(doc_id).get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    return None


def get_all_documents(collection: str) -> list[dict]:
    """Fetch all documents in a collection."""
    db = get_db()
    docs = db.collection(collection).stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def query_documents(collection: str, field: str, operator: str, value: Any) -> list[dict]:
    """
    Query documents by a field condition.
    operator examples: '==', '!=', '<', '<=', '>', '>=', 'in', 'array_contains'
    """
    db = get_db()
    docs = db.collection(collection).where(filter=FieldFilter(field, operator, value)).stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


# ── UPDATE ───────────────────────────────────────────────────────────────────

def update_document(collection: str, doc_id: str, data: dict) -> bool:
    """Update specific fields of a document (merge). Returns True on success."""
    db = get_db()
    doc_ref = db.collection(collection).document(doc_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.update(data)
    return True


# ── DELETE ───────────────────────────────────────────────────────────────────

def delete_document(collection: str, doc_id: str) -> bool:
    """Delete a document. Returns True on success."""
    db = get_db()
    doc_ref = db.collection(collection).document(doc_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.delete()
    return True
