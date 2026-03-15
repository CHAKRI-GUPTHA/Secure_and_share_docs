import { apiFetch, setToken, clearToken } from "./api.js";

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const logoutLink = document.getElementById("logout-link");

function setStatus(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  el.textContent = message;
  el.style.color = isError ? "#b00020" : "inherit";
}

async function register(event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    aadhaar: document.getElementById("aadhaar").value.trim(),
    password: document.getElementById("password").value.trim(),
    otp: document.getElementById("otp").value.trim()
  };

  try {
    const result = await apiFetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setToken(result.token);
    setStatus("register-status", "Account created. Redirecting...");
    window.location.href = "dashboard.html";
  } catch (error) {
    setStatus("register-status", error.message, true);
  }
}

async function login(event) {
  event.preventDefault();
  const payload = {
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value.trim()
  };

  try {
    const result = await apiFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setToken(result.token);
    window.location.href = "dashboard.html";
  } catch (error) {
    setStatus("login-status", error.message, true);
  }
}

function logout(event) {
  if (event) {
    event.preventDefault();
  }
  clearToken();
  window.location.href = "login.html";
}

if (registerForm) {
  registerForm.addEventListener("submit", register);
}

if (loginForm) {
  loginForm.addEventListener("submit", login);
}

if (logoutLink) {
  logoutLink.addEventListener("click", logout);
}
