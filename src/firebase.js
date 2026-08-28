import { initializeApp } from 'firebase/app';
// We import the modern persistence modules instead of the deprecated ones
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// REPLACE THIS OBJECT WITH YOUR ACTUAL CONFIG FROM STEP 2
const firebaseConfig = {
  apiKey: "AIzaSyCZt6jA48b0UOiNQdwUMH3uOFEAQZVM_gc",
  authDomain: "aio-calender.firebaseapp.com",
  projectId: "aio-calender",
  storageBucket: "aio-calender.firebasestorage.app",
  messagingSenderId: "961314076425",
  appId: "1:961314076425:web:5f43508f3b53840af185d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore WITH modern Offline Persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();