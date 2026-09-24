import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPC2v-2xl8SNCVNyRgfh_D-b0l7Xt7NOo",
  authDomain: "shinsei-e75f7.firebaseapp.com",
  projectId: "shinsei-e75f7",
  storageBucket: "shinsei-e75f7.firebasestorage.app",
  messagingSenderId: "183947337374",
  appId: "1:183947337374:web:31078cd74763b9c804258f",
  measurementId: "G-HG9C926QHW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where };
