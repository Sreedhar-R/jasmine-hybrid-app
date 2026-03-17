import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// In a real app, these should come from environment variables (.env)

const firebaseConfig = {
    apiKey: "AIzaSyBNXzm_REKtMBnApgHu71S7E2rI1e3lj50",
    authDomain: "jasmine-1410.firebaseapp.com",
    projectId: "jasmine-1410",
    storageBucket: "jasmine-1410.firebasestorage.app",
    messagingSenderId: "331312100274",
    appId: "1:331312100274:web:4d24ae5a12b481e38faaab",
    //   measurementId: "G-LHQDYG94D0"
};

// Initialize Firebase only once
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Export the storage instance
export const storage = getStorage(app);
export default app;
