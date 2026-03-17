import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);

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

    const clearCart = () => setItems([]);

    const subtotal = items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0);
    const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, subtotal, itemCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
