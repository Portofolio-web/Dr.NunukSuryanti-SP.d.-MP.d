/**
 * Admin Login Page Module
 * Handles authentication and admin panel access
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("adminLoginForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");
  const loginBtn = document.getElementById("adminLoginBtn");
  const errorMsg = document.getElementById("loginErrorMsg");

  if (!loginForm) {
    console.warn("Admin login form not found");
    return;
  }

  // Check if already logged in
  if (localStorage.getItem("isLoggedIn") === "true") {
    window.location.href = "admin/";
  }

  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleAdminLogin();
    });
  }

  /**
   * Handle admin login
   */
  function handleAdminLogin() {
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value?.trim();

    // Validation
    if (!email || !password) {
      showError("Email dan password harus diisi");
      return;
    }

    if (!isValidEmail(email)) {
      showError("Format email tidak valid");
      return;
    }

    // Disable button during login
    if (loginBtn) loginBtn.disabled = true;
    if (loginBtn) loginBtn.textContent = "Sedang login...";

    // Call Firebase auth
    signInWithEmail(email, password)
      .then((user) => {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", user.uid);
        clearError();
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "admin/";
        }, 500);
      })
      .catch((error) => {
        showError(getErrorMessage(error.code));
        if (loginBtn) loginBtn.disabled = false;
        if (loginBtn) loginBtn.textContent = "Masuk";
      });
  }

  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Show error message
   * @param {string} message
   */
  function showError(message) {
    if (errorMsg) {
      errorMsg.textContent = message;
      errorMsg.style.display = "block";
    }
  }

  /**
   * Clear error message
   */
  function clearError() {
    if (errorMsg) {
      errorMsg.textContent = "";
      errorMsg.style.display = "none";
    }
  }

  /**
   * Get user-friendly error message from Firebase error code
   * @param {string} errorCode
   * @returns {string}
   */
  function getErrorMessage(errorCode) {
    const errorMessages = {
      "auth/user-not-found": "Email tidak terdaftar",
      "auth/wrong-password": "Password salah",
      "auth/invalid-email": "Format email tidak valid",
      "auth/user-disabled": "Akun telah dinonaktifkan",
      "auth/too-many-requests": "Terlalu banyak percobaan login. Coba lagi nanti.",
      "auth/network-request-failed": "Koneksi internet bermasalah",
      default: "Gagal login. Coba lagi."
    };

    return errorMessages[errorCode] || errorMessages.default;
  }

  // Clear password on page load
  if (passwordInput) passwordInput.value = "";
});

/**
 * Logout function (called from dashboard)
 */
function logoutAdmin() {
  signOutUser()
    .then(() => {
      localStorage.setItem("isLoggedIn", "false");
      localStorage.removeItem("currentUser");
      window.location.href = "admin.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      alert("Gagal logout");
    });
}

/**
 * Check admin authentication
 * Redirect to login if not authenticated
 */
function requireAdminAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  if (!isLoggedIn) {
    window.location.href = "admin.html";
    return false;
  }
  
  return true;
}


