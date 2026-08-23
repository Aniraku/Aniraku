// =============================================================
// Aniraku SPA SEO Helper (loaded in index.html)
// Handles canonical URL updates and OG/Twitter URL normalization
// on page load. Dynamic page metadata is handled by src/lib/seo.js
// which runs after React mounts.
// =============================================================
(function(){
  var IS_LOCAL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
  var SITE = IS_LOCAL ? 'http://localhost:3000' : 'https://www.aniraku.tech';

  function canonicalPath() {
    return window.location.pathname === '/home' ? '/' : window.location.pathname;
  }

  function updateCanonical() {
    var c = document.getElementById('canonical-link');
    if (c) c.href = SITE + canonicalPath();
  }

  function updateMetaUrls() {
    document.querySelectorAll('[id$="-url"],[id$="-image"]').forEach(function(e) {
      var val = e.content || '';
      if (val.startsWith('https://www.aniraku.tech') || val.startsWith(SITE)) {
        e.content = val.replace('https://www.aniraku.tech', SITE);
      }
    });
  }

  function updateTitle() {
    // Check if path suggests a specific page type
    var path = window.location.pathname;
    var title = document.querySelector('title');
    
    if (path === '/' || path === '/home') {
      title.textContent = 'Aniraku — Free Anime Streaming | Watch Sub & Dub Online';
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateCanonical();
    updateMetaUrls();
    updateTitle();
  });

  // Also handle popstate for SPA navigation
  window.addEventListener('popstate', function() {
    updateCanonical();
    updateMetaUrls();
  });
})();
