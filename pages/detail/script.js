/**
 * Detail Page - Enhanced Article Display
 * Features: Theme toggle, sharing, TOC, related articles
 */

document.addEventListener('DOMContentLoaded', function() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const body = document.body;
  const shareBtn = document.getElementById('shareBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModal = document.getElementById('closeShareModal');

  // ============================================
  // THEME TOGGLE
  // ============================================

  const savedTheme = localStorage.getItem('site_theme') || 'light';
  if (savedTheme === 'dark') {
    body.classList.add('dark');
  }

  themeToggleBtn.addEventListener('click', function() {
    const isDark = body.classList.toggle('dark');
    localStorage.setItem('site_theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
  });

  function updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    if (body.classList.contains('dark')) {
      themeIcon.classList.remove('ri-sun-line');
      themeIcon.classList.add('ri-moon-line');
    } else {
      themeIcon.classList.remove('ri-moon-line');
      themeIcon.classList.add('ri-sun-line');
    }
  }

  updateThemeIcon();

  // ============================================
  // BACK BUTTON
  // ============================================

  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.history.back();
  });

  // ============================================
  // SHARE FUNCTIONALITY
  // ============================================

  shareBtn.addEventListener('click', function() {
    shareModal.classList.add('show');
  });

  closeShareModal.addEventListener('click', function() {
    shareModal.classList.remove('show');
  });

  shareModal.addEventListener('click', function(e) {
    if (e.target === shareModal) {
      shareModal.classList.remove('show');
    }
  });

  // Share Functions
  function getShareData() {
    const title = document.getElementById('articleTitle').textContent;
    const url = window.location.href;
    return { title, url };
  }

  function shareToWhatsApp() {
    const { title, url } = getShareData();
    const text = `${title}\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'width=600,height=400');
    shareModal.classList.remove('show');
  }

  function shareToEmail() {
    const { title, url } = getShareData();
    const subject = `Baca: ${title}`;
    const bodyText = `Saya ingin berbagi artikel ini dengan Anda:\n\n${title}\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    shareModal.classList.remove('show');
  }

  function copyLink() {
    const { url } = getShareData();
    navigator.clipboard.writeText(url).then(() => {
      showSuccessModal({
        title: 'Link Disalin',
        message: 'Tautan artikel telah disalin ke clipboard.',
        buttonText: 'OK'
      });
      shareModal.classList.remove('show');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  // Share Button Listeners
  document.getElementById('shareWhatsApp').addEventListener('click', shareToWhatsApp);
  document.getElementById('shareEmail').addEventListener('click', shareToEmail);
  document.getElementById('shareCopy').addEventListener('click', copyLink);
  document.getElementById('shareModalWhatsApp').addEventListener('click', shareToWhatsApp);
  document.getElementById('shareModalEmail').addEventListener('click', shareToEmail);
  document.getElementById('shareModalCopy').addEventListener('click', copyLink);

  // ============================================
  // LOAD ARTICLE DATA (DYNAMIC)
  // ============================================

  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || 'edu'; 
  const id = params.get('id');

  const titleEl = document.querySelector('.detail-title');
  const dateEl = document.querySelector('.detail-date');
  const categoryEl = document.querySelector('.detail-category');
  const heroImg = document.getElementById('detailHeroImg');
  const heroCaption = document.getElementById('detailHeroCaption');
  const emptyEl = document.getElementById('detailEmptyState');
  const contentEl = document.getElementById('detailContent');

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

  function getMediaPath(url) {
    if (!url) return null;
    const str = String(url).trim();
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) {
      return str;
    }
    const cleanPath = str.replace(/^\/+/, '');
    if (cleanPath.startsWith('admin/uploads/')) {
      return '/' + cleanPath;
    }
    return '/admin/uploads/' + cleanPath;
  }

  function renderData(item, kConfig) {
    emptyEl.classList.add('hidden');
    
    // 1. Text & Meta
    titleEl.textContent = item.title || 'Tanpa Judul';
    dateEl.textContent = item.publishDate || 'Baru saja';
    categoryEl.textContent = kConfig ? kConfig.label : type;

    // 2. Safe Image Logic
    let photoSrc = null;
    if (item.photo) {
      const photos = Array.isArray(item.photo) ? item.photo : [item.photo];
      if (photos.length > 0) {
        photoSrc = convertDriveUrl(getMediaPath(photos[0]));
      }
    }

    if (photoSrc) {
      heroImg.src = photoSrc;
      heroImg.setAttribute('onerror', "this.style.display='none'; document.getElementById('detailHeroCaption').style.display='none';");
      heroImg.alt = item.title || 'Foto';
      heroImg.style.display = 'block';
      heroCaption.textContent = item.title || 'Foto Lampiran';
      heroCaption.style.display = 'block';
    } else {
      // Hide completely if no image, preserving layout cleanly
      heroImg.style.display = 'none';
      heroCaption.style.display = 'none';
    }

    // 3. Description & Body
    const blocks = [];
    const teacher = item.teacher || item.mitra || item.dosen || item.instructor || '';
    const course = item.course || (item.year ? `Tahun: ${item.year}` : '');
    const desc = item.desc || '';

    if (teacher) blocks.push(`<p><strong>Pelaksana/Dosen:</strong> ${teacher}</p>`);
    if (course) blocks.push(`<p><strong>Keterangan/Mata Kuliah:</strong> ${course}</p>`);
    if (desc) blocks.push(`<div style="margin-top:16px; line-height: 1.6;">${desc}</div>`);

    // 4. Safe Document Button (Lihat Lampiran)
    let link = item.file || item.link || item.url || '';
    const isBase64Doc = link.startsWith('data:');
    
    if (link && !isBase64Doc) {
      link = wrapUrlInGoogleDocsViewer(getDriveViewerUrl(getMediaPath(link)));
      blocks.push(`
        <div style="margin-top: 24px;">
          <a href="${link}" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:8px; padding:12px 24px; background:#2563eb; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-family:system-ui, -apple-system, sans-serif; transition:background 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
            Buka Lampiran Dokumen
          </a>
        </div>
      `);
    } else if (isBase64Doc) {
      blocks.push(`
        <div style="margin-top: 24px;">
          <button onclick="window.open('${link}', '_blank')" style="display:inline-flex; align-items:center; gap:8px; padding:12px 24px; background:#2563eb; color:#fff; border:none; cursor:pointer; border-radius:8px; font-weight:600; font-family:system-ui, -apple-system, sans-serif; transition:background 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
            Buka Lampiran (Base64)
          </button>
        </div>
      `);
    }

    if (blocks.length === 0) {
      contentEl.innerHTML = `<p style="color:#6b7280; font-style:italic;">Detail dan deskripsi tidak tersedia.</p>`;
    } else {
      contentEl.innerHTML = blocks.join('');
    }
  }

  function initDetail() {
    if (!id) {
      showError("ID Data tidak valid atau tidak ditemukan.");
      return;
    }

    try {
      const config = JSON.parse(localStorage.getItem("db_kriteria_config_v1")) || [
        { id: "edu", label: "Pendidikan", storageKey: "db_edu_v5" },
        { id: "res", label: "Penelitian", storageKey: "db_res_v5" },
        { id: "srv", label: "Pengabdian", storageKey: "db_srv_v5" }
      ];

      const kConfig = config.find(c => c.id === type);
      if (!kConfig) {
        showError("Kategori (type) tidak dikenali.");
        return;
      }

      const storageKey = kConfig.storageKey || `db_custom_${type}_v1`;
      const db = JSON.parse(localStorage.getItem(storageKey));
      
      console.log(`Fetched Detail Data for [${type}]:`, db);

      if (!db || !Array.isArray(db) || db.length === 0) {
        showError(`Tidak ada data portofolio untuk kategori ${kConfig.label}.`);
        return;
      }

      const item = db.find((d, idx) => String(d.id ?? d.docId ?? d.slug ?? d._id ?? idx) === String(id));
      if (item) {
        renderData(item, kConfig);
      } else {
        showError("Data tidak ditemukan berdasarkan ID tersebut.");
      }
    } catch (err) {
      console.error("Error loading detail data:", err);
      showError("Terjadi kesalahan sistem saat memuat data.");
    }
  }

  function showError(msg) {
    emptyEl.classList.remove('hidden');
    titleEl.textContent = 'Data Tidak Ditemukan';
    dateEl.textContent = '-';
    categoryEl.textContent = type ? type.toUpperCase() : 'Error';
    heroImg.style.display = 'none';
    heroCaption.style.display = 'none';
    contentEl.innerHTML = `<div style="padding: 20px; background: #fee2e2; border: 1px solid #f87171; border-radius: 8px; color: #b91c1c; font-weight: 500;">${msg}</div>`;
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

  // Execute initialization
  initDetail();
  wrapAllDocumentLinksInDOM();

});
