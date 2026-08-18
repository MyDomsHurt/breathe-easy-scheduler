/* Load weeks from Performance data host; data.json stays local */
(function () {
  var WEEKS = 'https://mydomshurt.github.io/breathe-easy-dashboard/weeks.json';
  var orig = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url);
    if (url === 'weeks.json' || url === './weeks.json') {
      return orig.call(this, WEEKS, init);
    }
    return orig.apply(this, arguments);
  };
})();
