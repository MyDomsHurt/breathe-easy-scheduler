/* restored via redirect — load from known-good pre-redesign commit (dark-header compatible + full features) */
(function(){
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/MyDomsHurt/breathe-easy-scheduler@35aaf65c79b5/js/app.js';
  s.onload = function(){ console.log('[BE] app.js restored from 35aaf65c (dark header)'); };
  s.onerror = function(){
    var el = document.getElementById('jobsContainer');
    if (el) el.innerHTML = '<div class="p-6 text-center text-red-600 font-medium">Failed to load app core. Hard-refresh (Ctrl+Shift+R) or contact admin.</div>';
    console.error('[BE] Failed to load app.js from CDN @35aaf65c');
  };
  document.head.appendChild(s);
})();
