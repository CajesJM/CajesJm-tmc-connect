import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Your Firebase config (corrected)
const firebaseConfig = {
  apiKey: "AIzaSyCdtS1KbDFuqAsCpC5HMoP0-9tULYZQyC0",
  authDomain: "tmc-connect-92a46.firebaseapp.com",
  projectId: "tmc-connect-92a46",
  storageBucket: "tmc-connect-92a46.appspot.com", // 👈 fixed
  messagingSenderId: "542575332413",
  appId: "1:542575332413:web:e522b8a86c2f9b4b4fee54",
  measurementId: "G-1SKKFCZJ47", // safe to leave, but unused in RN
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export Firestore
export const db = getFirestore(app);
