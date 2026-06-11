/**
 * ============================================================
 *  Supabase Client Singleton
 *  Initializes and exposes window._supabase for all pages.
 *  Must be loaded AFTER the Supabase CDN <script> tag.
 * ============================================================
 */
(function () {
  if (window._supabase) return; // Prevent double-init

  const SUPABASE_URL = 'https://qmvqfusxnafojqophrwo.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_ZLAa1v4ArB1LZDUxp0BlNA_24Egfn4h';

  // The Supabase CDN exposes a global `supabase` object with createClient
  if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    console.error('[supabase-client.js] Supabase CDN belum dimuat. Pastikan tag <script> CDN ada sebelum file ini.');
    return;
  }

  window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[supabase-client.js] Supabase client berhasil diinisialisasi.');
})();
