/* Breathe-Easy Scheduler — 2026 Full Year */

let allJobs = [];
let filtered = [];
let currentFilters = {
  month: 'all',
  team: 'Josh',
  type: 'all',
  date: 'all',
  range: 'today',
  search: ''
};
let viewMode = 'date';
let compactMode = localStorage.getItem('be-compact') === '1';

const TEAMS = ['Josh', 'Matthew', 'Tiago', 'Nick', 'Alun', 'Iggi'];
const TEAM_COLORS = {
  Josh: 'bg-violet-100 text-violet-800',
  Matthew: 'bg-sky-100 text-sky-800',
  Tiago: 'bg-emerald-100 text-emerald-800',
  Nick: 'bg-amber-100 text-amber-800',
  Alun: 'bg-rose-100 text-rose-800',
  Iggi: 'bg-indigo-100 text-indigo-800'
};

const DISTRICT_COLORS = {
  'HKN':  { bg: '#CFE2F3', border: '#9FC5E8', text: '#1e3a5f' },
  'HKS':  { bg: '#9FC5E8', border: '#6FA8DC', text: '#1e3a5f' },
  'KLN':  { bg: '#F4CCCC', border: '#EA9999', text: '#5c1a1a' },
  'N-T':  { bg: '#FFF2CC', border: '#FFE599', text: '#5c4a00' },
  'N-TW': { bg: '#FCE4D6', border: '#F9CB9C', text: '#5c3a1a' },
  'TKO':  { bg: '#B6D7A8', border: '#93C47D', text: '#1e3d14' },
  'S-K':  { bg: '#D9EAD3', border: '#B6D7A8', text: '#1e3d14' },
  'L-T':  { bg: '#D9D2E9', border: '#B4A7D6', text: '#2e1a4a' },
  'L-M':  { bg: '#A2C4C9', border: '#76A5AF', text: '#1a3338' }
};
const DISTRICT_FALLBACK = { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };

function timeToMinutes(t) {
  if (!t) return 9999;
  const s = String(t).toLowerCase().replace(/\s+/g, '');
  const m = s.match(/(\d{1,2})(?:[.:](\d{2}))?(am|pm)?/);
  if (!m) return 9999;
  let h = parseInt(m[1], 10);
  const min = m[2] != null ? parseInt(m[2], 10) : 0;
  const ap = m[3] || '';
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (!ap && h >= 1 && h <= 6) h += 12;
  return h * 60 + min;
}

function jobSortMinutes(j) {
  const fromTime = timeToMinutes(j.time);
  if (fromTime !== 9999) return fromTime;
  return timeToMinutes(j.client_name || '');
}

function displayTime(j) {
  if (j.time) return j.time;
  const s = String(j.client_name || '');
  const m = s.match(/(\d{1,2}(?:[.:]\d{2})?\s*(?:am|pm)?)/i);
  return m ? m[1].replace(/\s+/g, '') : '—';
}

function jobMonth(j) {
  if (j.month != null && j.month !== '') return Number(j.month);
  if (j.date) return Number(String(j.date).slice(5, 7));
  return null;
}

async function init() {
  try {
    let files = [];
    try {
      const man = await fetch('data/manifest.json');
      if (man.ok) files = await man.json();
    } catch (_) {}
    if (files.length) {
      const results = await Promise.all(
        files.map(f => fetch('data/' + f).then(r => (r.ok ? r.json() : [])).catch(() => []))
      );
      allJobs = results.flat();
    }
    if (allJobs.length === 0) {
      const res = await fetch('data/jobs.json');
      if (res.ok) allJobs = await res.json();
    }
    if (allJobs.length === 0) throw new Error('No job data found');
    allJobs.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return jobSortMinutes(a) - jobSortMinutes(b);
    });
    buildTeamButtons();
    buildDateSelect();
    bindEvents();
    applyFilters();
  } catch (err) {
    document.getElementById('jobsContainer').innerHTML =
      '<div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">Failed to load job data.<br><span class="text-sm">' + err.message + '</span></div>';
  }
}

function buildTeamButtons() {
  const sidebar = document.getElementById('teamFilters');
  const techBar = document.getElementById('techTeamBar');
  function fill(container, includeAll) {
    if (!container) return;
    container.innerHTML = '';
    const names = includeAll ? ['all'].concat(TEAMS) : TEAMS.slice();
    names.forEach(t => {
      const btn = document.createElement('button');
      btn.dataset.team = t;
      const isActive = currentFilters.team === t;
      btn.className = 'team-btn shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium ' +
        (isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200');
      btn.textContent = t === 'all' ? 'All' : t;
      container.appendChild(btn);
    });
  }
  fill(sidebar, true);
  fill(techBar, false);
}

function buildDateSelect() {
  const select = document.getElementById('dateSelect');
  if (!select) return;
  const dates = [...new Set(allJobs.map(j => j.date))].sort();
  dates.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = formatDate(d);
    select.appendChild(opt);
  });
}

function bindEvents() {
  document.querySelectorAll('.month-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setActive('.month-btn', btn);
      currentFilters.month = btn.dataset.month;
      applyFilters();
    });
  });
  function onTeamClick(e) {
    const btn = e.target.closest('.team-btn');
    if (!btn) return;
    currentFilters.team = btn.dataset.team;
    document.querySelectorAll('.team-btn').forEach(b => {
      const on = b.dataset.team === currentFilters.team;
      b.classList.toggle('bg-brand-600', on);
      b.classList.toggle('text-white', on);
      b.classList.toggle('bg-slate-100', !on);
      b.classList.toggle('text-slate-700', !on);
      b.classList.toggle('hover:bg-slate-200', !on);
    });
    applyFilters();
  }
  const teamFiltersEl = document.getElementById('teamFilters');
  const techTeamBar = document.getElementById('techTeamBar');
  if (teamFiltersEl) teamFiltersEl.addEventListener('click', onTeamClick);
  if (techTeamBar) techTeamBar.addEventListener('click', onTeamClick);
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setActive('.type-btn', btn);
      currentFilters.type = btn.dataset.type;
      applyFilters();
    });
  });
  const dateSelect = document.getElementById('dateSelect');
  if (dateSelect) {
    dateSelect.addEventListener('change', e => {
      currentFilters.date = e.target.value;
      applyFilters();
    });
  }
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentFilters.search = e.target.value.trim().toLowerCase();
        applyFilters();
      }, 200);
    });
  }
  const viewByDate = document.getElementById('viewByDate');
  if (viewByDate) {
    viewByDate.addEventListener('click', () => {
      viewMode = 'date';
      setActive('.view-btn', viewByDate);
      render();
    });
  }
  const viewByTeam = document.getElementById('viewByTeam');
  if (viewByTeam) {
    viewByTeam.addEventListener('click', () => {
      viewMode = 'team';
      setActive('.view-btn', viewByTeam);
      render();
    });
  }
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  applyRoleUI();
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilters.range = btn.dataset.range;
      currentFilters.date = 'all';
      const dateSelect = document.getElementById('dateSelect');
      if (dateSelect) dateSelect.value = 'all';
      document.querySelectorAll('.range-btn').forEach(b => {
        b.classList.remove('bg-brand-600', 'text-white');
        b.classList.add('bg-slate-100', 'text-slate-700');
      });
      btn.classList.remove('bg-slate-100', 'text-slate-700');
      btn.classList.add('bg-brand-600', 'text-white');
      applyFilters();
    });
  });
  const compactBtn = document.getElementById('compactToggle');
  if (compactBtn) {
    compactBtn.addEventListener('click', () => {
      compactMode = !compactMode;
      localStorage.setItem('be-compact', compactMode ? '1' : '0');
      applyCompactUI();
      render();
    });
    applyCompactUI();
  }
  window.addEventListener('resize', syncHeaderHeight);
  syncHeaderHeight();
}

function syncHeaderHeight() {
  const header = document.querySelector('header');
  if (!header) return;
  const h = Math.ceil(header.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--app-header-h', h + 'px');
  const rangeBar = document.getElementById('techRangeBar');
  let barH = 0;
  if (rangeBar && !rangeBar.classList.contains('hidden')) {
    barH = Math.ceil(rangeBar.getBoundingClientRect().height);
  }
  document.documentElement.style.setProperty('--tech-bar-h', barH + 'px');
  document.documentElement.style.setProperty('--day-sticky-top', (h + barH) + 'px');
}

function applyCompactUI() {
  document.body.classList.toggle('compact', compactMode);
  const btn = document.getElementById('compactToggle');
  if (!btn) return;
  if (compactMode) {
    btn.classList.remove('bg-white/10', 'text-white', 'border-white/30');
    btn.classList.add('bg-white', 'text-brand-800', 'border-white');
  } else {
    btn.classList.add('bg-white/10', 'text-white', 'border-white/30');
    btn.classList.remove('bg-white', 'text-brand-800', 'border-white');
  }
}

function applyRoleUI() {
  viewMode = 'date';
  const rangeBar = document.getElementById('techRangeBar');
  if (rangeBar) rangeBar.classList.remove('hidden');
  const revenueEl = document.getElementById('revenueTotal');
  if (revenueEl) revenueEl.classList.add('hidden');
  currentFilters.month = 'all';
  currentFilters.date = 'all';
  currentFilters.search = '';
  currentFilters.type = 'all';
  if (!currentFilters.team || currentFilters.team === 'all') currentFilters.team = 'Josh';
  buildTeamButtons();
  applyCompactUI();
  syncHeaderHeight();
}

function setActive(selector, activeBtn) {
  document.querySelectorAll(selector).forEach(b => {
    b.classList.remove('active', 'bg-brand-600', 'text-white');
    b.classList.add('bg-slate-100', 'hover:bg-slate-200');
  });
  activeBtn.classList.add('active', 'bg-brand-600', 'text-white');
  activeBtn.classList.remove('bg-slate-100', 'hover:bg-slate-200');
}

function getRangeBounds(range) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };
  if (range === 'today') {
    const iso = toISO(today);
    return { start: iso, end: iso };
  }
  if (range === 'this_week') {
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toISO(monday), end: toISO(sunday) };
  }
  if (range === 'next_week') {
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + mondayOffset);
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    return { start: toISO(nextMonday), end: toISO(nextSunday) };
  }
  return null;
}

function applyFilters() {
  const bounds = getRangeBounds(currentFilters.range);
  filtered = allJobs.filter(j => {
    if (currentFilters.month !== 'all' && jobMonth(j) !== Number(currentFilters.month)) return false;
    if (currentFilters.team !== 'all' && j.team_lead !== currentFilters.team) return false;
    if (currentFilters.type === 'clean' && j.is_return) return false;
    if (currentFilters.type === 'return' && !j.is_return) return false;
    if (currentFilters.date !== 'all' && j.date !== currentFilters.date) return false;
    if (bounds && (j.date < bounds.start || j.date > bounds.end)) return false;
    if (currentFilters.search) {
      const hay = [j.client_name, j.mobile, j.address, j.notes, j.acs, j.invoice].join(' ').toLowerCase();
      if (!hay.includes(currentFilters.search)) return false;
    }
    return true;
  });
  filtered.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return jobSortMinutes(a) - jobSortMinutes(b);
  });
  updateHeaderStats();
  updateStatsPanel();
  render();
}

function updateHeaderStats() {
  const count = filtered.length;
  const returns = filtered.filter(j => j.is_return).length;
  const revenue = filtered.reduce((s, j) => s + (j.amount || 0), 0);
  const jobCount = document.getElementById('jobCount');
  if (jobCount) jobCount.textContent = count + ' job' + (count !== 1 ? 's' : '');
  const rc = document.getElementById('returnCount');
  if (rc) {
    if (returns > 0) {
      rc.textContent = returns + ' return' + (returns !== 1 ? 's' : '');
      rc.classList.remove('hidden');
    } else {
      rc.classList.add('hidden');
    }
  }
  const revenueTotal = document.getElementById('revenueTotal');
  if (revenueTotal) revenueTotal.textContent = formatMoney(revenue);
}

function updateStatsPanel() {
  const panel = document.getElementById('statsPanel');
  if (!panel) return;
  const byTeam = {};
  TEAMS.forEach(t => byTeam[t] = { jobs: 0, returns: 0, amount: 0 });
  filtered.forEach(j => {
    if (!byTeam[j.team_lead]) return;
    byTeam[j.team_lead].jobs++;
    if (j.is_return) byTeam[j.team_lead].returns++;
    byTeam[j.team_lead].amount += j.amount || 0;
  });
  panel.innerHTML = TEAMS.map(t => {
    const s = byTeam[t];
    if (s.jobs === 0) return '';
    const right = s.jobs + ' job' + (s.jobs !== 1 ? 's' : '');
    return '<div class="flex justify-between items-center"><span class="font-medium">' + t + '</span><span class="text-slate-500">' + right + '</span></div>';
  }).filter(Boolean).join('') || '<p class="text-slate-400">No data</p>';
}

function render() {
  const container = document.getElementById('jobsContainer');
  const empty = document.getElementById('emptyState');
  if (filtered.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    document.getElementById('viewTitle').textContent = 'No matching jobs';
    return;
  }
  empty.classList.add('hidden');
  if (viewMode === 'date') {
    document.getElementById('viewTitle').textContent = 'Jobs by Date';
    renderByDate(container);
  } else {
    document.getElementById('viewTitle').textContent = 'Jobs by Team';
    renderByTeam(container);
  }
  syncHeaderHeight();
}

function renderByDate(container) {
  const groups = groupBy(filtered, j => j.date);
  const dates = Object.keys(groups).sort();
  const gridCls = compactMode
    ? 'grid grid-cols-2 gap-1.5'
    : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3';
  container.innerHTML = dates.map(date => {
    const jobs = groups[date].slice().sort((a, b) => jobSortMinutes(a) - jobSortMinutes(b));
    const returns = jobs.filter(j => j.is_return).length;
    return '<section class="day-section">' +
      '<div class="day-header-sticky flex items-center justify-between mb-2 bg-slate-50/95 backdrop-blur py-1.5 z-10">' +
        '<h3 class="font-semibold text-brand-800">' +
          formatDate(date) + '<span class="text-slate-400 font-normal text-sm ml-2">' + jobs.length + ' jobs</span>' +
          (returns ? '<span class="ml-1 text-amber-600 text-sm">· ' + returns + ' return' + (returns > 1 ? 's' : '') + '</span>' : '') +
        '</h3>' +
      '</div>' +
      '<div class="' + gridCls + '">' + jobs.map(jobCard).join('') + '</div></section>';
  }).join('');
  bindCardClicks();
}

function renderByTeam(container) {
  const groups = groupBy(filtered, j => j.team_lead);
  const order = TEAMS.filter(t => groups[t]);
  container.innerHTML = order.map(team => {
    const jobs = groups[team].slice().sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return jobSortMinutes(a) - jobSortMinutes(b);
    });
    const returns = jobs.filter(j => j.is_return).length;
    return '<section><div class="flex items-center justify-between mb-2"><h3 class="font-semibold"><span class="inline-block px-2 py-0.5 rounded ' +
      (TEAM_COLORS[team] || 'bg-slate-100') + ' team-chip mr-1">' + team + '</span><span class="text-slate-400 font-normal text-sm">' +
      jobs.length + ' jobs' + (returns ? ' · ' + returns + ' returns' : '') + '</span></h3>' +
      '</div><div class="' + (compactMode ? 'grid grid-cols-2 gap-1.5' : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3') + '">' + jobs.map(jobCard).join('') + '</div></section>';
  }).join('');
  bindCardClicks();
}

function jobCard(j) {
  const returnBadge = j.is_return ? '<span class="return-badge shrink-0 whitespace-nowrap text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">RETURN</span>' : '';
  const isPaid = !!(j.receipt && String(j.receipt).trim());
  const rightBadge = isPaid
    ? '<span class="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">PAID</span>'
    : '<span class="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">UNPAID</span>';
  const units = j.acs
    ? '<span class="inline-flex items-center text-[11px] font-semibold bg-white/80 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded">' + esc(j.acs) + '</span>'
    : '';
  const dist = DISTRICT_COLORS[j.district] || DISTRICT_FALLBACK;

  if (compactMode) {
    const distBar = 'border-left: 4px solid ' + dist.border + '; background:' + dist.bg + ';';
    const showTeam = currentFilters.team === 'all';
    const teamChip = showTeam
      ? '<span class="text-[10px] font-medium px-1 py-0.5 rounded ' + (TEAM_COLORS[j.team_lead] || 'bg-slate-100') + '">' + esc(j.team_lead) + '</span>'
      : '';
    const shortAddr = j.address
      ? '<p class="text-[10px] leading-tight text-slate-600 mt-1 line-clamp-2">' + esc(j.address) + '</p>'
      : '';
    return '<article class="job-card compact-card rounded-xl cursor-pointer active:opacity-90 overflow-hidden" data-id="' + esc(j.job_id) + '" style="' + distBar + '">' +
      '<div class="p-2 min-h-[100px] flex flex-col">' +
        '<div class="flex items-start justify-between gap-1 min-w-0">' +
          '<p class="font-semibold text-[12px] leading-tight line-clamp-1 text-slate-800 min-w-0 flex-1 pr-1">' + esc(j.client_name) + '</p>' +
          returnBadge +
        '</div>' +
        '<p class="text-[12px] font-semibold text-slate-700 mt-0.5">' + esc(displayTime(j)) + '</p>' +
        shortAddr +
        '<div class="flex items-center gap-1.5 flex-wrap shrink-0 mt-auto pt-1.5">' + teamChip + units +
        '</div>' +
      '</div></article>';
  }

  const showTeam = currentFilters.team === 'all';
  const teamChip = showTeam
    ? '<span class="text-[10px] font-medium px-1.5 py-0.5 rounded ' + (TEAM_COLORS[j.team_lead] || 'bg-slate-100') + '">' + esc(j.team_lead) + '</span>'
    : '';

  const tel = j.mobile ? String(j.mobile).replace(/[^\d+]/g, '') : '';
  const callBtn = tel
    ? '<a href="tel:' + esc(tel) + '" class="card-action card-action-call flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 active:bg-emerald-100">Call</a>'
    : '';
  const mapsBtn = j.address
    ? '<a href="https://maps.google.com/?q=' + encodeURIComponent(cleanAddressForMaps(j.address)) + '" target="_blank" rel="noopener noreferrer" class="card-action card-action-maps flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-sky-50 border border-sky-200 text-sky-800 active:bg-sky-100">Maps</a>'
    : '';
  const actionsRow = (callBtn || mapsBtn)
    ? '<div class="card-actions flex gap-2 mt-3" data-stop="1">' + callBtn + mapsBtn + '</div>'
    : '';

  const addressBlock = j.address
    ? '<div class="mt-2.5 px-3 py-2 rounded-lg border text-[13px] leading-snug font-medium break-words" style="background:' + dist.bg + ';border-color:' + dist.border + ';color:' + dist.text + ';overflow-wrap:anywhere">' +
      esc(j.address) + (j.district ? ' <span class="opacity-70 text-[11px] font-semibold">' + esc(j.district) + '</span>' : '') + '</div>'
    : '';
  const notesBlock = j.notes
    ? '<p class="text-[12px] text-slate-600 mt-2 leading-snug line-clamp-3 border-l-2 border-slate-200 pl-2 break-words" style="overflow-wrap:anywhere">' + esc(j.notes) + '</p>'
    : '';
  return '<article class="job-card bg-white border border-slate-200 rounded-xl p-3.5 cursor-pointer hover:shadow-md transition-shadow overflow-hidden max-w-full" data-id="' + esc(j.job_id) + '">' +
    '<div class="flex items-start justify-between gap-2">' +
      '<div class="min-w-0 flex-1">' +
        '<p class="text-[15px] font-bold text-slate-800 leading-tight">' + esc(displayTime(j)) + '</p>' +
        '<p class="text-[14px] font-semibold text-slate-700 mt-0.5 truncate">' + esc(j.client_name) + '</p>' +
      '</div>' +
      '<div class="flex flex-col items-end gap-1 shrink-0">' + returnBadge + rightBadge + '</div>' +
    '</div>' +
    addressBlock + notesBlock +
    '<div class="flex items-center gap-1.5 flex-wrap mt-2.5">' + teamChip + units + '</div>' +
    actionsRow +
  '</article>';
}

function bindCardClicks() {
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-actions') || e.target.closest('a.card-action')) return;
      const job = filtered.find(j => j.job_id === card.dataset.id) || allJobs.find(j => j.job_id === card.dataset.id);
      if (job) openModal(job);
    });
  });
}

function cleanAddressForMaps(raw) {
  if (!raw) return '';
  let a = String(raw).trim();
  a = a.replace(/^(Flat|Unit|Room|Apt|Apartment|Suite)\s*[A-Z0-9\-\/]+[,\s]*/i, '')
    .replace(/\b\d{1,2}\s*(\/F|F|th\s*Floor|st\s*Floor|nd\s*Floor|rd\s*Floor|Floor)\b[,\s]*/gi, '')
    .replace(/\b(Floor|Level)\s*\d{1,2}\b[,\s]*/gi, '')
    .replace(/^(Tower|Block|Blk)\s*[A-Z0-9\-]+[,\s]*/i, '')
    .replace(/^\d{1,3}[A-Z]?\s*[,\-]\s*/i, '')
    .replace(/^[,\s\-]+/, '').replace(/\s{2,}/g, ' ').trim();
  if (a.length < 8) return raw.trim();
  return a;
}

function openModal(j) {
  document.getElementById('modalTitle').textContent = j.client_name;
  document.getElementById('modalSub').textContent = formatDate(j.date) + ' · ' + displayTime(j) + ' · ' + j.team_lead;
  const mapsUrl = j.address ? 'https://maps.google.com/?q=' + encodeURIComponent(cleanAddressForMaps(j.address)) : null;
  const mapsLink = mapsUrl
    ? '<a href="' + mapsUrl + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 mt-2 w-full sm:w-auto px-3 py-2.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 font-medium text-sm active:bg-brand-100 hover:bg-brand-100 transition-colors">Open in Google Maps</a>'
    : '';
  const addressHtml = j.address ? '<div class="text-slate-800 break-words">' + esc(j.address) + '</div>' + mapsLink : '—';
  const isPaid = !!(j.receipt && String(j.receipt).trim());
  const paidStatus = isPaid
    ? '<span class="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">PAID</span>'
    : '<span class="inline-flex items-center gap-1.5 text-rose-700 font-semibold">UNPAID</span>';
  const rows = [
    ['Type', j.is_return ? '<span class="text-amber-600 font-semibold">Return</span>' : 'Full clean'],
    ['Team', j.team_lead + (j.team_members ? ' (' + j.team_members + ')' : '')],
    ['ACs / Units', j.acs || '— (empty → treated as return)'],
    ['Payment Status', paidStatus],
    ['Mobile', j.mobile || '—'],
    ['Address', addressHtml],
    ['District', j.district || '—'],
    ['Notes', j.notes || '—'],
    ['Job ID', j.job_id]
  ];
  document.getElementById('modalBody').innerHTML = rows.map(function(pair) {
    return '<div><dt class="text-xs font-medium text-slate-400 uppercase tracking-wide">' + pair[0] + '</dt><dd class="mt-0.5 text-slate-800 break-words">' + pair[1] + '</dd></div>';
  }).join('');
  document.getElementById('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function groupBy(arr, keyFn) {
  return arr.reduce(function(acc, item) {
    const k = keyFn(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-HK', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-HK');
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

window.onAuthReady = function() {
  viewMode = 'date';
  if (!currentFilters.team || currentFilters.team === 'all') currentFilters.team = 'Josh';
  init();
};
