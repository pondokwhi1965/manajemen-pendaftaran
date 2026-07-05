import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
 apiKey: "AIzaSyDkbp1Q_QJ6vYnqmNst4Dm6-jM8hZvZ1rQ",
   authDomain: "pembayaran-santri-baru.firebaseapp.com",
     projectId: "pembayaran-santri-baru",
       storageBucket: "pembayaran-santri-baru.firebasestorage.app",
         messagingSenderId: "394796377736",
           appId: "1:394796377736:web:6f4f688c1d858be67da13d",
             measurementId: "G-R7BF63MMDM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
