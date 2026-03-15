const API_PORT = "3000";
const hostName = window.location.hostname || "localhost";
const isLocalhost = hostName === "localhost" || hostName === "127.0.0.1";
const runningOnApiPort = window.location.port === API_PORT;
const manualBase = window.APP_API_BASE || "";
const API_BASE = manualBase || (isLocalhost && !runningOnApiPort ? `http://${hostName}:${API_PORT}` : "");

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function setToken(token) {
  localStorage.setItem("auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

export async function apiFetch(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.headers.get("content-type")?.includes("application/json")) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response;
}
