const localKey = 'tridharmaNewsArticles';
const articlesPerPage = 6;

const sampleArticles = [
  {
    title: 'AI Lab launches an open access sustainability report',
    summary: 'Researchers share new data-driven climate insights and university partnerships across policy, technology, and education.',
    category: 'Research',
    author: 'Dr. Ratna Dewi',
    date: '2026-05-10',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    url: '#'
  },
  {
    title: 'Community forum explores digital inclusion and campus access',
    summary: 'Student leaders, faculty, and alumni discuss new programs for remote learners and community outreach.',
    category: 'Community',
    author: 'Aulia Tampubolon',
    date: '2026-05-07',
    image: 'https://images.unsplash.com/photo-1514971847139-8b47bd2c1b54?auto=format&fit=crop&w=1200&q=80',
    url: '#'
  },
  {
    title: 'Education summit highlights experiential learning pathways',
    summary: 'Hands-on projects, mentorship programs, and vocational innovation are shaping the next academic year.',
    category: 'Education',
    author: 'Prof. Anwar',
    date: '2026-05-05',
    image: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1200&q=80',
    url: '#'
  },
  {
    title: 'New student profile series: building future-ready leaders',
    summary: 'Read the stories of students who blend research, service, and entrepreneurship on campus.',
    category: 'Profile',
    author: 'Rizka Putri',
    date: '2026-05-02',
    image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1200&q=80',
    url: '#'
  },
  {
    title: 'Campus infrastructure initiative launches smart green buildings',
    summary: 'Facilities teams discuss low-carbon upgrades, energy efficiency, and community wellness.',
    category: 'Campus',
    author: 'Budi Santoso',
    date: '2026-04-28',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=1200&q=80',
    url: '#'
  },
  {
    title: 'Weekly digest: research milestones and event highlights',
    summary: 'A compact update on campus conferences, awards, and student-led innovation programs.',
    category: 'Digest',
    author: 'Maya Rachma',
    date: '2026-04-26',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    url: '#'
  },
  {
    title: 'Policy Lab examines sustainable finance for higher education',
    summary: 'Experts weigh investments, grants, and social impact strategies for future-proof institutions.',
    category: 'Policy',
    author: 'Siti Nurhayati',
    date: '2026-04-22',
    image: 'https://images.unsplash.com/photo-1496307055127-1aa53a3c83d4?auto=format&fit=crop&w=1200&q=80',
    url: '#'
  }
];

function getArticles() {
  const stored = localStorage.getItem(localKey);
  if (!stored) {
    localStorage.setItem(localKey, JSON.stringify(sampleArticles));
    return sampleArticles;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Invalid article data in storage, resetting sample data.', error);
    localStorage.removeItem(localKey);
    return sampleArticles;
  }
}

function setArticles(value) {
  localStorage.setItem(localKey, JSON.stringify(value));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function createNewsCard(article) {
  const meta = `${article.category} • ${article.author} • ${formatDate(article.date)}`;
  const mediaHtml = (article.image && article.image !== '#' && !article.image.includes('placeholder')) ? `
    <div class="news-card-media" style="width:100%; height:180px; overflow:hidden;">
      <img src="${article.image}" alt="${article.title}" style="width:100%; height:100%; object-fit:cover;">
    </div>
  ` : '';
  return `
    <article class="news-card">
      ${mediaHtml}
      <div class="news-card-content">
        <span class="news-card-meta">${meta}</span>
        <h2 class="news-card-title">${article.title}</h2>
        <p class="news-card-summary">${article.summary}</p>
        <a class="link-button" href="${article.url}">Read full article</a>
      </div>
    </article>
  `;
}

function renderArticles(page = 1) {
  const articles = getArticles();
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  const startIndex = (page - 1) * articlesPerPage;
  const pageItems = articles.slice(startIndex, startIndex + articlesPerPage);
  grid.innerHTML = pageItems.map(createNewsCard).join('');
  renderPagination(page, Math.ceil(articles.length / articlesPerPage));
}

function renderPagination(currentPage, totalPages) {
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  const numbers = document.getElementById('paginationNumbers');
  if (!prev || !next || !numbers) return;

  prev.disabled = currentPage <= 1;
  next.disabled = currentPage >= totalPages;

  numbers.innerHTML = '';
  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = page;
    button.className = page === currentPage ? 'active' : '';
    button.addEventListener('click', () => renderArticles(page));
    numbers.appendChild(button);
  }

  prev.onclick = () => renderArticles(currentPage - 1);
  next.onclick = () => renderArticles(currentPage + 1);
}

function renderPopular() {
  const articles = getArticles();
  const list = document.getElementById('popularList');
  if (!list) return;

  const top = [...articles]
    .slice(0, 5)
    .map((article) => `
      <li>
        <a href="${article.url}">${article.title}</a>
        <p>${formatDate(article.date)}</p>
      </li>
    `)
    .join('');

  list.innerHTML = top;
}

function initializeTheme() {
  const button = document.getElementById('themeToggle');
  if (!button) return;
  const current = localStorage.getItem('site_theme') || 'light';
  if (current === 'dark') document.body.classList.add('dark');
  button.textContent = current === 'dark' ? 'Light' : 'Dark';

  button.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const nextTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('site_theme', nextTheme);
    button.textContent = nextTheme === 'dark' ? 'Light' : 'Dark';
  });
}

function updatePreview() {
  const preview = document.getElementById('previewCard');
  if (!preview) return;

  const title = document.getElementById('storyTitle').value || 'Article preview headline';
  const summary = document.getElementById('storySummary').value || 'A short summary appears here as you type fields above.';
  const category = document.getElementById('storyCategory').value || 'Category';
  const author = document.getElementById('storyAuthor').value || 'Author';
  const date = document.getElementById('storyDate').value || new Date().toISOString().slice(0, 10);
  const image = document.getElementById('storyImage').value || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80';

  preview.querySelector('.news-card-media img').src = image;
  preview.querySelector('img').alt = title;
  preview.querySelector('.news-card-meta').textContent = `${category} • ${author} • ${formatDate(date)}`;
  preview.querySelector('.news-card-title').textContent = title;
  preview.querySelector('.news-card-summary').textContent = summary;
}

function initializeAdmin() {
  const form = document.getElementById('storyForm');
  const clear = document.getElementById('clearStorage');
  if (!form) return;

  const fields = ['storyTitle', 'storySummary', 'storyCategory', 'storyAuthor', 'storyDate', 'storyImage'];
  fields.forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', updatePreview);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const newArticle = {
      title: document.getElementById('storyTitle').value.trim(),
      summary: document.getElementById('storySummary').value.trim(),
      category: document.getElementById('storyCategory').value.trim(),
      author: document.getElementById('storyAuthor').value.trim(),
      date: document.getElementById('storyDate').value || new Date().toISOString().slice(0, 10),
      image: document.getElementById('storyImage').value.trim() || '../assets/images/news-sample.jpg',
      url: document.getElementById('storyUrl').value.trim() || '#'
    };

    const articles = getArticles();
    setArticles([newArticle, ...articles]);
    form.reset();
    updatePreview();
    showSuccessModal({
      title: 'Artikel Ditambahkan',
      message: 'Artikel baru telah ditambahkan ke portal. Refresh halaman utama untuk melihatnya.',
      buttonText: 'OK'
    });
  });

  clear.addEventListener('click', () => {
    localStorage.removeItem(localKey);
    setArticles(sampleArticles);
    showSuccessModal({
      title: 'Data Direset',
      message: 'Semua artikel telah dikembalikan ke data contoh.',
      buttonText: 'OK'
    });
  });
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

function initializePage() {
  initializeTheme();
  if (document.getElementById('newsGrid')) {
    renderArticles(1);
    renderPopular();
  }
  if (document.getElementById('storyForm')) {
    initializeAdmin();
    updatePreview();
  }
  wrapAllDocumentLinksInDOM();
}

initializePage();
