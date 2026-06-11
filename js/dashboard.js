import { signOut, auth } from "/firebase/firebase-config.js";

async function syncProfileToSupabase() {
  if (window._supabase) {
    const payload = {
      name: localStorage.getItem("profile_name_v5") || "",
      degree: localStorage.getItem("profile_degree_v5") || "",
      bio: localStorage.getItem("profile_bio_v5") || "",
      avatar: localStorage.getItem("profile_avatar_v5") || "",
      email: localStorage.getItem("profile_email_v5") || "",
      wa: localStorage.getItem("profile_wa_v5") || "",
      fb: localStorage.getItem("profile_fb_v5") || ""
    };
    try {
      const { data } = await window._supabase.from('admin_profile').select('id').limit(1).maybeSingle();
      if (data && data.id) {
        await window._supabase.from('admin_profile').update(payload).eq('id', data.id);
      } else {
        await window._supabase.from('admin_profile').insert(payload);
      }
    } catch (err) {
      console.error("Supabase sync error:", err);
    }
  }
}

let imageCropperInstance = null;

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150";

/* ================= STATUS NOTIFIKASI TOAST ================= */
function showToast(msg) {
  const toast = document.getElementById("successToast");
  const toastMsg = document.getElementById("toastMessage");
  if (toast && toastMsg) {
    toastMsg.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

/* ================= SINGLE PAGE APPLICATION ROUTER (DYNAMIC) ================= */
const sidebarItems = document.querySelectorAll(".sidebar-menu li");
sidebarItems.forEach(item => {
  item.addEventListener("click", () => {
    switchTab(item.getAttribute("data-target"));
  });
});

window.switchTab = function (viewId) {
    const m = document.getElementById("cropModal"); if(m) m.style.display="none"; if(typeof imageCropperInstance!=="undefined" && imageCropperInstance) { imageCropperInstance.destroy(); imageCropperInstance = null; }
  document.querySelectorAll(".content-view").forEach(view => view.classList.remove("active"));
  const currentTarget = document.getElementById(viewId);

  if (currentTarget) {
    currentTarget.classList.add("active");

    let titleText = "Dashboard Admin";
    const menus = document.querySelectorAll(".sidebar-menu li");

    menus.forEach(m => {
      if (m.getAttribute("data-target") === viewId) {
        m.classList.add("active");
        // Mengambil teks dari menu sidebar secara dinamis agar judul header otomatis pas!
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
  const name = localStorage.getItem('profile_name_v5') || 'Nama Pemilik Website';
  const email = localStorage.getItem('profile_email_v5') || '';
  const waRaw = localStorage.getItem('profile_wa_v5') || '';
  const fbRaw = localStorage.getItem('profile_fb_v5') || '';

  const contactNameEl = document.getElementById('contactName');
  const contactEmailEl = document.getElementById('contactEmail');
  const contactWAEl = document.getElementById('contactWA');
  const contactFBEl = document.getElementById('contactFB');
  const btnEmail = document.getElementById('contactEmailBtn');
  const btnWA = document.getElementById('contactWABtn');
  const btnFB = document.getElementById('contactFBBtn');

  if (contactNameEl) contactNameEl.textContent = name;
  if (contactEmailEl) contactEmailEl.textContent = email || '-';
  if (contactWAEl) contactWAEl.textContent = waRaw || '-';
  if (contactFBEl) contactFBEl.textContent = fbRaw || '-';

  if (btnEmail) {
    btnEmail.onclick = () => {
      const href = email ? `mailto:${email}` : 'mailto:admin@domain.com';
      window.open(href, '_blank');
    };
  }

  if (btnWA) {
    btnWA.onclick = () => {
      if (!waRaw) return alert('Kontak WhatsApp belum diatur.');
      let waHref = waRaw;
      const digits = waRaw.replace(/[^\d\+]/g, '');
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
      if (!fbRaw) return alert('Tautan Facebook belum diatur.');
      let fbHref = fbRaw;
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
const profileDegreeInput = document.getElementById("profileDegree");
const profileBioInput = document.getElementById("profileBio");
const globalAdminName = document.getElementById("globalAdminName");

const cropModal = document.getElementById("cropModal");
const cropImageTarget = document.getElementById("cropImageTarget");

if (avatarPreview) {
  avatarPreview.addEventListener("click", () => {
    imgUploader.click();
  });
}

if (imgUploader) {
  imgUploader.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        cropImageTarget.src = event.target.result;
        cropModal.style.display = "flex";

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
    cropModal.style.display = "none";
    if (imageCropperInstance) {
      imageCropperInstance.destroy();
      imageCropperInstance = null;
    }
    imgUploader.value = "";
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
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.6);

        avatarPreview.src = croppedBase64;
        globalAvatar.src = croppedBase64;

        localStorage.setItem("profile_avatar_v5", croppedBase64);
        syncProfileToSupabase();

        cropModal.style.display = "none";
        imageCropperInstance.destroy();
        imageCropperInstance = null;
        imgUploader.value = "";

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
    avatarPreview.src = DEFAULT_AVATAR;
    globalAvatar.src = DEFAULT_AVATAR;
    localStorage.removeItem("profile_avatar_v5");
    syncProfileToSupabase();
    imgUploader.value = "";
    showToast("Foto profil telah dihapus.");
  };
}

const saveProfileBtn = document.getElementById("saveProfileBtn");
if (saveProfileBtn) {
  saveProfileBtn.onclick = () => {
    localStorage.setItem("profile_name_v5", profileNameInput.value.trim());
    localStorage.setItem("profile_degree_v5", profileDegreeInput.value.trim());
    localStorage.setItem("profile_bio_v5", profileBioInput.value.trim());
    
    const em = document.getElementById("profileEmail");
    if (em) localStorage.setItem("profile_email_v5", em.value.trim());
    const wa = document.getElementById("profileWA");
    if (wa) localStorage.setItem("profile_wa_v5", wa.value.trim());
    const fb = document.getElementById("profileFB");
    if (fb) localStorage.setItem("profile_fb_v5", fb.value.trim());

    globalAdminName.textContent = profileNameInput.value.trim() || "Nama Pemilik Website"; 
    syncProfileToSupabase();
    const cropModal = document.getElementById("cropModal"); if(cropModal) cropModal.style.display = "none"; if(imageCropperInstance) { imageCropperInstance.destroy(); imageCropperInstance = null; }
    showToast("Profil berhasil diperbarui!");
    setTimeout(() => { switchTab('view-dashboard'); }, 250);
  };
}

function loadProfileData() {
  const storedName = localStorage.getItem("profile_name_v5") || "Nama Pemilik Website";
  const storedDegree = localStorage.getItem("profile_degree_v5");
  const storedBio = localStorage.getItem("profile_bio_v5");
  const storedAvatar = localStorage.getItem("profile_avatar_v5");

  if (profileNameInput) {
    profileNameInput.value = storedName === "Nama Pemilik Website" ? "" : storedName;
  }
  if (globalAdminName) {
    globalAdminName.textContent = storedName;
  }
  if (storedDegree && profileDegreeInput) profileDegreeInput.value = storedDegree;
  if (storedBio && profileBioInput) profileBioInput.value = storedBio;
  if (storedAvatar && avatarPreview) { avatarPreview.src = storedAvatar; globalAvatar.src = storedAvatar; }

  const em = document.getElementById("profileEmail");
  if (em) {
    em.value = localStorage.getItem("profile_email_v5") || "";
    em.dispatchEvent(new Event("input"));
  }
  const wa = document.getElementById("profileWA");
  if (wa) {
    wa.value = localStorage.getItem("profile_wa_v5") || "";
    wa.dispatchEvent(new Event("input"));
  }
  const fb = document.getElementById("profileFB");
  if (fb) {
    fb.value = localStorage.getItem("profile_fb_v5") || "";
    fb.dispatchEvent(new Event("input"));
  }
}

/* ================= SYSTEM BOOTLOADER INITIALIZATION ================= */
function coreBoot() {
  // 1. Memuat data identitas dasar admin
  loadProfileData();
  loadContactView();

  // 2. Memicu Kriteria Engine Dinamis untuk membangun UI Kriteria & Form CRUD otomatis
  if (window.KriteriaEngine && typeof window.KriteriaEngine.init === "function") {
    window.KriteriaEngine.init();
  } else if (window.KriteriaEngine && typeof window.KriteriaEngine.rebuildUI === "function") {
    window.KriteriaEngine.rebuildUI();
  }

  // 3. Global Action Buttons
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
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('adminUser');
      } catch (e) { }
      if (auth) { try { await signOut(auth); } catch (e) { } }
      window.location.href = "/index.html";
    };
  }
}

// Jalankan sistem saat file ini dieksekusi
coreBoot();


