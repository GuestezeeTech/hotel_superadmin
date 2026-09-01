importScripts('https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging-compat.js');

/* firebase.initializeApp({
  apiKey: "AIzaSyCMX3gUG0fIUFlNRCXpKXM_hyK9eC72jlI",
  authDomain: "labes-common-app-a2fa5.firebaseapp.com",
  projectId: "labes-common-app-a2fa5",
  messagingSenderId: "563382026704",
  appId: "1:563382026704:web:3224e1b6f267456f14b9d5",
});
 */

firebase.initializeApp({
  apiKey: "AIzaSyC7Kc8dcd-Q9hrS18bViBreDGzbtlRCTQ0",
  authDomain: "hospitalitynewsapp-f7968.firebaseapp.com",
  projectId: "hospitalitynewsapp-f7968",
  storageBucket: "hospitalitynewsapp-f7968.firebasestorage.app",
  messagingSenderId: "945771911357",
  appId: "1:945771911357:web:ce9a1527c47aed31773fd4",
  measurementId: "G-CP4QFZ4903"
});

// = {
//   apiKey: "AIzaSyCMX3gUG0fIUFlNRCXpKXM_hyK9eC72jlI",
//   authDomain: "labes-common-app-a2fa5.firebaseapp.com",
//   projectId: "labes-common-app-a2fa5",
//   storageBucket: "labes-common-app-a2fa5.appspot.com",
//   messagingSenderId: "563382026704",
//   appId: "1:563382026704:web:3224e1b6f267456f14b9d5",
//   measurementId: "G-0W36HEHXC7"
// };

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  // console.log('[firebase-messaging-sw.js] Background message received:', payload);
  const notificationTitle = payload.notification?.title || 'Background Message';
  const notificationOptions = {
    body: payload.notification?.body,
    data: payload.data
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  // Determine environment (local vs production)
  // console.log('Hostname:', self.location.hostname);
  const baseUrl = (self.location.hostname === 'localhost')
    ? 'http://localhost:4200'      // Local testing
    : 'http://superadmin.guestezee.com'; // Production URL
  // console.log('Base URL:', baseUrl);
  const path = '/dashboard';
  const url = baseUrl + path;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing tab if it exists
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
