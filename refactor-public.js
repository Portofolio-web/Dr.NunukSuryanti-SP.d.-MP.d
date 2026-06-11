const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'js/public-app.js');
let content = fs.readFileSync(targetPath, 'utf8');

const supabaseUtils = `
  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=500";

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
`;

// Replace the synchronous loading of config and dbMap
const syncConfigRegex = /const config = JSON\.parse\(localStorage\.getItem\("db_kriteria_config_v1"\)\) \|\| \[[\s\S]*?\];\n\n  const dbMap = \{\};\n  config\.forEach\(k => \{\n    const key = k\.storageKey \|\| \`db_custom_\$\{k\.id\}_v1\`;\n    dbMap\[k\.id\] = JSON\.parse\(localStorage\.getItem\(key\)\) \|\| \[\];\n  \}\);\n\n  function getDb\(kriteriaId\) \{\n    const k = config\.find\(c => c\.id === kriteriaId\);\n    if \(\!k\) return \[\];\n    const key = k\.storageKey \|\| \`db_custom_\$\{k\.id\}_v1\`;\n    return JSON\.parse\(localStorage\.getItem\(key\)\) \|\| \[\];\n  \}/;

const asyncConfigLoad = `
  let config = [
    { id: "edu", label: "Pendidikan", icon: "ri-book-open-line", storageKey: "db_edu_v5", fields: ["photo", "file", "course", "teacher", "desc"] },
    { id: "res", label: "Penelitian", icon: "ri-flask-line", storageKey: "db_res_v5", fields: ["photo", "link", "doi", "year", "course", "teacher", "desc"] },
    { id: "srv", label: "Pengabdian", icon: "ri-building-4-line", storageKey: "db_srv_v5", fields: ["photo", "mitra", "course", "teacher", "desc"] }
  ];
  let dbMap = {};

  function getDb(kriteriaId) {
    return dbMap[kriteriaId] || [];
  }
`;

content = content.replace(syncConfigRegex, supabaseUtils + asyncConfigLoad);

// Refactor refreshUIFromCache to fetch from Supabase
const refreshUIRegex = /function refreshUIFromCache\(\) \{[\s\S]*?renderGoogleNewsGrid\(\);/m;

const newRefreshUI = `async function refreshUIFromCache() {
    sysName = localStorage.getItem("profile_name_v5") || "Nama Pemilik Website";
    
    const profileNameEl = document.getElementById("profileOwnerName");
    if (profileNameEl) profileNameEl.textContent = sysName;
    
    const copyrightEl = document.getElementById('copyrightText');
    if (copyrightEl) copyrightEl.textContent = \`© 2026 - \${sysName}\`;
    
    const brandNameEl = document.getElementById('brandName') || document.querySelector('.brand-logo-zone');
    if (brandNameEl) brandNameEl.textContent = sysName;
    
    document.title = sysName + " - Portofolio Tri Dharma";

    const cachedDegree = localStorage.getItem("profile_degree_v5");
    const degreeEl = document.getElementById("profileDegreeTitle");
    if (degreeEl && cachedDegree) degreeEl.textContent = cachedDegree;

    const cachedBio = localStorage.getItem("profile_bio_v5");
    const bioEl = document.getElementById("profileBioText");
    if (bioEl && cachedBio) bioEl.textContent = cachedBio;

    const cachedPhoto = localStorage.getItem("profile_avatar_v5");
    const imgEl = document.getElementById("mainProfileImg");
    if (imgEl && cachedPhoto) imgEl.src = cachedPhoto;

    // Fetch config and DB from Supabase
    if (window._supabase) {
      const { data: configData } = await window._supabase.from('kriteria_config').select('*');
      if (configData && configData.length > 0) {
        config = configData.map(r => ({
          id: r.id, label: r.label, icon: r.icon, fields: r.fields || [], builtIn: r.built_in, storageKey: \`db_custom_\${r.id}_v1\`
        }));
      }

      const { data: contents } = await window._supabase.from('kriteria_contents').select('*, content_media(*)').order('created_at', { ascending: false });
      if (contents) {
        config.forEach(k => {
          dbMap[k.id] = contents.filter(c => c.kriteria_id === k.id).map(c => mapDbRowToItem(c));
        });
      } else {
        config.forEach(k => dbMap[k.id] = []);
      }
    } else {
      console.warn("Supabase not available in public-app");
    }

    // Re-render columns & grids
    renderHeaderTabs();
    renderNewsGridColumns();
    renderGoogleNewsGrid();`;

content = content.replace(refreshUIRegex, newRefreshUI);

// Fix invocation of refreshUIFromCache
content = content.replace(/refreshUIFromCache\(\);/g, 'refreshUIFromCache();');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Public app refactoring complete!');
