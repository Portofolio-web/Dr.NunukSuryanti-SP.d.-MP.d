const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('dashboard.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (e) => { console.error("JSDOM Error:", e); });
virtualConsole.on("warn", (w) => { console.warn("JSDOM Warn:", w); });
virtualConsole.on("log", (l) => { console.log("JSDOM Log:", l); });

const dom = new JSDOM(html, {
  url: "http://localhost/",
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
});

// Mock localStorage
const storage = {
  isLoggedIn: 'true'
};
Object.defineProperty(dom.window, 'localStorage', {
  value: {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => storage[k] = v,
    removeItem: (k) => delete storage[k],
  }
});

// Monitor unhandled rejections
dom.window.addEventListener('unhandledrejection', event => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Wait a bit to let scripts load
setTimeout(() => {
  console.log("Checking if dynamic sidebar rendered...");
  const sidebar = dom.window.document.getElementById('dynamicSidebarMenu');
  console.log("Sidebar contents:", sidebar ? sidebar.innerHTML : "Not found");
  
  const formsContainer = dom.window.document.getElementById('dynamicFormsContainer');
  console.log("Forms container:", formsContainer ? formsContainer.innerHTML.substring(0, 200) + '...' : "Not found");
  
  process.exit(0);
}, 3000);
