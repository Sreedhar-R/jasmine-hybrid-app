"""
Pydantic models for request validation and response shaping.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal, List
from datetime import datetime, timezone
from passlib.context import CryptContext


# ── Password hashing ──────────────────────────────────────────────────────────

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return _pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ── Addresses ─────────────────────────────────────────────────────────────────

class AddressCreate(BaseModel):
    label: str = Field(default="Home", description="e.g. Home, Work, Other")
    street: str
    city: str
    state: str
    zipCode: str
    country: str = "India"
    isPrimary: bool = False
    lat: Optional[float] = None
    lng: Optional[float] = None


class AddressUpdate(BaseModel):
    label: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None
    country: Optional[str] = None


# ── Users ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: str
    password: str = Field(min_length=8, description="Plain-text password; stored as bcrypt hash")
    role: Literal["user", "admin"] = "user"


class UserUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[Literal["user", "admin"]] = None


class LoginRequest(BaseModel):
    identifier: str = Field(description="Email address or phone number")
    password: str


# ── Orders ────────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    productId: str
    name: str
    image: Optional[str] = None
    unit: Optional[str] = None
    price: float
    qty: int

class AddressSnap(BaseModel):
    """Snapshot of the delivery address at order time."""
    firstName: str
    lastName: str
    street: str
    apartment: Optional[str] = None
    city: str
    state: str
    zipCode: str
    country: str = "India"
    phone: str

class OrderCreate(BaseModel):
    userId: Optional[str] = None
    email: str
    items: List[OrderItemCreate]
    address: AddressSnap
    paymentMethod: str = "razorpay"    # razorpay | cod
    razorpayOrderId: Optional[str] = None
    razorpayPaymentId: Optional[str] = None
    discountCode: Optional[str] = None
    discountAmount: float = 0.0
    subtotal: float
    shippingAmount: float = 0.0
    total: float
    status: str = "pending"            # pending | confirmed | processing | delivered | cancelled
