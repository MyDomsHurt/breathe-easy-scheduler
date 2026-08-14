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
  const m = s.match(/^(\d{1,2})[.:](\d{2})(am|pm)?$/);
  if (!m) return 9999;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3] || '';
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return h * 60 + min;
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
      return timeToMinutes(a.time) - timeToMinutes(b.time);
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
  document.getElementById('dateSelect').addEventListener('change', e => {
    currentFilters.date = e.target.value;
    applyFilters();
  });
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentFilters.search = e.target.value.trim().toLowerCase();
      applyFilters();
    }, 200);
  });
  document.getElementById('viewByDate').addEventListener('click', () => {
    viewMode = 'date';
    setActive('.view-btn', document.getElementById('viewByDate'));
    render();
  });
  document.getElementById('viewByTeam').addEventListener('click', () => {
    viewMode = 'team';
    setActive('.view-btn', document.getElementById('viewByTeam'));
    render();
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.getElementById('roleOffice').addEventListener('click', () => setRole('office'));
  document.getElementById('roleTech').addEventListener('click', () => setRole('tech'));
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
    officeBtn.className = 'role-btn px-3 py-1.5 bg-white/10 text-white hover:bg-white/20';
    techBtn.className = 'role-btn px-3 py-1.5 bg-white text-brand-800';
    revenueEl.classList.add('hidden');
    if (rangeBar) rangeBar.classList.remove('hidden');
    hideEls.forEach(el => el.classList.add('hidden'));
    currentFilters.month = 'all';
    currentFilters.date = 'all';
    currentFilters.search = '';
    currentFilters.type = 'all';
    if (!currentFilters.team || currentFilters.team === 'all') currentFilters.team = 'Josh';
    buildTeamButtons();
  } else {
    officeBtn.className = 'role-btn px-3 py-1.5 bg-white text-brand-800';
    techBtn.className = 'role-btn px-3 py-1.5 bg-white/10 text-white hover:bg-white/20';
    revenueEl.classList.remove('hidden');
    if (rangeBar) rangeBar.classList.add('hidden');
    hideEls.forEach(el => el.classList.remove('hidden'));
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
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });
  updateHeaderStats();
  updateStatsPanel();
  render();
}

function updateHeaderStats() {
  const count = filtered.length;
  const returns = filtered.filter(j => j.is_return).length;
  const revenue = filtered.reduce((s, j) => s + (j.amount || 0), 0);
  document.getElementById('jobCount').textContent = count + ' job' + (count !== 1 ? 's' : '');
  const rc = document.getElementById('returnCount');
  if (returns > 0) {
    rc.textContent = returns + ' return' + (returns !== 1 ? 's' : '');
    rc.classList.remove('hidden');
  } else {
    rc.classList.add('hidden');
  }
  document.getElementById('revenueTotal').textContent = formatMoney(revenue);
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
  container.innerHTML = dates.map(date => {
    const jobs = groups[date].slice().sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    const dayTotal = jobs.reduce((s, j) => s + (j.amount || 0), 0);
    const returns = jobs.filter(j => j.is_return).length;
    return '<section><div class="flex items-center justify-between mb-2 sticky top-[60px] bg-slate-50/95 backdrop-blur py-1 z-10"><h3 class="font-semibold text-brand-800">' +
      formatDate(date) + '<span class="text-slate-400 font-normal text-sm ml-2">' + jobs.length + ' jobs</span>' +
      (returns ? '<span class="ml-1 text-amber-600 text-sm">· ' + returns + ' return' + (returns > 1 ? 's' : '') + '</span>' : '') +
      '</h3>' + (roleMode === 'office' ? '<span class="text-sm font-medium text-emerald-700">' + formatMoney(dayTotal) + '</span>' : '') +
      '</div><div class="' + (compactMode && roleMode === 'tech' ? 'grid grid-cols-2 gap-1.5' : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3') + '">' + jobs.map(jobCard).join('') + '</div></section>';
  }).join('');
  bindCardClicks();
}

function renderByTeam(container) {
  const groups = groupBy(filtered, j => j.team_lead);
  const order = TEAMS.filter(t => groups[t]);
  container.innerHTML = order.map(team => {
    const jobs = groups[team].slice().sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    const dayTotal = jobs.reduce((s, j) => s + (j.amount || 0), 0);
    const returns = jobs.filter(j => j.is_return).length;
    return '<section><div class="flex items-center justify-between mb-2"><h3 class="font-semibold"><span class="inline-block px-2 py-0.5 rounded ' +
      (TEAM_COLORS[team] || 'bg-slate-100') + ' team-chip mr-1">' + team + '</span><span class="text-slate-400 font-normal text-sm">' +
      jobs.length + ' jobs' + (returns ? ' · ' + returns + ' returns' : '') + '</span></h3>' +
      (roleMode === 'office' ? '<span class="text-sm font-medium text-emerald-700">' + formatMoney(dayTotal) + '</span>' : '') +
      '</div><div class="' + (compactMode && roleMode === 'tech' ? 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3' : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3').replace('grid gap-2 sm:grid-cols-2 xl:grid-cols-3', compactMode && roleMode === 'tech' ? 'grid grid-cols-2 gap-1.5' : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3') + '">' + jobs.map(jobCard).join('') + '</div></section>';
  }).join('');
  bindCardClicks();
}

function jobCard(j) {
  const returnBadge = j.is_return ? '<span class="return-badge text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">RETURN</span>' : '';
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
  // Units chip: show AC count on cleans; leave blank on returns (RETURN badge covers type)
  const units = j.acs
    ? '<span class="inline-flex items-center text-[11px] font-semibold bg-white/80 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded">' + esc(j.acs) + '</span>'
    : '';
  const dist = DISTRICT_COLORS[j.district] || DISTRICT_FALLBACK;

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
        '<div class="flex items-start justify-between gap-1">' +
          '<p class="font-semibold text-[12px] leading-tight line-clamp-1 text-slate-800">' + esc(j.client_name) + '</p>' +
          returnBadge +
        '</div>' +
        '<p class="text-[12px] font-semibold text-slate-700 mt-0.5">' + esc(j.time || '—') + '</p>' +
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
      ? '<div class="mt-2 px-3 py-2 rounded-lg border text-[13px] leading-snug font-medium" style="background:' + dist.bg + ';border-color:' + dist.border + ';color:' + dist.text + '">' +
        esc(j.address) + (j.district ? ' <span class="opacity-70 text-[11px] font-semibold">' + esc(j.district) + '</span>' : '') + '</div>'
      : '';
    const notesBlock = j.notes
      ? '<p class="text-[12px] text-slate-600 mt-2 leading-snug line-clamp-3 border-l-2 border-slate-200 pl-2">' + esc(j.notes) + '</p>'
      : '';
    return '<article class="job-card bg-white border border-slate-200 rounded-xl p-3.5 cursor-pointer hover:shadow-md transition-shadow" data-id="' + esc(j.job_id) + '">' +
      '<div class="flex items-start justify-between gap-2">' +
        '<div class="min-w-0 flex-1">' +
          '<p class="text-[15px] font-bold text-slate-800 leading-tight">' + esc(j.time || '—') + '</p>' +
          '<p class="text-[14px] font-semibold text-slate-700 mt-0.5 truncate">' + esc(j.client_name) + '</p>' +
        '</div>' +
        '<div class="flex flex-col items-end gap-1 shrink-0">' + returnBadge + rightBadge + '</div>' +
      '</div>' +
      addressBlock + notesBlock +
      '<div class="flex items-center gap-1.5 flex-wrap mt-2.5">' + teamChip + units + '</div></article>';
  }

  const addressBlock = j.address
    ? '<div class="mt-2 px-2.5 py-1.5 rounded-lg border text-[12px] leading-snug" style="background:' + dist.bg + ';border-color:' + dist.border + ';color:' + dist.text + '"><span class="font-medium">' +
      esc(j.address) + '</span>' + (j.district ? '<span class="ml-1.5 opacity-70 text-[10px] font-semibold tracking-wide">' + esc(j.district) + '</span>' : '') + '</div>'
    : '';
  return '<article class="job-card bg-white border border-slate-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow" data-id="' + esc(j.job_id) + '">' +
    '<div class="flex items-start justify-between gap-2 mb-1"><div class="min-w-0"><p class="font-medium text-sm truncate">' + esc(j.client_name) + '</p>' +
    '<p class="text-xs text-slate-500 truncate">' + esc(j.time || '—') + '</p></div><div class="flex flex-col items-end gap-1 shrink-0">' + returnBadge + rightBadge + '</div></div>' +
    '<div class="flex items-center gap-1.5 flex-wrap mt-1.5">' + teamChip + units + '</div>' +
    addressBlock + (j.notes ? '<p class="text-xs text-slate-500 mt-1.5 line-clamp-2">' + esc(j.notes) + '</p>' : '') + '</article>';
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
  document.getElementById('modalSub').textContent = formatDate(j.date) + ' · ' + (j.time || '—') + ' · ' + j.team_lead;
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
    ['Mobile', j.mobile || '—'],
    ['Address', addressHtml],
    ['District', j.district || '—'],
    ['Notes', j.notes || '—'],
    ['Job ID', j.job_id]
  ] : [
    ['Type', j.is_return ? '<span class="text-amber-600 font-semibold">Return</span>' : 'Full clean'],
    ['Team', j.team_lead + (j.team_members ? ' (' + j.team_members + ')' : '')],
    ['ACs / Units', j.acs || '— (empty → treated as return)'],
    ['Amount', j.amount != null ? formatMoney(j.amount) : '—'],
    ['Mobile', j.mobile || '—'],
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

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    const toggle = document.getElementById('roleToggle');
    if (toggle) toggle.classList.remove('hidden');
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('hidden'));
    document.body.classList.add('role-office');
    document.body.classList.remove('role-tech');
  }
  init();
};
