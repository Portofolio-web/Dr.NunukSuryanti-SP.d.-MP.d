/**
 * Theme Management Module
 * Handles dark/light mode toggling and persistence
 */

// Initialize theme on page load
function initializeTheme() {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");

  if (!themeToggleBtn || !themeIcon) {
    console.warn("Theme toggle button or icon not found");
    return;
  }

  // Load saved theme from localStorage or default to 'light'
  const savedTheme = localStorage.getItem("site_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  // Toggle theme on button click
  themeToggleBtn.addEventListener("click", toggleTheme);
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // Update DOM and localStorage
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("site_theme", newTheme);

  // Update icon
  updateThemeIcon(newTheme);
}

/**
 * Update theme icon based on current theme
 * @param {string} theme - Current theme ('light' or 'dark')
 */
function updateThemeIcon(theme) {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (!themeToggleBtn) return;

  const isDark = theme === "dark";
  if (isDark) {
    themeToggleBtn.innerHTML = '<i class="ri-moon-line"></i>';
  } else {
    themeToggleBtn.innerHTML = '<i class="ri-sun-line"></i>';
  }
}

/**
 * Get current theme
 * @returns {string} Current theme ('light' or 'dark')
 */
function getCurrentTheme() {
  return document.documentElement.getAttribute("data-theme") || "light";
}

/**
 * Set theme to specific value
 * @param {string} theme - Theme to set ('light' or 'dark')
 */
function setTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("site_theme", theme);
    updateThemeIcon(theme);
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeTheme);
