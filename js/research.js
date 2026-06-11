/**
 * Research Management Module
 * Handles research/publication entries and operations
 */

// Research database key
const RESEARCH_DB_KEY = "db_res_v5";

/**
 * Load all research entries from localStorage
 * @returns {Array} Array of research objects
 */
function loadResearchEntries() {
  const data = localStorage.getItem(RESEARCH_DB_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save research entries to localStorage
 * @param {Array} entries - Research entries array
 */
function saveResearchEntries(entries) {
  localStorage.setItem(RESEARCH_DB_KEY, JSON.stringify(entries));
}

/**
 * Create new research entry object
 * @returns {Object}
 */
function createResearchEntry() {
  return {
    id: Date.now().toString(),
    title: "",
    year: new Date().getFullYear(),
    doi: "",
    desc: "",
    photo: [],
    file: "",
    publishDate: formatDateShort(new Date())
  };
}

/**
 * Add new research entry
 * @param {Object} entry - Research entry object
 * @returns {Array} Updated entries array
 */
function addResearchEntry(entry) {
  const entries = loadResearchEntries();
  entries.unshift(entry); // Add to beginning
  saveResearchEntries(entries);
  Toast.success("Penelitian berhasil ditambahkan");
  return entries;
}

/**
 * Update research entry
 * @param {string} id - Entry ID
 * @param {Object} updates - Updated fields
 * @returns {Array} Updated entries array
 */
function updateResearchEntry(id, updates) {
  const entries = loadResearchEntries();
  const index = entries.findIndex(e => e.id === id);
  
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates };
    saveResearchEntries(entries);
    Toast.success("Penelitian berhasil diperbarui");
  }
  
  return entries;
}

/**
 * Delete research entry
 * @param {string} id - Entry ID
 * @returns {Array} Updated entries array
 */
function deleteResearchEntry(id) {
  const entries = loadResearchEntries();
  const filtered = entries.filter(e => e.id !== id);
  saveResearchEntries(filtered);
  Toast.success("Penelitian berhasil dihapus");
  return filtered;
}

/**
 * Get research entry by ID
 * @param {string} id - Entry ID
 * @returns {Object|null}
 */
function getResearchEntry(id) {
  const entries = loadResearchEntries();
  return entries.find(e => e.id === id) || null;
}

/**
 * Search research entries
 * @param {string} query - Search query
 * @returns {Array} Filtered entries
 */
function searchResearchEntries(query) {
  const entries = loadResearchEntries();
  const q = query.toLowerCase();
  
  return entries.filter(entry =>
    entry.title.toLowerCase().includes(q) ||
    entry.desc.toLowerCase().includes(q) ||
    entry.year.toString().includes(q)
  );
}

/**
 * Get research entries by year
 * @param {number} year - Year to filter
 * @returns {Array}
 */
function getResearchByYear(year) {
  const entries = loadResearchEntries();
  return entries.filter(e => e.year === year);
}

/**
 * Get all years from research entries
 * @returns {Array} Sorted years
 */
function getResearchYears() {
  const entries = loadResearchEntries();
  const years = [...new Set(entries.map(e => e.year))];
  return years.sort((a, b) => b - a);
}

/**
 * Add photo to research entry
 * @param {string} id - Entry ID
 * @param {string} photoUrl - Photo URL or base64
 * @returns {Array} Updated entries
 */
function addResearchPhoto(id, photoUrl) {
  const entries = loadResearchEntries();
  const index = entries.findIndex(e => e.id === id);
  
  if (index !== -1) {
    if (!Array.isArray(entries[index].photo)) {
      entries[index].photo = [];
    }
    entries[index].photo.push(photoUrl);
    saveResearchEntries(entries);
  }
  
  return entries;
}

/**
 * Remove photo from research entry
 * @param {string} id - Entry ID
 * @param {number} photoIndex - Index of photo to remove
 * @returns {Array} Updated entries
 */
function removeResearchPhoto(id, photoIndex) {
  const entries = loadResearchEntries();
  const index = entries.findIndex(e => e.id === id);
  
  if (index !== -1 && Array.isArray(entries[index].photo)) {
    entries[index].photo.splice(photoIndex, 1);
    saveResearchEntries(entries);
  }
  
  return entries;
}

/**
 * Reorder research entries
 * @param {Array} newOrder - Array of IDs in new order
 */
function reorderResearchEntries(newOrder) {
  const entries = loadResearchEntries();
  const reordered = [];
  
  newOrder.forEach(id => {
    const entry = entries.find(e => e.id === id);
    if (entry) reordered.push(entry);
  });
  
  saveResearchEntries(reordered);
}

/**
 * Export research data as JSON
 * @returns {string} JSON string
 */
function exportResearchData() {
  const entries = loadResearchEntries();
  return JSON.stringify(entries, null, 2);
}

/**
 * Import research data from JSON
 * @param {string} jsonData - JSON string
 * @returns {boolean} Success status
 */
function importResearchData(jsonData) {
  try {
    const entries = JSON.parse(jsonData);
    if (Array.isArray(entries)) {
      saveResearchEntries(entries);
      Toast.success("Data penelitian berhasil diimpor");
      return true;
    }
    Toast.error("Format data tidak valid");
    return false;
  } catch (error) {
    Toast.error("Gagal mengimpor data: " + error.message);
    return false;
  }
}

/**
 * Get research statistics
 * @returns {Object} Statistics object
 */
function getResearchStats() {
  const entries = loadResearchEntries();
  
  return {
    total: entries.length,
    years: getResearchYears(),
    averageYear: entries.length > 0 
      ? Math.round(entries.reduce((sum, e) => sum + e.year, 0) / entries.length)
      : 0,
    withDoi: entries.filter(e => e.doi).length,
    withPhotos: entries.filter(e => e.photo && e.photo.length > 0).length
  };
}

/**
 * Validate research entry
 * @param {Object} entry - Entry to validate
 * @returns {Array} Array of validation errors
 */
function validateResearchEntry(entry) {
  const errors = [];
  
  if (!entry.title || entry.title.trim() === "") {
    errors.push("Judul penelitian harus diisi");
  }
  
  if (!entry.year || entry.year < 1900 || entry.year > new Date().getFullYear()) {
    errors.push("Tahun tidak valid");
  }
  
  if (entry.title.length > 200) {
    errors.push("Judul terlalu panjang (max 200 karakter)");
  }
  
  if (entry.desc && entry.desc.length > 5000) {
    errors.push("Deskripsi terlalu panjang (max 5000 karakter)");
  }
  
  return errors;
}

/**
 * Duplicate research entry
 * @param {string} id - Entry ID to duplicate
 * @returns {Array} Updated entries
 */
function duplicateResearchEntry(id) {
  const entries = loadResearchEntries();
  const originalIndex = entries.findIndex(e => e.id === id);
  
  if (originalIndex !== -1) {
    const original = entries[originalIndex];
    const duplicate = {
      ...deepClone(original),
      id: Date.now().toString(),
      title: original.title + " (Copy)"
    };
    
    entries.unshift(duplicate);
    saveResearchEntries(entries);
    Toast.success("Penelitian berhasil diduplikasi");
  }
  
  return entries;
}
