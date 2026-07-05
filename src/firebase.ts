import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBfjyCRFVu9WOhZGSJRntILilJ_TDu8A4I",
  authDomain: "manajemen-pendaftaran.firebaseapp.com",
  projectId: "manajemen-pendaftaran",
  storageBucket: "manajemen-pendaftaran.firebasestorage.app",
  messagingSenderId: "254037795870",
  appId: "1:254037795870:web:3e87d0bf2bfa5d2ff5ba0f",
  measurementId: "G-RB3G234L3P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
