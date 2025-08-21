import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCWz88UEuRpNP7Wc-LbeV7eHkrtUAUhcW0",
  authDomain: "apps-8508d.firebaseapp.com",
  projectId: "apps-8508d",
  storageBucket: "apps-8508d.firebasestorage.app",
  messagingSenderId: "925107255227",
  appId: "1:925107255227:web:a292a07afd41d3450ef69e",
  measurementId: "G-44NN72N0YB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;