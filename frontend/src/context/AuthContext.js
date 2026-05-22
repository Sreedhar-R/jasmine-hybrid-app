/**
 * AuthContext.js
 *
 * Persists the logged-in user to localStorage (web) so that a page refresh
 * or a redirect back from PhonePe does NOT log the user out.
 *
 * Storage key: 'jasmine_user'
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

const AUTH_KEY = 'jasmine_user';

// ── tiny cross-platform storage helpers ──────────────────────────────────────
const storage = {
    get: (key) => {
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                const raw = window.localStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            }
        } catch (_) {}
        return null;
    },
    set: (key, value) => {
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (_) {}
    },
    remove: (key) => {
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
        } catch (_) {}
    },
};

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Rehydrate from storage immediately (synchronous on web)
    const [user, setUser] = useState(() => storage.get(AUTH_KEY));
    const [hydrated, setHydrated] = useState(false);

    // Mark hydration complete after first render so children can distinguish
    // "loading" from "logged out"
    useEffect(() => {
        setHydrated(true);
    }, []);

    const login = (userData) => {
        storage.set(AUTH_KEY, userData);
        setUser(userData);
    };

    const logout = () => {
        storage.remove(AUTH_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hydrated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
