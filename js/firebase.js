/**
 * Firebase Integration Module
 * Handles authentication and database operations
 */

/**
 * Initialize Firebase (called from firebase-config.js)
 * Config should be loaded before this module
 */
let firebaseInitialized = false;

function initFirebase() {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK not loaded. Check firebase-config.js");
    return false;
  }
  firebaseInitialized = true;
  return true;
}

/**
 * User Authentication Functions
 */

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Firebase auth promise
 */
function signInWithEmail(email, password) {
  if (!firebaseInitialized && !initFirebase()) {
    return Promise.reject("Firebase not initialized");
  }

  return firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", userCredential.user.uid);
      return userCredential.user;
    })
    .catch((error) => {
      console.error("Auth error:", error.message);
      throw error;
    });
}

/**
 * Sign out current user
 * @returns {Promise}
 */
function signOutUser() {
  if (!firebaseInitialized && !initFirebase()) {
    return Promise.reject("Firebase not initialized");
  }

  return firebase
    .auth()
    .signOut()
    .then(() => {
      localStorage.setItem("isLoggedIn", "false");
      localStorage.removeItem("currentUser");
      return true;
    })
    .catch((error) => {
      console.error("Sign out error:", error.message);
      throw error;
    });
}

/**
 * Check if user is currently logged in
 * @returns {boolean}
 */
function isUserLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

/**
 * Get current user UID
 * @returns {string|null}
 */
function getCurrentUserUID() {
  return localStorage.getItem("currentUser");
}

/**
 * Database Operations
 */

/**
 * Save data to Firestore
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Data to save
 * @returns {Promise}
 */
function saveToFirestore(collection, docId, data) {
  if (!firebaseInitialized && !initFirebase()) {
    return Promise.reject("Firebase not initialized");
  }

  const db = firebase.firestore();
  return db
    .collection(collection)
    .doc(docId)
    .set(data, { merge: true })
    .catch((error) => {
      console.error("Firestore save error:", error);
      throw error;
    });
}

/**
 * Get data from Firestore
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise}
 */
function getFromFirestore(collection, docId) {
  if (!firebaseInitialized && !initFirebase()) {
    return Promise.reject("Firebase not initialized");
  }

  const db = firebase.firestore();
  return db
    .collection(collection)
    .doc(docId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return doc.data();
      }
      return null;
    })
    .catch((error) => {
      console.error("Firestore get error:", error);
      throw error;
    });
}

/**
 * Query data from Firestore
 * @param {string} collection - Collection name
 * @param {Array} conditions - Query conditions [field, operator, value]
 * @returns {Promise}
 */
function queryFirestore(collection, conditions = []) {
  if (!firebaseInitialized && !initFirebase()) {
    return Promise.reject("Firebase not initialized");
  }

  const db = firebase.firestore();
  let query = db.collection(collection);

  conditions.forEach((condition) => {
    query = query.where(condition[0], condition[1], condition[2]);
  });

  return query
    .get()
    .then((snapshot) => {
      const results = [];
      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    })
    .catch((error) => {
      console.error("Firestore query error:", error);
      throw error;
    });
}

/**
 * Delete document from Firestore
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise}
 */
function deleteFromFirestore(collection, docId) {
  if (!firebaseInitialized && !initFirebase()) {
    return Promise.reject("Firebase not initialized");
  }

  const db = firebase.firestore();
  return db
    .collection(collection)
    .doc(docId)
    .delete()
    .catch((error) => {
      console.error("Firestore delete error:", error);
      throw error;
    });
}

/**
 * Storage Operations (File uploads)
 */

/**
 * Upload file to Firebase Storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path
 * @returns {Promise} Download URL
 */
function uploadToStorage(file, path) {
  if (!firebaseInitialized && !initFirebase()) {
    return Promise.reject("Firebase not initialized");
  }

  const storage = firebase.storage();
  const ref = storage.ref(path);

  return ref
    .put(file)
    .then((snapshot) => snapshot.ref.getDownloadURL())
    .catch((error) => {
      console.error("Storage upload error:", error);
      throw error;
    });
}

/**
 * Delete file from Storage
 * @param {string} path - Storage path
 * @returns {Promise}
 */
function deleteFromStorage(path) {
  if (!firebaseInitialized && !initFirebase()) {
    return Promise.reject("Firebase not initialized");
  }

  const storage = firebase.storage();
  return storage
    .ref(path)
    .delete()
    .catch((error) => {
      console.error("Storage delete error:", error);
      throw error;
    });
}

/**
 * Real-time Listener
 */

/**
 * Listen to real-time updates from Firestore
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
function listenToDocument(collection, docId, callback) {
  if (!firebaseInitialized && !initFirebase()) {
    console.error("Firebase not initialized");
    return () => {};
  }

  const db = firebase.firestore();
  return db
    .collection(collection)
    .doc(docId)
    .onSnapshot(
      (doc) => {
        if (doc.exists) {
          callback({ id: doc.id, ...doc.data() });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Listener error:", error);
      }
    );
}

// Auto-initialize when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFirebase);
} else {
  initFirebase();
}
