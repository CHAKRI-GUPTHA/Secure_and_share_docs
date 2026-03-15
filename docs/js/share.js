import { apiFetch, getToken, clearToken } from "./api.js";

const shareForm = document.getElementById("share-form");
const shareSelect = document.getElementById("share-doc");
const logoutLink = document.getElementById("logout-link");

function setStatus(message, isError = false) {
  const el = document.getElementById("share-status");
  if (!el) {
    return;
  }
  el.textContent = message;
  el.style.color = isError ? "#b00020" : "inherit";
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

async function loadUserDocuments() {
  if (!requireAuth()) {
    return;
  }
  const docs = await apiFetch("/api/documents/own");
  shareSelect.innerHTML = "";
  if (!docs.length) {
    shareSelect.innerHTML = "<option value=\"\">No documents found</option>";
    return;
  }
  docs.forEach((doc) => {
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = doc.name ? `${doc.name} (${doc.type})` : doc.id;
    shareSelect.appendChild(option);
  });
}

async function shareDocument(event) {
  event.preventDefault();
  if (!requireAuth()) {
    return;
  }

  const docId = shareSelect.value;
  const email = document.getElementById("share-email").value.trim();
  const aadhaar = document.getElementById("share-aadhaar").value.trim();
  const permission = document.getElementById("share-permission").value.trim();

  if (!docId) {
    setStatus("Select a document.", true);
    return;
  }
  if (!email && !aadhaar) {
    setStatus("Provide an email or Aadhaar number.", true);
    return;
  }

  try {
    await apiFetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, email, aadhaar, permission })
    });
    setStatus("Access granted successfully.");
    shareForm.reset();
  } catch (error) {
    setStatus(error.message, true);
  }
}

if (shareForm) {
  loadUserDocuments();
  shareForm.addEventListener("submit", shareDocument);
}

if (logoutLink) {
  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    clearToken();
    window.location.href = "login.html";
  });
}
