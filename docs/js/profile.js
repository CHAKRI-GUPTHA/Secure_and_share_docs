import { apiFetch, getToken, clearToken } from "./api.js";

const profileForm = document.getElementById("profile-form");
const logoutLink = document.getElementById("logout-link");

function setStatus(message, isError = false) {
  const el = document.getElementById("profile-status");
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

async function loadProfile() {
  if (!requireAuth()) {
    return;
  }
  const user = await apiFetch("/api/me");
  document.getElementById("profile-name").value = user.name || "";
  document.getElementById("profile-email").value = user.email || "";
  document.getElementById("profile-phone").value = user.phone || "";
  document.getElementById("profile-aadhaar").value = user.aadhaar || "";
}

async function saveProfile(event) {
  event.preventDefault();
  if (!requireAuth()) {
    return;
  }

  const payload = {
    name: document.getElementById("profile-name").value.trim(),
    phone: document.getElementById("profile-phone").value.trim(),
    aadhaar: document.getElementById("profile-aadhaar").value.trim()
  };

  try {
    await apiFetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setStatus("Profile updated.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

if (profileForm) {
  loadProfile();
  profileForm.addEventListener("submit", saveProfile);
}

if (logoutLink) {
  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    clearToken();
    window.location.href = "login.html";
  });
}
