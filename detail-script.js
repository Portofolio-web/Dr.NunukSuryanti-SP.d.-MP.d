/**
 * Detail Page Theme Toggle Script
 * Manages light/dark mode switching
 */

document.addEventListener('DOMContentLoaded', function() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  const body = document.body;
  
  // Get saved theme from localStorage, default to 'light'
  const savedTheme = localStorage.getItem('detailPageTheme') || 'light';
  
  // Apply saved theme on page load
  if (savedTheme === 'dark') {
    body.classList.add('dark');
    updateThemeIcon(true);
  } else {
    body.classList.remove('dark');
    updateThemeIcon(false);
  }
  
  /**
   * Update theme icons based on current mode
   * @param {boolean} isDark - Whether dark mode is active
   */
  function updateThemeIcon(isDark) {
    if (isDark) {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    } else {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    }
  }
  
  /**
   * Toggle theme between light and dark modes
   */
  function toggleTheme() {
    const isDark = body.classList.toggle('dark');
    
    // Save preference to localStorage
    localStorage.setItem('detailPageTheme', isDark ? 'dark' : 'light');
    
    // Update icons
    updateThemeIcon(isDark);
  }
  
  // Add click event listener to toggle button
  themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Optional: Add keyboard shortcut (Ctrl/Cmd + Shift + D)
  document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      toggleTheme();
    }
  });
});
