/* Breathe-Easy Scheduler — 2026 Full Year */

let allJobs = [];
let filtered = [];
let currentFilters = {
  month: 'all',
  team: 'all',
  type: 'all',
  date: 'all',
  range: 'today',
  search: ''
};
let viewMode = 'date';
let roleMode = localStorage.getItem('be-role') || 'office';
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

function cleanPhone(raw) {
  if (!raw) return '';
  const s = String(raw);
  const m = s.match(/(\+?\d[\d\s\-]{5,}\d)/);
  const chunk = m ? m[1] : s;
  return chunk.replace(/[^\d+]/g, '');
}

function phoneButton(raw, opts) {
  opts = opts || {};
  const digits = cleanPhone(raw);
  if (!digits || digits.replace(/\D/g, '').length < 6) {
    return opts.fallback != null ? opts.fallback : '—';
  }
  const label = opts.label != null ? opts.label : String(raw).trim();
  const cls = opts.cls || 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm active:bg-emerald-100 hover:bg-emerald-100 transition-colors';
  return '<a href="tel:' + digits + '" class="' + cls + '" onclick="event.stopPropagation()">' +
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>' +
    '</svg>' + esc(label) + '</a>';
}

function mapsButton(address, opts) {
  opts = opts || {};
  if (!address) return '';
  const q = cleanAddressForMaps(address);
  if (!q) return '';
  const url = 'https://maps.google.com/?q=' + encodeURIComponent(q);
  const cls = opts.cls || 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-semibold text-sm active:bg-sky-100 hover:bg-sky-100 transition-colors';
  const label = opts.label != null ? opts.label : 'Maps';
  return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="' + cls + '" onclick="event.stopPropagation()">' +
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>' +
    '</svg>' + esc(label) + '</a>';
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
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
  const prev = select.value || 'all';
  select.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All dates';
  select.appendChild(allOpt);
  let dates = [...new Set(allJobs.map(j => j.date))].sort();
  if (currentFilters.month && currentFilters.month !== 'all') {
    const m = Number(currentFilters.month);
    dates = dates.filter(d => Number(String(d).slice(5, 7)) === m);
  }
  dates.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = formatDate(d);
    select.appendChild(opt);
  });
  if ([...select.options].some(o => o.value === prev)) select.value = prev;
  else {
    select.value = 'all';
    currentFilters.date = 'all';
  }
}

function bindEvents() {
  document.querySelectorAll('.month-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setActive('.month-btn', btn);
      currentFilters.month = btn.dataset.month;
      currentFilters.date = 'all';
      buildDateSelect();
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
  if (dateSelect) dateSelect.addEventListener('change', e => {
    currentFilters.date = e.target.value;
    applyFilters();
  });
  let searchTimer;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentFilters.search = e.target.value.trim().toLowerCase();
      applyFilters();
    }, 200);
  });
  const vbd = document.getElementById('viewByDate');
  const vbt = document.getElementById('viewByTeam');
  if (vbd) vbd.addEventListener('click', () => { viewMode = 'date'; setActive('.view-btn', vbd); render(); });
  if (vbt) vbt.addEventListener('click', () => { viewMode = 'team'; setActive('.view-btn', vbt); render(); });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  const roleOffice = document.getElementById('roleOffice');
  const roleTech = document.getElementById('roleTech');
  if (roleOffice) roleOffice.addEventListener('click', () => setRole('office'));
  if (roleTech) roleTech.addEventListener('click', () => setRole('tech'));
  applyRoleUI();
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilters.range = btn.dataset.range;
      currentFilters.date = 'all';
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
    btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
    btn.classList.add('bg-brand-600', 'text-white', 'border-brand-600');
  } else {
    btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
    btn.classList.remove('bg-brand-600', 'text-white', 'border-brand-600');
  }
}

function setRole(role) {
  if (window.__forcedRole === 'tech') role = 'tech';
  roleMode = role;
  localStorage.setItem('be-role', role);
  if (role === 'tech') {
    viewMode = 'date';
    currentFilters.range = 'today';
    currentFilters.date = 'all';
    if (!currentFilters.team || currentFilters.team === 'all') currentFilters.team = 'Josh';
    document.querySelectorAll('.range-btn').forEach(b => {
      const active = b.dataset.range === 'today';
      b.classList.toggle('bg-brand-600', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('bg-slate-100', !active);
      b.classList.toggle('text-slate-700', !active);
    });
  } else {
    currentFilters.month = 'all';
    currentFilters.date = 'all';
    currentFilters.team = 'all';
    document.querySelectorAll('.month-btn').forEach(b => {
      const active = b.dataset.month === 'all';
      b.classList.toggle('bg-brand-600', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('bg-slate-100', !active);
      b.classList.toggle('hover:bg-slate-200', !active);
    });
    const dateSelect = document.getElementById('dateSelect');
    if (dateSelect) dateSelect.value = 'all';
  }
  applyRoleUI();
  buildTeamButtons();
  applyFilters();
}

function applyRoleUI() {
  const isTech = roleMode === 'tech';
  const officeBtn = document.getElementById('roleOffice');
  const techBtn = document.getElementById('roleTech');
  const revenueEl = document.getElementById('revenueTotal');
  const rangeBar = document.getElementById('techRangeBar');
  const monthFilters = document.getElementById('monthFilters');
  const dateSelect = document.getElementById('dateSelect');
  const hideEls = [];
  if (monthFilters) {
    hideEls.push(monthFilters);
    const prev = monthFilters.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') hideEls.push(prev);
  }
  if (dateSelect) {
    hideEls.push(dateSelect);
    const prev = dateSelect.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') hideEls.push(prev);
  }
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    hideEls.push(searchInput);
    const prev = searchInput.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') hideEls.push(prev);
  }
  const teamFilters = document.getElementById('teamFilters');
  if (teamFilters) {
    hideEls.push(teamFilters);
    const prev = teamFilters.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') hideEls.push(prev);
  }
  document.querySelectorAll('.type-btn').forEach(btn => {
    hideEls.push(btn);
    const parent = btn.parentElement;
    if (parent && !hideEls.includes(parent)) {
      hideEls.push(parent);
      const prev = parent.previousElementSibling;
      if (prev && prev.tagName === 'LABEL') hideEls.push(prev);
    }
  });
  document.body.classList.toggle('role-tech', isTech);
  document.body.classList.toggle('role-office', !isTech);
  if (isTech) {
    if (officeBtn) officeBtn.className = 'role-btn px-3 py-1.5 bg-white/10 text-white hover:bg-white/20';
    if (techBtn) techBtn.className = 'role-btn px-3 py-1.5 bg-white text-brand-800';
    if (revenueEl) revenueEl.classList.add('hidden');
    if (rangeBar) rangeBar.classList.remove('hidden');
    hideEls.forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.view-btn').forEach(b => b.classList.add('hidden'));
    const vtWrap = document.getElementById('viewTitle');
    if (vtWrap && vtWrap.parentElement) vtWrap.parentElement.classList.add('hidden');
    currentFilters.month = 'all';
    currentFilters.date = 'all';
    currentFilters.search = '';
    currentFilters.type = 'all';
    if (!currentFilters.team || currentFilters.team === 'all') currentFilters.team = 'Josh';
    buildTeamButtons();
  } else {
    if (officeBtn) officeBtn.className = 'role-btn px-3 py-1.5 bg-white text-brand-800';
    if (techBtn) techBtn.className = 'role-btn px-3 py-1.5 bg-white/10 text-white hover:bg-white/20';
    if (revenueEl) revenueEl.classList.remove('hidden');
    if (rangeBar) rangeBar.classList.add('hidden');
    hideEls.forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('hidden'));
    const vtWrap = document.getElementById('viewTitle');
    if (vtWrap && vtWrap.parentElement) vtWrap.parentElement.classList.remove('hidden');
  }
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
  const bounds = roleMode === 'tech' ? getRangeBounds(currentFilters.range) : null;
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
  const jc = document.getElementById('jobCount');
  if (jc) jc.textContent = count + ' job' + (count !== 1 ? 's' : '');
  const rc = document.getElementById('returnCount');
  if (rc) {
    if (returns > 0) {
      rc.textContent = returns + ' return' + (returns !== 1 ? 's' : '');
      rc.classList.remove('hidden');
    } else rc.classList.add('hidden');
  }
  const rt = document.getElementById('revenueTotal');
  if (rt) rt.textContent = formatMoney(revenue);
}

function updateStatsPanel() {
  const byTeam = {};
  TEAMS.forEach(t => byTeam[t] = { jobs: 0, returns: 0, amount: 0 });
  filtered.forEach(j => {
    if (!byTeam[j.team_lead]) return;
    byTeam[j.team_lead].jobs++;
    if (j.is_return) byTeam[j.team_lead].returns++;
    byTeam[j.team_lead].amount += j.amount || 0;
  });
  const panel = document.getElementById('statsPanel');
  if (!panel) return;
  const isTech = roleMode === 'tech';
  panel.innerHTML = TEAMS.map(t => {
    const s = byTeam[t];
    if (s.jobs === 0) return '';
    const right = isTech ? (s.jobs + ' job' + (s.jobs !== 1 ? 's' : '')) : (s.jobs + ' · ' + formatMoney(s.amount));
    return '<div class="flex justify-between items-center"><span class="font-medium">' + t + '</span><span class="text-slate-500">' + right + '</span></div>';
  }).filter(Boolean).join('') || '<p class="text-slate-400">No data</p>';
}

function render() {
  const container = document.getElementById('jobsContainer');
  const empty = document.getElementById('emptyState');
  if (!container) return;
  if (filtered.length === 0) {
    container.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    const vt = document.getElementById('viewTitle');
    if (vt) vt.textContent = 'No matching jobs';
    return;
  }
  if (empty) empty.classList.add('hidden');
  if (viewMode === 'date') {
    const vt = document.getElementById('viewTitle');
    if (vt) vt.textContent = 'Jobs by Date';
    renderByDate(container);
  } else {
    const vt = document.getElementById('viewTitle');
    if (vt) vt.textContent = 'Jobs by Team';
    renderByTeam(container);
  }
  syncHeaderHeight();
}

function renderByDate(container) {
  const groups = groupBy(filtered, j => j.date);
  const dates = Object.keys(groups).sort();
  const isTech = roleMode === 'tech';
  const gridCls = (compactMode && isTech)
    ? 'grid grid-cols-2 gap-1.5'
    : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3';

  container.innerHTML = dates.map(date => {
    const jobs = groups[date].slice().sort((a, b) => jobSortMinutes(a) - jobSortMinutes(b));
    const dayTotal = jobs.reduce((s, j) => s + (j.amount || 0), 0);
    const returns = jobs.filter(j => j.is_return).length;
    const returnBit = returns
      ? '<span class="text-amber-700 font-medium"> · ' + returns + ' return' + (returns > 1 ? 's' : '') + '</span>'
      : '';
    const moneyBit = (!isTech)
      ? '<span class="text-sm font-semibold text-emerald-700 tabular-nums">' + formatMoney(dayTotal) + '</span>'
      : '';

    return (
      '<section class="day-block" data-date="' + date + '">' +
        '<div class="day-block-head">' +
          '<div class="min-w-0">' +
            '<p class="day-block-date">' + formatDate(date) + '</p>' +
            '<p class="day-block-meta">' + jobs.length + ' job' + (jobs.length !== 1 ? 's' : '') + returnBit + '</p>' +
          '</div>' +
          moneyBit +
        '</div>' +
        '<div class="day-block-body ' + gridCls + '">' +
          jobs.map(jobCard).join('') +
        '</div>' +
      '</section>'
    );
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
    const dayTotal = jobs.reduce((s, j) => s + (j.amount || 0), 0);
    const returns = jobs.filter(j => j.is_return).length;
    return '<section><div class="flex items-center justify-between mb-2"><h3 class="font-semibold"><span class="inline-block px-2 py-0.5 rounded ' +
      (TEAM_COLORS[team] || 'bg-slate-100') + ' team-chip mr-1">' + team + '</span><span class="text-slate-400 font-normal text-sm">' +
      jobs.length + ' jobs' + (returns ? ' · ' + returns + ' returns' : '') + '</span></h3>' +
      (roleMode === 'office' ? '<span class="text-sm font-medium text-emerald-700">' + formatMoney(dayTotal) + '</span>' : '') +
      '</div><div class="' + (compactMode && roleMode === 'tech' ? 'grid grid-cols-2 gap-1.5' : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3') + '">' + jobs.map(jobCard).join('') + '</div></section>';
  }).join('');
  bindCardClicks();
}

function jobCard(j) {
  const returnBadge = j.is_return ? '<span class="return-badge shrink-0 whitespace-nowrap text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">RETURN</span>' : '';
  const isTech = roleMode === 'tech';
  const isPaid = !!(j.receipt && String(j.receipt).trim());
  let rightBadge;
  if (isTech) {
    rightBadge = isPaid
      ? '<span class="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">PAID</span>'
      : '<span class="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">UNPAID</span>';
  } else {
    rightBadge = j.amount != null
      ? '<span class="font-semibold text-emerald-700">' + formatMoney(j.amount) + '</span>'
      : '<span class="text-slate-400 text-xs">—</span>';
  }
  const units = j.acs
    ? '<span class="inline-flex items-center text-[11px] font-semibold bg-white/80 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded">' + esc(j.acs) + '</span>'
    : '';
  const dist = DISTRICT_COLORS[j.district] || DISTRICT_FALLBACK;
  const callCls = 'inline-flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm active:bg-emerald-100';

  if (compactMode && isTech) {
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
        '<div class="flex items-center gap-1.5 shrink-0 mt-auto pt-1.5">' + teamChip + units + '</div>' +
      '</div></article>';
  }

  const showTeam = currentFilters.team === 'all';
  const teamChip = showTeam
    ? '<span class="text-[10px] font-medium px-1.5 py-0.5 rounded ' + (TEAM_COLORS[j.team_lead] || 'bg-slate-100') + '">' + esc(j.team_lead) + '</span>'
    : '';

  if (isTech) {
    const addressBlock = j.address
      ? '<div class="mt-2 px-3 py-2 rounded-lg border text-[13px] leading-snug font-medium break-words" style="background:' + dist.bg + ';border-color:' + dist.border + ';color:' + dist.text + ';overflow-wrap:anywhere">' +
        esc(j.address) + (j.district ? ' <span class="opacity-70 text-[11px] font-semibold">' + esc(j.district) + '</span>' : '') + '</div>'
      : '';
    const notesBlock = j.notes
      ? '<p class="text-[12px] text-slate-600 mt-2 leading-snug line-clamp-3 border-l-2 border-slate-200 pl-2 break-words" style="overflow-wrap:anywhere">' + esc(j.notes) + '</p>'
      : '';
    const callBtn = j.mobile ? '<div class="mt-2.5">' + phoneButton(j.mobile, { cls: callCls }) + '</div>' : '';
    return '<article class="job-card bg-white border border-slate-200 rounded-xl p-3.5 cursor-pointer hover:shadow-md transition-shadow overflow-hidden max-w-full" data-id="' + esc(j.job_id) + '">' +
      '<div class="flex items-start justify-between gap-2">' +
        '<div class="min-w-0 flex-1">' +
          '<p class="text-[15px] font-bold text-slate-800 leading-tight">' + esc(displayTime(j)) + '</p>' +
          '<p class="text-[14px] font-semibold text-slate-700 mt-0.5 truncate">' + esc(j.client_name) + '</p>' +
        '</div>' +
        '<div class="flex flex-col items-end gap-1 shrink-0">' + returnBadge + rightBadge + '</div>' +
      '</div>' +
      addressBlock + notesBlock + callBtn +
      '<div class="flex items-center gap-1.5 flex-wrap mt-2.5">' + teamChip + units + '</div></article>';
  }

  const addressBlock = j.address
    ? '<div class="mt-2 px-2.5 py-1.5 rounded-lg border text-[12px] leading-snug break-words" style="background:' + dist.bg + ';border-color:' + dist.border + ';color:' + dist.text + ';overflow-wrap:anywhere"><span class="font-medium">' +
      esc(j.address) + '</span>' + (j.district ? '<span class="ml-1.5 opacity-70 text-[10px] font-semibold tracking-wide">' + esc(j.district) + '</span>' : '') + '</div>'
    : '';
  const mapsCls = 'inline-flex items-center justify-center gap-1.5 flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-semibold text-sm active:bg-sky-100';
  const phoneCls = 'inline-flex items-center justify-center gap-1.5 flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm active:bg-emerald-100';
  const actions = [];
  if (j.mobile) actions.push(phoneButton(j.mobile, { cls: phoneCls, label: String(j.mobile).trim() }));
  if (j.address) actions.push(mapsButton(j.address, { cls: mapsCls, label: 'Maps' }));
  const actionRow = actions.length
    ? '<div class="mt-2 flex gap-2">' + actions.join('') + '</div>'
    : '';
  return '<article class="job-card bg-white border border-slate-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow overflow-hidden max-w-full" data-id="' + esc(j.job_id) + '">' +
    '<div class="flex items-start justify-between gap-2 mb-1"><div class="min-w-0"><p class="font-medium text-sm truncate">' + esc(j.client_name) + '</p>' +
    '<p class="text-xs text-slate-500 truncate">' + esc(displayTime(j)) + '</p></div><div class="flex flex-col items-end gap-1 shrink-0">' + returnBadge + rightBadge + '</div></div>' +
    '<div class="flex items-center gap-1.5 flex-wrap mt-1.5">' + teamChip + units + '</div>' +
    addressBlock + (j.notes ? '<p class="text-xs text-slate-500 mt-1.5 line-clamp-2 break-words" style="overflow-wrap:anywhere">' + esc(j.notes) + '</p>' : '') +
    actionRow + '</article>';
}

function bindCardClicks() {
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
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
  const isTech = roleMode === 'tech';
  const isPaid = !!(j.receipt && String(j.receipt).trim());
  const paidStatus = isPaid
    ? '<span class="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">PAID</span>'
    : '<span class="inline-flex items-center gap-1.5 text-rose-700 font-semibold">UNPAID</span>';
  const rows = isTech ? [
    ['Type', j.is_return ? '<span class="text-amber-600 font-semibold">Return</span>' : 'Full clean'],
    ['Team', j.team_lead + (j.team_members ? ' (' + j.team_members + ')' : '')],
    ['ACs / Units', j.acs || '— (empty → treated as return)'],
    ['Payment Status', paidStatus],
    ['Mobile', phoneButton(j.mobile)],
    ['Address', addressHtml],
    ['District', j.district || '—'],
    ['Notes', j.notes || '—'],
    ['Job ID', j.job_id]
  ] : [
    ['Type', j.is_return ? '<span class="text-amber-600 font-semibold">Return</span>' : 'Full clean'],
    ['Team', j.team_lead + (j.team_members ? ' (' + j.team_members + ')' : '')],
    ['ACs / Units', j.acs || '— (empty → treated as return)'],
    ['Amount', j.amount != null ? formatMoney(j.amount) : '—'],
    ['Mobile', phoneButton(j.mobile)],
    ['Address', addressHtml],
    ['District', j.district || '—'],
    ['Invoice', j.invoice || '—'],
    ['Receipt', j.receipt || '—'],
    ['Payment', j.payment || '—'],
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

window.onAuthReady = function(role, user) {
  window.__forcedRole = role;
  if (role === 'tech') {
    roleMode = 'tech';
    viewMode = 'date';
    localStorage.setItem('be-role', 'tech');
    if (!currentFilters.team || currentFilters.team === 'all') currentFilters.team = 'Josh';
    const toggle = document.getElementById('roleToggle');
    if (toggle) toggle.classList.add('hidden');
    document.querySelectorAll('.view-btn').forEach(b => b.classList.add('hidden'));
    document.body.classList.add('role-tech');
    document.body.classList.remove('role-office');
  } else {
    roleMode = localStorage.getItem('be-role') || 'office';
    if (roleMode === 'office') currentFilters.team = 'all';
    const toggle = document.getElementById('roleToggle');
    if (toggle) toggle.classList.remove('hidden');
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('hidden'));
    document.body.classList.add('role-office');
    document.body.classList.remove('role-tech');
  }
  init();
};
