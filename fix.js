const fs = require('fs');

let content = fs.readFileSync('js/public-app.js', 'utf8');

const missingTop = `// Cloud Sync dinonaktifkan
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

    item.photo = images.length > 0 ? images : [DEFAULT_IMAGE];
    item.file = docs.length > 0 ? docs[0] : "";

    return item;
  }

  let sysName = localStorage.getItem("profile_name_v5") || "Nama Pemilik Website";
  const hasCache = !!localStorage.getItem("profile_name_v5");
  let attachScrollObserver;
`;

content = missingTop + content;
fs.writeFileSync('js/public-app.js', content, 'utf8');
