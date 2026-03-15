# Secure & Share Govt Documents (Local Server)

A web app to store, manage, and share government documents with family members. This version runs fully on a local Node.js server with file uploads and no Firebase billing required.

## Features

- Registration and login (local)
- Upload, rename, delete documents
- Share documents with family by email or Aadhaar
- Profile management
- Activity logging

## Tech Stack

- HTML, CSS, JavaScript
- Node.js, Express, Multer
- Local JSON storage

## Setup

1. Install Node.js (already required for this project).
2. Install server dependencies:

```powershell
cd c:\Users\hp\OneDrive\Documents\chakri_internship4\server
npm install
```

3. Start the server:

```powershell
npm start
```

4. Open the app in your browser:

```
http://localhost:3000
```

## Notes

- Demo OTP for registration is `123456`.
- Uploaded files are stored in `server/uploads`.
- Data is stored in local JSON files under `server/data`.
- If you want to access the app from another phone on the same Wi-Fi, use your PC's local IP, for example:

```
http://192.168.x.x:3000
```

## Optional: Sync Data to Firebase Firestore

If you want all users, documents, shares, and logs to appear in Firebase Firestore:

1. In Firebase Console, go to Project Settings, then Service Accounts.
2. Click Generate new private key and download the JSON key file.
3. Set the environment variable before starting the server:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT="C:\\path\\to\\serviceAccountKey.json"
```

4. Start the server with `npm start`.

When the server detects the key, it will automatically mirror existing local data and keep Firestore in sync.

## Deploy Publicly (Render)

To access the same account and data from any device/network, deploy the server publicly.

1. Push this project to GitHub.
2. Create a new Render Web Service and connect your repo.
3. Configure the service:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

4. Add environment variables:

- `JWT_SECRET`: any long random string
- `FIREBASE_SERVICE_ACCOUNT_JSON`: paste the full JSON from your service account key

5. Optional (recommended) persistent storage:

- Attach a persistent disk in Render.
- Set `DATA_DIR` and `UPLOADS_DIR` to the disk path (for example `/var/data/app-data` and `/var/data/uploads`).

Without a persistent disk, uploaded files and local JSON data can be lost on redeploy/restart.

## Project Structure

- `public/index.html`
- `public/register.html`
- `public/login.html`
- `public/dashboard.html`
- `public/upload.html`
- `public/share.html`
- `public/profile.html`
- `public/css/styles.css`
- `public/js/*.js`
- `server/server.js`
- `server/data/*.json`
- `server/uploads/*`
