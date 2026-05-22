import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, DeviceEventEmitter } from 'react-native';
import { savePushToken } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

Notifications.addNotificationReceivedListener(notification => {
  try { DeviceEventEmitter.emit('onNotificationReceived', notification); } catch (e) {}
});

export async function registerForPushNotificationsAsync(userId) {
  if (!userId) return null;
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice || Platform.OS === 'web') {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Get device push token for direct FCM / APNs integration
      if (Platform.OS === 'web') {
        try {
          const { getMessaging, getToken, onMessage } = require('firebase/messaging');
          const app = require('./firebaseSetup').default;
          const messaging = getMessaging(app);
          const vapidKey = process.env.EXPO_PUBLIC_VAPID_KEY;
          if (vapidKey) {
            token = await getToken(messaging, { vapidKey });
            
            // Listen for foreground messages for Campaigns!
            onMessage(messaging, (payload) => {
              console.log('Foreground message received:', payload);
              const title = payload.notification?.title || payload.data?.title || 'New message';
              const body = payload.notification?.body || payload.data?.body || '';
              // For web, if Permissions are granted, show browser notification
              if (Notification.permission === 'granted' && typeof navigator !== 'undefined' && navigator.serviceWorker) {
                 navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, { body, icon: '/favicon.ico' });
                 });
              } else if (Notification.permission === 'granted') {
                 new Notification(title, { body, icon: '/favicon.ico' });
              }
              try { DeviceEventEmitter.emit('onNotificationReceived', payload); } catch (e) {}
            });
          } else {
            console.warn('VAPID key is missing! Please add EXPO_PUBLIC_VAPID_KEY to your .env file to enable Web Push.');
          }
        } catch (webErr) {
          console.warn('Web push token retrieval failed:', webErr);
        }
      } else {
        token = (await Notifications.getDevicePushTokenAsync()).data;
      }
    } catch (e) {
      console.log('Push token error (expected in some dev environments):', e);
    }
  }

  if (token) {
    try {
      await savePushToken(userId, { token: String(token), deviceType: Platform.OS });
    } catch (e) {
      // ignore
    }
  }
  return token;
}
