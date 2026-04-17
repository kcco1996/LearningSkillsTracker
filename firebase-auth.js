import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// 1) Paste your real Firebase config here
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBdu7ZLTrFwWbkcxingJFK4mf2KxoRQ3g",
  authDomain: "learningskillstracker.firebaseapp.com",
  projectId: "learningskillstracker",
  storageBucket: "learningskillstracker.firebasestorage.app",
  messagingSenderId: "440128091651",
  appId: "1:440128091651:web:fd68fe6cc7301bad458036"
};

// 2) Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 3) Make auth helpers available to your normal script.js
window.firebaseAuthHelpers = {
  async signInWithGoogle() {
    await signInWithPopup(auth, provider);
  },

  async signOutUser() {
    await signOut(auth);
  },

  onUserChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
};