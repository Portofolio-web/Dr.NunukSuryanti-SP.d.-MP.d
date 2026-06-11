const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (e) => { console.error("JSDOM Error:", e); });
virtualConsole.on("warn", (w) => { console.warn("JSDOM Warn:", w); });
virtualConsole.on("log", (l) => { console.log("JSDOM Log:", l); });

JSDOM.fromURL("http://127.0.0.1:8081/dashboard.html", {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
}).then(dom => {
  // Mock localStorage
  const storage = { isLoggedIn: 'true' };
  Object.defineProperty(dom.window, 'localStorage', {
    value: {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => storage[k] = v,
      removeItem: (k) => delete storage[k],
    }
  });

  // Mock Supabase to instantly resolve
  dom.window._supabase = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: async () => ({ data: [], error: null }),
          then: (res) => res({ data: [], error: null })
        }),
        order: async () => ({ data: [], error: null }),
        then: (res) => res({ data: [], error: null })
      }),
      insert: async () => ({ data: [], error: null }),
      update: () => ({ eq: async () => ({ data: [], error: null }) })
    }),
    auth: { signOut: async () => {} }
  };
  
  // Also override the getter so supabase-client.js doesn't overwrite our mock with a broken real client
  dom.window.supabase = { createClient: () => dom.window._supabase };

  setTimeout(() => {
    console.log("Checking if dynamic sidebar rendered...");
    const sidebar = dom.window.document.getElementById('dynamicSidebarMenu');
    console.log("Sidebar contents:", sidebar ? sidebar.innerHTML : "Not found");
    
    const stats = dom.window.document.getElementById('dashboardStatsGrid');
    console.log("Stats contents:", stats ? stats.innerHTML : "Not found");
    process.exit(0);
  }, 2000);
}).catch(e => {
  console.error("Failed to load JSDOM:", e);
});
