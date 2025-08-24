// dashboard.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, onSnapshot, runTransaction, collection, query, where,
  onSnapshot as listen, orderBy, serverTimestamp, doc as docRef
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let meUid = null;
let meRef = null;

// Toast helper
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2000);
}

// Auth & profile
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }

  meUid = user.uid;
  meRef = doc(db, "users", meUid);

  // Realtime profile (name + balance)
  onSnapshot(meRef, (snap) => {
    if (!snap.exists()) return;
    const u = snap.data();
    document.getElementById("userName").textContent = u.fullName ?? "User";
    document.getElementById("balance").textContent = (u.balance ?? 0);
    document.getElementById("userUid").textContent = meUid;
  });

  // Copy UID
  document.getElementById("copyUid").onclick = () => {
    navigator.clipboard.writeText(meUid);
    toast("UID copied ✅");
  };

  // Start history listeners
  startHistoryListeners();
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Send money (by UID) — atomic client transaction
document.getElementById("sendBtn").addEventListener("click", async () => {
  const receiverUid = document.getElementById("receiverUid").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);

  if (!receiverUid || !amount || amount <= 0) return toast("Enter valid UID & amount");
  if (receiverUid === meUid) return toast("You cannot send to yourself");

  const rxRef = doc(db, "users", receiverUid);
  const rxSnap = await getDoc(rxRef);
  if (!rxSnap.exists()) return toast("Receiver not found");

  try {
    await runTransaction(db, async (tx) => {
      const meDoc = await tx.get(meRef);
      const rxDoc = await tx.get(rxRef);

      if (!meDoc.exists() || !rxDoc.exists()) throw new Error("User docs missing");

      const meBal = Number(meDoc.data().balance || 0);
      const rxBal = Number(rxDoc.data().balance || 0);
      if (meBal < amount) throw new Error("Insufficient balance");

      // Update balances
      tx.update(meRef, { balance: meBal - amount });
      tx.update(rxRef, { balance: rxBal + amount });

      // Write transaction record inside the same transaction
      const txnRef = docRef(collection(db, "transactions"));
      tx.set(txnRef, {
        senderId: meUid,
        senderName: meDoc.data().fullName,
        receiverId: receiverUid,
        receiverName: rxDoc.data().fullName,
        amount: Number(amount),
        createdAt: serverTimestamp()
      });
    });

    // Clear fields & show success toast
    (document.getElementById("receiverUid").value = "");
    (document.getElementById("amount").value = "");
    toast("Payment successful ✅");

  } catch (e) {
    toast(e.message || "Payment failed");
  }
});

// -------- Realtime history (sent + received) --------
let sentUnsub = null, recvUnsub = null;
function startHistoryListeners() {
  const list = document.getElementById("txnList");
  const items = new Map(); // key=docId, value=data

  function render() {
    // Convert to array and sort desc by createdAt
    const arr = Array.from(items.values()).sort((a,b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });

    list.innerHTML = "";
    if (!arr.length) {
      const li = document.createElement("li");
      li.className = "item";
      li.textContent = "No transactions yet.";
      list.appendChild(li);
      return;
    }

    for (const t of arr) {
      const li = document.createElement("li");
      li.className = "item";
      const when = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : "";
      const isSent = t.senderId === meUid;
      li.innerHTML = isSent
        ? `<span class="amt debit">− ₹${t.amount}</span>
           <span>To <b>${t.receiverName}</b> (UID: ${t.receiverId})</span>
           <span class="muted">${when}</span>`
        : `<span class="amt credit">+ ₹${t.amount}</span>
           <span>From <b>${t.senderName}</b> (UID: ${t.senderId})</span>
           <span class="muted">${when}</span>`;
      list.appendChild(li);
    }
  }

  // Listen for sent
  const qSent = query(
    collection(db, "transactions"),
    where("senderId", "==", meUid),
    orderBy("createdAt", "desc")
  );
  sentUnsub = listen(qSent, (snap) => {
    snap.docChanges().forEach(ch => {
      if (ch.type === "removed") items.delete(ch.doc.id);
      else items.set(ch.doc.id, ch.doc.data());
    });
    render();
  });

  // Listen for received
  const qRecv = query(
    collection(db, "transactions"),
    where("receiverId", "==", meUid),
    orderBy("createdAt", "desc")
  );
  recvUnsub = listen(qRecv, (snap) => {
    snap.docChanges().forEach(ch => {
      if (ch.type === "removed") items.delete(ch.doc.id);
      else items.set(ch.doc.id, ch.doc.data());
    });
    render();
  });
}
