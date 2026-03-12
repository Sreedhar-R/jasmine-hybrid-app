import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);

    // Add item or increment qty if already present
    const addItem = (product) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === product.id);
            if (existing) {
                return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const removeItem = (productId) =>
        setItems((prev) => prev.filter((i) => i.id !== productId));

    const updateQty = (productId, delta) => {
        setItems((prev) =>
            prev
                .map((i) => i.id === productId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
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
