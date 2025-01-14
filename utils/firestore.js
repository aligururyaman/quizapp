// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC302T53I7gmxCESX-lLph2_rmk9_FnZOM",
  authDomain: "quizzers-80.firebaseapp.com",
  projectId: "quizzers-80",
  storageBucket: "quizzers-80.firebasestorage.app",
  messagingSenderId: "103510759773",
  appId: "1:103510759773:web:53bde26d72690b28d9f0b4",
  measurementId: "G-P0CP5E1WJ0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
