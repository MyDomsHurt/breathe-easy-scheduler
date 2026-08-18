/* Cross-app nav: Schedule | Performance — non-invasive */
(function () {
  function inject() {
    if (document.getElementById('be-app-switch')) return;
    var header = document.querySelector('#appRoot header .max-w-7xl, #appRoot header > div');
    if (!header) return;
    var brand = header.querySelector('.flex.items-center.gap-3') || header.firstElementChild;
    if (!brand) return;
    var wrap = document.createElement('nav');
    wrap.id = 'be-app-switch';
    wrap.setAttribute('aria-label', 'App');
    wrap.className = 'flex items-center rounded-lg overflow-hidden border border-white/25 text-xs font-semibold ml-1 sm:ml-2';
    wrap.innerHTML =
      '<span class="px-2.5 py-1.5 bg-white text-brand-800">Schedule</span>' +
      '<a href="dashboard/" class="px-2.5 py-1.5 bg-white/10 text-white hover:bg-white/20 transition">Performance</a>';
    brand.appendChild(wrap);
  }
  var obs = new MutationObserver(function () {
    var root = document.getElementById('appRoot');
    if (root && !root.classList.contains('hidden')) inject();
  });
  if (document.body) obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(inject, 500);
  });
})();
