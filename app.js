/**
 * app.js — Portal Engine
 * מדד התשואות | בפיקוח מקצועי: אור זמר
 * Hero tiles · Reveal sections · Insights drawer · Calculator
 */

'use strict';

/* ── Chart registry ──────────────────────────────── */
let _charts = {};
function _destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

const Portal = (() => {

  const PHONE     = '972502278922';
  let _activeKey  = null;
  let _sortState  = {};

  /* ── Colour helpers ─────────────────────────────── */
  function _cellColor(col, val) {
    if (col.type === 'text' || col.type === 'number') return '#F5F5F5';
    if (['fee','feeDeposit','feeAcc'].includes(col.key))
      return val <= 0.45 ? '#22C55E' : val >= 0.80 ? '#EF4444' : '#9CA3AF';
    if (col.key === 'equity')
      return val >= 90 ? '#22C55E' : val >= 80 ? '#F0D060' : '#9CA3AF';
    if (['y1','y3'].includes(col.key))
      return val >= 18 ? '#22C55E' : val >= 15 ? '#F0D060' : '#9CA3AF';
    return '#9CA3AF';
  }

  /* ── Format ─────────────────────────────────────── */
  function _fmt(col, val) {
    if (col.type === 'percent') return val.toFixed(2).replace(/\.?0+$/, '') + '%';
    if (col.type === 'number')  return Number(val).toLocaleString('he-IL');
    return val;
  }
  function _fmtILS(v) { return '₪' + Math.round(v).toLocaleString('he-IL'); }

  /* ── WhatsApp link ──────────────────────────────── */
  function _waLink(key) {
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(YIELD_DATA.waMessages[key] || '')}`;
  }

  /* ══════════════════════════════════════════════════
     HERO TILES
     ══════════════════════════════════════════════════ */
  function _buildTiles() {
    const grid = document.getElementById('tiles-grid');
    if (!grid) return;

    const items = YIELD_DATA.categories.map(cat => {
      const cfg    = YIELD_DATA.tables[cat.key];
      const topY1  = Math.max(...cfg.rows.map(r => r.y1));
      const topRow = cfg.rows.find(r => r.y1 === topY1);

      return `
      <div class="tile" id="tile-${cat.key}" onclick="Portal.openCategory('${cat.key}')">
        <span class="tile-icon">${cat.icon}</span>
        <div class="tile-label">${cat.label}</div>
        <div class="tile-sub">${cat.subtitle}</div>
        <div class="tile-yield">${topY1.toFixed(1)}%</div>
        <div class="tile-yield-label">תשואה שנתית מקסימלית</div>
        <div class="tile-leader">מוביל: ${topRow.name}</div>
        <span class="tile-arrow">←</span>
      </div>`;
    });

    /* CTA tile */
    items.push(`
      <div class="tile tile-cta" onclick="window.open('${_waLink('cta')}','_blank')">
        <span class="tile-icon">💬</span>
        <div class="tile-cta-label">בדיקת תיק אישית</div>
        <div class="tile-cta-sub">קבל ניתוח מקצועי מותאם אישית לתיק ולצרכים שלך</div>
        <span class="tile-wa-btn">פתח ייעוץ בוואטסאפ ←</span>
      </div>`);

    grid.innerHTML = items.join('');
  }

  /* ══════════════════════════════════════════════════
     KPI STRIP
     ══════════════════════════════════════════════════ */
  function _buildKpiStrip(key) {
    const cfg    = YIELD_DATA.tables[key];
    const rows   = cfg.rows;
    const topY1  = Math.max(...rows.map(r => r.y1));
    const topY3  = Math.max(...rows.map(r => r.y3));
    const lowFee = Math.min(...rows.map(r => r.fee ?? r.feeAcc ?? 0));
    const topRow    = rows.find(r => r.y1 === topY1);
    const topY3Row  = rows.find(r => r.y3 === topY3);
    const lowFeeRow = rows.find(r => (r.fee ?? r.feeAcc) === lowFee);

    return `
    <div class="kpi-strip">
      <div class="kpi-card">
        <span class="kpi-label">מוביל תשואה שנתית</span>
        <span class="kpi-value" style="color:#22C55E">${topY1.toFixed(1)}%</span>
        <span class="kpi-sub">${topRow.name}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">מוביל תשואה 3 שנים</span>
        <span class="kpi-value" style="color:#D4AF37">${topY3.toFixed(1)}%</span>
        <span class="kpi-sub">${topY3Row.name}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">דמי ניהול נמוכים</span>
        <span class="kpi-value" style="color:#F0D060">${lowFee.toFixed(2)}%</span>
        <span class="kpi-sub">${lowFeeRow.name}</span>
      </div>
      <div class="kpi-card kpi-cta" onclick="window.open('${_waLink(key)}','_blank')">
        <span class="kpi-label">ייעוץ מקצועי</span>
        <span class="kpi-value" style="font-size:1.6rem">💬</span>
        <span class="kpi-sub" style="color:var(--gold)">פתח וואטסאפ</span>
      </div>
    </div>`;
  }

  /* ══════════════════════════════════════════════════
     CALCULATOR
     ══════════════════════════════════════════════════ */
  function _buildCalculator(key) {
    const opts = YIELD_DATA.categories.map(c =>
      `<option value="${c.key}"${c.key === key ? ' selected' : ''}>${c.icon} ${c.label}</option>`
    ).join('');

    return `
    <div class="calc-panel">
      <div class="calc-header">
        <span class="calc-icon">💰</span>
        <div>
          <div class="calc-title">מחשבון פוטנציאל החיסכון</div>
          <div class="calc-sub">גלה כמה שווה לך לבחור במסלול המוביל</div>
        </div>
      </div>
      <div class="calc-inputs">
        <div class="calc-field">
          <label class="calc-label">חיסכון נוכחי</label>
          <div class="calc-input-wrap">
            <span class="calc-prefix">₪</span>
            <input type="number" id="calc-amount" class="calc-input"
                   value="100000" min="0" step="5000"
                   oninput="Portal.calcUpdate()" />
          </div>
        </div>
        <div class="calc-field">
          <label class="calc-label">קטגוריה</label>
          <select id="calc-category" class="calc-select" onchange="Portal.calcUpdate()">
            ${opts}
          </select>
        </div>
      </div>
      <div class="calc-results" id="calc-results"></div>
    </div>`;
  }

  /* ══════════════════════════════════════════════════
     TABLE
     ══════════════════════════════════════════════════ */
  function _buildTable(key) {
    const cfg    = YIELD_DATA.tables[key];
    const cols   = cfg.columns;
    const state  = _sortState[key] || { col: 1, dir: 'desc' };
    const topVal = Math.max(...cfg.rows.map(r => r[cfg.topKey]));
    const filter = (document.getElementById(`filter-${key}`)?.value || '').trim().toLowerCase();

    let sorted = [...cfg.rows].sort((a, b) => {
      const colKey = cols[state.col].key;
      const va = a[colKey], vb = b[colKey];
      if (typeof va === 'string')
        return state.dir === 'asc' ? va.localeCompare(vb, 'he') : vb.localeCompare(va, 'he');
      return state.dir === 'asc' ? va - vb : vb - va;
    });
    if (filter) sorted = sorted.filter(r => r.name.toLowerCase().includes(filter));

    const thead = `<thead><tr>${cols.map((c, i) => {
      const active = i === state.col;
      const dir    = active ? state.dir : '';
      return `<th class="th-sort ${dir}" data-view="${key}" data-col="${i}"
                  style="text-align:${c.align}">
        ${c.label} <span class="sort-icon">↓</span>
      </th>`;
    }).join('')}</tr></thead>`;

    const tbody = `<tbody>${sorted.map(r => {
      const isTop = r[cfg.topKey] === topVal;
      return `<tr class="${isTop ? 'row-top' : ''}">
        ${cols.map((c, i) => {
          const val   = r[c.key];
          const color = _cellColor(c, val);
          return `<td style="text-align:${c.align};color:${color};
                             ${i === 0 ? 'font-weight:600' : 'font-variant-numeric:tabular-nums;font-weight:500'}">
            ${isTop && i === 0 ? '<span class="top-star">★</span> ' : ''}${_fmt(c, val)}
          </td>`;
        }).join('')}
      </tr>`;
    }).join('')}</tbody>`;

    return `
    <div class="table-wrap" id="table-wrap-${key}">
      <table class="data-table" id="table-${key}">${thead}${tbody}</table>
    </div>`;
  }

  /* ══════════════════════════════════════════════════
     CHART — Gold + White/Light gradients
     ══════════════════════════════════════════════════ */
  function _renderChart(key) {
    const id = `chart-${key}`;
    _destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === 'undefined') return;

    const cfg    = YIELD_DATA.tables[key];
    const sorted = [...cfg.rows].sort((a, b) => b.y1 - a.y1);

    _charts[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(r => r.name),
        datasets: [
          {
            label: 'תשואה שנתית (12 חודשים)',
            data:  sorted.map(r => r.y1),
            backgroundColor: 'rgba(212,175,55,0.8)',
            borderColor:     '#D4AF37',
            borderWidth: 1.5,
            borderRadius: 6,
          },
          {
            label: 'ממוצע שנתי (3 שנים)',
            data:  sorted.map(r => +(r.y3 / 3).toFixed(2)),
            backgroundColor: 'rgba(245,245,245,0.28)',
            borderColor:     'rgba(245,245,245,0.75)',
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            labels: { color: '#9CA3AF', font: { family: 'Heebo', size: 12 }, padding: 16 }
          },
          tooltip: {
            backgroundColor: 'rgba(8,8,8,0.94)',
            borderColor: 'rgba(212,175,55,0.35)',
            borderWidth: 1,
            titleColor: '#D4AF37',
            bodyColor:  '#F5F5F5',
            callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y.toFixed(2)}%` }
          },
        },
        scales: {
          x: {
            ticks: { color: '#9CA3AF', font: { family: 'Heebo', size: 11 } },
            grid:  { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks: { color: '#9CA3AF', font: { family: 'Heebo', size: 11 }, callback: v => v + '%' },
            grid:  { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });
  }

  /* ══════════════════════════════════════════════════
     SORT LISTENER ATTACHMENT
     ══════════════════════════════════════════════════ */
  function _attachSortListeners() {
    const section = document.getElementById('content-section');
    if (!section) return;
    section.querySelectorAll('.th-sort').forEach(th => {
      th.addEventListener('click', () => {
        const k   = th.dataset.view;
        const col = parseInt(th.dataset.col);
        const prev = _sortState[k] || { col: 1, dir: 'desc' };
        _sortState[k] = { col, dir: prev.col === col ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'desc' };
        const wrap = document.getElementById(`table-wrap-${k}`);
        if (!wrap) return;
        const tmp = document.createElement('div');
        tmp.innerHTML = _buildTable(k);
        wrap.replaceWith(tmp.firstElementChild);
        _attachSortListeners();
      });
    });
  }

  /* ══════════════════════════════════════════════════
     CONTENT SECTION RENDERER
     ══════════════════════════════════════════════════ */
  function _renderContent(key) {
    const cat = YIELD_DATA.categories.find(c => c.key === key);
    const section   = document.getElementById('content-section');
    const container = section.querySelector('.container');

    container.innerHTML = `
      <div class="breadcrumb">
        <span class="breadcrumb-home" onclick="Portal.goHome()">ראשי</span>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-cur">${cat.label}</span>
      </div>

      <div class="section-title-row">
        <div>
          <div class="section-title">${cat.icon} ${cat.label}</div>
          <div class="section-sub">${cat.subtitle} · נתוני גמל נט · פברואר 2026</div>
        </div>
      </div>

      ${_buildKpiStrip(key)}
      ${_buildCalculator(key)}

      <div class="qs-bar">
        <span class="qs-label">מיון מהיר:</span>
        <button class="qs-btn" onclick="Portal.quickSort('${key}',1,'desc')">תשואה שנתית ↓</button>
        <button class="qs-btn" onclick="Portal.quickSort('${key}',2,'desc')">תשואה 3 שנים ↓</button>
        <button class="qs-btn" onclick="Portal.quickSort('${key}',3,'asc')">דמי ניהול ↑</button>
        <input type="text" id="filter-${key}" class="filter-input"
               placeholder="סנן לפי שם..." oninput="Portal.filterTable('${key}')">
      </div>

      ${_buildTable(key)}

      <div class="insights-drawer">
        <button class="drawer-toggle" onclick="Portal.toggleDrawer('${key}')">
          <span>📊 גרף תשואות השוואתי</span>
          <span class="drawer-arrow" id="drawer-arrow-${key}">▼</span>
        </button>
        <div class="drawer-body" id="drawer-body-${key}">
          <div class="chart-container">
            <canvas id="chart-${key}"></canvas>
          </div>
        </div>
      </div>

      <div class="disclaimer">
        ⚠️ ${YIELD_DATA.meta.disclaimer}
      </div>`;

    _attachSortListeners();
    Portal.calcUpdate();
  }

  /* ══════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════ */
  return {

    openCategory(key) {
      _activeKey = key;

      /* Mark active tile */
      document.querySelectorAll('.tile').forEach(t => t.classList.remove('tile-active'));
      document.getElementById(`tile-${key}`)?.classList.add('tile-active');

      /* Render + reveal content section */
      const section = document.getElementById('content-section');
      section.classList.remove('fade-up');
      _renderContent(key);
      section.classList.add('visible');

      /* Small delay so display:block takes effect before animation class */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          section.classList.add('fade-up');
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    },

    goHome() {
      _activeKey = null;
      const section = document.getElementById('content-section');
      section.classList.remove('visible', 'fade-up');
      /* Destroy any open charts */
      Object.keys(_charts).forEach(id => _destroyChart(id));
      document.querySelectorAll('.tile').forEach(t => t.classList.remove('tile-active'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    toggleDrawer(key) {
      const body  = document.getElementById(`drawer-body-${key}`);
      const arrow = document.getElementById(`drawer-arrow-${key}`);
      if (!body) return;
      const isOpen = body.classList.toggle('open');
      arrow?.classList.toggle('open', isOpen);
      if (isOpen)  _renderChart(key);
      else         _destroyChart(`chart-${key}`);
    },

    quickSort(key, col, dir) {
      _sortState[key] = { col, dir };
      const wrap = document.getElementById(`table-wrap-${key}`);
      if (!wrap) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = _buildTable(key);
      wrap.replaceWith(tmp.firstElementChild);
      _attachSortListeners();
    },

    filterTable(key) {
      const wrap = document.getElementById(`table-wrap-${key}`);
      if (!wrap) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = _buildTable(key);
      wrap.replaceWith(tmp.firstElementChild);
      _attachSortListeners();
    },

    calcUpdate() {
      const key    = document.getElementById('calc-category')?.value || _activeKey;
      if (!key) return;
      const amount = parseFloat(document.getElementById('calc-amount')?.value) || 100000;
      const cfg    = YIELD_DATA.tables[key];
      if (!cfg) return;

      const yields  = cfg.rows.map(r => r.y1);
      const yields3 = cfg.rows.map(r => r.y3);
      const topY1   = Math.max(...yields);
      const avgY1   = yields.reduce((a, b) => a + b, 0) / yields.length;
      const topY3   = Math.max(...yields3);
      const avgY3   = yields3.reduce((a, b) => a + b, 0) / yields3.length;
      const topRow  = cfg.rows.find(r => r.y1 === topY1);

      const topVal1 = amount * (1 + topY1 / 100);
      const avgVal1 = amount * (1 + avgY1 / 100);
      const diff1   = topVal1 - avgVal1;
      const diff3   = amount * (1 + topY3 / 100) - amount * (1 + avgY3 / 100);

      const el = document.getElementById('calc-results');
      if (!el) return;
      el.innerHTML = `
        <div class="calc-result">
          <span class="calc-result-label">מוביל שנתי · ${topRow.name} (${topY1.toFixed(1)}%)</span>
          <span class="calc-result-val c-green">${_fmtILS(topVal1)}</span>
          <span class="calc-result-diff">+${_fmtILS(topVal1 - amount)} רווח שנתי</span>
        </div>
        <div class="calc-result">
          <span class="calc-result-label">ממוצע קטגוריה (${avgY1.toFixed(1)}%)</span>
          <span class="calc-result-val">${_fmtILS(avgVal1)}</span>
          <span class="calc-result-diff">+${_fmtILS(avgVal1 - amount)} רווח שנתי</span>
        </div>
        <div class="calc-result highlight">
          <span class="calc-result-label">יתרון מסלול מוביל — שנה</span>
          <span class="calc-result-val c-gold">+${_fmtILS(diff1)}</span>
          <span class="calc-result-diff" style="color:#22C55E">+${((diff1 / amount) * 100).toFixed(2)}% עודף</span>
        </div>
        <div class="calc-result highlight">
          <span class="calc-result-label">יתרון מסלול מוביל — 3 שנים</span>
          <span class="calc-result-val c-gold">+${_fmtILS(diff3)}</span>
          <span class="calc-result-diff" style="color:#22C55E">+${((diff3 / amount) * 100).toFixed(2)}% עודף</span>
        </div>`;
    },

    init() {
      _buildTiles();
    },
  };

})();

document.addEventListener('DOMContentLoaded', () => Portal.init());
