// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBs77Fa8UfIxcsTBpeQj0T-xNaBor4hs_A",
  authDomain: "sec-pay-a54a3.firebaseapp.com",
  projectId: "sec-pay-a54a3",
  storageBucket: "sec-pay-a54a3.appspot.com",
  messagingSenderId: "809887207678",
  appId: "1:809887207678:web:5e69749adf92ceb310d5af"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
