// import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app.component';
// import { appConfig } from './app/app.config';
// import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
// // import { provideFirestore, getFirestore } from '@angular/fire/firestore';
// import { importProvidersFrom } from '@angular/core';
// import { provideRouter } from '@angular/router';
// import { routes } from './app/app.routes';
// import { environment } from './environments/environment';
 
// bootstrapApplication(AppComponent, {
//   ...appConfig,
//   providers: [
//     ...(appConfig.providers || []),
//     provideRouter(routes),
//     importProvidersFrom(
//       provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // Firebase initialized
//       // provideFirestore(() => getFirestore()) // Firestore service registered
//     )
//   ]
// }).catch((err) => console.error(err));





import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

// ✅ Step 1: Register Firebase Messaging Service Worker first
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker
//     .register('/firebase-messaging-sw.js')
//     .then((registration) => {
//       console.log('✅ Firebase Messaging Service Worker registered:', registration);
//     })
//     .catch((err) => {
//       console.error('❌ Service Worker registration failed:', err);
//     });
// }

// ✅ Step 2: Bootstrap the Angular app
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideRouter(routes),
    importProvidersFrom(
      provideFirebaseApp(() => initializeApp(environment.firebaseConfig))
      // you can re-enable Firestore or Auth if needed
    ),
  ],
}).catch((err) => console.error('Bootstrap error:', err));

 
 