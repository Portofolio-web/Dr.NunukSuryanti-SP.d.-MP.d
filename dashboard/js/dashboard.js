/**
 * ============================================================
 *  Dashboard Admin v6.0 - Supabase Integrated
 *  Mengelola data Tri Dharma dengan Supabase backend
 * ============================================================
 */

let imageCropperInstance = null;

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150";
const DEFAULT_IMAGE_PLACEHOLDER = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=500";

/* ================= SUPABASE INIT ================= */
const supabase = window._supabase;
if (!supabase) {
  console.error('Supabase client tidak tersedia. Pastikan supabase-client.js sudah dimuat.');
}

/* ================= DATA MANAGEMENT ================= */
let currentUser = null;
let profileData = {};

/* ================= STATUS NOTIFIKASI TOAST ================= */
function showToast(msg) {
  const toast = document.getElementById("successToast");
  document.getElementById("toastMessage").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ================= SINGLE PAGE APPLICATION ROUTER ================= */
const sidebarItems = document.querySelectorAll(".sidebar-menu li");
sidebarItems.forEach(item => {
  item.addEventListener("click", () => {
    switchTab(item.getAttribute("data-target"));
  });
});

// SPA Tab switching
window.switchTab = function (viewId) {
  // Close crop modal if open
  const m = document.getElementById("cropModal");
  if (m) m.style.display = "none";
  
  if (typeof imageCropperInstance !== "undefined" && imageCropperInstance) {
    imageCropperInstance.destroy();
    imageCropperInstance = null;
  }

  document.querySelectorAll(".content-view").forEach(view => view.classList.remove("active"));
  const currentTarget = document.getElementById(viewId);

  if (currentTarget) {
    currentTarget.classList.add("active");

    let titleText = "Dashboard Admin";
    const menus = document.querySelectorAll(".sidebar-menu li");

    menus.forEach(m => {
      if (m.getAttribute("data-target") === viewId) {
        m.classList.add("active");
        titleText = m.textContent.trim();
      } else {
        m.classList.remove("active");
      }
    });

    // Fallback spesifik jika view tidak ada di menu utama sidebar
    if (viewId === 'view-edit-profil') titleText = "Edit Profil Penulis";
    if (viewId === 'view-dashboard') titleText = "Dashboard Admin";

    const headerTitle = document.getElementById("headerTitle");
    if (headerTitle) headerTitle.textContent = titleText;
  }
}

/* ================= CONTACT VIEW MANAGEMENT ================= */
function loadContactView() {
  const name = profileData?.name || 'Administrator';
  const email = profileData?.email || '';
  const wa = profileData?.wa || '';
  const fb = profileData?.fb || '';

  const contactNameEl = document.getElementById('contactName');
  const contactEmailEl = document.getElementById('contactEmail');
  const contactWAEl = document.getElementById('contactWA');
  const contactFBEl = document.getElementById('contactFB');
  const btnEmail = document.getElementById('contactEmailBtn');
  const btnWA = document.getElementById('contactWABtn');
  const btnFB = document.getElementById('contactFBBtn');

  if (contactNameEl) contactNameEl.textContent = name;
  if (contactEmailEl) contactEmailEl.textContent = email || '-';
  if (contactWAEl) contactWAEl.textContent = wa || '-';
  if (contactFBEl) contactFBEl.textContent = fb || '-';

  if (btnEmail) {
    btnEmail.onclick = () => {
      const href = email ? `mailto:${email}` : 'mailto:admin@domain.com';
      window.open(href, '_blank');
    };
  }

  if (btnWA) {
    btnWA.onclick = () => {
      if (!wa) return alert('Kontak WhatsApp belum diatur.');
      let waHref = wa;
      const digits = wa.replace(/[^\d\+]/g, '');
      if (/^\+?\d{6,}$/.test(digits)) {
        const num = digits.replace(/^\+/, '');
        waHref = `https://wa.me/${num}`;
      } else if (!/^https?:\/\//i.test(waHref)) {
        waHref = 'https://' + waHref;
      }
      window.open(waHref, '_blank');
    };
  }

  if (btnFB) {
    btnFB.onclick = () => {
      if (!fb) return alert('Tautan Facebook belum diatur.');
      let fbHref = fb;
      if (!/^https?:\/\//i.test(fbHref)) fbHref = `https://facebook.com/${fbHref.replace(/^@/, '')}`;
      window.open(fbHref, '_blank');
    };
  }
}

/* ================= INTERAKTIF PROFILE PHOTO CROPPER & PROFILE MANAGEMENT ================= */
const imgUploader = document.getElementById("imageUploader");
const avatarPreview = document.getElementById("avatarPreview");
const globalAvatar = document.getElementById("globalAvatar");
const profileNameInput = document.getElementById("profileName");
const profileBioInput = document.getElementById("profileBio");
const profileEmailInput = document.getElementById("profileEmail");
const profileWAInput = document.getElementById("profileWA");
const profileFBInput = document.getElementById("profileFB");
const globalAdminName = document.getElementById("globalAdminName");

const cropModal = document.getElementById("cropModal");
const cropImageTarget = document.getElementById("cropImageTarget");

if (avatarPreview) {
  avatarPreview.addEventListener("click", () => {
    if (imgUploader) imgUploader.click();
  });
}

if (imgUploader) {
  imgUploader.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        cropImageTarget.src = event.target.result;
        if (cropModal) cropModal.style.display = "flex";

        if (imageCropperInstance) {
          imageCropperInstance.destroy();
        }

        setTimeout(() => {
          imageCropperInstance = new Cropper(cropImageTarget, {
            aspectRatio: 2 / 3,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            responsive: true,
            zoomable: true,
            cropBoxMovable: false,
            cropBoxResizable: false,
            toggleDragModeOnDblclick: false
          });
        }, 50);
      };
      reader.readAsDataURL(file);
    }
  });
}

const btnCancelCrop = document.getElementById("btnCancelCrop");
if (btnCancelCrop) {
  btnCancelCrop.onclick = () => {
    if (cropModal) cropModal.style.display = "none";
    if (imageCropperInstance) {
      imageCropperInstance.destroy();
      imageCropperInstance = null;
    }
    if (imgUploader) imgUploader.value = "";
  };
}

const btnApplyCrop = document.getElementById("btnApplyCrop");
if (btnApplyCrop) {
  btnApplyCrop.onclick = () => {
    if (imageCropperInstance) {
      const canvas = imageCropperInstance.getCroppedCanvas({
        width: 400,
        height: 600,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      if (canvas) {
        const croppedBase64 = canvas.toDataURL('image/jpeg');

        if (avatarPreview) avatarPreview.src = croppedBase64;
        if (globalAvatar) globalAvatar.src = croppedBase64;

        // Store in profile data
        profileData.avatar = croppedBase64;

        if (cropModal) cropModal.style.display = "none";
        imageCropperInstance.destroy();
        imageCropperInstance = null;
        if (imgUploader) imgUploader.value = "";

        showToast("Foto profil berhasil diperbarui!");
      } else {
        alert("Gagal memproses potongan gambar. Silakan coba lagi.");
      }
    }
  };
}

const deletePhotoBtn = document.getElementById("deletePhotoBtn");
if (deletePhotoBtn) {
  deletePhotoBtn.onclick = () => {
    if (avatarPreview) avatarPreview.src = DEFAULT_AVATAR;
    if (globalAvatar) globalAvatar.src = DEFAULT_AVATAR;
    profileData.avatar = null;
    if (imgUploader) imgUploader.value = "";
    showToast("Foto profil telah dihapus.");
  };
}

const saveProfileBtn = document.getElementById("saveProfileBtn");
if (saveProfileBtn) {
  saveProfileBtn.onclick = async () => {
    // Update profile data object
    profileData.name = profileNameInput?.value?.trim() || 'Administrator';
    profileData.bio = profileBioInput?.value?.trim() || '';
    profileData.email = profileEmailInput?.value?.trim() || '';
    profileData.wa = profileWAInput?.value?.trim() || '';
    profileData.fb = profileFBInput?.value?.trim() || '';

    // Save to Supabase
    if (currentUser && supabase) {
      try {
        const { error } = await supabase
          .from('admin_profile')
          .upsert({
            user_id: currentUser.id,
            name: profileData.name,
            bio: profileData.bio,
            email: profileData.email,
            wa: profileData.wa,
            fb: profileData.fb,
            avatar: profileData.avatar,
            updated_at: new Date()
          }, { onConflict: 'user_id' });

        if (error) throw error;
        
        if (globalAdminName) globalAdminName.textContent = profileData.name;
        showToast("Profil berhasil disimpan ke Supabase!");
        
        // Close crop modal if open
        if (cropModal) cropModal.style.display = "none";
        setTimeout(() => { switchTab('view-dashboard'); }, 250);
      } catch (err) {
        console.error('Error saving profile:', err);
        showToast("Gagal menyimpan profil: " + err.message);
      }
    }
  };
}

async function loadProfileData() {
  if (!currentUser || !supabase) return;

  try {
    const { data, error } = await supabase
      .from('admin_profile')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    
    if (data) {
      profileData = data;
      
      if (profileNameInput) profileNameInput.value = data.name || '';
      if (profileBioInput) profileBioInput.value = data.bio || '';
      if (profileEmailInput) profileEmailInput.value = data.email || '';
      if (profileWAInput) profileWAInput.value = data.wa || '';
      if (profileFBInput) profileFBInput.value = data.fb || '';
      if (globalAdminName) globalAdminName.textContent = data.name || 'Administrator';
      
      if (data.avatar && avatarPreview) {
        avatarPreview.src = data.avatar;
        if (globalAvatar) globalAvatar.src = data.avatar;
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

/* ================= SYSTEM BOOTLOADER INITIALIZATION ================= */
function coreBoot() {
  switchTab('view-dashboard');
  loadProfileData();
  loadContactView();

  // Initialize Kriteria Engine for Tri Dharma data management
  if (window.KriteriaEngine) {
    window.KriteriaEngine.init ? window.KriteriaEngine.init() : window.KriteriaEngine.rebuildUI();
  }

  const globalPublishBtn = document.getElementById("globalPublishBtn");
  if (globalPublishBtn) {
    globalPublishBtn.onclick = () => {
      showToast("Sukses! Seluruh data Tri Dharma dan Identitas Penulis Terbit Secara Live 🚀");
    };
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error('Logout error:', err);
      }
      window.location.href = "/index.html";
    };
  }
}

// Jalankan inisialisasi system
coreBoot();


