import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigured = missingConfig.length === 0;

if (!firebaseConfigured) {
  console.error(
    `Firebase is not configured. Add these variables to .env.local: ${missingConfig.join(", ")}`,
  );
}

export const firebaseApp = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider = new GoogleAuthProvider();

export const analyticsReady =
  firebaseApp && firebaseConfig.measurementId
    ? isSupported()
        .then((supported) => {
          if (!supported) {
            console.info("Firebase Analytics is unavailable in this browser.");
            return null;
          }
          return getAnalytics(firebaseApp);
        })
        .catch((error) => {
          console.warn("Firebase Analytics could not be initialized:", error);
          return null;
        })
    : Promise.resolve(null);
