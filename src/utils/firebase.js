import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB43p2CQBgAfhs1pDS9nVBM2o5Ty4-3aeU",
  authDomain: "expensetrackerpro-d216d.firebaseapp.com",
  projectId: "expensetrackerpro-d216d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, offline mode enabled in only one tab at a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser doesn't support offline persistence.");
  }
});
