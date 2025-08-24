import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBs77Fa8UfIxcsTBpeQj0T-xNaBor4hs_A",
  authDomain: "sec-pay-a54a3.firebaseapp.com",
  projectId: "sec-pay-a54a3",
  storageBucket: "sec-pay-a54a3.firebasestorage.app",
  messagingSenderId: "809887207678",
  appId: "1:809887207678:web:5e69749adf92ceb310d5af",
  measurementId: "G-4KXP9LEP3Q"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth();
const db = getFirestore();

// Signup
document.getElementById("signupBtn").addEventListener("click", async () => {
  const fullName = document.getElementById("fullname").value;
  const mobile = document.getElementById("mobile").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      fullName,
      mobile,
      email,
      balance: 1000,
      createdAt: new Date()
    });

    alert("Signup successful!");
    window.location.href = "dashboard.html"; // redirect
  } catch (error) {
    alert(error.message);
  }
});

// Login
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    window.location.href = "dashboard.html"; // redirect
  } catch (error) {
    alert(error.message);
  }
});
