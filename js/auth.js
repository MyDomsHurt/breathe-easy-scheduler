/* Breathe-Easy Auth – Firebase + allowlist */

let currentUser = null;
let currentRole = null; // 'office' | 'tech'

function resolveRole(email) {
  if (!email) return null;
  const e = email.toLowerCase().trim();
  const office = (window.ALLOWLIST?.office || []).map(x => x.toLowerCase().trim());
  const tech = (window.ALLOWLIST?.tech || []).map(x => x.toLowerCase().trim());
  if (office.includes(e)) return 'office';
  if (tech.includes(e)) return 'tech';
  return null; // not on allowlist
}

function showLogin() {
  document.getElementById('appRoot')?.classList.add('hidden');
  document.getElementById('loginScreen')?.classList.remove('hidden');
  document.getElementById('loginError')?.classList.add('hidden');
  document.getElementById('loginEmail')?.focus();
}

function showApp() {
  document.getElementById('loginScreen')?.classList.add('hidden');
  document.getElementById('appRoot')?.classList.remove('hidden');
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function updateUserChip() {
  const chip = document.getElementById('userChip');
  if (!chip || !currentUser) return;
  chip.textContent = currentUser.email || 'Signed in';
  chip.classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showLoginError('Enter email and password');
    return;
  }

  const role = resolveRole(email);
  if (!role) {
    showLoginError('This email is not on the allowlist. Contact the office.');
    return;
  }

  // Check Firebase is configured
  if (!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    showLoginError('Firebase is not configured yet. Add your project keys in js/firebase-config.js');
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const { getAuth, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js');
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will take over
  } catch (err) {
    console.error(err);
    let msg = 'Sign-in failed';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'Wrong email or password';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Too many attempts. Try again later.';
    } else if (err.message) {
      msg = err.message;
    }
    showLoginError(msg);
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
}

async function handleLogout() {
  try {
    const { getAuth, signOut } = await import('https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js');
    await signOut(getAuth());
  } catch (err) {
    console.error(err);
  }
  currentUser = null;
  currentRole = null;
  showLogin();
}

async function initAuth() {
  // Wire login form
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  // If Firebase not configured, show a clear message
  if (!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    showLogin();
    showLoginError('Firebase not configured. Add your keys in js/firebase-config.js, then create users in Firebase Auth and add their emails to the allowlist.');
    return;
  }

  // Init Firebase
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js');
  const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js');

  initializeApp(window.FIREBASE_CONFIG);
  const auth = getAuth();

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      currentUser = null;
      currentRole = null;
      showLogin();
      return;
    }

    const role = resolveRole(user.email);
    if (!role) {
      // Signed in but not on allowlist → force sign out
      handleLogout();
      showLoginError('This account is not authorised. Contact the office.');
      return;
    }

    currentUser = user;
    currentRole = role;
    updateUserChip();
    showApp();

    // Hand control to the scheduler
    if (typeof window.onAuthReady === 'function') {
      window.onAuthReady(role, user);
    }
  });
}

// Boot auth as soon as DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
