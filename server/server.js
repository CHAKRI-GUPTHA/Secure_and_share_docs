const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret";

const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "uploads");

let firestore = null;
let firestoreEnabled = false;

function initFirestore() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let serviceAccount = null;

  if (serviceAccountJson) {
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
      console.log("Firestore service account loaded from FIREBASE_SERVICE_ACCOUNT_JSON.");
    } catch (error) {
      console.warn("Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
      return;
    }
  } else if (serviceAccountBase64) {
    try {
      const decoded = Buffer.from(serviceAccountBase64, "base64").toString("utf-8");
      serviceAccount = JSON.parse(decoded);
      console.log("Firestore service account loaded from FIREBASE_SERVICE_ACCOUNT_BASE64.");
    } catch (error) {
      console.warn("Invalid FIREBASE_SERVICE_ACCOUNT_BASE64:", error.message);
      return;
    }
  } else if (serviceAccountPath) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      console.log("Firestore service account loaded from file path.");
    } catch (error) {
      console.warn("Invalid service account file:", error.message);
      return;
    }
  } else {
    console.log("Firestore sync disabled. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64, or FIREBASE_SERVICE_ACCOUNT.");
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firestore = admin.firestore();
    firestoreEnabled = true;
    console.log("Firestore sync enabled.");
    syncAllToFirestore();
  } catch (error) {
    console.warn("Firestore sync disabled:", error.message);
  }
}

function firestoreTimestamp() {
  return firestoreEnabled ? admin.firestore.FieldValue.serverTimestamp() : null;
}

async function syncFirestoreDoc(collectionName, docId, payload) {
  if (!firestoreEnabled) {
    return;
  }
  try {
    await firestore.collection(collectionName).doc(docId).set(payload, { merge: true });
  } catch (error) {
    console.warn(`Firestore sync failed for ${collectionName}/${docId}:`, error.message);
  }
}

async function deleteFirestoreDoc(collectionName, docId) {
  if (!firestoreEnabled) {
    return;
  }
  try {
    await firestore.collection(collectionName).doc(docId).delete();
  } catch (error) {
    console.warn(`Firestore delete failed for ${collectionName}/${docId}:`, error.message);
  }
}

initFirestore();

function ensureFile(filePath, defaultValue) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readJson(fileName, defaultValue) {
  const filePath = path.join(dataDir, fileName);
  ensureFile(filePath, defaultValue);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeJson(fileName, data) {
  const filePath = path.join(dataDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function logEvent(uid, action, details = {}) {
  const logs = readJson("logs.json", []);
  const logId = crypto.randomUUID();
  logs.push({
    id: logId,
    uid,
    action,
    details,
    createdAt: new Date().toISOString()
  });
  writeJson("logs.json", logs);
  syncFirestoreDoc("logs", logId, {
    id: logId,
    uid,
    action,
    details,
    createdAt: new Date().toISOString(),
    createdAtServer: firestoreTimestamp()
  });
}

function userToFirestore(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    aadhaar: user.aadhaar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || null,
    syncedAtServer: firestoreTimestamp()
  };
}

function docToFirestore(doc) {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    name: doc.name,
    type: doc.type,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    sharedToEmails: doc.sharedToEmails || [],
    sharedToAadhaar: doc.sharedToAadhaar || [],
    uploadedAt: doc.uploadedAt,
    updatedAt: doc.updatedAt || null,
    syncedAtServer: firestoreTimestamp()
  };
}

function shareToFirestore(share) {
  return {
    id: share.id,
    docId: share.docId,
    ownerId: share.ownerId,
    sharedToEmail: share.sharedToEmail,
    sharedToAadhaar: share.sharedToAadhaar,
    permission: share.permission,
    createdAt: share.createdAt,
    syncedAtServer: firestoreTimestamp()
  };
}

async function syncAllToFirestore() {
  if (!firestoreEnabled) {
    return;
  }
  const users = readJson("users.json", []);
  const docs = readJson("documents.json", []);
  const shares = readJson("shares.json", []);
  const logs = readJson("logs.json", []);

  await Promise.all(users.map((u) => syncFirestoreDoc("users", u.id, userToFirestore(u))));
  await Promise.all(docs.map((d) => syncFirestoreDoc("documents", d.id, docToFirestore(d))));
  await Promise.all(shares.map((s) => syncFirestoreDoc("shares", s.id, shareToFirestore(s))));
  await Promise.all(logs.map((l) => syncFirestoreDoc("logs", l.id, {
    id: l.id,
    uid: l.uid,
    action: l.action,
    details: l.details,
    createdAt: l.createdAt,
    syncedAtServer: firestoreTimestamp()
  })));
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    const docId = req.docId;
    const target = path.join(uploadsDir, userId, docId);
    fs.mkdirSync(target, { recursive: true });
    cb(null, target);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

function getToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  if (req.query.token) {
    return req.query.token;
  }
  return null;
}

function authRequired(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function findUserByEmail(email) {
  const users = readJson("users.json", []);
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  const users = readJson("users.json", []);
  return users.find((u) => u.id === id);
}

app.post("/api/register", async (req, res) => {
  const { name, email, phone, aadhaar, password, otp } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  if (otp && otp !== "123456") {
    return res.status(400).json({ error: "Invalid OTP (demo OTP is 123456)." });
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: "Email already registered." });
  }

  const users = readJson("users.json", []);
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    phone: phone || "",
    aadhaar: aadhaar || "",
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeJson("users.json", users);

  logEvent(user.id, "register", { email, phone, aadhaar });
  await syncFirestoreDoc("users", user.id, userToFirestore(user));

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, aadhaar: user.aadhaar } });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(400).json({ error: "Invalid credentials." });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(400).json({ error: "Invalid credentials." });
  }

  logEvent(user.id, "login", { email });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, aadhaar: user.aadhaar } });
});

app.get("/api/me", authRequired, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, aadhaar: user.aadhaar });
});

app.put("/api/profile", authRequired, async (req, res) => {
  const { name, phone, aadhaar } = req.body;
  const users = readJson("users.json", []);
  const idx = users.findIndex((u) => u.id === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  users[idx] = {
    ...users[idx],
    name: name || users[idx].name,
    phone: phone || users[idx].phone,
    aadhaar: aadhaar || users[idx].aadhaar,
    updatedAt: new Date().toISOString()
  };

  writeJson("users.json", users);
  logEvent(req.user.id, "profile_update", { name, phone, aadhaar });
  await syncFirestoreDoc("users", req.user.id, userToFirestore(users[idx]));
  res.json({ ok: true });
});

app.get("/api/documents", authRequired, (req, res) => {
  const docs = readJson("documents.json", []);
  const user = getUserById(req.user.id);

  const ownDocs = docs.filter((d) => d.ownerId === req.user.id);
  const sharedDocs = docs.filter((d) => {
    if (d.ownerId === req.user.id) {
      return false;
    }
    if (req.user.email && d.sharedToEmails.includes(req.user.email)) {
      return true;
    }
    if (user && user.aadhaar && d.sharedToAadhaar.includes(user.aadhaar)) {
      return true;
    }
    return false;
  });

  res.json({ ownDocs, sharedDocs });
});

app.get("/api/documents/own", authRequired, (req, res) => {
  const docs = readJson("documents.json", []);
  res.json(docs.filter((d) => d.ownerId === req.user.id));
});

app.post("/api/documents", authRequired, (req, res, next) => {
  req.docId = crypto.randomUUID();
  next();
}, upload.single("file"), async (req, res) => {
  const { name, type } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: "File is required." });
  }

  const docs = readJson("documents.json", []);
  const docRecord = {
    id: req.docId,
    ownerId: req.user.id,
    name: name || req.file.originalname,
    type: type || "Document",
    fileName: req.file.originalname,
    storagePath: req.file.path,
    fileUrl: `/api/documents/${req.docId}/file`,
    sharedToEmails: [],
    sharedToAadhaar: [],
    uploadedAt: new Date().toISOString()
  };

  docs.push(docRecord);
  writeJson("documents.json", docs);

  logEvent(req.user.id, "document_upload", { docId: req.docId, name: docRecord.name, type: docRecord.type });
  await syncFirestoreDoc("documents", docRecord.id, docToFirestore(docRecord));

  res.json(docRecord);
});

app.put("/api/documents/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const docs = readJson("documents.json", []);
  const idx = docs.findIndex((d) => d.id === id && d.ownerId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Document not found." });
  }

  docs[idx] = {
    ...docs[idx],
    name: name || docs[idx].name,
    updatedAt: new Date().toISOString()
  };

  writeJson("documents.json", docs);
  logEvent(req.user.id, "document_rename", { docId: id, newName: docs[idx].name });
  await syncFirestoreDoc("documents", id, docToFirestore(docs[idx]));
  res.json({ ok: true });
});

app.delete("/api/documents/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const docs = readJson("documents.json", []);
  const docIndex = docs.findIndex((d) => d.id === id && d.ownerId === req.user.id);
  if (docIndex === -1) {
    return res.status(404).json({ error: "Document not found." });
  }

  const docRecord = docs[docIndex];
  if (docRecord.storagePath && fs.existsSync(docRecord.storagePath)) {
    fs.unlinkSync(docRecord.storagePath);
  }

  docs.splice(docIndex, 1);
  writeJson("documents.json", docs);

  logEvent(req.user.id, "document_delete", { docId: id });
  await deleteFirestoreDoc("documents", id);
  res.json({ ok: true });
});

app.post("/api/share", authRequired, async (req, res) => {
  const { docId, email, aadhaar, permission } = req.body;
  if (!docId) {
    return res.status(400).json({ error: "docId is required" });
  }
  if (!email && !aadhaar) {
    return res.status(400).json({ error: "Provide an email or Aadhaar number." });
  }

  const docs = readJson("documents.json", []);
  const idx = docs.findIndex((d) => d.id === docId && d.ownerId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Document not found." });
  }

  if (email && !docs[idx].sharedToEmails.includes(email)) {
    docs[idx].sharedToEmails.push(email);
  }
  if (aadhaar && !docs[idx].sharedToAadhaar.includes(aadhaar)) {
    docs[idx].sharedToAadhaar.push(aadhaar);
  }

  writeJson("documents.json", docs);

  const shares = readJson("shares.json", []);
  const shareId = crypto.randomUUID();
  shares.push({
    id: shareId,
    docId,
    ownerId: req.user.id,
    sharedToEmail: email || "",
    sharedToAadhaar: aadhaar || "",
    permission: permission || "view",
    createdAt: new Date().toISOString()
  });
  writeJson("shares.json", shares);

  logEvent(req.user.id, "document_share", { docId, email, aadhaar, permission });
  await syncFirestoreDoc("documents", docId, docToFirestore(docs[idx]));
  await syncFirestoreDoc("shares", shareId, shareToFirestore(shares[shares.length - 1]));

  res.json({ ok: true });
});

app.get("/api/documents/:id/file", authRequired, (req, res) => {
  const { id } = req.params;
  const docs = readJson("documents.json", []);
  const docRecord = docs.find((d) => d.id === id);
  if (!docRecord) {
    return res.status(404).send("Not found");
  }

  const user = getUserById(req.user.id);
  const isOwner = docRecord.ownerId === req.user.id;
  const isShared = (req.user.email && docRecord.sharedToEmails.includes(req.user.email))
    || (user && user.aadhaar && docRecord.sharedToAadhaar.includes(user.aadhaar));

  if (!isOwner && !isShared) {
    return res.status(403).send("Forbidden");
  }

  if (!fs.existsSync(docRecord.storagePath)) {
    return res.status(404).send("File missing");
  }

  const safeName = path.basename(docRecord.fileName || docRecord.name || "document");
  const inlineName = safeName.replace(/"/g, "");
  res.setHeader("Content-Disposition", `inline; filename="${inlineName}"`);
  res.sendFile(path.resolve(docRecord.storagePath));
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
