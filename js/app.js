/* BE Schedule — race-safe loader for known-good full app (dark-header compatible) */
(function () {
  var queued = null;
  // Capture auth if it fires before the real app finishes loading
  window.onAuthReady = function (role, user) {
    queued = { role: role, user: user };
  };
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/MyDomsHurt/breathe-easy-scheduler@35aaf65c79b5/js/app.js';
  s.onload = function () {
    console.log('[BE] full app.js loaded from 35aaf65c');
    // Real app overwrote onAuthReady. If auth already fired, re-dispatch.
    if (queued) {
      try {
        if (typeof window.onAuthReady === 'function') {
          window.onAuthReady(queued.role, queued.user);
        }
      } catch (e) {
        console.error('[BE] onAuthReady re-dispatch failed', e);
      }
    }
  };
  s.onerror = function () {
    var el = document.getElementById('jobsContainer');
    if (el) {
      el.innerHTML = '<div class="p-6 text-center text-red-600 font-medium">Failed to load app core. Hard-refresh (Ctrl+Shift+R) or contact admin.</div>';
    }
    console.error('[BE] Failed to load app.js from CDN @35aaf65c');
  };
  document.head.appendChild(s);
})();
