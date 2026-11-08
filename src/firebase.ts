import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Firebase Web SDK configuration is a public client identifier, NOT an admin credential.
 * Authorization is exclusively enforced with Firebase Auth and deployed security rules.
 * Do not place any service account keys in this repository or VITE_* variables.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBVj_hH6ULUggOG_wZ05_ahcrLomME4v-U',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'seguros-d1a86.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'seguros-d1a86',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'seguros-d1a86.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '373683427082',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:373683427082:web:226964cb45b2aafcfeccf3',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XZYW8JEBZD',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const companyId = 'main' as const;

/** Initial business owners. Firebase rules must independently enforce this allowlist. */
export const initialAdminEmails = ['norvingarcia220@gmail.com', 'amyblandon171@gmail.com'] as const;
export function isInitialAdmin(email: string | null | undefined): boolean {
  return !!email && initialAdminEmails.some(adminEmail => adminEmail === email.trim().toLowerCase());
}
