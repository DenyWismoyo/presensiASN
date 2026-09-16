import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA68rTg8CIf4483joidSU_kfaIu603Dx1Q",
  authDomain: "teknopark-surakarta.firebaseapp.com",
  projectId: "teknopark-surakarta",
  storageBucket: "teknopark-surakarta.firebasestorage.app",
  messagingSenderId: "831800993201",
  appId: "1:831800993201:web:9bf7458a0d5aa9078f0990",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "presensi-pegawai");

async function checkFirestore() {
  const cred = await signInWithEmailAndPassword(auth, "budi.santoso@surakarta.go.id", "asn123456");
  console.log("Logged in UID:", cred.user.uid);
  try {
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    console.log("Doc exists?", snap.exists());
    if (snap.exists()) {
      console.log("Data:", snap.data());
    }
  } catch (err) {
    console.error("Read error:", err.code, err.message);
  }
}

checkFirestore();
