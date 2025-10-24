import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const userNameEl = document.getElementById("userName");
const userUidEl = document.getElementById("userUid");
const balanceEl = document.getElementById("balance");
const logoutBtn = document.getElementById("logoutBtn");
const sendBtn = document.getElementById("sendBtn");
const receiverInput = document.getElementById("receiverUid");
const amountInput = document.getElementById("amount");
const receiverNameDiv = document.getElementById("receiverName");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  userUidEl.textContent = user.uid;
  document.getElementById("copyUid").onclick = () => {
    navigator.clipboard.writeText(user.uid);
    alert("UID copied!");
  };

  const userRef = doc(db, "users", user.uid);

  // ✅ Real-time listener for balance & name
  onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      userNameEl.textContent = data.fullName || "User";
      balanceEl.textContent = (data.balance ?? 0).toFixed(2);
    }
  });
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

receiverInput.addEventListener("input", async () => {
  const uid = receiverInput.value.trim();
  if (!uid) {
    receiverNameDiv.textContent = "—";
    return;
  }
  try {
    const snap = await getDoc(doc(db, "users", uid));
    receiverNameDiv.textContent = snap.exists()
      ? snap.data().fullName
      : "❌ Not found";
  } catch (err) {
    receiverNameDiv.textContent = "Error fetching name";
  }
});

// Custom Confirm Popup
function customConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.4);display:flex;
      justify-content:center;align-items:center;z-index:9999;
    `;
    const box = document.createElement("div");
    box.style.cssText = `
      background:#fff;border-radius:12px;padding:20px 25px;text-align:center;
      width:280px;box-shadow:0 2px 10px rgba(0,0,0,0.2);
    `;
    box.innerHTML = `
      <h3 style="margin-bottom:10px;color:#222;">Confirm Payment</h3>
      <p style="margin-bottom:20px;color:#444;">${message}</p>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button id="yesBtn" style="padding:8px 16px;border:none;border-radius:6px;background:#007bff;color:#fff;cursor:pointer;">Yes</button>
        <button id="noBtn" style="padding:8px 16px;border:none;border-radius:6px;background:#ccc;color:#000;cursor:pointer;">No</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    box.querySelector("#yesBtn").onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    box.querySelector("#noBtn").onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };
  });
}

sendBtn.addEventListener("click", async () => {
  const receiverUid = receiverInput.value.trim();
  const amount = parseFloat(amountInput.value.trim());
  if (!receiverUid || isNaN(amount) || amount <= 0) {
    alert("⚠️ Enter valid receiver UID and amount");
    return;
  }

  const confirm = await customConfirm(`Are you sure you want to send ₹${amount}?`);
  if (!confirm) return;

  sendBtn.classList.add("loading");
  try {
    const sender = auth.currentUser;
    if (!sender) throw new Error("Not logged in");

    const senderRef = doc(db, "users", sender.uid);
    const receiverRef = doc(db, "users", receiverUid);

    const senderSnap = await getDoc(senderRef);
    const receiverSnap = await getDoc(receiverRef);

    if (!receiverSnap.exists()) throw new Error("Receiver not found");

    const senderData = senderSnap.data();
    const receiverData = receiverSnap.data();

    if (senderData.balance < amount) throw new Error("Insufficient balance");

    await updateDoc(senderRef, { balance: senderData.balance - amount });
    await updateDoc(receiverRef, { balance: (receiverData.balance || 0) + amount });

    await addDoc(collection(db, "transactions"), {
      from: sender.uid,
      to: receiverUid,
      amount,
      timestamp: serverTimestamp(),
    });

    alert("✅ Payment successful!");
    amountInput.value = "";
    receiverInput.value = "";
    receiverNameDiv.textContent = "—";
  } catch (err) {
    alert("❌ Payment failed: " + err.message);
  } finally {
    sendBtn.classList.remove("loading");
  }
});
