// setupUsers.js - Run this once to create initial users
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

// Your Firebase config (same as in your firebaseConfig.js)
const firebaseConfig = {
  // Your config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createUser(email, password, role, name) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: role,
      name: name,
      createdAt: new Date()
    });

    console.log(`✅ Created ${role}: ${email}`);
  } catch (error) {
    console.error(`❌ Error creating ${email}:`, error.message);
  }
}

// Create initial users
async function setupInitialUsers() {
  console.log('Setting up initial users...');
  
  await createUser('admin@tmc.edu', 'admin123', 'admin', 'Administrator');
  await createUser('student@tmc.edu', 'student123', 'student', 'Test Student');
  
  console.log('User setup completed!');
}

setupInitialUsers();