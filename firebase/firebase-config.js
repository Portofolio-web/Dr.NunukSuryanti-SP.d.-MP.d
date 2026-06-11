/**
 * Mock Firebase Auth SDK
 * Website ini menggunakan localStorage saja.
 * File ini menyediakan mock export yang kompatibel dengan
 * Firebase modular SDK v9+ untuk mencegah request ke Firebase server.
 */

const auth = {
  currentUser: null
};

function updateCurrentUser() {
  const logged = localStorage.getItem("isLoggedIn") === "true";
  if (logged) {
    auth.currentUser = {
      uid: localStorage.getItem("currentUser") || "admin-uid",
      email: localStorage.getItem("adminUser") || "admin@gmail.com"
    };
  } else {
    auth.currentUser = null;
  }
}

function getAuth() {
  updateCurrentUser();
  return auth;
}

function onAuthStateChanged(authInstance, callback) {
  updateCurrentUser();
  callback(auth.currentUser);
  // Return unsubscribe no-op
  return () => {};
}

function signInWithEmailAndPassword(authInstance, email, password) {
  // Menggunakan config dari admin.html jika ada, atau fallback ke default
  const accounts = window.ADMIN_ACCOUNTS || [
    { username: "admin", password: "admin12345" },
    { username: "admin@gmail.com", password: "admin12345" }
  ];

  const match = accounts.find(acc => acc.username === email && acc.password === password);

  if (match) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("adminUser", email);
    localStorage.setItem("currentUser", "admin-uid");
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("adminUser", email);
    updateCurrentUser();

    return Promise.resolve({
      user: auth.currentUser
    });
  } else {
    return Promise.reject({
      code: "auth/wrong-password",
      message: "Username atau password salah"
    });
  }
}

async function signOut() {
  localStorage.setItem("isLoggedIn", "false");
  localStorage.removeItem("adminUser");
  localStorage.removeItem("currentUser");
  sessionStorage.setItem("isLoggedIn", "false");
  sessionStorage.removeItem("adminUser");
  updateCurrentUser();
  return Promise.resolve();
}

function initializeApp() {
  return {};
}

export { auth, signOut, getAuth, onAuthStateChanged, signInWithEmailAndPassword, initializeApp };
