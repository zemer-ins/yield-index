/**
 * app.js — DataController Engine v2
 * מדד התשואות | אור זמר — מתכנן פיננסי
 * Features: Calculator · Charts · Sortable Tables · Live Filter
 */

'use strict';

/* ── Destroy Chart safely ─────────────────────── */
let _chartInstances = {};
function _destroyChart(id) {
  if (_chartInstances[id]) { _chartInstances[id].destroy(); delete _chartInstances[id]; }
}

const DataController = (() => {

  /* ── PRIVATE STATE ─────────────────────────── */
  let _currentKey = 'dashboard';
  let _sortState  = {};
  const PHONE     = '972502278922';

  /* ── COLOUR HELPERS ────────────────────────── */
  const _color = {
    yield:  v => v >= 18 ? '#22C55E' : v >= 15 ? '#F0D060' : '#9CA3AF',
    fee:    v => v <= 0.45 ? '#22C55E' : v >= 0.80 ? '#EF4444' : '#9CA3AF',
    equity: v => v >= 90 ? '#22C55E' : v >= 80 ? '#F0D060' : '#9CA3AF',
    text:   () => '#F5F5F5',
  };
  function _cellColor(col, val) {
    if (col.type === 'text' || col.type === 'number') return _color.text();
    if (['fee','feeDeposit','feeAcc'].includes(col.key)) return _color.fee(val);
    if (col.key === 'equity')  return _color.equity(val);
    if (['y1','y3'].includes(col.key)) return _color.yield(val);
    return '#9CA3AF';
  }

  /* ── FORMAT ────────────────────────────────── */
  function _fmt(col, val) {
    if (col.type === 'percent') return val.toFixed(2).replace(/\.?0+$/,'') + '%';
    if (col.type === 'number')  return Number(val).toLocaleString('he-IL');
    return val;
  }
  function _fmtILS(v) { return '₪' + Math.round(v).toLocaleString('he-IL'); }

  /* ── WHATSAPP ──────────────────────────────── */
  function _waLink(key) {
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(YIELD_DATA.waMessages[key] || '')}`;
  }

  /* ══════════════════════════════════════════════
     PROFIT CALCULATOR
     ══════════════════════════════════════════════ */
  function _buildCalculator() {
    const opts = YIELD_DATA.categories
      .filter(c => c.key !== 'dashboard')
      .map(c => `<option value="${c.key}">${c.icon} ${c.label}</option>`)
      .join('');

    return `
    <div class="calc-panel glass-card" id="calc-panel">
      <div class="calc-header">
        <span class="calc-icon-big">💰</span>
        <div>
          <div class="calc-title">מחשבון פוטנציאל החיסכון</div>
          <div class="calc-subtitle">גלה כמה שווה לך לבחור במסלול המוביל</div>
        </div>
      </div>
      <div class="calc-inputs-row">
        <div class="calc-field">
          <label class="calc-label">חיסכון נוכחי</label>
          <div class="calc-input-wrap">
            <span class="calc-currency">₪</span>
            <input type="number" id="calc-amount" class="calc-input"
                   value="100000" min="0" step="5000"
                   oninput="DataController.calcUpdate()" />
          </div>
        </div>
        <div class="calc-field">
          <label class="calc-label">קטגוריה</label>
          <select id="calc-category" class="calc-select" onchange="DataController.calcUpdate()">
            ${opts}
          </select>
        </div>
        <div class="calc-field" style="align-self:flex-end;">
          <button class="btn-gold-sm" onclick="DataController.calcUpdate()">חשב</button>
        </div>
      </div>
      <div id="calc-results" class="calc-results-grid"></div>
    </div>`;
  }

  /* ══════════════════════════════════════════════
     KPI STRIP
     ══════════════════════════════════════════════ */
  function _buildKpiStrip(key) {
    const cfg    = YIELD_DATA.tables[key];
    const rows   = cfg.rows;
    const topY1  = Math.max(...rows.map(r => r.y1));
    const topY3  = Math.max(...rows.map(r => r.y3));
    const lowFee = Math.min(...rows.map(r => r.fee ?? r.feeAcc ?? 0));
    const topRow = rows.find(r => r.y1 === topY1);
    const topY3Row = rows.find(r => r.y3 === topY3);
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
        <span class="kpi-label">ייעוץ אישי</span>
        <span class="kpi-value" style="font-size:1.5rem">💬</span>
        <span class="kpi-sub" style="color:#D4AF37">פתח וואטסאפ</span>
      </div>
    </div>`;
  }

  /* ══════════════════════════════════════════════
     TABLE with Quick-Sort + Filter
     ══════════════════════════════════════════════ */
  function _buildQuickSort(key) {
    return `
    <div class="quick-sort-bar">
      <span class="quick-sort-label">מיון מהיר:</span>
      <button class="qs-btn" onclick="DataController.quickSort('${key}',1,'desc')">
        תשואה שנתית ↓
      </button>
      <button class="qs-btn" onclick="DataController.quickSort('${key}',2,'desc')">
        תשואה 3 שנים ↓
      </button>
      <button class="qs-btn" onclick="DataController.quickSort('${key}',3,'asc')">
        דמי ניהול ↑
      </button>
      <div class="qs-filter">
        <input type="text" id="filter-${key}" class="filter-input"
               placeholder="סנן לפי שם..."
               oninput="DataController.filterTable('${key}')">
      </div>
    </div>`;
  }

  function _buildTable(key) {
    const cfg    = YIELD_DATA.tables[key];
    const cols   = cfg.columns;
    const state  = _sortState[key] || { col: 1, dir: 'desc' };
    const topVal = Math.max(...cfg.rows.map(r => r[cfg.topKey]));
    const filter = (document.getElementById(`filter-${key}`)?.value || '').trim().toLowerCase();

    let sorted = [...cfg.rows].sort((a, b) => {
      const colKey = cols[state.col].key;
      const va = a[colKey], vb = b[colKey];
      if (typeof va === 'string') return state.dir === 'asc' ? va.localeCompare(vb,'he') : vb.localeCompare(va,'he');
      return state.dir === 'asc' ? va - vb : vb - va;
    });

    if (filter) sorted = sorted.filter(r => r.name.toLowerCase().includes(filter));

    const thead = `<thead><tr>${cols.map((c,i) => {
      const active = i === state.col;
      const dir    = active ? state.dir : '';
      return `<th class="th-sortable ${dir}" data-view="${key}" data-col="${i}"
                  style="text-align:${c.align}">
        ${c.label} <span class="sort-icon">${active && dir==='asc' ? '↑' : '↓'}</span>
      </th>`;
    }).join('')}</tr></thead>`;

    const tbody = `<tbody>${sorted.map(r => {
      const isTop = r[cfg.topKey] === topVal;
      return `<tr class="${isTop ? 'row-top' : ''}">
        ${cols.map((c,i) => {
          const val   = r[c.key];
          const color = _cellColor(c, val);
          return `<td style="text-align:${c.align};color:${color};
                             ${i===0?'font-weight:600':'font-variant-numeric:tabular-nums;font-weight:500'}">
            ${isTop && i===0 ? '<span class="top-star">★</span> ' : ''}${_fmt(c, val)}
          </td>`;
        }).join('')}
      </tr>`;
    }).join('')}</tbody>`;

    return `
    <div class="table-wrap">
      <table class="data-table" id="table-${key}">${thead}${tbody}</table>
    </div>`;
  }

  /* ══════════════════════════════════════════════
     CHART — Category Bar Chart (Chart.js)
     ══════════════════════════════════════════════ */
  function _buildChartCanvas(id) {
    return `<div class="chart-container glass-card"><canvas id="${id}"></canvas></div>`;
  }

  function _renderCategoryChart(key) {
    const id  = `chart-${key}`;
    _destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === 'undefined') return;

    const cfg    = YIELD_DATA.tables[key];
    const sorted = [...cfg.rows].sort((a,b) => b.y1 - a.y1);
    const labels = sorted.map(r => r.name);
    const y1data = sorted.map(r => r.y1);
    const y3data = sorted.map(r => +(r.y3 / 3).toFixed(2)); // annualised 3Y

    _chartInstances[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'תשואה שנתית (12 חודשים)',
            data: y1data,
            backgroundColor: 'rgba(212,175,55,0.75)',
            borderColor:     '#D4AF37',
            borderWidth: 1.5,
            borderRadius: 6,
          },
          {
            label: 'תשואה שנתית ממוצעת (3 שנים)',
            data: y3data,
            backgroundColor: 'rgba(34,197,94,0.55)',
            borderColor:     '#22C55E',
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
            backgroundColor: 'rgba(10,10,10,0.92)',
            borderColor: 'rgba(212,175,55,0.35)',
            borderWidth: 1,
            titleColor: '#D4AF37',
            bodyColor:  '#F5F5F5',
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`
            }
          },
        },
        scales: {
          x: {
            ticks:  { color: '#9CA3AF', font: { family: 'Heebo', size: 11 } },
            grid:   { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks:  { color: '#9CA3AF', font: { family: 'Heebo', size: 11 },
                      callback: v => v + '%' },
            grid:   { color: 'rgba(255,255,255,0.06)' },
            border: { color: 'rgba(212,175,55,0.15)' },
          },
        },
      },
    });
  }

  /* ══════════════════════════════════════════════
     CHART — Dashboard Growth Line Chart
     ══════════════════════════════════════════════ */
  const CHART_COLORS = ['#D4AF37','#22C55E','#F0D060','#4ade80','#8B7320'];

  function _growthSeries(principal, annualPct, months) {
    const monthly = annualPct / 100 / 12;
    return Array.from({ length: months + 1 }, (_, i) =>
      +(principal * Math.pow(1 + monthly, i)).toFixed(0)
    );
  }

  function _renderDashboardChart() {
    const id = 'chart-dashboard';
    _destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === 'undefined') return;

    const MONTHS    = 36;
    const PRINCIPAL = 100000;
    const labels    = Array.from({ length: MONTHS + 1 }, (_, i) => i % 6 === 0 ? `חודש ${i}` : '');

    const categories = YIELD_DATA.categories.filter(c => c.key !== 'dashboard');
    const datasets   = categories.map((cat, idx) => {
      const rows  = YIELD_DATA.tables[cat.key].rows;
      const topY1 = Math.max(...rows.map(r => r.y1));
      const topRow = rows.find(r => r.y1 === topY1);
      return {
        label:           `${cat.icon} ${cat.label} (${topRow.name} ${topY1.toFixed(1)}%)`,
        data:            _growthSeries(PRINCIPAL, topY1, MONTHS),
        borderColor:     CHART_COLORS[idx],
        backgroundColor: CHART_COLORS[idx] + '18',
        borderWidth:     2,
        pointRadius:     0,
        pointHoverRadius:5,
        tension:         0.3,
        fill:            false,
      };
    });

    _chartInstances[id] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 800, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9CA3AF', font: { family: 'Heebo', size: 11 }, padding: 12, boxWidth: 14 }
          },
          tooltip: {
            backgroundColor: 'rgba(10,10,10,0.93)',
            borderColor: 'rgba(212,175,55,0.3)',
            borderWidth: 1,
            titleColor: '#D4AF37',
            bodyColor:  '#F5F5F5',
            callbacks: {
              title: items => items[0]?.label || '',
              label: ctx  => ` ${ctx.dataset.label.split(' (')[0]}: ${_fmtILS(ctx.parsed.y)}`,
            }
          },
        },
        scales: {
          x: {
            ticks:  { color: '#4B5563', font: { family: 'Heebo', size: 10 }, maxRotation: 0 },
            grid:   { color: 'rgba(255,255,255,0.03)' },
          },
          y: {
            ticks:  { color: '#9CA3AF', font: { family: 'Heebo', size: 10 },
                      callback: v => '₪' + Number(v).toLocaleString('he-IL') },
            grid:   { color: 'rgba(255,255,255,0.05)' },
            border: { color: 'rgba(212,175,55,0.12)' },
          },
        },
      },
    });
  }

  /* ══════════════════════════════════════════════
     VIEW BUILDERS
     ══════════════════════════════════════════════ */
  function _buildDashboard() {
    const cats = YIELD_DATA.categories.filter(c => c.key !== 'dashboard');
    const cards = cats.map(cat => {
      const cfg    = YIELD_DATA.tables[cat.key];
      const topY1  = Math.max(...cfg.rows.map(r => r.y1));
      const topY3  = Math.max(...cfg.rows.map(r => r.y3));
      const topRow = cfg.rows.find(r => r.y1 === topY1);
      const lowFee = Math.min(...cfg.rows.map(r => r.fee ?? r.feeAcc ?? 0));

      return `
      <div class="dash-card glass-card" onclick="DataController.setView('${cat.key}')">
        <div class="dash-card-header">
          <span class="dash-icon">${cat.icon}</span>
          <div><div class="dash-title">${cat.label}</div>
               <div class="dash-sub">${cat.subtitle}</div></div>
        </div>
        <div class="dash-stats">
          <div class="dash-stat">
            <span class="dash-stat-label">תשואה שנתית מקסימלית</span>
            <span class="dash-stat-val" style="color:#22C55E">${topY1.toFixed(1)}%</span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat-label">תשואה 3 שנים מקסימלית</span>
            <span class="dash-stat-val" style="color:#D4AF37">${topY3.toFixed(1)}%</span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat-label">מוביל · דמי ניהול מינ׳</span>
            <span class="dash-stat-val" style="font-size:.8rem">${topRow.name} · ${lowFee.toFixed(2)}%</span>
          </div>
        </div>
        <div class="dash-arrow">←</div>
      </div>`;
    }).join('');

    return `
    <div class="view-header">
      <h2 class="view-title gold-text">סקירה כללית</h2>
      <p class="view-sub">כלי ניתוח השוואתי מקצועי · נתוני גמל נט · פברואר 2025</p>
    </div>

    ${_buildCalculator()}

    <div class="chart-section">
      <div class="chart-section-label">
        📈 סימולציית צמיחה — ₪100,000 לאורך 3 שנים (מסלולים מובילים)
      </div>
      ${_buildChartCanvas('chart-dashboard')}
    </div>

    <div class="section-label">קטגוריות</div>
    <div class="dash-grid">${cards}</div>
    <div class="disclaimer">
      ⚠️ הנתונים המוצגים הם לצורך המחשה בלבד. אינם מהווים ייעוץ השקעות.
      ביצועי עבר אינם מבטיחים תשואות עתידיות.
    </div>`;
  }

  function _buildCategoryView(key) {
    const cat = YIELD_DATA.categories.find(c => c.key === key);
    return `
    <div class="view-header">
      <h2 class="view-title gold-text">${cat.icon} ${cat.label}</h2>
      <p class="view-sub">${cat.subtitle} · נתוני גמל נט · פברואר 2025</p>
    </div>

    ${_buildKpiStrip(key)}

    <div class="chart-section">
      <div class="chart-section-label">📊 השוואת תשואות — שנתי מול ממוצע שנתי ל-3 שנים</div>
      ${_buildChartCanvas('chart-' + key)}
    </div>

    ${_buildQuickSort(key)}
    ${_buildTable(key)}

    <div class="disclaimer" style="margin-top:16px;">
      ⚠️ הנתונים המוצגים הם לצורך המחשה בלבד. לחץ על כותרת עמודה למיון מתקדם.
    </div>`;
  }

  /* ══════════════════════════════════════════════
     UPDATE VIEW ENGINE (no page refresh)
     ══════════════════════════════════════════════ */
  function _updateView() {
    const el = document.getElementById('main-content');
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transform = 'translateY(8px)';

    setTimeout(() => {
      el.innerHTML = _currentKey === 'dashboard'
        ? _buildDashboard()
        : _buildCategoryView(_currentKey);

      /* Attach sort listeners */
      el.querySelectorAll('.th-sortable').forEach(th => {
        th.addEventListener('click', () => {
          const k   = th.dataset.view;
          const col = parseInt(th.dataset.col);
          const prev = _sortState[k] || { col:1, dir:'desc' };
          _sortState[k] = { col, dir: prev.col===col ? (prev.dir==='asc'?'desc':'asc') : 'desc' };
          // Re-render only table area
          const tableArea = el.querySelector(`#table-${k}`)?.closest('.table-wrap');
          if (tableArea) {
            const tmp = document.createElement('div');
            tmp.innerHTML = _buildTable(k);
            tableArea.replaceWith(tmp.firstElementChild);
            el.querySelectorAll('.th-sortable').forEach(th2 =>
              th2.addEventListener('click', () => DataController.sortCol(th2))
            );
          }
        });
      });

      /* Render Charts */
      if (typeof Chart !== 'undefined') {
        if (_currentKey === 'dashboard')         { _renderDashboardChart(); DataController.calcUpdate(); }
        else if (YIELD_DATA.tables[_currentKey]) { _renderCategoryChart(_currentKey); }
      }

      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, 160);
  }

  /* ── NAV + MOBILE ─────────────────────────── */
  function _highlightNav(key) {
    document.querySelectorAll('.nav-item').forEach(el =>
      el.classList.toggle('nav-active', el.dataset.view === key)
    );
  }
  function _updatePageTitle(key) {
    const cat = YIELD_DATA.categories.find(c => c.key === key);
    const el  = document.getElementById('header-subtitle');
    if (el && cat) el.textContent = cat.label + ' · ' + cat.subtitle;
  }
  function _initMobileToggle() {
    const btn  = document.getElementById('menu-toggle');
    const sb   = document.getElementById('sidebar');
    const ov   = document.getElementById('overlay');
    const close = () => { sb?.classList.remove('sidebar-open'); ov?.classList.add('hidden'); };
    btn?.addEventListener('click', () => { sb?.classList.toggle('sidebar-open'); ov?.classList.toggle('hidden'); });
    ov?.addEventListener('click', close);
    document.querySelectorAll('.nav-item').forEach(el => el.addEventListener('click', close));
  }

  /* ══════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════ */
  return {

    setView(key) {
      _currentKey = key;
      _highlightNav(key);
      _updatePageTitle(key);
      _updateView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    quickSort(key, col, dir) {
      _sortState[key] = { col, dir };
      _updateView();
    },

    sortCol(th) {
      const k   = th.dataset.view;
      const col = parseInt(th.dataset.col);
      const prev = _sortState[k] || { col:1, dir:'desc' };
      _sortState[k] = { col, dir: prev.col===col ? (prev.dir==='asc'?'desc':'asc') : 'desc' };
      _updateView();
    },

    filterTable(key) {
      const tableWrap = document.querySelector(`#table-${key}`)?.closest('.table-wrap');
      if (!tableWrap) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = _buildTable(key);
      tableWrap.replaceWith(tmp.firstElementChild);
    },

    calcUpdate() {
      const amount   = parseFloat(document.getElementById('calc-amount')?.value) || 100000;
      const key      = document.getElementById('calc-category')?.value || 'hashtalut';
      const cfg      = YIELD_DATA.tables[key];
      if (!cfg) return;

      const yields   = cfg.rows.map(r => r.y1);
      const yields3  = cfg.rows.map(r => r.y3);
      const topY1    = Math.max(...yields);
      const avgY1    = yields.reduce((a,b) => a+b,0) / yields.length;
      const topY3    = Math.max(...yields3);
      const avgY3    = yields3.reduce((a,b) => a+b,0) / yields3.length;
      const topRow   = cfg.rows.find(r => r.y1 === topY1);

      const topVal1  = amount * (1 + topY1/100);
      const avgVal1  = amount * (1 + avgY1/100);
      const topVal3  = amount * (1 + topY3/100);
      const avgVal3  = amount * (1 + avgY3/100);
      const diff1    = topVal1 - avgVal1;
      const diff3    = topVal3 - avgVal3;
      const pct1     = ((diff1/amount)*100).toFixed(2);
      const pct3     = ((diff3/amount)*100).toFixed(2);

      const el = document.getElementById('calc-results');
      if (!el) return;
      el.innerHTML = `
        <div class="calc-result-item">
          <span class="calc-result-label">מוביל שנתי · ${topRow.name} (${topY1.toFixed(1)}%)</span>
          <span class="calc-result-val green">${_fmtILS(topVal1)}</span>
          <span class="calc-result-diff">+${_fmtILS(topVal1-amount)} רווח שנתי</span>
        </div>
        <div class="calc-result-item">
          <span class="calc-result-label">ממוצע קטגוריה (${avgY1.toFixed(1)}%)</span>
          <span class="calc-result-val">${_fmtILS(avgVal1)}</span>
          <span class="calc-result-diff">+${_fmtILS(avgVal1-amount)} רווח שנתי</span>
        </div>
        <div class="calc-result-item highlight">
          <span class="calc-result-label">יתרון מסלול מוביל — שנה</span>
          <span class="calc-result-val gold">+${_fmtILS(diff1)}</span>
          <span class="calc-result-diff" style="color:#22C55E">+${pct1}% עודף</span>
        </div>
        <div class="calc-result-item highlight">
          <span class="calc-result-label">יתרון מסלול מוביל — 3 שנים</span>
          <span class="calc-result-val gold">+${_fmtILS(diff3)}</span>
          <span class="calc-result-diff" style="color:#22C55E">+${pct3}% עודף</span>
        </div>`;
    },

    init() {
      const navEl = document.getElementById('nav-list');
      if (navEl) navEl.innerHTML = YIELD_DATA.categories.map(cat => `
        <li class="nav-item" data-view="${cat.key}"
            onclick="DataController.setView('${cat.key}')">
          <span class="nav-icon">${cat.icon}</span>
          <span class="nav-label">${cat.label}</span>
        </li>`).join('');

      _initMobileToggle();
      this.setView('dashboard');
    },
  };

})();

document.addEventListener('DOMContentLoaded', () => DataController.init());
