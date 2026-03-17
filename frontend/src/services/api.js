/**
 * API service — all fetch calls to the Python FastAPI backend.
 * Base URL points to the local dev server by default.
 */

// Determine if we are running locally or if this is the deployed production build
const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('172.'));

// Base URL points to local dev server or live Cloud Run backend
// If using Expo Go on a physical device, 'localhost' won't work to reach your computer.
// Change localhost here to your computer's actual local IP if testing on a real phone!
const BASE_URL = isLocal
    ? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080`
    : 'https://jasmine-backend-331312100274.us-central1.run.app';

// const BASE_URL = 'https://jasmine-backend-331312100274.us-central1.run.app';

async function apiFetch(path, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${path}`, options);
        if (!response.ok) {
            let detail = `API error ${response.status}`;
            try {
                const errBody = await response.json();
                detail = errBody?.detail || detail;
            } catch (_) { }
            throw new Error(detail);
        }
        return await response.json();
    } catch (error) {
        console.error('API fetch failed:', error);
        throw error;
    }
}

export const fetchBanners = () => apiFetch('/banners');
export const fetchCategories = () => apiFetch('/categories');
export const fetchProducts = () => apiFetch('/products');
export const fetchProductsByCategory = (category) => apiFetch(`/products?category=${encodeURIComponent(category)}`);
export const searchProducts = (q) => apiFetch(`/products/search?q=${encodeURIComponent(q)}`);
export const fetchProduct = (id) => apiFetch(`/products/${id}`);
export const fetchCategory = (id) => apiFetch(`/categories/${id}`);
export const loginUser = (identifier, password) =>
    apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
    });

export const registerUser = (userData) =>
    apiFetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });

export const fetchUserOrders = (userId) => apiFetch(`/orders/user/${userId}`);

export const fetchUserAddresses = (userId) => apiFetch(`/users/${userId}/addresses`);

export const createUserAddress = (userId, data) =>
    apiFetch(`/users/${userId}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

export const deleteAddress = (addressId) =>
    apiFetch(`/addresses/${addressId}`, { method: 'DELETE' });

export const setPrimaryAddress = (userId, addressId) =>
    apiFetch(`/users/${userId}/addresses/${addressId}/set-primary`, { method: 'PUT' });

export const createRazorpayOrder = (amount) =>
    apiFetch('/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR' }),
    });

export const placeOrder = (orderData) =>
    apiFetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
    });

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const fetchSubscribableProducts = () => apiFetch('/subscriptions/products');
export const fetchUserSubscriptions = (userId) => apiFetch(`/users/${userId}/subscriptions`);
export const createSubscription = (data) =>
    apiFetch('/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
export const pauseSubscription = (subId) => apiFetch(`/subscriptions/${subId}/pause`, { method: 'PUT' });
export const resumeSubscription = (subId) => apiFetch(`/subscriptions/${subId}/resume`, { method: 'PUT' });
export const cancelSubscription = (subId) => apiFetch(`/subscriptions/${subId}`, { method: 'DELETE' });
export const processSubscriptions = () => apiFetch('/subscriptions/process-due', { method: 'POST' });

// ── Wallet ─────────────────────────────────────────────────────────────────────
export const getWalletBalance = (userId) => apiFetch(`/users/${userId}/wallet`);
export const getWalletTransactions = (userId) => apiFetch(`/users/${userId}/wallet/transactions`);
export const topUpWallet = (userId, amount) =>
    apiFetch(`/users/${userId}/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
    });
export const deductWallet = (userId, amount, note) =>
    apiFetch(`/users/${userId}/wallet/deduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, note }),
    });

// ── Admin ──────────────────────────────────────────────────────────────────────
export const fetchAllOrders = (date) =>
    apiFetch(`/admin/orders${date ? `?date=${date}` : ''}`);
export const createBanner = (data) =>
    apiFetch('/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateBanner = (id, data) =>
    apiFetch(`/banners/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteBanner = (id) =>
    apiFetch(`/banners/${id}`, { method: 'DELETE' });
export const updateCategory = (id, data) =>
    apiFetch(`/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteCategory = (id) =>
    apiFetch(`/categories/${id}`, { method: 'DELETE' });
export const createCategory = (data) =>
    apiFetch('/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const createProduct = (data) =>
    apiFetch('/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateProduct = (id, data) =>
    apiFetch(`/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteProduct = (id) =>
    apiFetch(`/products/${id}`, { method: 'DELETE' });


