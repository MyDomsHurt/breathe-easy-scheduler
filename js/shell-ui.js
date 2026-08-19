/* Patch Schedule role/compact UI for universal light shell */
(function () {
  function paint() {
    var office = document.getElementById('roleOffice');
    var tech = document.getElementById('roleTech');
    var compact = document.getElementById('compactToggle');
    if (office && tech) {
      var isTech = document.body.classList.contains('role-tech');
      office.classList.toggle('be-on', !isTech);
      tech.classList.toggle('be-on', isTech);
    }
    if (compact) {
      compact.classList.toggle('be-on', document.body.classList.contains('compact'));
    }
  }
  // Observe body class changes from app.js applyRoleUI / applyCompactUI
  var obs = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].attributeName === 'class') { paint(); break; }
    }
  });
  if (document.body) {
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  // Also re-paint after clicks on the controls
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'roleOffice' || t.id === 'roleTech' || t.id === 'compactToggle' ||
        (t.closest && (t.closest('#roleToggle') || t.id === 'compactToggle'))) {
      setTimeout(paint, 0);
      setTimeout(paint, 50);
    }
  });
  // Initial + delayed (app.js may apply after auth)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paint);
  } else {
    paint();
  }
  setTimeout(paint, 200);
  setTimeout(paint, 800);
  setTimeout(paint, 2000);
  // Expose for manual re-sync
  window.__beShellPaint = paint;
})();
