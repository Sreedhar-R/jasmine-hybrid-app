from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from database import get_db
from crud import (
    create_document, get_document, get_all_documents,
    update_document, delete_document, query_documents
)
from models import UserCreate, UserUpdate, AddressCreate, AddressUpdate, get_password_hash, verify_password, LoginRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_db()
    yield

app = FastAPI(title="Hybrid Cloud App API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Backend is running", "database": "Firestore"}

@app.get("/health")
def health_check():
    return {"status": "ok"}


# ── Auth ───────────────────────────────────────────────────────────────────────

@app.post("/auth/login")
def login(data: LoginRequest):
    """
    Login with email or phone number + password.
    Tries email match first, falls back to phone match.
    """
    identifier = data.identifier.strip()

    # Try email match
    users = query_documents("users", "email", "==", identifier)

    # Fallback: try phone
    if not users:
        users = query_documents("users", "phone", "==", identifier)

    if not users:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = users[0]
    hashed = user.get("hashedPassword", "")

    if not hashed or not verify_password(data.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Return user without the hashed password
    safe_user = {k: v for k, v in user.items() if k != "hashedPassword"}
    return {"message": "Login successful", "user": safe_user}



# ── Banners ───────────────────────────────────────────────────────────────────

@app.get("/banners")
def list_banners():
    banners = get_all_documents("banners")
    return sorted(banners, key=lambda x: x.get("order", 0))

@app.post("/banners", status_code=201)
def create_banner(data: dict):
    doc_id = create_document("banners", data)
    return {"id": doc_id, **data}

@app.put("/banners/{banner_id}")
def update_banner(banner_id: str, data: dict):
    if not get_document("banners", banner_id):
        raise HTTPException(status_code=404, detail="Banner not found")
    update_document("banners", banner_id, data)
    return {"id": banner_id, **data}

@app.delete("/banners/{banner_id}")
def delete_banner(banner_id: str):
    if not get_document("banners", banner_id):
        raise HTTPException(status_code=404, detail="Banner not found")
    delete_document("banners", banner_id)
    return {"message": "Banner deleted"}

# ── Categories ────────────────────────────────────────────────────────────────

@app.get("/categories")
def list_categories():
    cats = get_all_documents("categories")
    return sorted(cats, key=lambda x: x.get("order", 0))

@app.get("/categories/{category_id}")
def get_category(category_id: str):
    cat = get_document("categories", category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@app.post("/categories")
def create_category(data: dict):
    doc_id = create_document("categories", data)
    return {"id": doc_id, **data}

@app.put("/categories/{category_id}")
def update_category(category_id: str, data: dict):
    if not get_document("categories", category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    update_document("categories", category_id, data)
    return {"id": category_id, **data}

@app.delete("/categories/{category_id}")
def delete_category(category_id: str):
    if not get_document("categories", category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    delete_document("categories", category_id)
    return {"message": "Category deleted"}


# ── Products ──────────────────────────────────────────────────────────────────

@app.get("/products")
def list_products(category: str = None):
    products = get_all_documents("products")
    if category:
        products = [p for p in products if p.get("category", "").lower() == category.lower()]
    return products

@app.get("/products/search")
def search_products(q: str = ""):
    """Search products by name or description (case-insensitive)."""
    all_products = get_all_documents("products")
    if not q.strip():
        return all_products
    query = q.strip().lower()
    return [
        p for p in all_products
        if query in p.get("name", "").lower()
        or query in p.get("description", "").lower()
    ]

@app.get("/products/{product_id}")
def get_product(product_id: str):
    product = get_document("products", product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/products")
def create_product(data: dict):
    doc_id = create_document("products", data)
    return {"id": doc_id, **data}

@app.put("/products/{product_id}")
def update_product(product_id: str, data: dict):
    success = update_document("products", product_id, data)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"id": product_id, **data}

@app.delete("/products/{product_id}")
def delete_product(product_id: str):
    success = delete_document("products", product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


# ── Users ─────────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/users")
def list_users():
    return get_all_documents("users")


@app.get("/users/{user_id}")
def get_user(user_id: str):
    user = get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/users", status_code=201)
def create_user(data: UserCreate):
    # Duplicate email check
    if query_documents("users", "email", "==", data.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    # Duplicate phone check
    phone_full = data.phone if data.phone.startswith("+") else f"+91-{data.phone}"
    if query_documents("users", "phone", "==", phone_full):
        raise HTTPException(status_code=409, detail="An account with this phone number already exists.")

    payload = data.model_dump()
    # Hash password; never store plaintext
    raw_password = payload.pop("password")
    payload["hashedPassword"] = get_password_hash(raw_password)
    payload["primaryAddressId"] = None
    payload["createdAt"] = _now()
    payload["updatedAt"] = _now()
    doc_id = create_document("users", payload)
    # Return without the hashed password
    payload.pop("hashedPassword")
    return {"id": doc_id, **payload}


@app.put("/users/{user_id}")
def update_user(user_id: str, data: UserUpdate):
    user = get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    patch = {k: v for k, v in data.model_dump().items() if v is not None}
    patch["updatedAt"] = _now()
    update_document("users", user_id, patch)
    return {**user, **patch}


@app.delete("/users/{user_id}")
def delete_user(user_id: str):
    if not get_document("users", user_id):
        raise HTTPException(status_code=404, detail="User not found")
    # Remove all addresses belonging to this user
    for addr in query_documents("addresses", "userId", "==", user_id):
        delete_document("addresses", addr["id"])
    delete_document("users", user_id)
    return {"message": "User deleted"}


# ── Addresses ─────────────────────────────────────────────────────────────────

@app.get("/users/{user_id}/addresses")
def list_user_addresses(user_id: str):
    if not get_document("users", user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return query_documents("addresses", "userId", "==", user_id)


@app.post("/users/{user_id}/addresses", status_code=201)
def create_address(user_id: str, data: AddressCreate):
    if not get_document("users", user_id):
        raise HTTPException(status_code=404, detail="User not found")

    existing = query_documents("addresses", "userId", "==", user_id)

    # First address automatically becomes primary
    is_primary = data.isPrimary or len(existing) == 0

    # If this should be primary, demote all existing ones first
    if is_primary:
        for addr in existing:
            update_document("addresses", addr["id"], {"isPrimary": False})

    payload = data.model_dump()
    payload["userId"] = user_id
    payload["isPrimary"] = is_primary
    payload["createdAt"] = _now()

    addr_id = create_document("addresses", payload)

    if is_primary:
        update_document("users", user_id, {"primaryAddressId": addr_id, "updatedAt": _now()})

    return {"id": addr_id, **payload}


@app.get("/addresses/{address_id}")
def get_address(address_id: str):
    addr = get_document("addresses", address_id)
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    return addr


@app.put("/addresses/{address_id}")
def update_address(address_id: str, data: AddressUpdate):
    addr = get_document("addresses", address_id)
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    patch = {k: v for k, v in data.model_dump().items() if v is not None}
    update_document("addresses", address_id, patch)
    return {**addr, **patch}


@app.delete("/addresses/{address_id}")
def delete_address(address_id: str):
    addr = get_document("addresses", address_id)
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    delete_document("addresses", address_id)
    # If deleted was primary, clear user's primaryAddressId
    if addr.get("isPrimary"):
        update_document("users", addr["userId"], {"primaryAddressId": None, "updatedAt": _now()})
    return {"message": "Address deleted"}


@app.put("/users/{user_id}/addresses/{address_id}/set-primary")
def set_primary_address(user_id: str, address_id: str):
    if not get_document("users", user_id):
        raise HTTPException(status_code=404, detail="User not found")
    addr = get_document("addresses", address_id)
    if not addr or addr.get("userId") != user_id:
        raise HTTPException(status_code=404, detail="Address not found for this user")

    # Demote all other addresses
    for a in query_documents("addresses", "userId", "==", user_id):
        if a["id"] != address_id:
            update_document("addresses", a["id"], {"isPrimary": False})

    # Promote this one
    update_document("addresses", address_id, {"isPrimary": True})
    update_document("users", user_id, {"primaryAddressId": address_id, "updatedAt": _now()})
    return {"message": "Primary address updated", "primaryAddressId": address_id}


# ── Orders ─────────────────────────────────────────────────────────────────────

@app.get("/orders/user/{user_id}")
def get_orders_for_user(user_id: str):
    """Return all orders for a given user, newest first."""
    orders = query_documents("orders", "userId", "==", user_id)
    orders.sort(key=lambda o: o.get("createdAt", ""), reverse=True)
    return orders


@app.get("/orders/{order_id}")
def get_order(order_id: str):
    order = get_document("orders", order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ── Admin endpoints ────────────────────────────────────────────────────────────

@app.get("/admin/orders")
def admin_list_orders(date: str = None):
    """
    Return all orders (all users).  Optionally filter by date (YYYY-MM-DD).
    Orders are returned newest-first.
    """
    orders = get_all_documents("orders")
    if date:
        orders = [
            o for o in orders
            if isinstance(o.get("createdAt"), str) and o["createdAt"].startswith(date)
        ]
    orders.sort(key=lambda o: o.get("createdAt", ""), reverse=True)
    return orders


# ── Razorpay ─────────────────────────────────────────────────────────────────
import os, json

@app.post("/razorpay/create-order")
def razorpay_create_order(body: dict):
    """
    Creates a Razorpay order.  Falls back to a mock order when
    RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured.
    """
    amount_paise = int(body.get("amount", 0) * 100)   # amount in ₹, convert to paise
    currency     = body.get("currency", "INR")

    key_id     = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")

    if key_id and key_secret:
        try:
            import razorpay
            client = razorpay.Client(auth=(key_id, key_secret))
            rz_order = client.order.create({"amount": amount_paise, "currency": currency, "payment_capture": 1})
            return rz_order
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Razorpay error: {e}")

    # ── Mock order (dev / no keys) ──────────────────────────────────────────
    import uuid, time
    return {
        "id":       f"order_mock_{uuid.uuid4().hex[:12]}",
        "amount":   amount_paise,
        "currency": currency,
        "status":   "created",
        "_mock":    True,
    }


# ── Order creation ────────────────────────────────────────────────────────────
from models import OrderCreate

@app.post("/orders", status_code=201)
def create_order(data: OrderCreate):
    payload = data.model_dump()
    payload["createdAt"] = _now()
    payload["updatedAt"] = _now()

    # Serialise address snapshot (it's a Pydantic sub-model, now a dict)
    order_id = create_document("orders", payload)

    # Optionally save address for the user if they're logged in
    if data.userId and data.address:
        addr = data.address.model_dump()
        street = f"{addr['street']}" + (f", {addr['apartment']}" if addr.get("apartment") else "")
        existing = query_documents("addresses", "userId", "==", data.userId)
        is_primary = len(existing) == 0
        create_document("addresses", {
            "userId":    data.userId,
            "label":     "Home",
            "street":    street,
            "city":      addr["city"],
            "state":     addr["state"],
            "zipCode":   addr["zipCode"],
            "country":   addr.get("country", "India"),
            "isPrimary": is_primary,
            "createdAt": _now(),
        })

    # ── Deduct stock for each item ─────────────────────────────────────────
    for item in data.items:
        product = get_document("products", item.productId)
        if product is not None:
            current_stock = product.get("stock")
            if current_stock is not None:
                new_stock = max(0, int(current_stock) - item.qty)
                update_document("products", item.productId, {"stock": new_stock, "updatedAt": _now()})

    return {"id": order_id, **payload}


# ── Subscriptions ─────────────────────────────────────────────────────────────

@app.get("/subscriptions/products")
def list_subscribable_products():
    """All products that have subscriptionAvailable == True."""
    products = get_all_documents("products")
    return [p for p in products if p.get("subscriptionAvailable", False)]


@app.get("/users/{user_id}/subscriptions")
def get_user_subscriptions(user_id: str):
    """Return all subscriptions for a user, newest first."""
    subs = query_documents("subscriptions", "userId", "==", user_id)
    subs.sort(key=lambda s: s.get("createdAt", ""), reverse=True)
    return subs


@app.post("/subscriptions", status_code=201)
def create_subscription(data: dict):
    """
    Create a new subscription.
    Expected fields: userId, productId, productName, productImage,
      productPrice, productUnit, frequency (daily|weekly|biweekly|monthly),
      quantity, deliveryAddress (dict).
    """
    required = ["userId", "productId", "frequency", "quantity"]
    for field in required:
        if field not in data:
            raise HTTPException(status_code=422, detail=f"Missing required field: {field}")

    payload = {
        **data,
        "status": "active",       # active | paused | cancelled
        "createdAt": _now(),
        "updatedAt": _now(),
        "nextDelivery": None,
    }
    sub_id = create_document("subscriptions", payload)
    return {"id": sub_id, **payload}


@app.put("/subscriptions/{sub_id}/pause")
def pause_subscription(sub_id: str):
    sub = get_document("subscriptions", sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    update_document("subscriptions", sub_id, {"status": "paused", "updatedAt": _now()})
    return {"id": sub_id, "status": "paused"}


@app.put("/subscriptions/{sub_id}/resume")
def resume_subscription(sub_id: str):
    sub = get_document("subscriptions", sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    update_document("subscriptions", sub_id, {"status": "active", "updatedAt": _now()})
    return {"id": sub_id, "status": "active"}


@app.delete("/subscriptions/{sub_id}")
def cancel_subscription(sub_id: str):
    sub = get_document("subscriptions", sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    update_document("subscriptions", sub_id, {"status": "cancelled", "updatedAt": _now()})
    return {"message": "Subscription cancelled", "id": sub_id}


# ── Wallet ─────────────────────────────────────────────────────────────────────

@app.get("/users/{user_id}/wallet")
def get_wallet(user_id: str):
    """Return the current wallet balance for a user."""
    user = get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"userId": user_id, "balance": user.get("walletBalance", 0.0)}


@app.post("/users/{user_id}/wallet/topup")
def topup_wallet(user_id: str, body: dict):
    """
    Add funds to the user's wallet.
    Minimum top-up is ₹100.
    body: { amount: float }
    """
    user = get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    amount = float(body.get("amount", 0))
    if amount < 100:
        raise HTTPException(status_code=422, detail="Minimum top-up amount is ₹100")

    current = float(user.get("walletBalance", 0.0))
    new_balance = round(current + amount, 2)

    update_document("users", user_id, {"walletBalance": new_balance, "updatedAt": _now()})

    # Log the transaction
    create_document("walletTransactions", {
        "userId": user_id,
        "type": "credit",
        "amount": amount,
        "balance": new_balance,
        "note": "Top-up",
        "createdAt": _now(),
    })

    return {"userId": user_id, "balance": new_balance, "credited": amount}


@app.post("/users/{user_id}/wallet/deduct")
def deduct_wallet(user_id: str, body: dict):
    """
    Deduct funds from the user's wallet.
    body: { amount: float, note: str }
    """
    user = get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    amount = float(body.get("amount", 0))
    current = float(user.get("walletBalance", 0.0))

    if current < amount:
        raise HTTPException(status_code=422, detail="Insufficient wallet balance")

    new_balance = round(current - amount, 2)
    update_document("users", user_id, {"walletBalance": new_balance, "updatedAt": _now()})

    create_document("walletTransactions", {
        "userId": user_id,
        "type": "debit",
        "amount": amount,
        "balance": new_balance,
        "note": body.get("note", "Deduction"),
        "createdAt": _now(),
    })

    return {"userId": user_id, "balance": new_balance, "debited": amount}


@app.get("/users/{user_id}/wallet/transactions")
def get_wallet_transactions(user_id: str):
    """Return all wallet transactions for a user, newest first."""
    txns = query_documents("walletTransactions", "userId", "==", user_id)
    txns.sort(key=lambda t: t.get("createdAt", ""), reverse=True)
    return txns


# ── Subscription delivery processor ────────────────────────────────────────────

from datetime import date, timedelta

DAY_MAP = {"sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6}


def _compute_next_delivery(sub: dict, after_date: date) -> date:
    """Return the next delivery date on or after `after_date` for a subscription."""
    freq = sub.get("frequency", "weekly")
    start = date.fromisoformat(sub["startDate"]) if sub.get("startDate") else after_date

    if freq == "daily":
        return after_date

    if freq == "weekly":
        # Next weekly slot from start date
        delta = (after_date - start).days
        weeks = max(0, -(-delta // 7))   # ceil div
        return start + timedelta(weeks=weeks)

    if freq == "every_n_days":
        n = int(sub.get("nDays") or 2)
        delta = (after_date - start).days
        cycles = max(0, -(-delta // n))
        return start + timedelta(days=cycles * n)

    if freq == "custom":
        custom_days = sub.get("customDays") or []
        day_nums = sorted(set(DAY_MAP[d] for d in custom_days if d in DAY_MAP))
        if not day_nums:
            return after_date
        dow = after_date.weekday()  # Mon=0 … Sun=6
        # find next matching day of week on or after after_date
        for d in day_nums:
            # Python weekday: Mon=0, but DAY_MAP: sun=0, mon=1 …
            # Convert DAY_MAP to Python weekday: (d - 1) % 7
            py_dow = (d - 1) % 7
            diff = (py_dow - dow) % 7
            return after_date + timedelta(days=diff)
        return after_date

    return after_date


def _is_due_today(sub: dict, today: date) -> bool:
    """Return True if a subscription has a delivery due today."""
    start_str = sub.get("startDate")
    if not start_str:
        return False
    start = date.fromisoformat(start_str)
    if start > today:
        return False  # hasn't started yet

    # Use stored nextDelivery if available; otherwise compute from start
    next_str = sub.get("nextDelivery")
    if next_str:
        try:
            return date.fromisoformat(next_str) <= today
        except ValueError:
            pass
    return _compute_next_delivery(sub, today) == today


@app.post("/subscriptions/process-due")
def process_due_subscriptions():
    """
    Process all active subscriptions whose delivery is due today.
    For each:
      - Check wallet balance >= order amount
      - Check product stock > 0 (if stock field exists)
      - If OK: create order, deduct wallet, update nextDelivery
      - If not: create a failed order with failureReason, update nextDelivery anyway
    Returns a summary dict.
    """
    today = date.today()
    today_str = today.isoformat()

    all_subs = get_all_documents("subscriptions")
    active = [s for s in all_subs if s.get("status") == "active"]

    placed = []
    failed = []
    skipped = 0

    for sub in active:
        if not _is_due_today(sub, today):
            skipped += 1
            continue

        sub_id    = sub["id"]
        user_id   = sub.get("userId")
        qty       = int(sub.get("quantity", 1))
        price     = float(sub.get("productPrice") or 0)
        order_amt = round(price * qty, 2)

        # ── Compute next delivery AFTER today ──────────────────────────────
        next_d = _compute_next_delivery(sub, today + timedelta(days=1))
        next_str = next_d.isoformat()

        failure_reason = None

        # ── Wallet check ──────────────────────────────────────────────────
        user = get_document("users", user_id) if user_id else None
        wallet = float(user.get("walletBalance", 0)) if user else 0
        if wallet < order_amt:
            failure_reason = f"Insufficient wallet balance (₹{wallet:.2f} < ₹{order_amt:.2f})"

        # ── Stock check ───────────────────────────────────────────────────
        if not failure_reason:
            product = get_document("products", sub.get("productId", ""))
            if product:
                stock = product.get("stock")
                if stock is not None and int(stock) < qty:
                    failure_reason = f"Insufficient stock ({stock} available, {qty} requested)"

        # ── Build base order payload ───────────────────────────────────────
        order_payload = {
            "userId":          user_id,
            "subscriptionId":  sub_id,
            "source":          "subscription",
            "items": [{
                "productId":   sub.get("productId"),
                "productName": sub.get("productName"),
                "productImage":sub.get("productImage"),
                "price":       price,
                "quantity":    qty,
            }],
            "totalAmount":     order_amt,
            "deliveryAddress": sub.get("deliveryAddress"),
            "frequency":       sub.get("frequency"),
            "status":          "placed" if not failure_reason else "failed",
            "failureReason":   failure_reason,
            "deliveryDate":    today_str,
            "createdAt":       _now(),
            "updatedAt":       _now(),
        }

        if failure_reason:
            order_id = create_document("orders", order_payload)
            failed.append({"subscriptionId": sub_id, "orderId": order_id, "reason": failure_reason})
        else:
            # Create successful order
            order_id = create_document("orders", order_payload)

            # Deduct wallet
            new_balance = round(wallet - order_amt, 2)
            update_document("users", user_id, {"walletBalance": new_balance, "updatedAt": _now()})
            create_document("walletTransactions", {
                "userId":    user_id,
                "type":      "debit",
                "amount":    order_amt,
                "balance":   new_balance,
                "note":      f"Subscription order – {sub.get('productName', '')}",
                "orderId":   order_id,
                "createdAt": _now(),
            })

            placed.append({"subscriptionId": sub_id, "orderId": order_id, "amount": order_amt})

            # ── Deduct stock ────────────────────────────────────────────
            if product:
                current_stock = product.get("stock")
                if current_stock is not None:
                    new_stock = max(0, int(current_stock) - qty)
                    update_document("products", sub.get("productId", ""), {"stock": new_stock, "updatedAt": _now()})

        # ── Always advance the next delivery date ──────────────────────────
        update_document("subscriptions", sub_id, {
            "nextDelivery": next_str,
            "updatedAt":    _now(),
        })

    return {
        "processedDate": today_str,
        "totalActive":   len(active),
        "skipped":       skipped,
        "placed":        len(placed),
        "failed":        len(failed),
        "placedOrders":  placed,
        "failedOrders":  failed,
    }


