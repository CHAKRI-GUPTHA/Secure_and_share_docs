import { apiFetch, getToken, clearToken, getApiBase } from "./api.js";

const myDocsContainer = document.getElementById("my-docs");
const sharedDocsContainer = document.getElementById("shared-docs");
const uploadForm = document.getElementById("upload-form");
const logoutLink = document.getElementById("logout-link");
const welcomeText = document.getElementById("welcome-text");

function setStatus(id, message, isError = false) {
  const el = document.getElementById(id);
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

function createDocCard(doc, isShared) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = doc.name || "Untitled";

  const type = document.createElement("div");
  type.className = "tag";
  type.textContent = doc.type || "Document";

  const date = document.createElement("p");
  date.textContent = doc.uploadedAt ? `Uploaded: ${new Date(doc.uploadedAt).toLocaleString()}` : "Uploaded: --";

  const actions = document.createElement("div");
  actions.className = "actions";

  const viewBtn = document.createElement("button");
  viewBtn.className = "secondary";
  viewBtn.textContent = "View";
  viewBtn.addEventListener("click", () => {
    const token = getToken();
    if (doc.fileUrl && token) {
      const apiBase = getApiBase();
      const normalized = doc.fileUrl.startsWith("http")
        ? doc.fileUrl
        : `${apiBase}${doc.fileUrl}`;
      const joiner = normalized.includes("?") ? "&" : "?";
      window.open(`${normalized}${joiner}token=${token}`, "_blank");
    }
  });

  actions.appendChild(viewBtn);

  if (!isShared) {
    const renameBtn = document.createElement("button");
    renameBtn.className = "secondary";
    renameBtn.textContent = "Rename";
    renameBtn.addEventListener("click", async () => {
      const newName = window.prompt("Enter new document name", doc.name || "");
      if (!newName) {
        return;
      }
      try {
        await apiFetch(`/api/documents/${doc.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName })
        });
        title.textContent = newName;
      } catch (error) {
        alert(error.message);
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      const confirmed = window.confirm("Delete this document permanently?");
      if (!confirmed) {
        return;
      }
      try {
        await apiFetch(`/api/documents/${doc.id}`, { method: "DELETE" });
        card.remove();
      } catch (error) {
        alert(error.message);
      }
    });

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);
  } else {
    const sharedTag = document.createElement("span");
    sharedTag.className = "badge";
    sharedTag.textContent = "Shared";
    actions.appendChild(sharedTag);
  }

  card.appendChild(type);
  card.appendChild(title);
  card.appendChild(date);
  card.appendChild(actions);

  return card;
}

async function loadDashboard() {
  if (!requireAuth()) {
    return;
  }

  if (welcomeText) {
    const user = await apiFetch("/api/me");
    const name = user.name || "User";
    welcomeText.textContent = `Welcome, ${name}. Manage your documents below.`;
  }

  if (myDocsContainer || sharedDocsContainer) {
    const data = await apiFetch("/api/documents");

    if (myDocsContainer) {
      myDocsContainer.innerHTML = "";
      if (!data.ownDocs.length) {
        myDocsContainer.innerHTML = "<p class=\"status\">No documents yet.</p>";
      } else {
        data.ownDocs.forEach((doc) => {
          myDocsContainer.appendChild(createDocCard(doc, false));
        });
      }
    }

    if (sharedDocsContainer) {
      sharedDocsContainer.innerHTML = "";
      if (!data.sharedDocs.length) {
        sharedDocsContainer.innerHTML = "<p class=\"status\">No shared documents yet.</p>";
      } else {
        data.sharedDocs.forEach((doc) => {
          sharedDocsContainer.appendChild(createDocCard(doc, true));
        });
      }
    }
  }
}

async function uploadDocument(event) {
  event.preventDefault();
  if (!requireAuth()) {
    return;
  }

  const formData = new FormData();
  formData.append("name", document.getElementById("doc-name").value.trim());
  formData.append("type", document.getElementById("doc-type").value.trim());
  formData.append("file", document.getElementById("doc-file").files[0]);

  try {
    setStatus("upload-status", "Uploading...");
    await apiFetch("/api/documents", {
      method: "POST",
      body: formData
    });
    setStatus("upload-status", "Upload successful.");
    event.target.reset();
  } catch (error) {
    setStatus("upload-status", error.message, true);
  }
}

if (uploadForm) {
  uploadForm.addEventListener("submit", uploadDocument);
}

if (myDocsContainer || sharedDocsContainer || welcomeText) {
  loadDashboard();
}

if (logoutLink) {
  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    clearToken();
    window.location.href = "login.html";
  });
}
