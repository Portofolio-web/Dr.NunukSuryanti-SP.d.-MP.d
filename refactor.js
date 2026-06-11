const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'js/kriteria-engine.js');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Tambahkan fungsi Utility Supabase & Toggle Loading
const supabaseUtils = `
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
  const fileExt = file.name.split('.').pop();
  const fileName = \`\${kriteriaId}_\${Date.now()}_\${Math.random().toString(36).substring(7)}.\${fileExt}\`;
  const filePath = \`\${kriteriaId}/\${fileName}\`;

  const { data, error } = await window._supabase.storage
    .from('tridharma_media')
    .upload(filePath, file);

  if (error) {
    console.error("Upload error:", error);
    throw error;
  }

  const { data: publicUrlData } = window._supabase.storage
    .from('tridharma_media')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
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
`;

content = content.replace('// ─────────────────────────────────────────────────────────────\n//  CONFIG MANAGEMENT\n// ─────────────────────────────────────────────────────────────', supabaseUtils + '\n// ─────────────────────────────────────────────────────────────\n//  CONFIG MANAGEMENT\n// ─────────────────────────────────────────────────────────────');

// 2. Replace getKriteriaConfig, saveKriteriaConfig, initKriteriaConfig
const configMgmtRegex = /\/\*\* Baca config kriteria dari localStorage \*\/[\s\S]*?function initKriteriaConfig\(\) \{[\s\S]*?\}/;
const newConfigMgmt = `
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
    desc: \`Konten kategori \${r.label}.\`,
    storageKey: \`db_custom_\${r.id}_v1\`
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
`;
content = content.replace(configMgmtRegex, newConfigMgmt);

// 3. Replace getDb and saveDb
const dbMgmtRegex = /\/\*\* Ambil data array untuk suatu kriteria \*\/[\s\S]*?function saveDb\(kriteriaId, data\) \{[\s\S]*?return false;\n  \}\n\}/;
const newDbMgmt = `
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
`;
content = content.replace(dbMgmtRegex, newDbMgmt);

// 4. Update async render functions
content = content.replace(/function applyActiveEditPrefills\(\) \{/g, 'async function applyActiveEditPrefills() {');
content = content.replace(/const config = getKriteriaConfig\(\);/g, 'const config = await getKriteriaConfig();');
content = content.replace(/const db = getDb\((.*?)\);/g, 'const db = await getDb($1);');
content = content.replace(/function renderDashboardStatsGrid\(\) \{/g, 'async function renderDashboardStatsGrid() {');
content = content.replace(/function renderPreviewForKriteria\(kriteriaId\) \{/g, 'async function renderPreviewForKriteria(kriteriaId) {');
content = content.replace(/function renderDashboardAllPreview\(\) \{/g, 'async function renderDashboardAllPreview() {');
content = content.replace(/function renderDrafKontenTable\(\) \{/g, 'async function renderDrafKontenTable() {');

// Fix Promise.all for array map with await getDb
// In renderDashboardStatsGrid:
/* 
  config.forEach(k => {
    const db = await getDb(k.id);
*/
// It's inside a forEach which won't await. We need to replace forEach with for...of in these functions!
const fixForEach = (funcName, contentStr) => {
    const regex = new RegExp("(async function " + funcName + "\\\\(.*?\\\\) \\\\{[\\\\s\\\\S]*?\\\\})\\\\n\\\\n", 'g');
    return contentStr.replace(regex, (match) => {
        let res = match.replace(/config\.forEach\(\(?(k|c)\)? => \{/g, 'for (const $1 of config) {');
        res = res.replace(/}\);/g, '}');
        return res;
    });
};
content = fixForEach('renderDashboardStatsGrid', content);
content = fixForEach('renderDashboardAllPreview', content);
content = fixForEach('renderDrafKontenTable', content);
content = fixForEach('applyActiveEditPrefills', content);


// 5. Update saveItem
const saveItemRegex = /window\.saveItem = function\s*\(kriteriaId\)\s*\{[\s\S]*?\}\s*\}\n\};/m;
const newSaveItem = `
window.saveItem = async function (kriteriaId) {
  const config = await getKriteriaConfig();
  const k = config.find(c => c.id === kriteriaId);
  if (!k) return;

  const titleInput = document.getElementById(\`f-\${kriteriaId}-title\`);
  if (!titleInput || !titleInput.value.trim()) {
    window.showToast && window.showToast(\`Judul \${k.label} wajib diisi!\`);
    return;
  }

  toggleLoading(true, \`Menyimpan \${k.label}...\`);

  try {
    const editIndex = _editState[kriteriaId] !== undefined ? _editState[kriteriaId] : null;
    const db = await getDb(kriteriaId);
    const existingItem = (editIndex !== null && db[editIndex]) ? db[editIndex] : null;

    const contentData = {
      kriteria_id: kriteriaId,
      title: titleInput.value.trim(),
      desc: document.getElementById(\`f-\${kriteriaId}-desc\`)?.value.trim() || null,
      link: document.getElementById(\`f-\${kriteriaId}-link\`)?.value.trim() || null,
      doi: document.getElementById(\`f-\${kriteriaId}-doi\`)?.value.trim() || null,
      year: document.getElementById(\`f-\${kriteriaId}-year\`)?.value.trim() || null,
      mitra: document.getElementById(\`f-\${kriteriaId}-mitra\`)?.value.trim() || null,
      course: document.getElementById(\`f-\${kriteriaId}-course\`)?.value.trim() || null,
      teacher: document.getElementById(\`f-\${kriteriaId}-teacher\`)?.value.trim() || null
    };

    let contentId = existingItem ? existingItem.id : null;

    if (contentId) {
      const { error } = await window._supabase.from('kriteria_contents').update(contentData).eq('id', contentId);
      if (error) throw error;
    } else {
      const { data, error } = await window._supabase.from('kriteria_contents').insert(contentData).select('id').single();
      if (error) throw error;
      contentId = data.id;
    }

    const photoDef = (k.fields || []).find(f => f === "photo");
    if (photoDef) {
      const fileInput = document.getElementById(\`f-\${kriteriaId}-photo\`);
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        if (existingItem) {
           await window._supabase.from('content_media').delete().eq('content_id', contentId).eq('file_type', 'image');
        }
        for (const f of fileInput.files) {
          const url = await uploadToSupabaseStorage(f, kriteriaId);
          await window._supabase.from('content_media').insert({
            content_id: contentId, file_url: url, file_type: 'image'
          });
        }
      }
    }

    const fileDef = (k.fields || []).find(f => f === "file");
    if (fileDef) {
      const docInput = document.getElementById(\`f-\${kriteriaId}-file\`);
      if (docInput && docInput.files && docInput.files.length > 0) {
        if (existingItem) {
           await window._supabase.from('content_media').delete().eq('content_id', contentId).eq('file_type', 'document');
        }
        const url = await uploadToSupabaseStorage(docInput.files[0], kriteriaId);
        await window._supabase.from('content_media').insert({
          content_id: contentId, file_url: url, file_type: 'document'
        });
      }
    }

    if (editIndex !== null) delete _editState[kriteriaId];
    
    clearForm(kriteriaId, k);
    await rebuildDashboardUI();

    if (typeof window.showToast === "function") window.showToast(\`Draft \${k.label} berhasil disimpan!\`);
    if (typeof window.switchTab === "function") window.switchTab("view-draf-konten");

  } catch (e) {
    console.error("Save error:", e);
    alert("Terjadi kesalahan saat menyimpan: " + e.message);
  } finally {
    toggleLoading(false);
  }
};
`;
content = content.replace(saveItemRegex, newSaveItem);

// 6. Update deleteItem
const deleteItemRegex = /window\.deleteItem = function \(\s*kriteriaId,\s*index\s*\)\s*\{[\s\S]*?\}\s*\};\n  \}\s*\};\n\};/m;
const newDeleteItem = `
window.deleteItem = async function (kriteriaId, index) {
  const db = await getDb(kriteriaId);
  const item = db[index];
  if (!item) return;

  const modal = document.getElementById("confirmModal");
  if (!modal) return;
  const msg = document.getElementById("confirmMessage");
  if (msg) msg.innerHTML = \`Apakah Anda yakin ingin menghapus data <b>\${item.title || "tanpa judul"}</b>?\`;
  
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
`;
content = content.replace(deleteItemRegex, newDeleteItem);

// 7. Remove getBase64
content = content.replace(/function getBase64\(file\) \{[\s\S]*?return;\n  \}\n\}/m, '');

// 8. rebuildDashboardUI to async
content = content.replace(/function rebuildDashboardUI\(\) \{/g, 'async function rebuildDashboardUI() {');
content = content.replace(/renderDashboardForms\(\);/g, 'await renderDashboardForms();');
content = content.replace(/renderDashboardSidebar\(\);/g, 'await renderDashboardSidebar();');
content = content.replace(/attachSaveButtons\(\);/g, 'await attachSaveButtons();');
content = content.replace(/applyActiveEditPrefills\(\);/g, 'await applyActiveEditPrefills();');
content = content.replace(/renderAllPreviews\(\);/g, 'await renderAllPreviews();');
content = content.replace(/renderDashboardStatsGrid\(\);/g, 'await renderDashboardStatsGrid();');

content = content.replace(/function renderAllPreviews\(\) \{/g, 'async function renderAllPreviews() {');
content = content.replace(/config\.forEach\(k => renderPreviewForKriteria\(k\.id\)\);/g, 'for(const k of config) { await renderPreviewForKriteria(k.id); }');
content = content.replace(/renderDashboardAllPreview\(\);/g, 'await renderDashboardAllPreview();');
content = content.replace(/renderDrafKontenTable\(\);/g, 'await renderDrafKontenTable();');

content = content.replace(/function renderDashboardSidebar\(\) \{/g, 'async function renderDashboardSidebar() {');
content = content.replace(/function renderDashboardForms\(\) \{/g, 'async function renderDashboardForms() {');
content = content.replace(/function attachSaveButtons\(\) \{/g, 'async function attachSaveButtons() {');
content = content.replace(/function renderKelolaKriteriaView\(\) \{/g, 'async function renderKelolaKriteriaView() {');

// 9. Fix openBase64File
content = content.replace(/window\.openBase64File = function\(index, kriteriaId\) \{/g, 'window.openBase64File = async function(index, kriteriaId) {');

// 10. Fix editItem
content = content.replace(/window\.editItem = function\s*\(kriteriaId, index\)\s*\{/g, 'window.editItem = async function(kriteriaId, index) {');

// 11. Fix addKriteria
content = content.replace(/function addKriteria\(label, fields\) \{/g, 'async function addKriteria(label, fields) {');
content = content.replace(/saveKriteriaConfig\(config\);/g, 'await saveKriteriaConfig(config);');

// 12. Fix removeKriteria
content = content.replace(/function removeKriteria\(kriteriaId\) \{/g, 'async function removeKriteria(kriteriaId) {');
content = content.replace(/function editKriteria\(kriteriaId, newLabel, newFields\) \{/g, 'async function editKriteria(kriteriaId, newLabel, newFields) {');

// Add async to KriteriaEngine.init and rebuildUI exports
content = content.replace(/init: function \(\) \{/g, 'init: async function () {');
content = content.replace(/rebuildUI: function \(\) \{/g, 'rebuildUI: async function () {');
content = content.replace(/renderKelolaView: function \(\) \{/g, 'renderKelolaView: async function () {');
content = content.replace(/initKriteriaConfig\(\);/g, 'await initKriteriaConfig();');
content = content.replace(/rebuildDashboardUI\(\);/g, 'await rebuildDashboardUI();');
content = content.replace(/renderKelolaKriteriaView\(\);/g, 'await renderKelolaKriteriaView();');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Refactoring complete!');
