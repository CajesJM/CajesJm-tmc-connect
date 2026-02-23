import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCdtS1KbDFuqAsCpC5HMoP0-9tULYZQyC0",
  authDomain: "tmc-connect-92a46.firebaseapp.com",
  projectId: "tmc-connect-92a46",
  storageBucket: "tmc-connect-92a46.appspot.com", 
  messagingSenderId: "542575332413",
  appId: "1:542575332413:web:e522b8a86c2f9b4b4fee54",
  measurementId: "G-1SKKFCZJ47", 
};

const app = initializeApp(firebaseConfig);

// Simple approach - no window access
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Remove all window references and debug code
// Just export the services

export { auth, db, storage };
