/**
 * ============================================================
 *  KRITERIA ENGINE v1.0
 *  Sistem manajemen kriteria dinamis untuk Dashboard Admin
 *  dan Halaman Publik website Tri Dharma.
 * ============================================================
 *
 *  Kriteria adalah kategori konten (Pendidikan, Penelitian,
 *  Pengabdian, atau kategori custom yang admin tambahkan).
 *
 *  Config disimpan di localStorage["db_kriteria_config_v1"].
 *  Data tiap kriteria disimpan di localStorage["db_custom_{id}_v1"].
 *  Data builtIn tetap pakai key lama (db_edu_v5, db_res_v5, db_srv_v5).
 */

// ─────────────────────────────────────────────────────────────
//  KONSTANTA
// ─────────────────────────────────────────────────────────────
const KE_CONFIG_KEY = "db_kriteria_config_v1";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=500";
const STORAGE_BUCKET = "Sitedata";

/**
 * Daftar field yang tersedia untuk kriteria custom.
 * Setiap field memiliki: id, label, type, dan placeholder.
 */
const AVAILABLE_FIELDS = [
  { id: "photo", label: "Upload Photo", type: "file-multi-image", placeholder: "" },
  { id: "file", label: "Upload File", type: "file-single-doc", placeholder: "" },
  { id: "link", label: "Link URL", type: "url", placeholder: "https://..." },
  { id: "doi", label: "Nomor DOI", type: "text", placeholder: "https://doi.org/10.xxx/..." },
  { id: "year", label: "Tahun", type: "number", placeholder: "2026" },
  { id: "mitra", label: "Lokasi", type: "text", placeholder: "Nama lokasi atau mitra terkait" },
  { id: "course", label: "Mata Kuliah", type: "text", placeholder: "Contoh: Kecerdasan Buatan" },
  { id: "teacher", label: "Pelaksana", type: "text", placeholder: "Contoh: Dr. Ahmad, M.Kom." },
  { id: "desc", label: "Deskripsi", type: "textarea", placeholder: "Tuliskan deskripsi atau abstrak..." },
];

/**
 * Config default — 3 kriteria builtIn.
 * builtIn = tidak bisa dihapus admin.
 * storageKey = key localStorage untuk data.
 */
const DEFAULT_CONFIG = [
  {
    id: "edu",
    label: "Pendidikan",
    icon: "ri-book-open-line",
    desc: "Materi kelas, foto dokumentasi & file.",
    fields: ["photo", "file", "course", "teacher", "desc"],
    builtIn: true,
    storageKey: "db_edu_v5"
  },
  {
    id: "res",
    label: "Penelitian",
    icon: "ri-flask-line",
    desc: "Riwayat jurnal & publikasi ilmiah.",
    fields: ["photo", "link", "doi", "year", "course", "teacher", "desc"],
    builtIn: true,
    storageKey: "db_res_v5"
  },
  {
    id: "srv",
    label: "Pengabdian",
    icon: "ri-building-4-line",
    desc: "Dokumentasi program & lokasi mitra.",
    fields: ["photo", "mitra", "course", "teacher", "desc"],
    builtIn: true,
    storageKey: "db_srv_v5"
  }
];


// ─────────────────────────────────────────────────────────────
//  SUPABASE UTILITIES & LOADING STATE
// ─────────────────────────────────────────────────────────────

function toggleLoading(show, text = "Memuat...") {
  const overlay = document.getElementById('globalLoadingOverlay');
  const textEl = document.getElementById('globalLoadingText');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
  if (textEl) {
    textEl.textContent = text;
  }
}

async function uploadToSupabaseStorage(file, kriteriaId) {
  if (!file) return null;

  // ── Validasi Supabase client
  if (!window._supabase) {
    const msg = 'Supabase client belum siap. Coba muat ulang halaman.';
    console.error('[Upload]', msg);
    if (typeof window.showToast === 'function') window.showToast(msg, 'error');
    throw new Error(msg);
  }

  // ── Validasi ukuran file (max 50 MB)
  const MAX_MB = 50;
  if (file.size > MAX_MB * 1024 * 1024) {
    const msg = `File "${file.name}" terlalu besar (maks ${MAX_MB}MB).`;
    if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    throw new Error(msg);
  }

  const fileExt  = file.name.split('.').pop().toLowerCase();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${kriteriaId}_${Date.now()}_${Math.random().toString(36).substring(7)}_${safeName}`;
  const filePath = `${kriteriaId}/${fileName}`;

  console.log(`[Upload] Mulai upload ke bucket "${STORAGE_BUCKET}" → ${filePath}`);

  const { data, error } = await window._supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    let msg = `Gagal upload "${file.name}"`;
    // Pesan error yang lebih spesifik
    if (error.message && error.message.includes('Bucket not found')) {
      msg = `Storage bucket "${STORAGE_BUCKET}" tidak ditemukan. Pastikan nama bucket di Supabase sudah benar.`;
    } else if (error.message && error.message.includes('row-level security')) {
      msg = 'Upload ditolak. Pastikan RLS Policy storage Supabase sudah diizinkan untuk INSERT.';
    } else if (error.message && error.message.includes('Unauthorized') || error.statusCode === 401) {
      msg = 'Tidak terotorisasi. Pastikan Anda sudah login dan anon key benar.';
    } else if (error.message) {
      msg = `Upload gagal: ${error.message}`;
    }
    console.error('[Upload] Error:', error);
    if (typeof window.showToast === 'function') window.showToast(msg, 'error');
    throw new Error(msg);
  }

  console.log('[Upload] Berhasil:', data);

  const { data: publicUrlData } = window._supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  const url = publicUrlData?.publicUrl || null;
  console.log('[Upload] Public URL:', url);
  return url;
}

function mapDbRowToItem(row) {
  const item = {
    id: row.id,
    title: row.title || "",
    desc: row.desc || "",
    link: row.link || "",
    doi: row.doi || "",
    year: row.year || "",
    mitra: row.mitra || "",
    course: row.course || "",
    teacher: row.teacher || "",
    publishDate: new Date(row.created_at).toLocaleDateString("id-ID", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    }),
    timestamp: new Date(row.created_at).getTime()
  };

  const medias = row.content_media || [];
  const images = medias.filter(m => m.file_type === 'image').map(m => m.file_url);
  const docs = medias.filter(m => m.file_type === 'document').map(m => m.file_url);

  item.photo = images.length > 0 ? images : [DEFAULT_IMAGE];
  item.file = docs.length > 0 ? docs[0] : "";

  return item;
}

let __memoryConfig = null;

// ─────────────────────────────────────────────────────────────
//  CONFIG MANAGEMENT
// ─────────────────────────────────────────────────────────────


/** Baca config kriteria dari Supabase */
async function getKriteriaConfig() {
  if (__memoryConfig) return __memoryConfig;
  const { data, error } = await window._supabase.from('kriteria_config').select('*');
  if (error || !data || data.length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
  const mapped = data.map(r => ({
    id: r.id,
    label: r.label,
    icon: r.icon,
    fields: r.fields || [],
    builtIn: r.built_in,
    desc: `Konten kategori ${r.label}.`,
    storageKey: `db_custom_${r.id}_v1`
  }));
  
  const res = mapped.find(c => c.id === "res");
  if (res && !res.fields.includes("photo")) {
    res.fields.unshift("photo");
    await saveKriteriaConfig(mapped);
  }
  __memoryConfig = mapped;
  return mapped;
}

/** Simpan config kriteria ke Supabase */
async function saveKriteriaConfig(config) {
  for (const c of config) {
    const { data: existing } = await window._supabase.from('kriteria_config').select('id').eq('id', c.id).single();
    if (existing) {
      await window._supabase.from('kriteria_config').update({
        label: c.label,
        icon: c.icon,
        fields: c.fields,
        built_in: c.builtIn
      }).eq('id', c.id);
    } else {
      await window._supabase.from('kriteria_config').insert({
        id: c.id,
        label: c.label,
        icon: c.icon,
        fields: c.fields,
        built_in: c.builtIn
      });
    }
  }
  __memoryConfig = null; // reset cache
}

async function initKriteriaConfig() {
  toggleLoading(true, "Inisialisasi sistem...");
  const { data, error } = await window._supabase.from('kriteria_config').select('*');
  if (error || !data || data.length === 0) {
    await saveKriteriaConfig(DEFAULT_CONFIG);
  }
  toggleLoading(false);
}

// ─────────────────────────────────────────────────────────────
//  DATABASE PER KRITERIA
// ─────────────────────────────────────────────────────────────


/** Ambil data array untuk suatu kriteria (Async) */
async function getDb(kriteriaId) {
  const { data, error } = await window._supabase.from('kriteria_contents')
    .select('*, content_media(*)')
    .eq('kriteria_id', kriteriaId)
    .order('created_at', { ascending: false });
    
  if (error || !data) return [];
  return data.map(r => mapDbRowToItem(r));
}

/** Simpan DB (deprecated untuk operasi array, kita gunakan Supabase saveItem row-based, tapi dipertahankan kompatibilitas) */
async function saveDb(kriteriaId, data) {
  // Operasi row-based handled in saveItem directly.
  return true;
}


// ─────────────────────────────────────────────────────────────
//  TAMBAH / HAPUS KRITERIA
// ─────────────────────────────────────────────────────────────

/**
 * Tambah kriteria baru.
 * @param {string} label - Nama kriteria (mis. "Seminar")
 * @param {string[]} fields - Array field id yang dipilih
 * @returns {object} config yang baru dibuat, atau null jika gagal
 */
async function addKriteria(label, fields) {
  if (!label || !label.trim()) return null;
  const config = await getKriteriaConfig();

  // Buat id unik dari label (lowercase, alfanumerik saja)
  let baseId = label.trim().toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
  let id = baseId;
  let counter = 2;
  while (config.find(c => c.id === id)) {
    id = baseId + "_" + counter++;
  }

  const newKriteria = {
    id,
    label: label.trim(),
    icon: "ri-folder-line",
    desc: `Konten kategori ${label.trim()}.`,
    fields: fields && fields.length ? fields : ["photo", "desc"],
    builtIn: false,
    storageKey: `db_custom_${id}_v1`
  };

  config.push(newKriteria);
  await saveKriteriaConfig(config);
  return newKriteria;
}

/**
 * Hapus kriteria (hanya non-builtIn).
 * @param {string} kriteriaId
 * @returns {boolean} berhasil atau tidak
 */
async function removeKriteria(kriteriaId) {
  const config = await getKriteriaConfig();
  const idx = config.findIndex(c => c.id === kriteriaId);
  if (idx === -1) return false;

  // Hapus dari Supabase db
  try {
    const { error } = await window._supabase.from('kriteria_config').delete().eq('id', kriteriaId);
    if (error) throw error;
  } catch (err) {
    console.error("Gagal menghapus kriteria dari Supabase:", err);
    if (typeof window.showToast === "function") {
      window.showToast("Gagal menghapus kriteria di Supabase: " + err.message, "error");
    }
    return false;
  }

  config.splice(idx, 1);
  __memoryConfig = config; // update memory cache
  return true;
}

// State edit kriteria
let editingKriteriaId = null;

async function setEditing(kriteriaId) {
  editingKriteriaId = kriteriaId;
  await renderKelolaKriteriaView();
  const modal = document.getElementById("kriteriaFormModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
  }
}

async function showAddKriteriaModal() {
  editingKriteriaId = null;
  await renderKelolaKriteriaView();
  const modal = document.getElementById("kriteriaFormModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
  }
}

async function closeKriteriaModal() {
  const modal = document.getElementById("kriteriaFormModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
  editingKriteriaId = null;
  await renderKelolaKriteriaView();
}

// State edit item draf kriteria (untuk pengisian form CRUD kriteria)
const _editState = {};

// Restore edit state from localStorage on script load
try {
  const savedEditKId = localStorage.getItem("ke_edit_kriteria_id");
  const savedEditIdx = localStorage.getItem("ke_edit_item_index");
  if (savedEditKId && savedEditIdx !== null) {
    _editState[savedEditKId] = parseInt(savedEditIdx, 10);
  }
} catch (e) {}

async function applyActiveEditPrefills() {
  const config = await getKriteriaConfig();
  for (const k of config) {
    const editIndex = _editState[k.id];
    if (editIndex !== undefined && editIndex !== null) {
      const db = await getDb(k.id);
      const item = db[editIndex];
      if (item) {
        const titleInput = document.getElementById(`f-${k.id}-title`);
        if (titleInput) titleInput.value = item.title || "";

        (k.fields || []).forEach(fid => {
          const inputId = `f-${k.id}-${fid}`;
          const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fid);
          if (!fieldDef) return;
          if (fieldDef.type === "file-multi-image" || fieldDef.type === "file-single-doc") return;
          const el = document.getElementById(inputId);
          if (el) el.value = item[fid] || "";
        });
      }
    }
  }
}

async function cancelEditItem(kriteriaId) {
  delete _editState[kriteriaId];
  try {
    localStorage.removeItem("ke_edit_kriteria_id");
    localStorage.removeItem("ke_edit_item_index");
  } catch (e) {}

  await rebuildDashboardUI();

  if (typeof window.switchTab === "function") {
    window.switchTab("view-draf-konten");
  }
}

/**
 * Edit kriteria yang sudah ada (bawaan maupun kustom).
 * @param {string} kriteriaId
 * @param {string} newLabel
 * @param {string[]} newFields
 * @returns {boolean} berhasil atau tidak
 */
async function editKriteria(kriteriaId, newLabel, newFields) {
  if (!newLabel || !newLabel.trim()) return false;
  const config = await getKriteriaConfig();
  const k = config.find(c => c.id === kriteriaId);
  if (!k) return false;

  k.label = newLabel.trim();
  k.fields = newFields && newFields.length ? newFields : ["photo", "desc"];
  
  await saveKriteriaConfig(config);
  return true;
}


// ─────────────────────────────────────────────────────────────
//  UTILITY: FILE READER
// ─────────────────────────────────────────────────────────────

function getBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      return;
    }
    
    // Compress image to prevent QuotaExceededError
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1024;
        
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = e.target.result;
    };
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD: RENDER SIDEBAR
// ─────────────────────────────────────────────────────────────

/**
 * Generate sidebar menu item HTML dari config kriteria.
 * Dipanggil saat dashboard boot dan setelah config berubah.
 */
async function renderDashboardSidebar() {
  const menu = document.querySelector(".sidebar-menu");
  if (!menu) return;

  const config = await getKriteriaConfig();

  // Hapus semua item kecuali Dashboard & Edit Profil (index 0 & 1)
  // Kita rebuild total (kecuali item static yang sudah ada)
  menu.innerHTML = `
    <li class="active" data-target="view-dashboard"><a><i class="ri-dashboard-line"></i> <span>Dashboard</span></a></li>
    <li data-target="view-edit-profil"><a><i class="ri-user-settings-line"></i> <span>Edit Profil</span></a></li>
    <li data-target="view-draf-konten"><a><i class="ri-file-list-3-line"></i> <span>Draf Konten</span></a></li>
  `;

  config.forEach(k => {
    const li = document.createElement("li");
    li.setAttribute("data-target", `view-kriteria-${k.id}`);
    li.innerHTML = `<a><i class="${k.icon}"></i> <span>${k.label}</span></a>`;
    menu.appendChild(li);
  });

  // Kelola Kriteria — selalu di bawah
  const liKelola = document.createElement("li");
  liKelola.setAttribute("data-target", "view-kelola-kriteria");
  liKelola.innerHTML = `<a><i class="ri-settings-3-line"></i> <span>Kelola Kriteria</span></a>`;
  menu.appendChild(liKelola);

  // Re-attach event listeners setelah rebuild
  attachSidebarEvents();
}

function attachSidebarEvents() {
  const items = document.querySelectorAll(".sidebar-menu li");
  items.forEach(item => {
    item.addEventListener("click", () => {
      if (typeof window.switchTab === "function") {
        window.switchTab(item.getAttribute("data-target"));
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD: RENDER STATS GRID (Card Overview)
// ─────────────────────────────────────────────────────────────

async function renderDashboardStatsGrid() {
  const grid = document.getElementById("dashboardStatsGrid");
  if (!grid) return;
  const config = await getKriteriaConfig();
  let html = "";
  for (const k of config) {
    const db = await getDb(k.id);
    html += `
      <div class="card-stat" onclick="switchTab('view-kriteria-${k.id}')">
        <i class="${k.icon}"></i>
        <div class="stat-number" style="font-size: 28px; font-weight: 700; color: var(--ios-text); margin: 4px 0;">${db.length}</div>
        <h3>${k.label}</h3>
        <p>${k.desc}</p>
      </div>
    `;
  }
  // Profil selalu ada
  html += `
    <div class="card-stat" onclick="switchTab('view-edit-profil')">
      <i class="ri-user-line"></i>
      <div class="stat-number" style="font-size: 28px; font-weight: 700; color: var(--ios-text); margin: 4px 0;">&mdash;</div>
      <h3>Profil Penulis</h3>
      <p>Ubah biografi & latar belakang.</p>
    </div>
  `;
  grid.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD: RENDER FORM VIEWS
// ─────────────────────────────────────────────────────────────

/**
 * Generate satu view-kriteria-{id} berisi form input + preview card.
 * Dipanggil saat boot dan setelah config berubah.
 */
async function renderDashboardForms() {
  const main = document.getElementById("dynamicFormsContainer");
  if (!main) return;
  const config = await getKriteriaConfig();
  main.innerHTML = "";

  config.forEach(k => {
    const div = document.createElement("div");
    div.id = `view-kriteria-${k.id}`;
    div.className = "content-view";

    const isEditing = _editState[k.id] !== undefined;
    const formTitle = isEditing ? `Edit Konten ${k.label}` : `Input ${k.label}`;
    const submitText = isEditing ? `Simpan Perubahan` : `Simpan ke Draf Konten`;
    const submitIcon = isEditing ? `ri-save-line` : `ri-save-3-line`;

    const cancelBtnHtml = isEditing
      ? `<button type="button" class="btn-danger" onclick="window.KriteriaEngine.cancelEditItem('${k.id}')" style="background:#e2e8f0; color:#475569; border:none; padding:12px 24px; border-radius:12px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:0.2s; margin-left:10px;">Batal</button>`
      : ``;

    div.innerHTML = `
      <div class="form-container">
        <h4 style="margin-bottom:20px; color:#2563eb;">
          <i class="${k.icon}"></i> ${formTitle}
        </h4>
        <form id="form-${k.id}" onsubmit="return false;">
          ${buildFormFields(k)}
          <div style="display:flex; align-items:center;">
            <button type="button" id="saveBtn-${k.id}" class="btn-submit">
              <i class="${submitIcon}"></i> ${submitText}
            </button>
            ${cancelBtnHtml}
          </div>
        </form>
      </div>
    `;

    main.appendChild(div);
  });
}

/** Build HTML field-field dari definisi kriteria */
function buildFormFields(k) {
  let html = `
    <div class="form-group">
      <label>Judul / Nama ${k.label}</label>
      <input type="text" id="f-${k.id}-title" placeholder="Masukkan judul ${k.label.toLowerCase()}..." required />
    </div>
  `;

  const fields = k.fields || [];
  const fieldMap = {};
  AVAILABLE_FIELDS.forEach(f => { fieldMap[f.id] = f; });

  // Group fields: foto dan file di grid 2 kolom
  const photoAndFile = fields.filter(f => f === "photo" || f === "file");
  const rest = fields.filter(f => f !== "photo" && f !== "file");

  if (photoAndFile.length === 2) {
    html += `<div class="form-grid">`;
    photoAndFile.forEach(fid => { html += buildSingleFieldHtml(k.id, fieldMap[fid]); });
    html += `</div>`;
  } else {
    photoAndFile.forEach(fid => { html += buildSingleFieldHtml(k.id, fieldMap[fid]); });
  }

  // link + doi, course + teacher → grid 2 kolom
  const pairs = [["link", "doi"], ["course", "teacher"], ["year", "mitra"]];
  const usedInPair = new Set();

  pairs.forEach(([a, b]) => {
    const hasA = rest.includes(a);
    const hasB = rest.includes(b);
    if (hasA && hasB) {
      usedInPair.add(a); usedInPair.add(b);
      html += `<div class="form-grid">`;
      html += buildSingleFieldHtml(k.id, fieldMap[a]);
      html += buildSingleFieldHtml(k.id, fieldMap[b]);
      html += `</div>`;
    }
  });

  rest.forEach(fid => {
    if (!usedInPair.has(fid)) {
      html += buildSingleFieldHtml(k.id, fieldMap[fid]);
    }
  });

  return html;
}

function buildSingleFieldHtml(kriteriaId, fieldDef) {
  if (!fieldDef) return "";
  const fid = fieldDef.id;
  const inputId = `f-${kriteriaId}-${fid}`;

  let inner = "";

  if (fieldDef.type === "file-multi-image") {
    inner = `
      <div class="text-upload-container">
        <label for="${inputId}" class="btn-submit"><i class="ri-image-add-line"></i> Upload Photo</label>
        <input type="file" id="${inputId}" accept="image/*" multiple style="display:none;" />
        <div id="lbl-${inputId}" class="upload-status-filename"></div>
      </div>
    `;
  } else if (fieldDef.type === "file-single-doc") {
    inner = `
      <div class="text-upload-container">
        <label for="${inputId}" class="btn-submit"><i class="ri-file-upload-line"></i> Upload File</label>
        <input type="file" id="${inputId}" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip" style="display:none;" />
        <div id="lbl-${inputId}" class="upload-status-filename"></div>
      </div>
    `;
  } else if (fieldDef.type === "textarea") {
    inner = `<textarea id="${inputId}" rows="4" placeholder="${fieldDef.placeholder}"></textarea>`;
  } else if (fieldDef.type === "number") {
    inner = `<input type="number" id="${inputId}" placeholder="${fieldDef.placeholder}" />`;
  } else {
    inner = `<input type="text" id="${inputId}" placeholder="${fieldDef.placeholder}" />`;
  }

  return `
    <div class="form-group">
      <label>${fieldDef.label}</label>
      ${inner}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD: PREVIEW CARDS
// ─────────────────────────────────────────────────────────────

async function renderPreviewForKriteria(kriteriaId) {
  const config = await getKriteriaConfig();
  const k = config.find(c => c.id === kriteriaId);
  if (!k) return;
  const container = document.getElementById(`preview-${kriteriaId}`);
  if (!container) return;

  const db = await getDb(kriteriaId);
  if (db.length === 0) {
    container.innerHTML = `<p style="color:#94a3b8; font-size:13px; padding:10px;">Belum ada konten untuk kategori ${k.label}.</p>`;
    return;
  }

  container.innerHTML = "";
  db.forEach((item, index) => {
    const isArray = Array.isArray(item.photo);
    const thumbSrc = isArray ? item.photo[0] : (item.photo || DEFAULT_IMAGE);
    const hasPhoto = item.photo && item.photo !== DEFAULT_IMAGE;

    let photoHtml = '';
    if (hasPhoto) {
      if (isArray && item.photo.length > 1) {
        const pCount = item.photo.length;
        const rows = pCount > 2 ? 2 : 1;
        let thumbsHtml = item.photo.slice(0, 4).map(src => `<img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`).join('');
        photoHtml = `<div class="web-img-wrapper" style="display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(${rows}, 1fr); gap: 4px; padding: 4px; background: #f1f5f9; aspect-ratio: 16/9; max-height: 220px; box-sizing: border-box;">${thumbsHtml}</div>`;
      } else {
        photoHtml = `<div class="web-img-wrapper"><img src="${thumbSrc}" alt="${item.title}" /></div>`;
      }
    }

    let extras = "";
    if (item.link) extras += `<p style="font-size:12px;color:#475569;margin-bottom:4px;"><b>Link:</b> <a href="${item.link}" target="_blank" class="preview-active-link">${item.link}</a></p>`;
    if (item.doi) extras += `<p style="font-size:12px;color:#475569;margin-bottom:4px;"><b>DOI:</b> ${item.doi}</p>`;
    if (item.year) extras += `<p style="font-size:12px;color:#475569;margin-bottom:4px;"><b>Tahun:</b> ${item.year}</p>`;
    if (item.mitra) extras += `<p style="font-size:12px;color:#1e3a8a;font-weight:bold;margin-bottom:8px;"><i class="ri-map-pin-2-line"></i> ${item.mitra}</p>`;

    container.innerHTML += `
      <div class="public-web-card">
        ${photoHtml}
        <div class="web-content" style="${!hasPhoto ? 'padding-top:20px;' : ''}">
          <div>
            <div class="web-meta">
              <span><i class="ri-time-line"></i> ${item.publishDate || ''}</span>
              <span style="color:#2563eb;"><i class="${k.icon}"></i> ${k.label}</span>
            </div>
            <h3>${item.title}</h3>
            ${extras}
            <p class="web-desc">${item.desc || ''}</p>
          </div>
          ${item.file ? `
            <button class="btn-access-file" onclick="openBase64File(${index}, '${kriteriaId}')">
              <i class="ri-external-link-line"></i> Buka / Lihat File Lampiran
            </button>` : ''}
        </div>
        <div class="card-admin-actions">
          <button class="btn-edit-item" onclick="editItem('${kriteriaId}', ${index})"><i class="ri-edit-line"></i> Edit</button>
          <button class="btn-delete-item" onclick="deleteItem('${kriteriaId}', ${index})"><i class="ri-delete-bin-line"></i> Hapus</button>
        </div>
      </div>
    `;
  });
}

async function renderAllPreviews() {
  const config = await getKriteriaConfig();
  for(const k of config) { await renderPreviewForKriteria(k.id); }
  await renderDashboardAllPreview();
  await renderDrafKontenTable();
}

/** Dashboard utama: gabungan semua preview */
async function renderDashboardAllPreview() {
  const containers = document.querySelectorAll(".dashboard-review-container");
  if (!containers.length) return;
  const config = await getKriteriaConfig();
  
  let html = "";
  for (const k of config) {
    const db = await getDb(k.id);
    db.forEach((item, index) => {
      const isArray = Array.isArray(item.photo);
      const thumbSrc = isArray ? item.photo[0] : (item.photo || null);
      
      let photoHtml = '';
      if (thumbSrc) {
        if (isArray && item.photo.length > 1) {
          const pCount = item.photo.length;
          const rows = pCount > 2 ? 2 : 1;
          let thumbsHtml = item.photo.slice(0, 4).map(src => `<img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`).join('');
          photoHtml = `<div class="web-img-wrapper" style="display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(${rows}, 1fr); gap: 4px; padding: 4px; background: #f1f5f9; aspect-ratio: 16/9; max-height: 220px; box-sizing: border-box;">${thumbsHtml}</div>`;
        } else {
          photoHtml = `<div class="web-img-wrapper"><img src="${thumbSrc}" alt="${item.title}" /></div>`;
        }
      }

      let extras = "";
      if (item.mitra) extras = `<p style="font-size:12px;color:#1e3a8a;font-weight:bold;margin-bottom:8px;"><i class="ri-map-pin-2-line"></i> ${item.mitra}</p>`;
      if (item.link) extras = `<p style="font-size:12px;color:#475569;"><b>Link:</b> <a href="${item.link}" target="_blank" class="preview-active-link">${item.link}</a></p>`;

      html += `
        <div class="public-web-card">
          ${photoHtml}
          <div class="web-content" style="${!thumbSrc ? 'padding-top:20px;' : ''}">
            <div>
              <div class="web-meta">
                <span><i class="ri-time-line"></i> ${item.publishDate || ''}</span>
                <span style="color:#2563eb;"><i class="${k.icon}"></i> ${k.label}</span>
              </div>
              <h3>${item.title}</h3>
              ${extras}
              <p class="web-desc">${item.desc || ''}</p>
            </div>
          </div>
          <div class="card-admin-actions">
            <button class="btn-edit-item" onclick="editItem('${k.id}', ${index})"><i class="ri-edit-line"></i> Edit</button>
            <button class="btn-delete-item" onclick="deleteItem('${k.id}', ${index})"><i class="ri-delete-bin-line"></i> Hapus</button>
          </div>
        </div>
      `;
    });
  }

  for (const c of containers) {
    c.innerHTML = html || "<p style='color:#64748b; font-size:13px;'>Belum ada konten dari kriteria manapun.</p>";
  }
}

async function renderDrafKontenTable() {
  const container = document.getElementById("drafKontenTableContainer");
  if (!container) return;

  const config = await getKriteriaConfig();
  let rows = [];

  for (const k of config) {
    const db = await getDb(k.id);
    db.forEach((item, index) => {
      rows.push({
        kriteriaId: k.id,
        kriteriaLabel: k.label,
        index: index,
        title: item.title || "",
        publishDate: item.publishDate || "",
        timestamp: item.timestamp || 0
      });
    });
  }

  // Sort by timestamp descending
  rows.sort((a, b) => b.timestamp - a.timestamp);

  if (rows.length === 0) {
    container.innerHTML = `
      <div class="form-container" style="text-align:center; padding: 40px; background: white; border-radius: 20px;">
        <i class="ri-file-list-3-line" style="font-size: 48px; color: #cbd5e1; display: block; margin-bottom: 15px;"></i>
        <p style="color:#64748b; font-size:14px;">Belum ada draf konten yang ditambahkan.</p>
      </div>
    `;
    return;
  }

  const tableRows = rows.map(r => {
    const editBtn = `<button type="button" class="btn-edit-kriteria" onclick="window.editItem('${r.kriteriaId}', ${r.index})" style="background:#fef3c7; color:#d97706; border:none; padding:6px 12px; border-radius:8px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:12px; transition:0.2s; margin-right:6px;"><i class="ri-edit-line"></i> Edit</button>`;

    const deleteBtn = `<button type="button" class="btn-delete-kriteria" onclick="window.deleteItem('${r.kriteriaId}', ${r.index})" style="background:#fee2e2; color:#b91c1c; border:none; padding:6px 12px; border-radius:8px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:12px; transition:0.2s;"><i class="ri-delete-bin-line"></i> Hapus</button>`;

    return `
      <tr>
        <td data-label="Judul Konten" style="font-weight:600; color:#1e3a8a;">${r.title}</td>
        <td data-label="Kategori"><span class="badge-bawaan" style="background:#eff6ff; color:#2563eb;">${r.kriteriaLabel}</span></td>
        <td data-label="Tanggal Rilis" style="color:#64748b; font-size:13px;">${r.publishDate}</td>
        <td data-label="Aksi">
          <div style="display:flex; align-items:center;">
            ${editBtn}
            ${deleteBtn}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="form-container" style="margin-top:0;">
      <div style="overflow-x:auto;">
        <table class="kriteria-table">
          <thead>
            <tr>
              <th>Judul Konten</th>
              <th>Kategori</th>
              <th>Tanggal Rilis</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD: CRUD GENERIK
// ─────────────────────────────────────────────────────────────

// State edit — tracking per kriteria
window.saveItem = async function (kriteriaId) {
  const config = await getKriteriaConfig();
  const k = config.find(c => c.id === kriteriaId);
  if (!k) return;

  const titleInput = document.getElementById(`f-${kriteriaId}-title`);
  if (!titleInput || !titleInput.value.trim()) {
    window.showToast(`Judul ${k.label} wajib diisi!`);
    return;
  }

  toggleLoading(true, "Menyimpan ke Supabase...");

  try {
    const editIndex = _editState[kriteriaId] !== undefined ? _editState[kriteriaId] : null;
    const db = await getDb(kriteriaId);
    let existingItem = null;
    let contentId = null;

    if (editIndex !== null && db[editIndex]) {
      existingItem = db[editIndex];
      contentId = existingItem.id;
    }

    // 1. Kumpulkan data untuk kriteria_contents
    const contentData = {
      kriteria_id: kriteriaId,
      title: titleInput.value.trim(),
    };

    const mediaUploads = [];

    for (const fid of (k.fields || [])) {
      const inputId = `f-${kriteriaId}-${fid}`;
      const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fid);
      if (!fieldDef) continue;

      if (fieldDef.type === "file-multi-image") {
        const fileInput = document.getElementById(inputId);
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          for (let i=0; i<fileInput.files.length; i++) {
            const file = fileInput.files[i];
            mediaUploads.push(uploadToSupabaseStorage(file, kriteriaId).then(url => ({ file_url: url, file_type: 'image' })));
          }
        }
      } else if (fieldDef.type === "file-single-doc") {
        const fileInput = document.getElementById(inputId);
        if (fileInput && fileInput.files && fileInput.files[0]) {
          mediaUploads.push(uploadToSupabaseStorage(fileInput.files[0], kriteriaId).then(url => ({ file_url: url, file_type: 'document' })));
        }
      } else {
        const el = document.getElementById(inputId);
        contentData[fid] = el ? el.value.trim() : "";
      }
    }

    // 2. Insert atau Update kriteria_contents
    let resultContentId;
    if (contentId) {
      // Update
      const { error: errUpdate } = await window._supabase.from('kriteria_contents').update(contentData).eq('id', contentId);
      if (errUpdate) throw errUpdate;
      resultContentId = contentId;
    } else {
      // Insert
      const { data: inserted, error: errInsert } = await window._supabase.from('kriteria_contents').insert(contentData).select('id').single();
      if (errInsert) throw errInsert;
      resultContentId = inserted.id;
    }

    // 3. Upload media dan simpan ke content_media
    if (mediaUploads.length > 0) {
      const uploadedMedias = await Promise.all(mediaUploads);
      const validMedias = uploadedMedias.filter(m => m && m.file_url);

      if (validMedias.length > 0) {
        // Hapus media lama jika update (karena file diganti baru)
        if (contentId) {
          await window._supabase.from('content_media').delete().eq('content_id', resultContentId);
        }

        const mediaRows = validMedias.map(m => ({
          content_id: resultContentId,
          file_url: m.file_url,
          file_type: m.file_type
        }));

        const { error: errMedia } = await window._supabase.from('content_media').insert(mediaRows);
        if (errMedia) throw errMedia;
      }
    }

    // Cleanup Edit State
    delete _editState[kriteriaId];
    try {
      localStorage.removeItem("ke_edit_kriteria_id");
      localStorage.removeItem("ke_edit_item_index");
    } catch (e) {}

    clearForm(kriteriaId, k);
    await renderDashboardStatsGrid();
    await renderDrafKontenTable();

    if (typeof window.showToast === "function") {
      window.showToast(`Draft ${k.label} berhasil disimpan!`);
    }
    if (typeof window.switchTab === "function") {
      window.switchTab("view-draf-konten");
    }

  } catch (error) {
    console.error("Gagal menyimpan data ke Supabase:", error);
    alert("Gagal menyimpan data: " + error.message);
  } finally {
    toggleLoading(false);
  }
};

window.editItem = async function(kriteriaId, index) {
  const config = await getKriteriaConfig();
  const k = config.find(c => c.id === kriteriaId);
  if (!k) return;
  const db = await getDb(kriteriaId);
  const item = db[index];
  if (!item) return;

  // Set memory and localStorage state
  _editState[kriteriaId] = index;
  try {
    localStorage.setItem("ke_edit_kriteria_id", kriteriaId);
    localStorage.setItem("ke_edit_item_index", index);
  } catch (e) {}

  // Re-render forms to change headers/buttons to Edit mode
  await renderDashboardForms();
  await attachSaveButtons();

  // Prefill the form inputs
  const titleInput = document.getElementById(`f-${kriteriaId}-title`);
  if (titleInput) titleInput.value = item.title || "";

  (k.fields || []).forEach(fid => {
    const inputId = `f-${kriteriaId}-${fid}`;
    const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fid);
    if (!fieldDef) return;

    if (fieldDef.type === "file-multi-image" || fieldDef.type === "file-single-doc") {
      return;
    }

    const el = document.getElementById(inputId);
    if (el) el.value = item[fid] || "";
  });

  // Switch tab
  if (typeof window.switchTab === "function") {
    window.switchTab(`view-kriteria-${kriteriaId}`);
  }
  const view = document.getElementById(`view-kriteria-${kriteriaId}`);
  if (view) view.scrollIntoView({ behavior: "smooth" });
};

window.deleteItem = async function (kriteriaId, index) {
  const db = await getDb(kriteriaId);
  const item = db[index];
  if (!item) return;

  const modal = document.getElementById("confirmModal");
  if (!modal) return;
  const msg = document.getElementById("confirmMessage");
  if (msg) msg.innerHTML = `Apakah Anda yakin ingin menghapus data <b>${item.title || "tanpa judul"}</b>?`;
  
  modal.style.display = "flex";

  const btnOk = document.getElementById("confirmOk");
  const btnCancel = document.getElementById("confirmCancel");
  
  if (btnCancel) {
    btnCancel.onclick = () => { modal.style.display = "none"; };
  }
  
  if (btnOk) {
    btnOk.onclick = async () => {
      modal.style.display = "none";
      toggleLoading(true, "Menghapus data...");
      try {
        const { error } = await window._supabase.from('kriteria_contents').delete().eq('id', item.id);
        if (error) throw error;
        
        await renderPreviewForKriteria(kriteriaId);
        await renderDashboardAllPreview();
        await renderDashboardStatsGrid();
        await renderDrafKontenTable();
        
        if (typeof window.showToast === "function") window.showToast("Item berhasil dihapus.");
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus: " + e.message);
      } finally {
        toggleLoading(false);
      }
    };
  }
};

window.openBase64File = async function (index, kriteriaId) {
  const db = await getDb(kriteriaId);
  const item = db[index];
  if (item && item.file) {
    const isBase64 = item.file.startsWith('data:');
    if (isBase64) {
      const w = window.open();
      w.document.write(`<iframe src="${item.file}" frameborder="0" style="border:0;position:fixed;top:0;left:0;width:100%;height:100%;" allowfullscreen></iframe>`);
    } else {
      const finalUrl = wrapUrlInGoogleDocsViewer(item.file);
      window.open(finalUrl, '_blank');
    }
  } else {
    window.showToast("Gagal memuat berkas, file lampiran kosong.");
  }
};

/** Reset semua field form suatu kriteria */
function clearForm(kriteriaId, k) {
  const titleInput = document.getElementById(`f-${kriteriaId}-title`);
  if (titleInput) titleInput.value = "";

  (k.fields || []).forEach(fid => {
    const inputId = `f-${kriteriaId}-${fid}`;
    const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fid);
    if (!fieldDef) return;

    const el = document.getElementById(inputId);
    if (!el) return;

    if (fieldDef.type === "file-multi-image" || fieldDef.type === "file-single-doc") {
      el.value = "";
      const lbl = document.getElementById(`lbl-${inputId}`);
      if (lbl) lbl.style.display = "none";
    } else {
      el.value = "";
    }
  });
}

/** Attach save button handler per kriteria */
async function attachSaveButtons() {
  const config = await getKriteriaConfig();
  config.forEach(k => {
    const btn = document.getElementById(`saveBtn-${k.id}`);
    if (btn) {
      btn.onclick = () => window.saveItem(k.id);
    }

    // File input label update
    (k.fields || []).forEach(fid => {
      const inputId = `f-${k.id}-${fid}`;
      const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fid);
      if (!fieldDef) return;
      if (fieldDef.type === "file-multi-image" || fieldDef.type === "file-single-doc") {
        const fileInput = document.getElementById(inputId);
        const lbl = document.getElementById(`lbl-${inputId}`);
        if (fileInput && lbl) {
          fileInput.addEventListener("change", async e => {
            const files = e.target.files;
            if (files && files.length) {
              if (fieldDef.type === "file-multi-image") {
                lbl.style.display = "block";
                lbl.innerHTML = `<div style="margin-bottom: 8px; font-style: normal; color: #1e293b;">Terpilih: <b>${files.length} foto</b></div><div class="upload-preview-grid"></div>`;
                const grid = lbl.querySelector(".upload-preview-grid");
                for (let i = 0; i < files.length; i++) {
                   const f = files[i];
                   const b64 = await getBase64(f);
                   grid.innerHTML += `<div class="upload-preview-item"><img src="${b64}"></div>`;
                }
              } else {
                if (files.length === 1) {
                  lbl.innerHTML = `Terpilih: <b>${files[0].name}</b> (${(files[0].size / 1024).toFixed(1)} KB)`;
                } else {
                  lbl.innerHTML = `Terpilih: <b>${files.length} berkas</b>`;
                }
                lbl.style.display = "inline-flex";
              }
            } else {
              lbl.style.display = "none";
              lbl.innerHTML = "";
            }
          });
        }
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  KELOLA KRITERIA VIEW
// ─────────────────────────────────────────────────────────────

function getFieldIcon(fid) {
  switch (fid) {
    case "photo": return "ri-image-add-line";
    case "file": return "ri-file-upload-line";
    case "link": return "ri-link";
    case "doi": return "ri-fingerprint-line";
    case "year": return "ri-calendar-line";
    case "mitra": return "ri-map-pin-line";
    case "course": return "ri-book-open-line";
    case "teacher": return "ri-user-line";
    case "desc": return "ri-align-left";
    default: return "ri-checkbox-blank-line";
  }
}

function getFieldIconColor(fid) {
  switch (fid) {
    case "photo": return "#3b82f6"; // Blue
    case "file": return "#10b981";  // Emerald/Green
    case "link": return "#6366f1";  // Indigo
    case "doi": return "#8b5cf6";   // Purple
    case "year": return "#f59e0b";  // Amber
    case "mitra": return "#ec4899"; // Pink
    case "course": return "#14b8a6"; // Teal
    case "teacher": return "#06b6d4"; // Cyan
    case "desc": return "#64748b";  // Slate
    default: return "#64748b";
  }
}

function getFieldDescription(fid) {
  switch (fid) {
    case "photo": return "Upload satu atau beberapa foto dokumentasi kegiatan.";
    case "file": return "Upload file dokumen lampiran (PDF, Word, Excel, atau ZIP).";
    case "link": return "Tautkan ke alamat web eksternal.";
    case "doi": return "Nomor identifikasi unik untuk karya ilmiah.";
    case "year": return "Tahun publikasi atau pelaksanaan kegiatan.";
    case "mitra": return "Nama lokasi atau institusi mitra kerja sama.";
    case "course": return "Nama mata kuliah yang terkait.";
    case "teacher": return "Dosen pengajar atau pelaksana kegiatan.";
    case "desc": return "Penjelasan singkat mengenai konten ini.";
    default: return "";
  }
}

async function renderKelolaKriteriaView() {
  const container = document.getElementById("kelolaKriteriaContent");
  if (!container) return;
  const config = await getKriteriaConfig();

  // 1. Render Table of Current Criteria
  const fieldMap = {};
  AVAILABLE_FIELDS.forEach(f => { fieldMap[f.id] = f; });

  const tableRows = config.map(k => {
    const typeBadge = k.builtIn 
      ? `<span class="badge-bawaan">Bawaan</span>` 
      : `<span class="badge-kustom">Kustom</span>`;
    
    const friendlyFields = (k.fields || [])
      .map(fid => fieldMap[fid] ? fieldMap[fid].label.split(" (")[0] : fid)
      .join(", ");

    const editBtn = `<button type="button" class="btn-edit-kriteria" onclick="window.KriteriaEngine.setEditing('${k.id}')" style="background:#fef3c7; color:#d97706; border:none; padding:6px 12px; border-radius:8px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:12px; transition:0.2s; margin-right:6px;"><i class="ri-edit-line"></i> Edit</button>`;

    const deleteBtn = `<button type="button" class="btn-delete-kriteria" onclick="window.KriteriaEngine.confirmRemoveKriteria('${k.id}', '${k.label}')" style="background:#fee2e2; color:#b91c1c; border:none; padding:6px 12px; border-radius:8px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:12px; transition:0.2s;"><i class="ri-delete-bin-line"></i> Hapus</button>`;

    return `
      <tr>
        <td data-label="Nama Kriteria" style="font-weight:600; color:#1e3a8a;"><i class="${k.icon || 'ri-folder-line'}" style="margin-right:8px; font-size:16px;"></i>${k.label}</td>
        <td data-label="Tipe">${typeBadge}</td>
        <td data-label="Fields" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${friendlyFields}">${friendlyFields || '-'}</td>
        <td data-label="Aksi">
          <div style="display:flex; align-items:center;">
            ${editBtn}
            ${deleteBtn}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  const tableHtml = `
    <div class="form-container" style="margin-top:0;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <h4 style="margin:0; color:#1e3a8a;"><i class="ri-list-settings-line"></i> Daftar Kriteria Saat Ini</h4>
        <button type="button" class="btn-submit" onclick="window.KriteriaEngine.showAddKriteriaModal()" style="padding: 10px 18px; font-size:13px; border-radius:10px;">
          <i class="ri-add-line"></i> Tambah Kriteria Baru
        </button>
      </div>
      <div style="overflow-x:auto;">
        <table class="kriteria-table">
          <thead>
            <tr>
              <th>Nama Kriteria</th>
              <th>Tipe</th>
              <th>Field Aktif</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // 2. Render Add or Edit Form
  let formHtml = "";
  if (editingKriteriaId) {
    const kToEdit = config.find(k => k.id === editingKriteriaId);
    if (kToEdit) {
      const fieldCheckboxes = AVAILABLE_FIELDS.map(f => {
        const icon = getFieldIcon(f.id);
        const iconColor = getFieldIconColor(f.id);
        const desc = getFieldDescription(f.id);
        const isChecked = (kToEdit.fields || []).includes(f.id) ? "checked" : "";
        return `
          <label class="field-card-item">
            <div style="display:flex; align-items:flex-start; gap:12px; flex:1;">
              <div style="width:36px; height:36px; border-radius:8px; background:${iconColor}15; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">
                <i class="${icon}" style="font-size:18px; color:${iconColor};"></i>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                <span style="font-size:13.5px; color:#1e293b; font-weight:700;">${f.label}</span>
                <span style="font-size:11.5px; color:#64748b; font-weight:500; line-height:1.4;">${desc}</span>
              </div>
            </div>
            <input type="checkbox" value="${f.id}" id="ck-field-${f.id}" ${isChecked} style="accent-color:#2563eb; width:16px; height:16px; cursor:pointer; flex-shrink:0; margin-top:4px;">
          </label>
        `;
      }).join("");

      formHtml = `
        <div class="modal-header">
          <h4 class="modal-title">
            <i class="ri-edit-box-line" style="font-size:20px; color:#2563eb;"></i> Edit Kriteria: ${kToEdit.label}
          </h4>
          <button type="button" onclick="window.KriteriaEngine.closeKriteriaModal()" class="close-modal-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div>
            <label style="font-size:13.5px; font-weight:700; color:#334155; margin-bottom:8px; display:block;">Nama Kriteria</label>
            <input type="text" id="editKriteriaLabel" value="${kToEdit.label}" placeholder="Contoh: Seminar, Penghargaan, Publikasi Buku..." style="width:100%; box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-size:13.5px; font-weight:700; color:#334155; margin-bottom:8px; display:block;">Pilih Field yang Tersedia</label>
            <div style="position:relative;">
              <button type="button" onclick="const m = this.nextElementSibling; m.style.display = m.style.display === 'none' ? 'block' : 'none';" style="width:100%; padding:12px; text-align:left; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; cursor:pointer; font-size:13px; font-weight:600; color:#475569; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
                <span>Pilih Field (Klik untuk membuka)</span>
                <i class="ri-arrow-down-s-line" style="font-size:16px;"></i>
              </button>
              <div style="display:none; position:absolute; top:100%; left:0; width:100%; background:white; border:1px solid #e2e8f0; border-radius:10px; margin-top:4px; max-height:200px; overflow-y:auto; z-index:99; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1); padding:10px; box-sizing:border-box;">
                <div style="display:flex; flex-direction:column; gap:8px;">
                  ${fieldCheckboxes}
                </div>
              </div>
            </div>
            <div id="editFieldCapsules" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;"></div>
            <p style="font-size:12px; color:#64748b; margin-top:8px; line-height:1.4;">Pilih setidaknya 1 field. Field "Judul" selalu ada secara otomatis.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" id="btnBatalEdit" class="btn-danger-batal">Batal</button>
          <button type="button" id="btnSimpanKriteria" class="btn-submit-modal">
            <i class="ri-save-line"></i> Simpan
          </button>
        </div>
      `;
    }
  } else {
    // Form tambah kriteria baru
    const fieldCheckboxes = AVAILABLE_FIELDS.map(f => {
      const icon = getFieldIcon(f.id);
      const iconColor = getFieldIconColor(f.id);
      const desc = getFieldDescription(f.id);
      return `
        <label class="field-card-item">
          <div style="display:flex; align-items:flex-start; gap:12px; flex:1;">
            <div style="width:36px; height:36px; border-radius:8px; background:${iconColor}15; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">
              <i class="${icon}" style="font-size:18px; color:${iconColor};"></i>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
              <span style="font-size:13.5px; color:#1e293b; font-weight:700;">${f.label}</span>
              <span style="font-size:11.5px; color:#64748b; font-weight:500; line-height:1.4;">${desc}</span>
            </div>
          </div>
          <input type="checkbox" value="${f.id}" id="ck-field-${f.id}" style="accent-color:#2563eb; width:16px; height:16px; cursor:pointer; flex-shrink:0; margin-top:4px;">
        </label>
      `;
    }).join("");

    formHtml = `
      <div class="modal-header">
        <h4 class="modal-title">
          <i class="ri-add-circle-line" style="font-size:20px; color:#2563eb;"></i> Tambah Kriteria Baru
        </h4>
        <button type="button" onclick="window.KriteriaEngine.closeKriteriaModal()" class="close-modal-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div>
          <label style="font-size:13.5px; font-weight:700; color:#334155; margin-bottom:8px; display:block;">Nama Kriteria</label>
          <input type="text" id="newKriteriaLabel" placeholder="Contoh: Seminar, Penghargaan, Publikasi Buku..." style="width:100%; box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:13.5px; font-weight:700; color:#334155; margin-bottom:8px; display:block;">Pilih Field yang Tersedia</label>
          <div style="position:relative;">
            <button type="button" onclick="const m = this.nextElementSibling; m.style.display = m.style.display === 'none' ? 'block' : 'none';" style="width:100%; padding:12px; text-align:left; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; cursor:pointer; font-size:13px; font-weight:600; color:#475569; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
              <span>Pilih Field (Klik untuk membuka)</span>
              <i class="ri-arrow-down-s-line" style="font-size:16px;"></i>
            </button>
            <div style="display:none; position:absolute; top:100%; left:0; width:100%; background:white; border:1px solid #e2e8f0; border-radius:10px; margin-top:4px; max-height:200px; overflow-y:auto; z-index:99; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1); padding:10px; box-sizing:border-box;">
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${fieldCheckboxes}
              </div>
            </div>
          </div>
          <div id="newFieldCapsules" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;"></div>
          <p style="font-size:12px; color:#64748b; margin-top:8px; line-height:1.4;">Pilih setidaknya 1 field. Field "Judul" selalu ada secara otomatis.</p>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" onclick="window.KriteriaEngine.closeKriteriaModal()" class="btn-danger-batal">Batal</button>
        <button type="button" id="btnTambahKriteria" class="btn-submit-modal">
          <i class="ri-save-line"></i> Simpan
        </button>
      </div>
    `;
  }

  container.innerHTML = tableHtml;

  let modalEl = document.getElementById("kriteriaFormModal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "kriteriaFormModal";
    document.body.appendChild(modalEl);
  }

  modalEl.className = `confirm-modal-overlay ${editingKriteriaId ? 'active' : ''}`;
  modalEl.style.display = editingKriteriaId ? 'flex' : 'none';

  modalEl.innerHTML = `
    <style>
      #kriteriaFormModal.confirm-modal-overlay {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(15, 23, 42, 0.6) !important;
        z-index: 40 !important;
        display: none;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px) !important;
      }
      #kriteriaFormModal.confirm-modal-overlay.active {
        display: flex !important;
      }
      #kriteriaFormModal .confirm-modal-content {
        position: relative !important;
        z-index: 50 !important;
        width: 560px !important;
        max-width: 90vw !important;
        box-sizing: border-box !important;
        min-height: 420px !important;
        max-height: 90vh !important;
        display: flex !important;
        flex-direction: column !important;
        border-radius: 20px !important;
        background: #0040C0 !important; /* Biru solid tema utama */
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        animation: slideUp 0.3s ease-out !important;
        overflow: hidden !important;
        color: #ffffff !important;
      }
      #kriteriaFormModal h4,
      #kriteriaFormModal label,
      #kriteriaFormModal p,
      #kriteriaFormModal span {
        color: #ffffff !important;
      }
      #kriteriaFormModal input[type="text"] {
        background: #ffffff !important;
        color: #0f172a !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 10px !important;
        padding: 12px 16px !important;
        font-size: 14px !important;
        box-sizing: border-box !important;
      }
      #kriteriaFormModal .modal-body {
        background: #0037a8 !important; /* slightly darker blue for body fields */
        color: #ffffff !important;
      }
      #kriteriaFormModal .modal-footer {
        background: #003090 !important; /* even darker blue for footer */
        border-top: 1px solid rgba(255, 255, 255, 0.15) !important;
      }
      #kriteriaFormModal .field-card-item {
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        border-radius: 10px !important;
        color: #ffffff !important;
      }
      #kriteriaFormModal .field-card-item:hover {
        background: rgba(255, 255, 255, 0.15) !important;
        border-color: rgba(255, 255, 255, 0.25) !important;
      }
      #kriteriaFormModal .field-card-item:has(input:checked) {
        background: rgba(255, 255, 255, 0.2) !important;
        border-color: #ffffff !important;
      }
      #kriteriaFormModal .field-card-item span {
        color: #ffffff !important;
      }
      #kriteriaFormModal .field-card-item span:last-child {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      #kriteriaFormModal button[onclick*="nextElementSibling"] {
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        color: #ffffff !important;
      }
      #kriteriaFormModal button[onclick*="nextElementSibling"] span,
      #kriteriaFormModal button[onclick*="nextElementSibling"] i {
        color: #ffffff !important;
      }
      #kriteriaFormModal button[onclick*="nextElementSibling"] + div {
        background: #003090 !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
      }
      #kriteriaFormModal .btn-danger-batal {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
      }
      #kriteriaFormModal .btn-danger-batal:hover {
        background: rgba(255, 255, 255, 0.18) !important;
      }
      #kriteriaFormModal .btn-submit-modal {
        background: #ffffff !important;
        color: #0040C0 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }
      #kriteriaFormModal .btn-submit-modal:hover {
        background: #f8fafc !important;
      }
      body {
        background: #f4f6fb !important;
      }
      .modal-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 16px 28px !important;
        background: #0040C0 !important; /* Header biru royal */
        border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
      }
      .modal-title {
        margin: 0 !important;
        color: #ffffff !important; /* Judul putih */
        font-size: 16px !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }
      .modal-title i {
        color: #ffffff !important;
      }
      .modal-body {
        padding: 28px !important;
        overflow-y: auto !important;
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 20px !important;
      }
      .modal-footer {
        padding: 16px 28px !important;
        border-top: 1px solid #e2e8f0 !important;
        display: flex !important;
        justify-content: flex-end !important;
        gap: 16px !important;
        background: white !important;
        position: sticky !important;
        bottom: 0 !important;
        z-index: 10 !important;
      }
      .field-card-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 12px !important;
        background: #f8fafc;
        border: 1px solid #e2e8f0 !important;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      }
      .field-card-item:hover {
        background: #f1f5f9;
        border-color: #cbd5e1 !important;
        transform: translateY(-1px);
      }
      .field-card-item:has(input:checked) {
        background: #eff6ff;
        border-color: #3b82f6 !important;
      }
      .close-modal-btn {
        background: none !important;
        border: none !important;
        font-size: 24px !important;
        color: rgba(255, 255, 255, 0.8) !important; /* Close button putih */
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }
      .close-modal-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff !important;
      }
      .btn-danger-batal, .btn-submit-modal {
        height: 42px !important;
        padding: 0 24px !important;
        border-radius: 10px;
        font-weight: 700;
        font-size: 13.5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      .btn-danger-batal {
        background: #f1f5f9 !important;
        color: #475569 !important;
      }
      .btn-danger-batal:hover {
        background: #e2e8f0 !important;
        color: #1e293b !important;
      }
      .btn-submit-modal {
        background: #0040C0 !important; /* Simpan biru royal */
        color: white !important;
      }
      .btn-submit-modal:hover {
        background: #003090 !important;
      }
    </style>
    <div class="confirm-modal-content">
      ${formHtml}
    </div>
  `;

  // Click outside modal to close
  const modalOverlayEl = document.getElementById("kriteriaFormModal");
  if (modalOverlayEl) {
    modalOverlayEl.onclick = async (e) => {
      if (e.target === modalOverlayEl) {
        await closeKriteriaModal();
      }
    };
  }

  // Capsule rendering logic
  const updateCapsules = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const selectedFields = AVAILABLE_FIELDS.filter(f => {
      const ck = document.getElementById(`ck-field-${f.id}`);
      return ck && ck.checked;
    });
    
    container.innerHTML = selectedFields.map(f => `
      <span style="background:#dbeafe; color:#1e40af; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
        <i class="ri-check-line"></i> ${f.label}
      </span>
    `).join("");
  };

  // Attach change listeners to all checkboxes
  AVAILABLE_FIELDS.forEach(f => {
    const ck = document.getElementById(`ck-field-${f.id}`);
    if (ck) {
      ck.addEventListener("change", () => {
        updateCapsules(editingKriteriaId ? "editFieldCapsules" : "newFieldCapsules");
      });
    }
  });

  // Initial render for capsules
  updateCapsules(editingKriteriaId ? "editFieldCapsules" : "newFieldCapsules");

  // 3. Bind Event Handlers
  if (!editingKriteriaId) {
    document.getElementById("btnTambahKriteria").onclick = async () => {
      const label = (document.getElementById("newKriteriaLabel").value || "").trim();
      if (!label) { window.showToast("Nama kriteria tidak boleh kosong!"); return; }

      const selectedFields = AVAILABLE_FIELDS
        .filter(f => document.getElementById(`ck-field-${f.id}`) && document.getElementById(`ck-field-${f.id}`).checked)
        .map(f => f.id);

      if (selectedFields.length === 0) { window.showToast("Pilih minimal 1 field!"); return; }

      const newK = await addKriteria(label, selectedFields);
      if (!newK) { window.showToast("Gagal menambahkan kriteria. Coba nama yang berbeda."); return; }

      await closeKriteriaModal();

      // Rebuild semua UI
      await rebuildDashboardUI();

      if (typeof window.showToast === "function") window.showToast(`Kriteria "${label}" berhasil ditambahkan!`);
      await renderKelolaKriteriaView();
    };
  } else {
    // Edit action handlers
    document.getElementById("btnBatalEdit").onclick = async () => {
      await closeKriteriaModal();
    };

    document.getElementById("btnSimpanKriteria").onclick = async () => {
      const label = (document.getElementById("editKriteriaLabel").value || "").trim();
      if (!label) { window.showToast("Nama kriteria tidak boleh kosong!"); return; }

      const selectedFields = AVAILABLE_FIELDS
        .filter(f => document.getElementById(`ck-field-${f.id}`) && document.getElementById(`ck-field-${f.id}`).checked)
        .map(f => f.id);

      if (selectedFields.length === 0) { window.showToast("Pilih minimal 1 field!"); return; }

      const ok = await editKriteria(editingKriteriaId, label, selectedFields);
      if (!ok) { window.showToast("Gagal menyimpan kriteria."); return; }

      await closeKriteriaModal();
      await rebuildDashboardUI();

      if (typeof window.showToast === "function") window.showToast(`Kriteria "${label}" berhasil diperbarui!`);
      await renderKelolaKriteriaView();
    };
  }
}

window.confirmRemoveKriteria = function (kriteriaId, kriteriaLabel) {
  const confirmModal = document.getElementById("confirmModal");
  const confirmMessage = document.getElementById("confirmMessage");
  const btnOk = document.getElementById("confirmOk");
  const btnCancel = document.getElementById("confirmCancel");

  const doRemove = async () => {
    const ok = await removeKriteria(kriteriaId);
    if (!ok) { window.showToast("Kriteria tidak dapat dihapus."); return; }
    if (editingKriteriaId === kriteriaId) {
      editingKriteriaId = null;
    }
    await rebuildDashboardUI();
    if (typeof window.showToast === "function") window.showToast(`Kriteria "${kriteriaLabel}" dihapus.`);
    await renderKelolaKriteriaView();
    if (typeof window.switchTab === "function") window.switchTab("view-kelola-kriteria");
  };

  if (!confirmModal || !btnOk || !btnCancel) {
    if (confirm(`Hapus kriteria "${kriteriaLabel}"? Seluruh data di dalamnya akan hilang.`)) doRemove();
    return;
  }

  if (confirmMessage) confirmMessage.textContent = `Hapus kriteria "${kriteriaLabel}"? Seluruh data di dalamnya akan hilang.`;
  confirmModal.style.display = "flex";

  const cleanup = () => {
    btnOk.onclick = null;
    btnCancel.onclick = null;
    confirmModal.style.display = "none";
  };

  btnCancel.onclick = () => cleanup();
  btnOk.onclick = () => { doRemove(); cleanup(); };
};

// ─────────────────────────────────────────────────────────────
//  REBUILD SELURUH UI (setelah config berubah)
// ─────────────────────────────────────────────────────────────

async function rebuildDashboardUI() {
  console.log("REBUILD UI CALLED");
  await renderDashboardSidebar();
  await renderDashboardForms();
  await attachSaveButtons();
  await applyActiveEditPrefills();
  await renderDashboardStatsGrid();

  // Reattach switchTab agar form view baru ikut tertangani
  if (typeof window._reattachSwitchTab === "function") {
    window._reattachSwitchTab();
  }
}

// ─────────────────────────────────────────────────────────────
//  EXPORT (global)
// ─────────────────────────────────────────────────────────────

window.KriteriaEngine = {
  // Short aliases
  init: initKriteriaConfig,
  getConfig: getKriteriaConfig,
  saveConfig: saveKriteriaConfig,
  getDb: getDb,
  saveDb: saveDb,
  addKriteria: addKriteria,
  removeKriteria: removeKriteria,
  editKriteria: editKriteria,
  setEditing: setEditing,
  showAddKriteriaModal: showAddKriteriaModal,
  closeKriteriaModal: closeKriteriaModal,
  confirmRemoveKriteria: window.confirmRemoveKriteria,
  cancelEditItem: cancelEditItem,
  rebuildUI: rebuildDashboardUI,
  renderSidebar: renderDashboardSidebar,
  renderForms: renderDashboardForms,
  renderStats: renderDashboardStatsGrid,
  renderKelolaView: renderKelolaKriteriaView,
  renderAllPreviews: renderAllPreviews,
  // Full-name aliases (used by dashboard.html module script)
  initKriteriaConfig: initKriteriaConfig,
  renderDashboardSidebar: renderDashboardSidebar,
  renderDashboardForms: renderDashboardForms,
  attachSaveButtons: attachSaveButtons,
  renderDashboardStatsGrid: renderDashboardStatsGrid,
  renderKelolaKriteriaView: renderKelolaKriteriaView,
  getKriteriaConfig: getKriteriaConfig
};

// Automatically check and wrap document links in DOM
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

// Jalankan inisialisasi otomatis saat script pertama kali dimuat
document.addEventListener("DOMContentLoaded", async () => {
  await initKriteriaConfig();
  wrapAllDocumentLinksInDOM();
});