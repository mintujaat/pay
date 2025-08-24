import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.includes("login.html")) {
    window.location.href = "dashboard.html";
  }
});

// Signup
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fullName = document.getElementById("fullName").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    // 1️⃣ Create user in Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // 2️⃣ Add user to Firestore "users" collection (lowercase)
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      fullName,
      mobile,
      email,
      balance: 1000,
      createdAt: serverTimestamp()
    });

    console.log("User added to Firestore:", cred.user.uid);
    alert("Signup successful!");
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Error code:", err.code, "Message:", err.message);
    alert("Error: " + err.message);
  }
});

// Login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Login Error code:", err.code, "Message:", err.message);
    alert("Login Error: " + err.message);
  }
});
