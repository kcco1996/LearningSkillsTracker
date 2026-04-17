import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// 1) Paste your real Firebase config here
const firebaseConfig = {
  apiKey: "PASTE_YOURS_HERE",
  authDomain: "PASTE_YOURS_HERE",
  projectId: "PASTE_YOURS_HERE",
  storageBucket: "PASTE_YOURS_HERE",
  messagingSenderId: "PASTE_YOURS_HERE",
  appId: "PASTE_YOURS_HERE"
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