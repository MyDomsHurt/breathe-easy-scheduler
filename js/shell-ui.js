/* Compact toggle styling for universal light shell */
(function () {
  function paint() {
    var compact = document.getElementById('compactToggle');
    if (compact) {
      compact.classList.toggle('be-on', document.body.classList.contains('compact'));
    }
  }
  var obs = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].attributeName === 'class') { paint(); break; }
    }
  });
  if (document.body) {
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'compactToggle') {
      setTimeout(paint, 0);
      setTimeout(paint, 50);
    }
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paint);
  } else {
    paint();
  }
  setTimeout(paint, 200);
  window.__beShellPaint = paint;
})();
