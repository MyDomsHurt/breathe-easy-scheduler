/* Breathe-Easy Scheduler — August 2026 */

let allJobs = [];
let filtered = [];
let currentFilters = {
  week: 'all',
  team: 'all',
  type: 'all',
  date: 'all',
  search: ''
};
let viewMode = 'date'; // 'date' | 'team'

const TEAMS = ['Josh', 'Matthew', 'Tiago', 'Nick', 'Alun', 'Iggi'];
const TEAM_COLORS = {
  Josh: 'bg-violet-100 text-violet-800',
  Matthew: 'bg-sky-100 text-sky-800',
  Tiago: 'bg-emerald-100 text-emerald-800',
  Nick: 'bg-amber-100 text-amber-800',
  Alun: 'bg-rose-100 text-rose-800',
  Iggi: 'bg-indigo-100 text-indigo-800'
};

async function init() {
  try {
    // Prefer manifest of small part files, then fall back to single jobs.json
    let files = [];
    try {
      const man = await fetch('data/manifest.json');
      if (man.ok) files = await man.json();
    } catch (_) {}

    if (files.length) {
      const results = await Promise.all(
        files.map(f =>
          fetch('data/' + f)
            .then(r => (r.ok ? r.json() : []))
            .catch(() => [])
        )
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
      return (a.time || '').localeCompare(b.time || '');
    });
    buildTeamButtons();
    buildDateSelect();
    bindEvents();
    applyFilters();
  } catch (err) {
    document.getElementById('jobsContainer').innerHTML =
      `<div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load job data. Serve this folder over HTTP
        (e.g. <code class="bg-red-100 px-1 rounded">npx serve .</code>).
        <br><span class="text-sm">${err.message}</span>
      </div>`;
  }
}

function buildTeamButtons() {
  const container = document.getElementById('teamFilters');
  TEAMS.forEach(t => {
    const btn = document.createElement('button');
    btn.dataset.team = t;
    btn.className = 'team-btn px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200';
    btn.textContent = t;
    container.appendChild(btn);
  });
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
  // Week
  document.querySelectorAll('.week-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setActive('.week-btn', btn);
      currentFilters.week = btn.dataset.week;
      applyFilters();
    });
  });

  // Team
  document.getElementById('teamFilters').addEventListener('click', e => {
    const btn = e.target.closest('.team-btn');
    if (!btn) return;
    setActive('.team-btn', btn);
    currentFilters.team = btn.dataset.team;
    applyFilters();
  });

  // Type
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setActive('.type-btn', btn);
      currentFilters.type = btn.dataset.type;
      applyFilters();
    });
  });

  // Date select
  document.getElementById('dateSelect').addEventListener('change', e => {
    currentFilters.date = e.target.value;
    applyFilters();
  });

  // Search
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentFilters.search = e.target.value.trim().toLowerCase();
      applyFilters();
    }, 200);
  });

  // View mode
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

  // Modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function setActive(selector, activeBtn) {
  document.querySelectorAll(selector).forEach(b => {
    b.classList.remove('active', 'bg-brand-600', 'text-white');
    b.classList.add('bg-slate-100', 'hover:bg-slate-200');
  });
  activeBtn.classList.add('active', 'bg-brand-600', 'text-white');
  activeBtn.classList.remove('bg-slate-100', 'hover:bg-slate-200');
}

function applyFilters() {
  filtered = allJobs.filter(j => {
    if (currentFilters.week !== 'all' && j.week !== Number(currentFilters.week)) return false;
    if (currentFilters.team !== 'all' && j.team_lead !== currentFilters.team) return false;
    if (currentFilters.type === 'clean' && j.is_return) return false;
    if (currentFilters.type === 'return' && !j.is_return) return false;
    if (currentFilters.date !== 'all' && j.date !== currentFilters.date) return false;
    if (currentFilters.search) {
      const hay = [
        j.client_name, j.mobile, j.address, j.notes, j.acs, j.invoice
      ].join(' ').toLowerCase();
      if (!hay.includes(currentFilters.search)) return false;
    }
    return true;
  });
  updateHeaderStats();
  updateStatsPanel();
  render();
}

function updateHeaderStats() {
  const count = filtered.length;
  const returns = filtered.filter(j => j.is_return).length;
  const revenue = filtered.reduce((s, j) => s + (j.amount || 0), 0);

  document.getElementById('jobCount').textContent = `${count} job${count !== 1 ? 's' : ''}`;
  const rc = document.getElementById('returnCount');
  if (returns > 0) {
    rc.textContent = `${returns} return${returns !== 1 ? 's' : ''}`;
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
  panel.innerHTML = TEAMS.map(t => {
    const s = byTeam[t];
    if (s.jobs === 0) return '';
    return `<div class="flex justify-between items-center">
      <span class="font-medium">${t}</span>
      <span class="text-slate-500">${s.jobs} · ${formatMoney(s.amount)}</span>
    </div>`;
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
}

function renderByDate(container) {
  const groups = groupBy(filtered, j => j.date);
  const dates = Object.keys(groups).sort();

  container.innerHTML = dates.map(date => {
    const jobs = groups[date];
    const dayTotal = jobs.reduce((s, j) => s + (j.amount || 0), 0);
    const returns = jobs.filter(j => j.is_return).length;

    return `
      <section>
        <div class="flex items-center justify-between mb-2 sticky top-[60px] bg-slate-50/95 backdrop-blur py-1 z-10">
          <h3 class="font-semibold text-brand-800">${formatDate(date)}
            <span class="text-slate-400 font-normal text-sm ml-2">${jobs.length} jobs</span>
            ${returns ? `<span class="ml-1 text-amber-600 text-sm">· ${returns} return${returns>1?'s':''}</span>` : ''}
          </h3>
          <span class="text-sm font-medium text-emerald-700">${formatMoney(dayTotal)}</span>
        </div>
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          ${jobs.map(jobCard).join('')}
        </div>
      </section>`;
  }).join('');

  bindCardClicks();
}

function renderByTeam(container) {
  const groups = groupBy(filtered, j => j.team_lead);
  const order = TEAMS.filter(t => groups[t]);

  container.innerHTML = order.map(team => {
    const jobs = groups[team];
    const dayTotal = jobs.reduce((s, j) => s + (j.amount || 0), 0);
    const returns = jobs.filter(j => j.is_return).length;

    return `
      <section>
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">
            <span class="inline-block px-2 py-0.5 rounded ${TEAM_COLORS[team] || 'bg-slate-100'} team-chip mr-1">${team}</span>
            <span class="text-slate-400 font-normal text-sm">${jobs.length} jobs
            ${returns ? `· ${returns} returns` : ''}</span>
          </h3>
          <span class="text-sm font-medium text-emerald-700">${formatMoney(dayTotal)}</span>
        </div>
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          ${jobs.map(jobCard).join('')}
        </div>
      </section>`;
  }).join('');

  bindCardClicks();
}

function jobCard(j) {
  const returnBadge = j.is_return
    ? `<span class="return-badge text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">RETURN</span>`
    : '';
  const acs = j.acs
    ? `<span class="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">${esc(j.acs)}</span>`
    : '';
  const amount = j.amount != null
    ? `<span class="font-semibold text-emerald-700">${formatMoney(j.amount)}</span>`
    : `<span class="text-slate-400 text-xs">—</span>`;

  return `
    <article class="job-card bg-white border border-slate-200 rounded-xl p-3 cursor-pointer"
             data-id="${esc(j.job_id)}">
      <div class="flex items-start justify-between gap-2 mb-1">
        <div class="min-w-0">
          <p class="font-medium text-sm truncate">${esc(j.client_name)}</p>
          <p class="text-xs text-slate-500 truncate">${esc(j.time || '—')}</p>
        </div>
        <div class="flex flex-col items-end gap-1 shrink-0">
          ${returnBadge}
          ${amount}
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-wrap mt-1.5">
        <span class="text-[10px] font-medium px-1.5 py-0.5 rounded ${TEAM_COLORS[j.team_lead] || 'bg-slate-100'}">${esc(j.team_lead)}</span>
        ${acs}
        ${j.district ? `<span class="text-[10px] text-slate-400">${esc(j.district)}</span>` : ''}
      </div>
      ${j.notes ? `<p class="text-xs text-slate-500 mt-1.5 line-clamp-2">${esc(j.notes)}</p>` : ''}
    </article>`;
}

function bindCardClicks() {
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
      const job = filtered.find(j => j.job_id === card.dataset.id)
               || allJobs.find(j => j.job_id === card.dataset.id);
      if (job) openModal(job);
    });
  });
}

function openModal(j) {
  document.getElementById('modalTitle').textContent = j.client_name;
  document.getElementById('modalSub').textContent =
    `${formatDate(j.date)} · ${j.time || '—'} · ${j.team_lead}`;

  const rows = [
    ['Type', j.is_return ? '<span class="text-amber-600 font-semibold">Return</span>' : 'Full clean'],
    ['Team', `${j.team_lead}${j.team_members ? ` (${j.team_members})` : ''}`],
    ['ACs', j.acs || '— (empty → treated as return)'],
    ['Amount', j.amount != null ? formatMoney(j.amount) : '—'],
    ['Mobile', j.mobile || '—'],
    ['Address', j.address || '—'],
    ['District', j.district || '—'],
    ['Invoice', j.invoice || '—'],
    ['Receipt', j.receipt || '—'],
    ['Payment', j.payment || '—'],
    ['Notes', j.notes || '—'],
    ['Job ID', j.job_id]
  ];

  document.getElementById('modalBody').innerHTML = rows.map(([k, v]) => `
    <div>
      <dt class="text-xs font-medium text-slate-400 uppercase tracking-wide">${k}</dt>
      <dd class="mt-0.5 text-slate-800 break-words">${v}</dd>
    </div>`).join('');

  document.getElementById('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// Helpers
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
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
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

// Boot
init();
