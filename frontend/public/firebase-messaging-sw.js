importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBNXzm_REKtMBnApgHu71S7E2rI1e3lj50",
    authDomain: "jasmine-1410.firebaseapp.com",
    projectId: "jasmine-1410",
    storageBucket: "jasmine-1410.firebasestorage.app",
    messagingSenderId: "331312100274",
    appId: "1:331312100274:web:4d24ae5a12b481e38faaab",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
