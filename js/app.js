/**
 * Application Utilities & Helpers
 * Common functions for the entire application
 */

/**
 * Toast Notification System
 */
const Toast = {
  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type: 'success', 'error', 'info', 'warning'
   * @param {number} duration - Duration in ms (default: 3000)
   */
  show(message, type = "info", duration = 3000) {
    let container = document.getElementById("toastContainer");
    
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${getToastColor(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 400px;
      word-wrap: break-word;
    `;
    
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(message, duration) {
    this.show(message, "success", duration || 3000);
  },

  error(message, duration) {
    this.show(message, "error", duration || 3000);
  },

  info(message, duration) {
    this.show(message, "info", duration || 3000);
  },

  warning(message, duration) {
    this.show(message, "warning", duration || 3000);
  }
};

/**
 * Get toast color based on type
 */
function getToastColor(type) {
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b"
  };
  return colors[type] || colors.info;
}

/**
 * Add toast animations to stylesheet
 */
(function addToastStyles() {
  if (document.getElementById("toastStyles")) return;
  
  const style = document.createElement("style");
  style.id = "toastStyles";
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
})();

/**
 * Utility Functions
 */

/**
 * Format date to Indonesian format
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return "-";
  
  const d = new Date(date);
  const options = { 
    year: "numeric", 
    month: "long", 
    day: "numeric",
    locale: "id-ID"
  };
  
  return d.toLocaleDateString("id-ID", options);
}

/**
 * Format date to short format (DD/MM/YYYY)
 * @param {Date|string} date
 * @returns {string}
 */
function formatDateShort(date) {
  if (!date) return "-";
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Convert File to Base64
 * @param {File} file
 * @returns {Promise}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Truncate text to maximum length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncateText(text, maxLength = 50) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Confirm dialog
 * @param {string} message
 * @returns {Promise}
 */
function confirm(message) {
  return new Promise((resolve) => {
    if (window.confirm(message)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

/**
 * Deep clone object
 * @param {Object} obj
 * @returns {Object}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get URL parameters
 * @returns {Object}
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (let [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Check if object is empty
 * @param {Object} obj
 * @returns {boolean}
 */
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Merge objects
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
function mergeObjects(target, source) {
  return { ...target, ...source };
}

/**
 * Validate required fields in object
 * @param {Object} obj
 * @param {Array} requiredFields
 * @returns {Array} Array of missing fields
 */
function validateRequired(obj, requiredFields) {
  return requiredFields.filter(field => !obj[field]);
}

/**
 * Automatically check and wrap document links in DOM
 */
function wrapUrlInGoogleDocsViewer(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  
  const cleanUrl = trimmed.split('?')[0].toLowerCase();
  const docExtensions = ['.pdf', '.docx', '.doc', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
  const isDoc = docExtensions.some(ext => cleanUrl.endsWith(ext));
  
  if (isDoc) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

function wrapAllDocumentLinksInDOM() {
  const elements = document.querySelectorAll('a[href]:not([data-viewer-processed])');
  elements.forEach(el => {
    el.setAttribute('data-viewer-processed', 'true');
    let href = el.getAttribute('href');
    if (!href) return;
    
    if (href.startsWith('https://docs.google.com/viewer?url=') ||
        href.startsWith('data:') ||
        href.startsWith('#') ||
        href.startsWith('javascript:')) {
      return;
    }
    
    const cleanUrl = href.split('?')[0].toLowerCase();
    const docExtensions = ['.pdf', '.docx', '.doc', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
    const isDoc = docExtensions.some(ext => cleanUrl.endsWith(ext));
    
    if (isDoc) {
      el.setAttribute('href', `https://docs.google.com/viewer?url=${encodeURIComponent(href.trim())}`);
      el.setAttribute('target', '_blank');
      if (!el.getAttribute('rel')) {
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });
}

// Check every second to catch dynamically rendered elements
setInterval(wrapAllDocumentLinksInDOM, 1000);
document.addEventListener('DOMContentLoaded', wrapAllDocumentLinksInDOM);
