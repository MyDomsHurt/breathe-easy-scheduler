/* restored via redirect — load from known good CDN copy until full restore */
(function(){
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/gh/MyDomsHurt/breathe-easy-scheduler@820f287929a15806bd665d9ccd3d3f5b54cabc4f/js/app.js';
  s.onload=function(){ console.log('app.js restored from 820f287'); };
  s.onerror=function(){ document.getElementById('jobsContainer') && (document.getElementById('jobsContainer').innerHTML='<div class="p-4 text-red-600">Failed to load app core. Hard refresh or contact admin.</div>'); };
  document.head.appendChild(s);
})();
