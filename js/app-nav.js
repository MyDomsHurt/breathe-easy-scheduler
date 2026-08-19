/* App switch is now in the HTML header — no inject needed */
(function () {
  // Measure sticky heights for tech range bar / day headers
  function measure() {
    var nav = document.querySelector('.be-nav');
    var toolbar = document.getElementById('officeToolbar');
    var h = nav ? nav.getBoundingClientRect().height : 56;
    var t = toolbar && !toolbar.classList.contains('hidden') ? toolbar.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--app-header-h', Math.round(h) + 'px');
    document.documentElement.style.setProperty('--app-toolbar-h', Math.round(t) + 'px');
  }
  window.addEventListener('resize', measure);
  document.addEventListener('DOMContentLoaded', function () {
    measure();
    setTimeout(measure, 300);
    setTimeout(measure, 1000);
  });
  // Re-measure when app becomes visible
  var root = document.getElementById('appRoot');
  if (root && window.MutationObserver) {
    new MutationObserver(measure).observe(root, { attributes: true, attributeFilter: ['class'] });
  }
})();
