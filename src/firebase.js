// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
    apiKey: "AIzaSyDgQKWyl4nJ9I03b6lu4DZUERFpgJKCJ5Y",
    authDomain: "socialsphere-c4ea5.firebaseapp.com",
    projectId: "socialsphere-c4ea5",
    storageBucket: "socialsphere-c4ea5.firebasestorage.app",
    messagingSenderId: "486589143323",
    appId: "1:486589143323:web:60fa61f8014df18f7d9bbe"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
