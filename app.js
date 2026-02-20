/**
 * app.js — DataController Engine
 * מדד התשואות | אור זמר — מתכנן פיננסי
 */

'use strict';

const DataController = (() => {

  /* ── PRIVATE STATE ────────────────────────────── */
  let _currentKey = 'dashboard';
  let _sortState  = {};   // { [key]: { col: Number, dir: 'asc'|'desc' } }
  const PHONE = '972502278922';

  /* ── COLOUR HELPERS ───────────────────────────── */
  const _color = {
    yield:  v => v >= 18 ? 'var(--c-green)'   : v >= 15 ? 'var(--c-gold-light)' : 'var(--c-text2)',
    fee:    v => v <= 0.45 ? 'var(--c-green)'  : v >= 0.80 ? 'var(--c-red)'      : 'var(--c-text2)',
    equity: v => v >= 90 ? 'var(--c-green)'    : v >= 80  ? 'var(--c-gold-light)': 'var(--c-text2)',
    aum:    () => 'var(--c-text2)',
    text:   () => 'var(--c-text)',
  };

  function _cellColor(col, val) {
    if (col.type === 'text' || col.type === 'number') return _color.text();
    if (col.key === 'fee' || col.key === 'feeDeposit' || col.key === 'feeAcc') return _color.fee(val);
    if (col.key === 'equity') return _color.equity(val);
    if (col.key === 'y1' || col.key === 'y3') return _color.yield(val);
    return 'var(--c-text2)';
  }

  /* ── FORMAT HELPERS ───────────────────────────── */
  function _fmt(col, val) {
    if (col.type === 'percent') return val.toFixed(2).replace(/\.?0+$/, d => d ? d : '') + '%';
    if (col.type === 'number')  return Number(val).toLocaleString('he-IL');
    return val;
  }

  /* ── WHATSAPP LINK ────────────────────────────── */
  function _waLink(key) {
    const msg = encodeURIComponent(YIELD_DATA.waMessages[key] || YIELD_DATA.waMessages.dashboard);
    return `https://wa.me/${PHONE}?text=${msg}`;
  }

  /* ── KPI STRIP (per table) ────────────────────── */
  function _buildKpiStrip(key) {
    const cfg  = YIELD_DATA.tables[key];
    const rows = cfg.rows;
    const topY1  = Math.max(...rows.map(r => r.y1));
    const topY3  = Math.max(...rows.map(r => r[cfg.topKey === 'y3' ? 'y3' : 'y3']));
    const lowFee = Math.min(...rows.map(r => r.fee ?? r.feeAcc ?? 0));
    const topRow = rows.find(r => r.y1 === topY1);

    return `
    <div class="kpi-strip">
      <div class="kpi-card">
        <span class="kpi-label">מוביל תשואה שנתית</span>
        <span class="kpi-value" style="color:var(--c-green)">${topY1.toFixed(1)}%</span>
        <span class="kpi-sub">${topRow.name}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">תשואה 3 שנים מקסימלית</span>
        <span class="kpi-value" style="color:var(--c-gold)">${topY3.toFixed(1)}%</span>
        <span class="kpi-sub">${rows.find(r => r.y3 === topY3)?.name ?? ''}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">דמי ניהול נמוכים</span>
        <span class="kpi-value" style="color:var(--c-gold-light)">${lowFee.toFixed(2)}%</span>
        <span class="kpi-sub">${rows.find(r => (r.fee ?? r.feeAcc) === lowFee)?.name ?? ''}</span>
      </div>
      <div class="kpi-card kpi-cta" onclick="window.open('${_waLink(key)}','_blank')">
        <span class="kpi-label">ייעוץ אישי</span>
        <span class="kpi-value" style="font-size:1.4rem;">💬</span>
        <span class="kpi-sub" style="color:var(--c-gold);">פתח וואטסאפ</span>
      </div>
    </div>`;
  }

  /* ── BUILD TABLE ──────────────────────────────── */
  function _buildTable(key) {
    const cfg    = YIELD_DATA.tables[key];
    const cols   = cfg.columns;
    const state  = _sortState[key] || { col: 1, dir: 'desc' };
    const topVal = Math.max(...cfg.rows.map(r => r[cfg.topKey]));

    // Sort rows
    const sorted = [...cfg.rows].sort((a, b) => {
      const colKey = cols[state.col].key;
      const va = a[colKey], vb = b[colKey];
      if (typeof va === 'string') return state.dir === 'asc' ? va.localeCompare(vb, 'he') : vb.localeCompare(va, 'he');
      return state.dir === 'asc' ? va - vb : vb - va;
    });

    /* thead */
    const thead = `<thead><tr>${cols.map((c, i) => {
      const active = i === state.col;
      const dir    = active ? state.dir : '';
      return `<th class="th-sortable ${dir}" data-view="${key}" data-col="${i}" style="text-align:${c.align}">
        ${c.label}
        <span class="sort-icon">${active && dir === 'asc' ? '↑' : '↓'}</span>
      </th>`;
    }).join('')}</tr></thead>`;

    /* tbody */
    const tbody = `<tbody>${sorted.map(r => {
      const isTop = r[cfg.topKey] === topVal;
      return `<tr class="${isTop ? 'row-top' : ''}">
        ${cols.map((c, i) => {
          const val   = r[c.key];
          const color = _cellColor(c, val);
          const txt   = _fmt(c, val);
          const isName = i === 0;
          return `<td style="text-align:${c.align}; color:${color}; ${isName ? 'font-weight:600' : 'font-variant-numeric:tabular-nums; font-weight:500'}">
            ${isTop && isName ? '<span class="top-star">★</span> ' : ''}${txt}
          </td>`;
        }).join('')}
      </tr>`;
    }).join('')}</tbody>`;

    return `<div class="table-wrap"><table class="data-table">${thead}${tbody}</table></div>`;
  }

  /* ── DASHBOARD VIEW ───────────────────────────── */
  function _buildDashboard() {
    const cats = YIELD_DATA.categories.filter(c => c.key !== 'dashboard');

    const cards = cats.map(cat => {
      const cfg    = YIELD_DATA.tables[cat.key];
      const topVal = Math.max(...cfg.rows.map(r => r[cfg.topKey]));
      const topRow = cfg.rows.find(r => r[cfg.topKey] === topVal);
      const lowFee = Math.min(...cfg.rows.map(r => r.fee ?? r.feeAcc ?? 0));

      return `
      <div class="dash-card glass-card" onclick="DataController.setView('${cat.key}')">
        <div class="dash-card-header">
          <span class="dash-icon">${cat.icon}</span>
          <div>
            <div class="dash-title">${cat.label}</div>
            <div class="dash-sub">${cat.subtitle}</div>
          </div>
        </div>
        <div class="dash-stats">
          <div class="dash-stat">
            <span class="dash-stat-label">תשואה שנתית מקסימלית</span>
            <span class="dash-stat-val" style="color:var(--c-green)">${topVal.toFixed(1)}%</span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat-label">מוביל</span>
            <span class="dash-stat-val" style="color:var(--c-gold-light); font-size:0.85rem">${topRow.name}</span>
          </div>
          <div class="dash-stat">
            <span class="dash-stat-label">דמי ניהול נמוכים</span>
            <span class="dash-stat-val">${lowFee.toFixed(2)}%</span>
          </div>
        </div>
        <div class="dash-arrow">←</div>
      </div>`;
    }).join('');

    return `
    <div class="view-header">
      <h2 class="view-title gold-text">סקירה כללית</h2>
      <p class="view-sub">לחץ על קטגוריה לצפייה בטבלת הנתונים המלאה</p>
    </div>
    <div class="dash-grid">${cards}</div>
    <div class="disclaimer">
      ⚠️ הנתונים המוצגים הם לצורך המחשה בלבד על בסיס נתוני גמל נט.
      אינם מהווים ייעוץ השקעות. ביצועי עבר אינם מבטיחים תשואות עתידיות.
    </div>`;
  }

  /* ── CATEGORY VIEW ────────────────────────────── */
  function _buildCategoryView(key) {
    const cat = YIELD_DATA.categories.find(c => c.key === key);
    return `
    <div class="view-header">
      <h2 class="view-title gold-text">${cat.icon} ${cat.label}</h2>
      <p class="view-sub">${cat.subtitle} · נתוני גמל נט · פברואר 2025</p>
    </div>
    ${_buildKpiStrip(key)}
    ${_buildTable(key)}
    <div class="disclaimer" style="margin-top:16px;">
      ⚠️ הנתונים המוצגים הם לצורך המחשה בלבד. אינם מהווים ייעוץ השקעות.
      ביצועי עבר אינם מבטיחים תשואות עתידיות. לחץ על כותרת עמודה למיון.
    </div>`;
  }

  /* ── UPDATE VIEW (no page refresh) ───────────── */
  function _updateView() {
    const content = document.getElementById('main-content');
    if (!content) return;

    // Fade out → render → fade in
    content.style.opacity = '0';
    content.style.transform = 'translateY(8px)';

    setTimeout(() => {
      content.innerHTML = _currentKey === 'dashboard'
        ? _buildDashboard()
        : _buildCategoryView(_currentKey);

      // Attach sort listeners
      content.querySelectorAll('.th-sortable').forEach(th => {
        th.addEventListener('click', () => {
          const k   = th.dataset.view;
          const col = parseInt(th.dataset.col);
          const prev = _sortState[k] || { col: 1, dir: 'desc' };
          _sortState[k] = {
            col,
            dir: prev.col === col ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'desc',
          };
          _updateView();
        });
      });

      content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      content.style.opacity    = '1';
      content.style.transform  = 'translateY(0)';
    }, 180);
  }

  /* ── NAV HIGHLIGHT ────────────────────────────── */
  function _highlightNav(key) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('nav-active', el.dataset.view === key);
    });
  }

  /* ── PAGE TITLE ───────────────────────────────── */
  function _updatePageTitle(key) {
    const cat = YIELD_DATA.categories.find(c => c.key === key);
    const sub = document.getElementById('header-subtitle');
    if (sub && cat) sub.textContent = cat.label + ' · ' + cat.subtitle;
  }

  /* ── MOBILE SIDEBAR ───────────────────────────── */
  function _initMobileToggle() {
    const btn     = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    function close() {
      sidebar?.classList.remove('sidebar-open');
      overlay?.classList.add('hidden');
    }
    btn?.addEventListener('click', () => {
      sidebar?.classList.toggle('sidebar-open');
      overlay?.classList.toggle('hidden');
    });
    overlay?.addEventListener('click', close);
    document.querySelectorAll('.nav-item').forEach(el =>
      el.addEventListener('click', close)
    );
  }

  /* ── PUBLIC API ───────────────────────────────── */
  return {

    setView(key) {
      _currentKey = key;
      _highlightNav(key);
      _updatePageTitle(key);
      _updateView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    init() {
      /* Build nav from data */
      const navEl = document.getElementById('nav-list');
      if (navEl) {
        navEl.innerHTML = YIELD_DATA.categories.map(cat => `
          <li class="nav-item" data-view="${cat.key}" onclick="DataController.setView('${cat.key}')">
            <span class="nav-icon">${cat.icon}</span>
            <span class="nav-label">${cat.label}</span>
          </li>`).join('');
      }

      _initMobileToggle();
      this.setView('dashboard');
    },
  };

})(); // DataController IIFE

/* Auto-init on DOM ready */
document.addEventListener('DOMContentLoaded', () => DataController.init());
