import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Client Initialization
const SUPABASE_URL = 'https://qmvqfusxnafojqophrwo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZLAa1v4ArB1LZDUxp0BlNA_24Egfn4h';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Helper function to format timestamp into relative time in Indonesian.
 * @param {string} timestamp - ISO timestamp from database
 * @returns {string} Relative time string (e.g. "1 JAM LALU")
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;

  if (diffMs < 0) return 'BARU SAJA';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'BARU SAJA';
  if (diffMins < 60) return `${diffMins} MENIT LALU`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} JAM LALU`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} HARI LALU`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} BULAN LALU`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} TAHUN LALU`;
};

export default function NewsSection() {
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Ambil data awal dari Supabase
    const fetchLatestNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: fetchErr } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (fetchErr) throw fetchErr;
        setNewsList(data || []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err.message || 'Gagal memuat berita dari server.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestNews();

    // 2. Berlangganan Fitur Realtime
    const newsSubscription = supabase
      .channel('realtime_news_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        (payload) => {
          console.log('Realtime change detected:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setNewsList((currentNews) => {
            let updatedList = [...currentNews];

            if (eventType === 'INSERT') {
              updatedList = [newRecord, ...updatedList].slice(0, 3);
            } else if (eventType === 'UPDATE') {
              updatedList = updatedList.map((item) =>
                item.id === newRecord.id ? newRecord : item
              );
              updatedList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (eventType === 'DELETE') {
              updatedList = updatedList.filter((item) => item.id !== oldRecord.id);
              fetchLatestNews();
              return currentNews;
            }

            return updatedList;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(newsSubscription);
    };
  }, []);

  // UI Kategori Tag Stylizer
  const getCategoryBadgeClass = (category = '') => {
    const cat = category.toUpperCase();
    if (cat.includes('CRYPTO') || cat.includes('KRIPTO')) {
      return 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30';
    }
    if (cat.includes('GLOBAL') || cat.includes('FINANCE') || cat.includes('KEUANGAN')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  };

  return (
    <section 
      className="py-16 px-4 md:px-8 font-sans transition-colors duration-400" 
      id="news-section"
      style={{
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)'
      }}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header Seksi */}
        <div 
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">
              LATEST UPDATES
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: 'var(--text-main)' }}>
              Berita Finansial & Kripto Terkini
            </h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Analisis pasar, perkembangan ekonomi global, dan teknologi blockchain terbaru yang diperbarui secara langsung.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">LIVE FEED</span>
          </div>
        </div>

        {/* LOADING STATE - Skeleton Loader yang Responsif terhadap Tema */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="news-skeleton-loader">
            {[1, 2, 3].map((n) => (
              <div 
                key={n} 
                className="rounded-2xl p-4 flex flex-col space-y-4 animate-pulse shadow-xl"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Skeleton Gambar */}
                <div className="h-48 rounded-xl w-full bg-slate-300/40 dark:bg-slate-800/60"></div>
                {/* Skeleton Tag */}
                <div className="h-5 rounded w-1/4 bg-slate-300/40 dark:bg-slate-800/60"></div>
                {/* Skeleton Judul */}
                <div className="space-y-2">
                  <div className="h-6 rounded w-11/12 bg-slate-300/40 dark:bg-slate-800/60"></div>
                  <div className="h-6 rounded w-3/4 bg-slate-300/40 dark:bg-slate-800/60"></div>
                </div>
                {/* Skeleton Deskripsi */}
                <div className="space-y-2 flex-1">
                  <div className="h-4 rounded w-full bg-slate-300/20 dark:bg-slate-800/40"></div>
                  <div className="h-4 rounded w-full bg-slate-300/20 dark:bg-slate-800/40"></div>
                  <div className="h-4 rounded w-2/3 bg-slate-300/20 dark:bg-slate-800/40"></div>
                </div>
                {/* Skeleton Footer / Waktu */}
                <div className="h-4 rounded w-1/3 pt-2 bg-slate-300/40 dark:bg-slate-800/60"></div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!isLoading && error && (
          <div 
            id="news-error-container"
            className="bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold">Koneksi Supabase Bermasalah</h4>
                <p className="text-xs opacity-80 mt-1">{error}</p>
              </div>
            </div>
            <button 
              id="news-retry-btn"
              onClick={() => window.location.reload()} 
              className="px-5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white transition-all duration-300 active:scale-95 flex-shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !error && newsList.length === 0 && (
          <div 
            id="news-empty-container" 
            className="text-center py-12 rounded-2xl max-w-lg mx-auto"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 00-2-2m2 8a2 2 0 00-2-2m2 4a2 2 0 01-2 2h-2m-6-4h.01M9 16h.01" />
            </svg>
            <h4 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>Belum Ada Berita</h4>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Data berita kosong di database Supabase.</p>
          </div>
        )}

        {/* MAIN DISPLAY - 3 Columns Grid */}
        {!isLoading && !error && newsList.length > 0 && (
          <div 
            id="news-display-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {newsList.map((news) => (
              <article 
                key={news.id}
                id={`news-card-${news.id}`}
                className="group relative rounded-2xl overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 backdrop-blur-md"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Container Gambar dengan Rasio 16:9 & Efek Zoom */}
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  {news.image_url ? (
                    <img 
                      src={news.image_url} 
                      alt={news.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Overlay Gradasi Tipis */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Konten Text */}
                <div className="p-6 flex flex-col flex-1">
                  
                  {/* Tag Kategori */}
                  <div className="mb-4">
                    <span 
                      id={`news-category-${news.id}`}
                      className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getCategoryBadgeClass(news.category)}`}
                    >
                      {news.category || 'MARKET UPDATE'}
                    </span>
                  </div>

                  {/* Judul Berita */}
                  <h3 
                    id={`news-title-${news.id}`}
                    className="text-lg font-bold leading-snug transition-colors duration-300 line-clamp-2"
                    style={{ color: 'var(--text-main)' }}
                    title={news.title}
                  >
                    {news.title}
                  </h3>

                  {/* Deskripsi Berita */}
                  <p 
                    id={`news-desc-${news.id}`}
                    className="mt-3 text-xs md:text-sm leading-relaxed line-clamp-3 flex-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {news.description}
                  </p>

                  {/* Footer Card (Waktu Relatif) */}
                  <div 
                    className="mt-6 pt-4 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase"
                    style={{
                      borderTop: '1px solid var(--border-color)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <time dateTime={news.created_at} id={`news-time-${news.id}`}>
                        {formatRelativeTime(news.created_at)}
                      </time>
                    </div>
                    
                    <span className="text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex items-center gap-0.5">
                      BACA <span className="text-xs">&rarr;</span>
                    </span>
                  </div>

                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
