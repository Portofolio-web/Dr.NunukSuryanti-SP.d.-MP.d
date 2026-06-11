/**
 * Profile Management Module
 * Menggunakan murni Local Storage agar instan tanpa Supabase Auth/RLS.
 */

// Inisialisasi Supabase Client secara dinamis jika belum tersedia
async function getSupabaseClient() {
  if (window._supabase) return window._supabase;
  if (window.supabase) {
    const SUPABASE_URL = 'https://qmvqfusxnafojqophrwo.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_ZLAa1v4ArB1LZDUxp0BlNA_24Egfn4h';
    window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window._supabase;
  }
  
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      const SUPABASE_URL = 'https://qmvqfusxnafojqophrwo.supabase.co';
      const SUPABASE_ANON_KEY = 'sb_publishable_ZLAa1v4ArB1LZDUxp0BlNA_24Egfn4h';
      window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      resolve(window._supabase);
    };
    script.onerror = () => {
      console.error("Gagal memuat Supabase SDK secara dinamis.");
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

async function loadProfileData() {
  const client = await getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('admin_profile').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        localStorage.setItem("profile_name_v5", data.name || "");
        localStorage.setItem("profile_degree_v5", data.degree || "");
        localStorage.setItem("profile_bio_v5", data.bio || "");
        localStorage.setItem("profile_avatar_v5", data.avatar || "");
        localStorage.setItem("profile_email_v5", data.email || "");
        localStorage.setItem("profile_wa_v5", data.wa || "");
        localStorage.setItem("profile_fb_v5", data.fb || "");
        return data;
      }
    } catch (err) {
      console.error("Gagal memuat profil dari Supabase:", err.message);
    }
  }
  
  return {
    name: localStorage.getItem("profile_name_v5") || "Nama Pemilik Website",
    degree: localStorage.getItem("profile_degree_v5") || "Doktor Pendidikan Akuntansi",
    bio: localStorage.getItem("profile_bio_v5") || "Selamat datang di platform Website Pribadi saya",
    avatar: localStorage.getItem("profile_avatar_v5") || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400",
    email: localStorage.getItem("profile_email_v5") || "",
    wa: localStorage.getItem("profile_wa_v5") || "",
    fb: localStorage.getItem("profile_fb_v5") || ""
  };
}


function displayProfile(profileData) {
  const nameElement = document.getElementById("profileOwnerName");
  if (nameElement) nameElement.textContent = profileData.name;

  const degreeElement = document.getElementById("profileDegreeTitle");
  if (degreeElement && profileData.degree) degreeElement.textContent = profileData.degree;

  const bioElement = document.getElementById("profileBioText");
  if (bioElement) bioElement.textContent = profileData.bio;

  if (profileData.avatar) {
    const avatarElement = document.getElementById("mainProfileImg");
    if (avatarElement) avatarElement.src = profileData.avatar;
  }

  const copyrightElement = document.getElementById("copyrightText");
  if (copyrightElement) copyrightElement.textContent = `© 2026 - ${profileData.name}`;

  const brandElement = document.getElementById("brandName") || document.querySelector(".brand-logo-zone");
  if (brandElement) brandElement.textContent = profileData.name;
}

function setFooterContacts(contactData) {
  const waEl = document.getElementById("ftWA");
  const fbEl = document.getElementById("ftFB");
  const emEl = document.getElementById("ftEmail");

  if (waEl) {
    const rawWa = (contactData.wa || "").trim();
    if (!rawWa) {
      waEl.href = "#";
    } else {
      let waHref = rawWa;
      const digits = rawWa.replace(/[^\d\+]/g, "");
      if (/^\+?\d{6,}$/.test(digits)) {
        waHref = `https://wa.me/${digits.replace(/^\+/, "")}`;
      } else if (!/^https?:\/\//i.test(waHref)) {
        waHref = "https://" + waHref;
      }
      waEl.href = waHref;
      waEl.target = "_blank";
    }
  }

  if (fbEl) {
    const rawFb = (contactData.fb || "").trim();
    if (!rawFb) {
      fbEl.href = "#";
    } else {
      let fbHref = rawFb;
      if (!/^https?:\/\//i.test(fbHref)) {
        fbHref = `https://facebook.com/${fbHref.replace(/^@/, "")}`;
      }
      fbEl.href = fbHref;
      fbEl.target = "_blank";
    }
  }

  if (emEl) {
    const rawEmail = (contactData.email || "").trim();
    if (!rawEmail) {
      emEl.href = "mailto:admin@domain.com";
    } else {
      emEl.href = `mailto:${rawEmail}`;
    }
  }
}

async function handleProfileSubmit(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const nameVal = document.getElementById("profileName")?.value?.trim() || "";
  const degreeVal = document.getElementById("profileDegree")?.value?.trim() || "";
  const bioVal = document.getElementById("profileBio")?.value?.trim() || "";
  const emailVal = document.getElementById("profileEmail")?.value?.trim() || "";
  const waVal = document.getElementById("profileWA")?.value?.trim() || "";
  const fbVal = document.getElementById("profileFB")?.value?.trim() || "";
  const avatarVal = document.getElementById("avatarPreview")?.src || localStorage.getItem("profile_avatar_v5") || "";

  localStorage.setItem("profile_name_v5", nameVal);
  localStorage.setItem("profile_degree_v5", degreeVal);
  localStorage.setItem("profile_bio_v5", bioVal);
  localStorage.setItem("profile_email_v5", emailVal);
  localStorage.setItem("profile_wa_v5", waVal);
  localStorage.setItem("profile_fb_v5", fbVal);
  if (avatarVal) {
    localStorage.setItem("profile_avatar_v5", avatarVal);
  }

  const client = await getSupabaseClient();
  if (!client) {
    console.error("Gagal update profil: Supabase client tidak tersedia");
    return;
  }

  try {
    // 2. Ambil ID pengguna yang sedang login (Pastikan Auth berjalan)
    const { data: userData, error: authError } = await client.auth.getUser();
    if (authError || !userData?.user) {
      throw new Error("Sesi login tidak ditemukan.");
    }

    const userId = userData.user.id;

    // 3. Kumpulkan data dari form HTML (sudah dideklarasikan di atas)
    const payload = {
      user_id: userId,
      name: nameVal,
      degree: degreeVal,
      bio: bioVal,
      email: emailVal,
      wa: waVal,
      fb: fbVal,
      avatar: avatarVal,
      updated_at: new Date()
    };

    // 4. Eksekusi UPDATE ke Supabase dengan filter .eq() yang ketat dan .select()
    const { data, error } = await client
      .from('admin_profile')
      .update(payload)
      .eq('user_id', userId)
      .select();

    // 5. Tangkap error dari Supabase (misal: RLS diblokir)
    if (error) {
      throw error;
    }

    // 6. Jika berhasil sampai sini, barulah munculkan popup sukses
    console.log("Data berhasil disimpan:", data);
    if (typeof window.showToast === "function") {
      window.showToast("Profil berhasil disimpan!");
    } else {
      alert("Profil berhasil diperbarui!");
    }
  } catch (error) {
    // Tangkap semua jenis kegagalan dan tampilkan dengan jelas
    console.error("GAGAL MENYIMPAN PROFIL:", error.message);
    if (typeof window.showToast === "function") {
      window.showToast("Gagal menyimpan profil: " + error.message, "error");
    } else {
      alert("Terjadi kesalahan saat menyimpan: " + error.message);
    }
  }
}

function setupProfileEventListeners() {
  const profileForm = document.getElementById("profileForm") || document.querySelector("form");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleProfileSubmit(e);
    });
  }

  const saveProfileBtn = document.getElementById("saveProfileBtn");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await handleProfileSubmit(e);
    });
  }
}

async function initializeProfile() {
  const profileData = await loadProfileData();
  displayProfile(profileData);
  setFooterContacts(profileData);
  setupProfileEventListeners();
}

document.addEventListener("DOMContentLoaded", initializeProfile);
