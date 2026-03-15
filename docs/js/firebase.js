import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyALi9avQ4URuu4TBgEXP61JhAMNTC3Bt-8",
  authDomain: "and-share-3db85.firebaseapp.com",
  projectId: "and-share-3db85",
  storageBucket: "and-share-3db85.firebasestorage.app",
  messagingSenderId: "760689347289",
  appId: "1:760689347289:web:9190e3372a2855b0a4ccc8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
