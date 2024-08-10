import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB3BGNjSXM7x9ne1q5ocsiG7olOqe_mj1A",
    authDomain: "nutpromv1.firebaseapp.com",
    projectId: "nutpromv1",
    storageBucket: "nutpromv1.appspot.com",
    messagingSenderId: "1029027081391",
    appId: "1:1029027081391:web:a4cc34de05cfe1889b385a"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };