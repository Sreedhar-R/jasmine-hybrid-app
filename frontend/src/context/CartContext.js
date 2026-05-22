/**
 * CartContext.js
 *
 * Persists cart items to sessionStorage (web) so that a page redirect
 * (e.g. to PhonePe and back) does not wipe the cart mid-checkout.
 *
 * sessionStorage is intentionally used instead of localStorage so the
 * cart clears when the browser tab is closed.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

const CART_KEY = 'jasmine_cart';

// ── cross-platform sessionStorage helper ─────────────────────────────────────
const cartStorage = {
    get: (key) => {
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                const raw = window.sessionStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            }
        } catch (_) {}
        return null;
    },
    set: (key, value) => {
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.sessionStorage.setItem(key, JSON.stringify(value));
            }
        } catch (_) {}
    },
    remove: (key) => {
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.sessionStorage.removeItem(key);
            }
        } catch (_) {}
    },
};

// ── Context ───────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    // Rehydrate from sessionStorage immediately (synchronous on web)
    const [items, setItems] = useState(() => cartStorage.get(CART_KEY) ?? []);

    // Keep sessionStorage in sync whenever items change
    useEffect(() => {
        if (items.length > 0) {
            cartStorage.set(CART_KEY, items);
        } else {
            cartStorage.remove(CART_KEY);
        }
    }, [items]);

    // Add item or increment qty if already present, respecting stock
    const addItem = (product) => {
        setItems((prev) => {
            const qtyToAdd = product.qty || 1;
            const existing = prev.find((i) => i.id === product.id);
            const stock = (product.stock !== undefined && product.stock !== null) ? product.stock : 999;

            if (existing) {
                const newQty = Math.min(existing.qty + qtyToAdd, stock);
                return prev.map((i) => i.id === product.id ? { ...i, qty: newQty } : i);
            }
            return [...prev, { ...product, qty: Math.min(qtyToAdd, stock) }];
        });
    };

    const removeItem = (productId) =>
        setItems((prev) => prev.filter((i) => i.id !== productId));

    const updateQty = (productId, delta) => {
        setItems((prev) =>
            prev.map((i) => {
                if (i.id === productId) {
                    const stock = (i.stock !== undefined && i.stock !== null) ? i.stock : 999;
                    const newQty = Math.max(1, i.qty + delta);
                    return { ...i, qty: Math.min(newQty, stock) };
                }
                return i;
            })
        );
    };

    const clearCart = () => {
        cartStorage.remove(CART_KEY);
        setItems([]);
    };

    const subtotal = items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0);
    const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, subtotal, itemCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
