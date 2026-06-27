// import { Injectable } from '@angular/core';
// import { initializeApp } from 'firebase/app';
// import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
// import { environment } from '../../environments/environment';
// import { HttpClient } from '@angular/common/http';

// @Injectable({ providedIn: 'root' })
// export class PushService {
//   // private app = initializeApp(environment.firebaseConfig);
//   // private messaging = getMessaging(this.app);

//   constructor(private http: HttpClient) {}

//   // ✅ Request permission and get FCM token safely
//   async requestPermissionAndGetToken(userId: string): Promise<string | null> {
//     if (typeof window === 'undefined' &&  (window as Window).location.protocol === 'https:') {
//       console.warn('Push notifications not supported (non-browser environment).');
//       return null;
//     }

//     try {
//       console.log('Requesting notification permission...');
//       const permission = await Notification.requestPermission();

//       if (permission !== 'granted') {
//         console.error('Notification permission not granted');
//         return null;
//       }

//       // ✅ Register the service worker before calling getToken
//       const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
//       console.log('Service Worker registered:', registration);

//       // ✅ Now get the FCM token
//       const token = await getToken(this.messaging, {
//         vapidKey: environment.fcmVapidKey,
//         serviceWorkerRegistration: registration,
//       });

//       if (!token) throw new Error('No FCM registration token available');
//       console.log('FCM token:', token);
//       return token;
//     } catch (err) {
//       console.error('FCM token error:', err);
//       return null;
//     }
//   }

//   // ✅ Foreground notification listener
//   onMessageListener(cb: (payload: MessagePayload) => void) {
//     if (typeof window === 'undefined') return; // only in browser

//     console.log('Listening for foreground messages...');
//     onMessage(this.messaging, (payload) => {
//       console.log('Foreground message received:', payload);
//       cb(payload);
//     });
//   }

//   // ✅ Optional: Ask for permission on load (if needed)
//   async askNotificationPermission() {
//     if (typeof window === 'undefined') return;
//     const status = await Notification.requestPermission();
//     console.log(status === 'granted' ? 'Notifications allowed' : 'Notifications denied');
//   }
// }
