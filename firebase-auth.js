import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBdu7ZLTrFwWbkcxingJFK4mf2KxoRQ3g",
  authDomain: "learningskillstracker.firebaseapp.com",
  projectId: "learningskillstracker",
  storageBucket: "learningskillstracker.firebasestorage.app",
  messagingSenderId: "440128091651",
  appId: "1:440128091651:web:fd68fe6cc7301bad458036"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

window.firebaseAuthHelpers = {
  async signInWithGoogle() {
    return await signInWithPopup(auth, provider);
  },

  async signOutUser() {
    return await signOut(auth);
  },

  onUserChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
};