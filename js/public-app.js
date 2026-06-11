// Cloud Sync dinonaktifkan
const CLOUD_SYNC_URL = "";

document.addEventListener("DOMContentLoaded", async () => {
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

    item.hasCustomPhoto = images.length > 0;
    item.photo = images.length > 0 ? images : [DEFAULT_IMAGE];
    item.file = docs.length > 0 ? docs[0] : "";

    return item;
  }

  let sysName = localStorage.getItem("profile_name_v5") || "Nama Pemilik Website";
  const hasCache = !!localStorage.getItem("profile_name_v5");
  let attachScrollObserver;

  function hideSkeleton() {
    const profileSkeleton = document.getElementById("profileSkeleton");
    const profileContentWrap = document.getElementById("profileContentWrap");
    if (profileSkeleton) profileSkeleton.style.display = "none";
    if (profileContentWrap) profileContentWrap.style.display = "";
  }

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const newsGlobalSearch = document.getElementById("newsGlobalSearch");
  const profileBtn = document.getElementById('profileBtn');

  const paneMainGrid = document.getElementById("pane-main-grid");
  const paneSingleKriteria = document.getElementById("pane-single-kriteria");
  const paneDetailArtikel = document.getElementById("pane-detail-artikel");

  const targetKriteriaName = document.getElementById("targetKriteriaName");
  const verticalFullListContainer = document.getElementById("verticalFullListContainer");

  let config = JSON.parse(localStorage.getItem("db_kriteria_config_v1")) || [
    { id: "edu", label: "Pendidikan", icon: "ri-book-open-line", storageKey: "db_edu_v5", fields: ["photo", "file", "course", "teacher", "desc"] },
    { id: "res", label: "Penelitian", icon: "ri-flask-line", storageKey: "db_res_v5", fields: ["photo", "link", "doi", "year", "course", "teacher", "desc"] },
    { id: "srv", label: "Pengabdian", icon: "ri-building-4-line", storageKey: "db_srv_v5", fields: ["photo", "mitra", "course", "teacher", "desc"] }
  ];

  const dbMap = {};
  config.forEach(k => {
    const key = k.storageKey || `db_custom_${k.id}_v1`;
    dbMap[k.id] = JSON.parse(localStorage.getItem(key)) || [];
  });

  function getDb(kriteriaId) {
    const k = config.find(c => c.id === kriteriaId);
    if (!k) return [];
    const key = k.storageKey || `db_custom_${k.id}_v1`;
    return JSON.parse(localStorage.getItem(key)) || [];
  }

  function convertDriveUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const match =
      url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      url.match(/\/d\/([a-zA-Z0-9_-]+)\//) ||
      url.match(/open\?id=([a-zA-Z0-9_-]+)/) ||
      url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    return url;
  }

  function getDriveViewerUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Tangkap ID file dari link
    let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || 
                url.match(/uc\?export=view&id=([a-zA-Z0-9_-]+)/);
                
    if (match && match[1]) {
      // Ubah menjadi format Google Drive Web Viewer
      return `https://drive.google.com/file/d/${match[1]}/view`;
    }
    return url;
  }

  async function refreshUIFromCache() {
    let profile = null;
    if (window._supabase) {
      try {
        const { data } = await window._supabase.from('admin_profile').select('*').limit(1).maybeSingle();
        if (data) {
          profile = data;
          localStorage.setItem("profile_name_v5", data.name || "");
          localStorage.setItem("profile_degree_v5", data.degree || "");
          localStorage.setItem("profile_bio_v5", data.bio || "");
          localStorage.setItem("profile_avatar_v5", data.avatar || "");
          localStorage.setItem("profile_email_v5", data.email || "");
          localStorage.setItem("profile_wa_v5", data.wa || "");
          localStorage.setItem("profile_fb_v5", data.fb || "");
        }
      } catch (err) {
        console.error('Failed to fetch profile from Supabase:', err);
      }
    }

    sysName = profile?.name || localStorage.getItem("profile_name_v5") || "Nama Pemilik Website";
    
    const profileNameEl = document.getElementById("profileOwnerName");
    if (profileNameEl) profileNameEl.textContent = sysName;
    
    const copyrightEl = document.getElementById('copyrightText');
    if (copyrightEl) copyrightEl.textContent = `© 2026 - ${sysName}`;
    
    const brandNameEl = document.getElementById('brandName') || document.querySelector('.brand-logo-zone');
    if (brandNameEl) brandNameEl.textContent = sysName;
    
    document.title = sysName + " - Portofolio Tri Dharma";

    const sysDegree = profile?.degree || localStorage.getItem("profile_degree_v5") || "";
    const degreeEl = document.getElementById("profileDegreeTitle");
    if (degreeEl) degreeEl.textContent = sysDegree;

    const sysBio = profile?.bio || localStorage.getItem("profile_bio_v5") || "Selamat datang di platform Website Pribadi saya";
    const bioEl = document.getElementById("profileBioText");
    if (bioEl) bioEl.textContent = sysBio;

    const sysAvatar = profile?.avatar || localStorage.getItem("profile_avatar_v5");
    const imgEl = document.getElementById("mainProfileImg");
    if (imgEl && sysAvatar) imgEl.src = sysAvatar;

    // Fetch config and DB from Supabase
    if (window._supabase) {
      const { data: configData } = await window._supabase.from('kriteria_config').select('*');
      if (configData && configData.length > 0) {
        config = configData.map(r => ({
          id: r.id, label: r.label, icon: r.icon, fields: r.fields || [], builtIn: r.built_in, storageKey: `db_custom_${r.id}_v1`
        }));
      }

      const { data: contents } = await window._supabase.from('kriteria_contents').select('*, content_media(*)').order('created_at', { ascending: false });
      if (contents) {
        config.forEach(k => {
          dbMap[k.id] = contents.filter(c => c.kriteria_id === k.id).map(c => mapDbRowToItem(c));
          localStorage.setItem(k.storageKey, JSON.stringify(dbMap[k.id]));
        });
        localStorage.setItem("db_kriteria_config_v1", JSON.stringify(config));
      } else {
        config.forEach(k => dbMap[k.id] = []);
      }
    } else {
      console.warn("Supabase not available in public-app");
    }

    // Re-render columns & grids
    renderHeaderTabs();
    renderNewsGridColumns();
    renderGoogleNewsGrid();
    
    // Update footer contacts
    const rawWa = (profile?.wa || localStorage.getItem("profile_wa_v5") || "").trim();
    const rawFb = (profile?.fb || localStorage.getItem("profile_fb_v5") || "").trim();
    const rawEm = (profile?.email || localStorage.getItem("profile_email_v5") || "").trim();

    const waEl = document.getElementById("ftWA");
    const fbEl = document.getElementById("ftFB");
    const emEl = document.getElementById("ftEmail");

    if(waEl) {
      if(!rawWa) waEl.href = '#';
      else {
        let waHref = rawWa;
        const digits = rawWa.replace(/[^\d\+]/g, '');
        if(/^\+?\d{6,}$/.test(digits)) {
          const num = digits.replace(/^\+/, '');
          waHref = `https://wa.me/${num}`;
        } else if(!/^https?:\/\//i.test(waHref)) {
          waHref = 'https://' + waHref;
        }
        waEl.href = waHref;
        waEl.target = '_blank';
      }
    }

    if(fbEl) {
      if(!rawFb) fbEl.href = '#';
      else {
        let fbHref = rawFb;
        if(!/^https?:\/\//i.test(fbHref)) fbHref = `https://facebook.com/${fbHref.replace(/^@/, '')}`;
        fbEl.href = fbHref;
        fbEl.target = '_blank';
      }
    }

    if(emEl) {
      if(!rawEm) emEl.href = 'mailto:admin@domain.com';
      else emEl.href = `mailto:${rawEm}`;
    }
    hideSkeleton();
    if (typeof attachScrollObserver === 'function') {
      attachScrollObserver();
    }
  }


  const thumbEdu = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=150";
  const thumbRes = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=150";
  const thumbSrv = "https://images.unsplash.com/photo-1461532257341-81d394aec826?q=80&w=150";

  function renderHeaderTabs() {
    const container = document.getElementById("headerTabsContainer");
    if (!container) return;
    let html = `<span id="tab-all" class="nav-tab-item active" onclick="routeToEtalase()">Beranda</span>`;
    config.forEach(k => {
      html += `<span id="tab-${k.id}" class="nav-tab-item" onclick="routeToDetailKriteria('${k.id}')">${k.label}</span>`;
    });
    container.innerHTML = html;
  }

  function renderNewsGridColumns() {
    const container = document.getElementById("dynamicNewsGrid");
    if (!container) return;

    let sortedConfig = [...config];
    sortedConfig.sort((a, b) => {
      const dbA = dbMap[a.id] || [];
      const dbB = dbMap[b.id] || [];
      const maxA = dbA.length > 0 ? Math.max(...dbA.map(i => i.timestamp || 0)) : 0;
      const maxB = dbB.length > 0 ? Math.max(...dbB.map(i => i.timestamp || 0)) : 0;
      return maxB - maxA;
    });

    let html = "";
    sortedConfig.forEach((k, idx) => {
      html += `
        <div class="news-card-column" style="--col-index: ${idx};">
          <div class="card-brand-header">
            <div class="brand-meta-title clickable-text" onclick="routeToDetailKriteria('${k.id}')">
              ${k.label}
            </div>
          </div>
          <div id="colStack-${k.id}" class="news-items-stack"></div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  renderHeaderTabs();
  renderNewsGridColumns();

  sysName = localStorage.getItem("profile_name_v5") || "Nama Pemilik Website";

  document.getElementById("profileOwnerName").textContent = sysName;
  const copyrightEl = document.getElementById('copyrightText');
  if (copyrightEl) copyrightEl.textContent = `© 2026 - ${sysName}`;

  const brandNameEl = document.getElementById('brandName') || document.querySelector('.brand-logo-zone');
  if (brandNameEl) brandNameEl.textContent = sysName;

  // Set dynamic page title
  document.title = sysName + " - Portofolio Tri Dharma";

  const cachedDegree = localStorage.getItem("profile_degree_v5");
  if (cachedDegree) {
    const degreeEl = document.getElementById("profileDegreeTitle");
    if (degreeEl) degreeEl.textContent = cachedDegree;
  }

  const cachedBio = localStorage.getItem("profile_bio_v5");
  if (cachedBio) {
    const bioEl = document.getElementById("profileBioText");
    if (bioEl) bioEl.textContent = cachedBio;
  }

  const cachedPhoto = localStorage.getItem("profile_avatar_v5");
  if (cachedPhoto) {
    const imgEl = document.getElementById("mainProfileImg");
    if (imgEl) imgEl.src = cachedPhoto;
  }
  hideSkeleton();

  // Navigation history tracker
  let currentViewContext = "all";

  // Normalize and set contact links (WA / FB / Email)
  (function setFooterContacts(){
    const rawWa = (localStorage.getItem("profile_wa_v5") || "").trim();
    const rawFb = (localStorage.getItem("profile_fb_v5") || "").trim();
    const rawEm = (localStorage.getItem("profile_email_v5") || "").trim();

    const waEl = document.getElementById("ftWA");
    const fbEl = document.getElementById("ftFB");
    const emEl = document.getElementById("ftEmail");

    if(waEl) {
      if(!rawWa) waEl.href = '#';
      else {
        let waHref = rawWa;
        const digits = rawWa.replace(/[^\d\+]/g, '');
        if(/^\+?\d{6,}$/.test(digits)) {
          const num = digits.replace(/^\+/, '');
          waHref = `https://wa.me/${num}`;
        } else if(!/^https?:\/\//i.test(waHref)) {
          waHref = 'https://' + waHref;
        }
        waEl.href = waHref;
        waEl.target = '_blank';
      }
    }

    if(fbEl) {
      if(!rawFb) fbEl.href = '#';
      else {
        let fbHref = rawFb;
        if(!/^https?:\/\//i.test(fbHref)) fbHref = `https://facebook.com/${fbHref.replace(/^@/, '')}`;
        fbEl.href = fbHref;
        fbEl.target = '_blank';
      }
    }

    if(emEl) {
      if(!rawEm) emEl.href = 'mailto:admin@domain.com';
      else emEl.href = `mailto:${rawEm}`;
    }
  })();



  // Profile button: go direct to dashboard when logged in, otherwise to admin login
  if(profileBtn) {
    profileBtn.addEventListener('click', () => {
      const logged = localStorage.getItem('isLoggedIn');
      if (logged === 'true') window.location.href = 'admin/';
      else window.location.href = 'admin.html';
    });
  }

  // Fix: safely handle clicks when event.target may be a text node
  document.body.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : e.target.parentElement;
    const el = target ? target.closest("h2, h3, h4, p, .brand-meta-title") : null;
    if (el && !el.closest('.btn-follow-star')) {
      el.classList.add("clicked-blue");
      setTimeout(() => {
        el.classList.remove("clicked-blue");
      }, 1500);
    }
  });

  /* ========================================
     DATE & RELATIVE TIME PARSER
     ======================================== */
  function parseIndoDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const months = {
      'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
      'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
    };
    try {
      const clean = dateStr.toLowerCase().replace(/pukul/g, ' ').replace(/:/g, '.').trim();
      const parts = clean.split(/\s+/);
      if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const monthName = parts[1];
        const month = months[monthName] !== undefined ? months[monthName] : 4;
        const year = parseInt(parts[2], 10);
        let hour = 12;
        let minute = 0;
        if (parts.length >= 4) {
          const timeParts = parts[3].split('.');
          if (timeParts.length >= 2) {
            hour = parseInt(timeParts[0], 10);
            minute = parseInt(timeParts[1], 10);
          }
        }
        return new Date(year, month, day, hour, minute).getTime();
      }
    } catch (e) { }
    return null;
  }

  function getRelativeTime(timestamp, fallbackStr) {
    let timeMs = timestamp;
    if (!timeMs && fallbackStr) {
      timeMs = parseIndoDate(fallbackStr);
    }
    if (!timeMs) return "Baru saja";

    const diffMs = Date.now() - timeMs;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return "Kemarin";
    return `${diffDays} hari yang lalu`;
  }

  /* ========================================
     ATTACHMENT, REFERENCE, & LINK PARSER
     ======================================== */
  function linkify(text) {
    if (!text) return "";
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return escaped.replace(urlRegex, function (url) {
      const finalUrl = wrapUrlInGoogleDocsViewer(url);
      return `<a href="${finalUrl}" target="_blank" style="color: var(--accent-blue); text-decoration: underline;">${url}</a>`;
    });
  }

  function renderAttachments(entry, index, type) {
    let html = '';

    // Check if there is an uploaded file or link in entry.file
    if (entry.file) {
      const isBase64 = entry.file.startsWith('data:');
      if (isBase64) {
        const mimeMatch = entry.file.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : '';

        if (mimeType.startsWith('image/')) {
          let fileIcon = 'ri-image-line';
          let fileLabel = 'Buka Lampiran Gambar';
          html += `
            <div class="attachment-action-box">
              <button class="premium-download-btn" onclick="window.open('${entry.file}', '_blank')">
                <i class="${fileIcon}"></i> ${fileLabel}
              </button>
            </div>
          `;
        } else {
          // Document downloads
          let fileIcon = 'ri-file-line';
          let fileLabel = 'Unduh Lampiran';

          if (mimeType.includes('pdf')) {
            fileIcon = 'ri-file-pdf-line';
            fileLabel = 'Buka / Unduh Lampiran PDF';
          } else if (mimeType.includes('word') || mimeType.includes('msword') || mimeType.includes('officedocument.wordprocessingml')) {
            fileIcon = 'ri-file-word-line';
            fileLabel = 'Unduh Dokumen Word';
          } else if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('officedocument.spreadsheetml')) {
            fileIcon = 'ri-file-excel-line';
            fileLabel = 'Unduh Berkas Excel';
          } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType.includes('officedocument.presentationml')) {
            fileIcon = 'ri-file-ppt-line';
            fileLabel = 'Unduh Presentasi PPT';
          } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('octet-stream')) {
            fileIcon = 'ri-folder-zip-line';
            fileLabel = 'Unduh Berkas Kompresi (ZIP/RAR)';
          }

          html += `
            <div class="attachment-action-box">
              <button class="premium-download-btn" onclick="openBase64File(${index}, '${type}')">
                <i class="${fileIcon}"></i> ${fileLabel}
              </button>
            </div>
          `;
        }
      } else {
        // It's a plain text URL in the file field
        html += renderUrlButton(entry.file);
      }
    }

    if (html) {
      return `
        <h4 style="font-size:18px; font-weight:700; color:var(--text-main); margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Lampiran</h4>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${html}
        </div>
      `;
    }
    return '';
  }

  function renderReferences(entry) {
    let html = '';

    // Check if there are external links (entry.link or entry.doiLink)
    if (entry.link) {
      html += renderUrlButton(entry.link, 'Sumber Jurnal / Link Eksternal');
    }
    if (entry.doiLink) {
      html += renderUrlButton(entry.doiLink, `DOI: ${entry.doi || 'Tautan DOI'}`);
    }

    if (html) {
      return `
        <h4 style="font-size:18px; font-weight:700; color:var(--text-main); margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Referensi</h4>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${html}
        </div>
      `;
    }
    return '';
  }

    function renderUrlButton(url, defaultLabel = 'Buka Lampiran') {
    if (!url) return '';
    url = url.trim();

    let label = defaultLabel;
    let icon = 'ri-external-link-line';

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      label = 'Video Materi'; icon = 'ri-youtube-fill';
    } else if (url.includes('github.com')) {
      label = 'Repositori GitHub'; icon = 'ri-github-fill';
    }

    const finalUrl = wrapUrlInGoogleDocsViewer(getDriveViewerUrl(url));

    return `
      <div style="margin-top: 24px; display: flex;">
        <a href="${finalUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: all 0.2s ease-in-out;" onmouseover="this.style.backgroundColor='#1d4ed8'; this.style.transform='translateY(-2px)'" onmouseout="this.style.backgroundColor='#2563eb'; this.style.transform='translateY(0)'">
          <i class="${icon}" style="font-size: 18px;"></i>
          ${label}
        </a>
      </div>
    `;
  }
/* ========================================
     IMAGE SLIDER (CAROUSEL) ENGINE
     ======================================== */
  window.appSliders = {};

  window.buildSliderHtml = function(photos, sliderId) {
    if (!photos || photos.length === 0) return '';
    if (photos.length === 1) {
      return `<div class="article-thumbnail"><img src="${photos[0]}" loading="lazy"></div>`;
    }

    window.appSliders[sliderId] = {
      currentIndex: 0,
      total: photos.length,
      interval: null
    };

    let tracks = photos.map((src, i) => `
      <div class="slider-slide">
        <img src="${src}" loading="lazy" alt="Image ${i+1}">
      </div>
    `).join('');

    let dots = photos.map((_, i) => `
      <div class="slider-dot ${i === 0 ? 'active' : ''}" onclick="event.stopPropagation(); window.goToSlide('${sliderId}', ${i})"></div>
    `).join('');

    // Start auto-slide slightly delayed
    setTimeout(() => { window.startAutoSlide(sliderId); }, 500);

    return `
      <div class="slider-container" id="slider-${sliderId}" onclick="event.stopPropagation()">
        <div class="slider-track" id="track-${sliderId}">
          ${tracks}
        </div>
        <button type="button" class="slider-btn prev" onclick="event.stopPropagation(); window.moveSlide('${sliderId}', -1)">
          <i class="ri-arrow-left-s-line"></i>
        </button>
        <button type="button" class="slider-btn next" onclick="event.stopPropagation(); window.moveSlide('${sliderId}', 1)">
          <i class="ri-arrow-right-s-line"></i>
        </button>
        <div class="slider-dots" id="dots-${sliderId}">
          ${dots}
        </div>
      </div>
    `;
  };

  window.moveSlide = function(sliderId, direction) {
    const state = window.appSliders[sliderId];
    if (!state) return;
    let newIndex = state.currentIndex + direction;
    if (newIndex < 0) newIndex = state.total - 1;
    if (newIndex >= state.total) newIndex = 0;
    window.goToSlide(sliderId, newIndex);
  };

  window.goToSlide = function(sliderId, index) {
    const state = window.appSliders[sliderId];
    if (!state) return;
    state.currentIndex = index;
    
    const track = document.getElementById(`track-${sliderId}`);
    if (track) {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
    
    const dotsContainer = document.getElementById(`dots-${sliderId}`);
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.slider-dot');
      dots.forEach((dot, i) => {
        if (i === index) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    }
    
    window.startAutoSlide(sliderId);
  };

  window.startAutoSlide = function(sliderId) {
    const state = window.appSliders[sliderId];
    if (!state) return;
    if (state.interval) clearInterval(state.interval);
    
    state.interval = setInterval(() => {
      const el = document.getElementById(`slider-${sliderId}`);
      if (!el) {
        clearInterval(state.interval);
        return;
      }
      let newIndex = state.currentIndex + 1;
      if (newIndex >= state.total) newIndex = 0;
      
      state.currentIndex = newIndex;
      const track = document.getElementById(`track-${sliderId}`);
      if (track) track.style.transform = `translateX(-${newIndex * 100}%)`;
      
      const dotsContainer = document.getElementById(`dots-${sliderId}`);
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
          if (i === newIndex) dot.classList.add('active');
          else dot.classList.remove('active');
        });
      }
    }, 3000);
  };

  /* ========================================
     HOMEPAGE RENDER (HORIZONTAL CARDS)
     ======================================== */
  function renderGoogleNewsGrid() {
    config.forEach(k => {
      const stackEl = document.getElementById(`colStack-${k.id}`);
      if (!stackEl) return;
      
      const db = dbMap[k.id] || [];
      if (db.length === 0) {
        stackEl.innerHTML = `<p class="empty-stack-info">Belum ada dokumen ${k.label.toLowerCase()}.</p>`;
      } else {
        let html = "";
        let displayList = db.map((item, index) => ({ item, index }));
        displayList.sort((a, b) => b.item.timestamp - a.item.timestamp);
        
        displayList.forEach((wrapper, cardIdx) => {
          const item = wrapper.item;
          const index = wrapper.index;
          
          const photos = (Array.isArray(item.photo) ? item.photo : (item.photo ? [item.photo] : [])).map(convertDriveUrl);
          let photoSrc = (photos.length > 0 && photos[0]) ? photos[0] : "";
          if (!photoSrc) {
            if (k.id === 'edu') {
              photoSrc = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80";
            } else if (k.id === 'res') {
              photoSrc = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80";
            } else {
              photoSrc = "https://images.unsplash.com/photo-1559027615-cd4486d23a30?auto=format&fit=crop&w=600&q=80";
            }
          }
          const hasRealPhoto = item.hasCustomPhoto || (
            photoSrc &&
            photoSrc !== DEFAULT_IMAGE &&
            !photoSrc.includes("photo-1434030216411-0b793f4b4173") &&
            !photoSrc.includes("photo-1454165804606-c3d57bc86b40") &&
            !photoSrc.includes("photo-1559027615-cd4486d23a30")
          );
          const mediaHtml = hasRealPhoto ? `
            <div class="w-full h-[180px] overflow-hidden flex-shrink-0 news-media-wrap">
              <img src="${photoSrc}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';" />
            </div>
          ` : '';

          const relativeTime = getRelativeTime(item.timestamp, item.publishDate);
          const tagRow = `
            <div class="flex items-center justify-between w-full mb-2">
              <span class="news-badge text-[10px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider">
                ${k.label}
              </span>
              <span class="news-time text-xs flex items-center gap-1">
                <i class="ri-time-line"></i> ${relativeTime}
              </span>
            </div>
          `;

          const titleHtml = `
            <h3 class="news-title font-bold text-base mt-1 mb-2 line-clamp-2 transition-colors" title="${item.title}">
              ${item.title}
            </h3>
          `;

          const descHtml = `
            <p class="news-desc text-xs leading-relaxed line-clamp-3">
              ${item.desc || 'Deskripsi tidak tersedia'}
            </p>
          `;

          html += `
            <div class="group flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 card-${k.id} homepage-news-card article-card" 
                 onclick="showParentDetail(${index}, '${k.id}')">
              ${mediaHtml}
              <div class="p-4 flex flex-col flex-grow">
                ${tagRow}
                ${titleHtml}
                ${descHtml}
              </div>
            </div>
          `;
        });
        stackEl.innerHTML = html;
      }
    });
  }

  window.routeToEtalase = function () {
    currentViewContext = "all";
    switchActiveTabIndicator("tab-all");
    paneSingleKriteria.classList.remove("active");
    paneDetailArtikel.classList.remove("active");
    paneMainGrid.classList.add("active");
    newsGlobalSearch.value = "";
    triggerLiveSearchFilter("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.routeToDetailKriteria = function (kriteriaKey, directIndex) {
    currentViewContext = kriteriaKey;
    switchActiveTabIndicator("tab-" + kriteriaKey);
    paneMainGrid.classList.remove("active");
    paneDetailArtikel.classList.remove("active");
    paneSingleKriteria.classList.add("active");
    verticalFullListContainer.innerHTML = "";
    newsGlobalSearch.value = "";

    // Reset container style
    verticalFullListContainer.style.border = '';
    verticalFullListContainer.style.boxShadow = '';
    verticalFullListContainer.style.background = '';
    verticalFullListContainer.style.padding = '';
    verticalFullListContainer.style.maxWidth = '';
    
    verticalFullListContainer.className = '';
    // Force inline override to guarantee no dark box and align left for ALL tabs
    verticalFullListContainer.style.background = 'transparent';
    verticalFullListContainer.style.padding = '0';
    verticalFullListContainer.style.margin = '0';
    verticalFullListContainer.style.width = '100%';
    verticalFullListContainer.style.boxShadow = 'none';
    verticalFullListContainer.style.border = 'none';

    if (directIndex !== undefined) {
      const db = dbMap[kriteriaKey] || [];
      const targetData = db[directIndex];
      if (targetData) {
        showParentDetail(directIndex, kriteriaKey);
        return;
      }
    }

    // Helper: build gallery items
    function buildGalleryItemsFrom(entries, typeId) {
      const gallery = [];
      const k = config.find(c => c.id === typeId);
      const defaultThumb = typeId === 'edu' ? thumbEdu : (typeId === 'res' ? thumbRes : (typeId === 'srv' ? thumbSrv : "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=150"));
      
      entries.forEach((entry, pIdx) => {
        const photos = (Array.isArray(entry.photo) ? entry.photo : (entry.photo ? [entry.photo] : [])).map(convertDriveUrl);
        const hasRealPhoto = entry.hasCustomPhoto === true || (
          photos.length > 0 &&
          photos[0] !== DEFAULT_IMAGE && 
          !photos[0].includes("photo-1434030216411-0b793f4b4173") &&
          !photos[0].includes("photo-1454165804606-c3d57bc86b40") &&
          !photos[0].includes("photo-1559027615-cd4486d23a30")
        );
        gallery.push({
          photo: photos.length ? photos[0] : null,
          photos: photos,
          hasOriginalPhoto: hasRealPhoto,
          title: entry.title,
          desc: entry.desc || '',
          file: entry.file || '',
          publishDate: entry.publishDate || '',
          timestamp: entry.timestamp || null,
          course: entry.course || '',
          teacher: entry.teacher || '',
          parentIndex: pIdx
        });
      });
      gallery.sort((a, b) => b.timestamp - a.timestamp);
      return gallery;
    }

    /* ========================================
       CATEGORY SINGLE COLUMN LAYOUT
       ======================================== */
    function renderGalleryPage(galleryItems, page, type) {
      const perPage = 6;
      const totalPages = Math.max(1, Math.ceil(galleryItems.length / perPage));
      const cur = Math.min(Math.max(1, page), totalPages);
      const start = (cur - 1) * perPage;
      const slice = galleryItems.slice(start, start + perPage);

      verticalFullListContainer.innerHTML = '';

      if (slice.length === 0) {
        verticalFullListContainer.innerHTML = `<p class="empty-stack-info">Tidak ada berkas/dokumen untuk ditampilkan.</p>`;
        return;
      }

      const k = config.find(c => c.id === type);
      const kLabel = k ? k.label : type;

      let columnHtml = '';
      
      columnHtml += '<div class="w-full flex flex-col items-start justify-start text-left mt-6">';
      columnHtml += '<div class="w-full flex flex-col gap-6">';
      
      slice.forEach((gi, idx) => {
        const relTime = getRelativeTime(gi.timestamp, gi.publishDate);
        const courseText = gi.course || (gi.year ? `Tahun: ${gi.year}` : null) || kLabel;
        const teacherText = gi.teacher || gi.mitra || sysName;
        const imgClass = "w-auto max-w-full md:max-w-[224px] h-auto max-h-[300px] object-cover rounded-lg flex-shrink-0";
        
        let mediaHtml = '';
        if (gi.hasOriginalPhoto) {
          mediaHtml = window.buildSliderHtml(gi.photos, `gallery-${idx}`);
        }
            
        columnHtml += `
          <div class="w-full flex flex-col md:flex-row gap-4 mb-6 gallery-list-item" style="cursor:pointer; --card-index: ${idx};" onclick="showParentDetail(${gi.parentIndex}, '${type}')">
            ${mediaHtml}
            
            <!-- Teks -->
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <!-- Judul -->
              <h3 class="text-lg font-bold hover:text-blue-500 cursor-pointer" style="color: var(--text-main);">
                ${gi.title}
              </h3>
              
              <!-- Baris 1: Mata Kuliah & Dosen -->
              <div class="text-sm mt-1" style="color: var(--text-muted);">
                ${courseText} <span class="mx-1">&bull;</span> Dosen: ${teacherText}
              </div>
              
              <!-- Baris 2: Waktu -->
              <div class="text-sm mt-0.5" style="color: var(--text-muted); opacity: 0.8;">
                ${relTime}
              </div>
            </div>
          </div>
        `;
      });
      columnHtml += '</div></div>';
      
      verticalFullListContainer.innerHTML = columnHtml;

      if (totalPages > 1) {
        let pagerHtml = '<div style="text-align:center; margin-top:32px; display:flex; justify-content:center; align-items:center; gap:16px; margin-bottom:48px;">';
        if (cur > 1) pagerHtml += `<button class="btn-submit" onclick="renderGalleryPageWindow(${cur - 1}, '${type}')">&#9664; Prev</button>`;
        pagerHtml += ` <span style="font-weight:600; font-size:14px; color:var(--text-main);">Page ${cur} / ${totalPages}</span>`;
        if (cur < totalPages) pagerHtml += `<button class="btn-submit" onclick="renderGalleryPageWindow(${cur + 1}, '${type}')">Next &#9654;</button>`;
        pagerHtml += '</div>';
        verticalFullListContainer.innerHTML += pagerHtml;
      }
    }

    window.renderGalleryPageWindow = function (page, type) {
      const db = dbMap[type] || [];
      const gallery = buildGalleryItemsFrom(db, type);
      renderGalleryPage(gallery, page, type);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const targetKConfig = config.find(c => c.id === kriteriaKey);
    if (targetKConfig) {
      targetKriteriaName.textContent = targetKConfig.label;
      const db = dbMap[kriteriaKey] || [];
      const gallery = buildGalleryItemsFrom(db, kriteriaKey);
      renderGalleryPage(gallery, 1, kriteriaKey);
    }
  };

    /* ========================================
       MODAL DETAIL ENGINE (NOW INLINE PANE)
       ======================================== */
    window.showParentDetail = function (parentIndex, type) {
      const currentDb = dbMap[type] || [];
      const entry = currentDb[parentIndex];
      if (!entry) return;

      // Switch Pane Direct Transition
      paneMainGrid.classList.remove("active");
      paneSingleKriteria.classList.remove("active");
      paneDetailArtikel.classList.add("active");

      const photos = Array.isArray(entry.photo) ? entry.photo : (entry.photo ? [entry.photo] : []);
      
      const defaultThumb = type === 'edu' ? thumbEdu : (type === 'res' ? thumbRes : (type === 'srv' ? thumbSrv : "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=150"));
      const mainImg = photos.length ? photos[0] : defaultThumb;

      // Title
      document.getElementById('detailArticleTitle').textContent = entry.title;

      // Meta row: Mata Kuliah • Nama Dosen • Waktu Relatif
      const k = config.find(c => c.id === type);
      const kLabel = k ? k.label : type;
      let metaItems = [];
      if (entry.course) metaItems.push(`Mata Kuliah: ${entry.course}`);
      if (entry.teacher) metaItems.push(`Pelaksana: ${entry.teacher}`);
      if (entry.year) metaItems.push(`Tahun: ${entry.year}`);
      if (entry.mitra) metaItems.push(`Lokasi/Mitra: ${entry.mitra}`);
      if (entry.doi) metaItems.push(`DOI: ${entry.doi}`);
      
      if (metaItems.length === 0) {
        metaItems.push(kLabel);
        metaItems.push(sysName);
      }
      
      const relTime = getRelativeTime(entry.timestamp, entry.publishDate);
      metaItems.push(relTime);
      document.getElementById('detailArticleMeta').textContent = metaItems.join(' • ');

      const hasRealPhoto = entry.hasCustomPhoto || (
        photos.length > 0 &&
        photos[0] !== DEFAULT_IMAGE &&
        !photos[0].includes("photo-1434030216411-0b793f4b4173") &&
        !photos[0].includes("photo-1454165804606-c3d57bc86b40") &&
        !photos[0].includes("photo-1559027615-cd4486d23a30")
      );

      // Render Images as Carousel
      const mediaContainer = document.getElementById('detailArticleMediaContainer');
      if (mediaContainer) {
        mediaContainer.innerHTML = '';
        if (!hasRealPhoto) {
          mediaContainer.style.display = 'none';
        } else {
          mediaContainer.style.display = 'flex';
          photos.forEach(ph => {
            const tImg = document.createElement('img');
            tImg.src = convertDriveUrl(ph);
            tImg.className = 'carousel-item-img';
            mediaContainer.appendChild(tImg);
          });

          // Reset scroll
          mediaContainer.scrollLeft = 0;

          // Auto-scroll logic (every 3 seconds)
          if (window.carouselInterval) clearInterval(window.carouselInterval);
          if (photos.length > 1) {
            window.carouselInterval = setInterval(() => {
              if (!document.getElementById('pane-detail-artikel').classList.contains('active')) {
                clearInterval(window.carouselInterval);
                return;
              }
              const maxScroll = mediaContainer.scrollWidth - mediaContainer.clientWidth;
              if (mediaContainer.scrollLeft >= maxScroll - 10) {
                // If at the end, reset to 0
                mediaContainer.scrollTo({ left: 0, behavior: 'smooth' });
              } else {
                // Scroll by container width
                mediaContainer.scrollBy({ left: mediaContainer.clientWidth, behavior: 'smooth' });
              }
            }, 3000);
          }
        }
      }

      // Split description into abstract and body to avoid duplication
      let abstract = "";
      let body = entry.desc || "";

      if (body.includes('\n')) {
        const paragraphs = body.split('\n');
        abstract = paragraphs[0].trim();
        body = paragraphs.slice(1).join('\n').trim();
        if (!body) {
          body = abstract;
          abstract = "";
        }
      } else {
        body = entry.desc || "";
        abstract = "";
      }

      const briefEl = document.getElementById('detailArticleBrief');
      if (abstract) {
        briefEl.innerHTML = linkify(abstract);
        briefEl.style.display = 'block';
      } else {
        briefEl.style.display = 'none';
      }

      const bodyEl = document.getElementById('detailArticleBody');
      if (bodyEl) {
        bodyEl.innerHTML = linkify(body) || 'Tidak ada deskripsi tambahan.';
      }

      // Attachment
      const attachArea = document.getElementById('detailArticleAttachments');
      if (attachArea) {
        attachArea.innerHTML = renderAttachments(entry, parentIndex, type);
      }

      // References
      const referencesArea = document.getElementById('detailArticleReferences');
      if (referencesArea) {
        referencesArea.innerHTML = renderReferences(entry);
      }

      // Related Posts
      const relatedArea = document.getElementById('detailArticleRelated');
      if (relatedArea) {
        relatedArea.innerHTML = renderRelatedPosts(currentDb, parentIndex, type);
      }

      // Sidebar Related Posts
      const sidebarArea = document.getElementById('detailArticleSidebar');
      if (sidebarArea) {
        sidebarArea.innerHTML = renderSidebarRelatedPosts(currentDb, parentIndex, type);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /* ========================================
       SIDEBAR RELATED POSTS GENERATOR
       ======================================== */
    function renderSidebarRelatedPosts(currentDb, currentIndex, type) {
      let related = currentDb.filter((_, idx) => idx !== currentIndex).slice(0, 4);
      if (related.length === 0) return '';

      let html = '<h4 style="font-size:18px; font-weight:700; color:var(--text-main); margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Artikel Terkait</h4>';
      html += '<div style="display:flex; flex-direction:column; gap:16px;">';

      const k = config.find(c => c.id === type);
      const kLabel = k ? k.label : type;

      related.forEach(item => {
        const idx = currentDb.indexOf(item);
        
        // Find or fallback photo
        const photos = (Array.isArray(item.photo) ? item.photo : (item.photo ? [item.photo] : [])).map(convertDriveUrl);
        let photoSrc = (photos.length > 0 && photos[0]) ? photos[0] : "";
        if (!photoSrc) {
          if (type === 'edu') {
            photoSrc = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80";
          } else if (type === 'res') {
            photoSrc = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80";
          } else {
            photoSrc = "https://images.unsplash.com/photo-1559027615-cd4486d23a30?auto=format&fit=crop&w=600&q=80";
          }
        }
        
        const relTime = getRelativeTime(item.timestamp, item.publishDate);
        const hasRealPhoto = item.hasCustomPhoto || (
          photos.length > 0 &&
          photos[0] !== DEFAULT_IMAGE &&
          !photos[0].includes("photo-1434030216411-0b793f4b4173") &&
          !photos[0].includes("photo-1454165804606-c3d57bc86b40") &&
          !photos[0].includes("photo-1559027615-cd4486d23a30")
        );

        const mediaHtml = hasRealPhoto ? `
          <div class="w-full h-[80px] overflow-hidden flex-shrink-0 news-media-wrap">
            <img src="${photoSrc}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';" />
          </div>
        ` : '';

        html += `
          <div class="group flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 card-${type} homepage-news-card article-card" 
               style="margin-bottom: 0px;"
               onclick="showParentDetail(${idx}, '${type}')">
            
            ${mediaHtml}
            
            <div class="p-3 flex flex-col flex-grow">
              <div class="flex items-center justify-between w-full mb-1">
                <span class="news-badge text-[9px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                  ${kLabel}
                </span>
                <span class="news-time text-[10px] flex items-center gap-1">
                  <i class="ri-time-line"></i> ${relTime}
                </span>
              </div>
              <h3 class="news-title font-bold text-xs mt-1 line-clamp-2 transition-colors" title="${item.title}">
                ${item.title}
              </h3>
            </div>
          </div>
        `;
      });

      html += '</div>';
      return html;
    }

    /* ========================================
       RELATED POSTS GENERATOR
       ======================================== */
    function renderRelatedPosts(currentDb, currentIndex, type) {
      let related = currentDb.filter((_, idx) => idx !== currentIndex).slice(0, 3);
      if (related.length === 0) return '';

      let html = '<h4 style="font-size:18px; font-weight:700; color:var(--text-main); margin-top:32px; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Artikel Terkait</h4>';
      html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-6" style="margin-top: 16px;">';

      const k = config.find(c => c.id === type);
      const kLabel = k ? k.label : type;

      related.forEach(item => {
        const idx = currentDb.indexOf(item);
        const relTime = getRelativeTime(item.timestamp, item.publishDate);
        
        // Find or fallback photo
        const photos = (Array.isArray(item.photo) ? item.photo : (item.photo ? [item.photo] : [])).map(convertDriveUrl);
        let photoSrc = (photos.length > 0 && photos[0]) ? photos[0] : "";
        if (!photoSrc) {
          if (type === 'edu') {
            photoSrc = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80";
          } else if (type === 'res') {
            photoSrc = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80";
          } else {
            photoSrc = "https://images.unsplash.com/photo-1559027615-cd4486d23a30?auto=format&fit=crop&w=600&q=80";
          }
        }

        const hasRealPhoto = item.hasCustomPhoto || (
          photos.length > 0 &&
          photos[0] !== DEFAULT_IMAGE &&
          !photos[0].includes("photo-1434030216411-0b793f4b4173") &&
          !photos[0].includes("photo-1454165804606-c3d57bc86b40") &&
          !photos[0].includes("photo-1559027615-cd4486d23a30")
        );

        const mediaHtml = hasRealPhoto ? `
          <div class="w-full h-[120px] overflow-hidden flex-shrink-0 news-media-wrap">
            <img src="${photoSrc}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';" />
          </div>
        ` : '';

        const tagRow = `
          <div class="flex items-center justify-between w-full mb-2">
            <span class="news-badge text-[10px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider">
              ${kLabel}
            </span>
            <span class="news-time text-xs flex items-center gap-1">
              <i class="ri-time-line"></i> ${relTime}
            </span>
          </div>
        `;

        const titleHtml = `
          <h3 class="news-title font-bold text-sm mt-1 mb-2 line-clamp-2 transition-colors" title="${item.title}">
            ${item.title}
          </h3>
        `;

        const descHtml = `
          <p class="news-desc text-xs leading-relaxed line-clamp-3">
            ${item.desc || 'Deskripsi tidak tersedia'}
          </p>
        `;

        html += `
          <div class="group flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 card-${type} homepage-news-card article-card" 
               style="margin-bottom: 0px;"
               onclick="showParentDetail(${idx}, '${type}')">
            ${mediaHtml}
            <div class="p-4 flex flex-col flex-grow">
              ${tagRow}
              ${titleHtml}
              ${descHtml}
            </div>
          </div>
        `;
      });

      html += '</div>';
      return html;
    }

    // Back Button Navigation
    window.goBackFromDetail = function () {
      if (currentViewContext === "all") {
        window.routeToEtalase();
      } else {
        window.routeToDetailKriteria(currentViewContext);
      }
    };

    function switchActiveTabIndicator(targetTabId) {
      document.querySelectorAll(".nav-tab-item").forEach(tab => tab.classList.remove("active"));
      const targetElement = document.getElementById(targetTabId);
      if (targetElement) {
        targetElement.classList.add("active");
      }
    }

    newsGlobalSearch.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase().trim();
      triggerLiveSearchFilter(keyword);
    });

    newsGlobalSearch.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const keyword = newsGlobalSearch.value.toLowerCase().trim();
      if (!keyword) return;

      let results = [];
      for (const k of config) {
        const db = getDb(k.id);
        db.forEach((item, idx) => {
          if (
            (item.title || "").toLowerCase().includes(keyword) ||
            (item.desc || "").toLowerCase().includes(keyword)
          ) {
            results.push({ item, idx, kriteriaId: k.id, kriteriaLabel: k.label });
          }
        });
      }

      if (results.length === 0) {
        showSearchNotFound();
        return;
      }

      // Switch ke pane kriteria dan tampilkan hasil
      paneMainGrid.classList.remove("active");
      paneSingleKriteria.classList.add("active");
      paneDetailArtikel.classList.remove("active");
      if (targetKriteriaName) targetKriteriaName.textContent = "";

      verticalFullListContainer.innerHTML = `
        <h3 style="margin-bottom:16px; color:var(--text-main);">
          Hasil pencarian: "<strong>${keyword}</strong>" (${results.length} ditemukan)
        </h3>
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${results.map((r, idx) => {
            const photos = (Array.isArray(r.item.photo) ? r.item.photo : (r.item.photo ? [r.item.photo] : [])).map(convertDriveUrl);
            const photoSrc = (photos.length > 0 && photos[0]) ? photos[0] : "";
            const hasRealPhoto = r.item.hasCustomPhoto || (
              photoSrc &&
              photoSrc !== DEFAULT_IMAGE &&
              !photoSrc.includes("photo-1434030216411-0b793f4b4173") &&
              !photoSrc.includes("photo-1454165804606-c3d57bc86b40") &&
              !photoSrc.includes("photo-1559027615-cd4486d23a30")
            );

            return `
              <div class="search-result-item" style="--card-index: ${idx}; display:flex; gap:16px; align-items:center; cursor:pointer; padding:12px; border-radius:12px; border:1px solid var(--border-color); background:var(--bg-card);" onclick="showParentDetail(${r.idx}, '${r.kriteriaId}')">
                ${hasRealPhoto ? `
                  <img src="${photoSrc}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0" onerror="this.style.display='none';" />
                ` : ''}
                <div>
                  <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">${r.item.title}</div>
                  <div style="font-size:12px; color:#3b82f6;">${r.kriteriaLabel}</div>
                  <div style="font-size:11px; color:var(--text-muted);">${getRelativeTime(r.item.timestamp, r.item.publishDate)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      newsGlobalSearch.blur();
    });

    function showSearchNotFound() {
      const existing = document.getElementById('searchNotFoundPopup');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'searchNotFoundPopup';
      toast.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e293b;
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 13px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      `;
      toast.innerHTML = `<i class="ri-search-line"></i> Artikel tidak ditemukan`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }

    function triggerLiveSearchFilter(queryString) {
      if (!queryString) {
        // Reset tampilan normal
        document.querySelectorAll(".article-card, .article-item").forEach(el => {
          el.style.display = el.classList.contains('article-card') ? "flex" : "block";
        });
        return;
      }

      let visibleCards = [];
      document.querySelectorAll(".article-card, .article-item").forEach(block => {
        if (block.textContent.toLowerCase().includes(queryString)) {
          block.style.display = block.classList.contains('article-card') ? "flex" : "block";
          visibleCards.push(block);
        } else {
          block.style.display = "none";
        }
      });

      // Jika hanya 1 hasil, langsung klik otomatis
      if (visibleCards.length === 1) {
        visibleCards[0].click();
      }
    }

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

    // Allow opening base64-attached files from the public site
    window.openBase64File = (index, type) => {
      const db = dbMap[type] || [];
      const dataItem = db[index];

      if (dataItem && dataItem.file) {
        const isBase64 = dataItem.file.startsWith('data:');
        if (isBase64) {
          const targetWindow = window.open();
          targetWindow.document.write(`<iframe src="${dataItem.file}" frameborder="0" style="border:0; position:fixed; top:0; left:0; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          const finalUrl = wrapUrlInGoogleDocsViewer(dataItem.file);
          window.open(finalUrl, '_blank');
        }
      } else {
        alert("Gagal memuat berkas, file lampiran kosong.");
      }
    };

    // Define scroll observer function
    attachScrollObserver = function() {
      try {
        const selector = '.article-card, .article-item, .profile-premium-box';
        const els = Array.from(document.querySelectorAll(selector));
        if (!els.length) return;

        els.forEach(el => {
          if (!el.classList.contains('animate-on-scroll')) {
            el.classList.add('animate-on-scroll');
          }
        });

        const obs = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });

        els.forEach(el => obs.observe(el));
      } catch (e) { }
    };

    // Initialize features
    if (window._supabase) {
      refreshUIFromCache();
    } else {
      renderGoogleNewsGrid();
    }
    attachScrollObserver();
    wrapAllDocumentLinksInDOM();
  });
