// ============================================================
// Firebase config – replace with values from your Firebase console
// Project Settings → General → Your apps → SDK setup and configuration
// ============================================================
window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ============================================================
// Allowlist – emails that can access the app
// office  = full access (Office + Technician toggle)
// tech    = Technician view only (no Office, no toggle)
// ============================================================
window.ALLOWLIST = {
  office: [
    // e.g. "jeff@breathe-easy.hk",
  ],
  tech: [
    // e.g. "matthew@breathe-easy.hk",
    // e.g. "tiago@breathe-easy.hk",
  ]
};
