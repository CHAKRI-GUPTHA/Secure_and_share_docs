import { auth, db } from "./firebase.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export async function logEvent(action, details = {}) {
  const user = auth.currentUser;
  if (!user) {
    return;
  }

  try {
    await addDoc(collection(db, "logs"), {
      uid: user.uid,
      action,
      details,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("Log failed", error);
  }
}
