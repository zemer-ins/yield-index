/**
 * data.js — Yield Data Store
 * מדד התשואות | אור זמר — מתכנן פיננסי
 * Source: GemelNet approximations (illustrative, Feb 2025)
 */

window.YIELD_DATA = {

  /* ── NAV CATEGORIES ─────────────────────────────── */
  categories: [
    { key: 'dashboard',  label: 'דשבורד',              icon: '▦',  subtitle: 'סקירה כללית' },
    { key: 'hashtalut',  label: 'קרנות השתלמות',       icon: '🎓', subtitle: 'מסלול מניות' },
    { key: 'gemel',      label: 'גמל להשקעה',           icon: '📊', subtitle: 'מסלול מניות' },
    { key: 'polisa',     label: 'פוליסות חיסכון',       icon: '📋', subtitle: 'מסלול מניות' },
    { key: 'pension',    label: 'קרנות פנסיה',          icon: '🌅', subtitle: 'מסלול מניות' },
    { key: 'yeladim',    label: 'חיסכון לכל ילד',       icon: '🧒', subtitle: 'מסלול מניות' },
  ],

  /* ── TABLE SCHEMAS & ROWS ───────────────────────── */
  tables: {

    hashtalut: {
      topKey: 'y1',
      columns: [
        { key: 'name',   label: 'חברה',                 type: 'text',    align: 'right'  },
        { key: 'y1',     label: 'תשואה 12 חודשים',      type: 'percent', align: 'center' },
        { key: 'y3',     label: 'תשואה 3 שנים',         type: 'percent', align: 'center' },
        { key: 'fee',    label: 'דמי ניהול',            type: 'percent', align: 'center' },
        { key: 'equity', label: 'חשיפה למניות',         type: 'percent', align: 'center' },
      ],
      rows: [
        { name: 'מור',           y1: 19.7, y3: 45.3, fee: 0.40, equity: 96 },
        { name: 'אלטשולר שחם',  y1: 18.4, y3: 42.1, fee: 0.50, equity: 92 },
        { name: 'מיטב',          y1: 17.2, y3: 38.6, fee: 0.45, equity: 88 },
        { name: 'פניקס',         y1: 16.8, y3: 36.9, fee: 0.52, equity: 85 },
        { name: 'הראל',          y1: 15.9, y3: 35.2, fee: 0.55, equity: 82 },
      ],
    },

    gemel: {
      topKey: 'y1',
      columns: [
        { key: 'name', label: 'חברה',                   type: 'text',    align: 'right'  },
        { key: 'y1',   label: 'תשואה 12 חודשים',        type: 'percent', align: 'center' },
        { key: 'y3',   label: 'תשואה 3 שנים',           type: 'percent', align: 'center' },
        { key: 'fee',  label: 'דמי ניהול',              type: 'percent', align: 'center' },
        { key: 'aum',  label: 'נכסים מנוהלים (מיל׳)',   type: 'number',  align: 'center' },
      ],
      rows: [
        { name: 'מור',           y1: 19.3, y3: 44.1, fee: 0.50, aum: 2800  },
        { name: 'אלטשולר שחם',  y1: 18.1, y3: 41.4, fee: 0.60, aum: 12400 },
        { name: 'מיטב',          y1: 17.0, y3: 37.9, fee: 0.55, aum: 9100  },
        { name: 'IBI',           y1: 16.4, y3: 36.2, fee: 0.45, aum: 4300  },
        { name: 'הראל',          y1: 15.6, y3: 34.8, fee: 0.65, aum: 7800  },
      ],
    },

    polisa: {
      topKey: 'y1',
      columns: [
        { key: 'name',      label: 'חברת ביטוח',        type: 'text',    align: 'right'  },
        { key: 'y1',        label: 'תשואה 12 חודשים',   type: 'percent', align: 'center' },
        { key: 'y3',        label: 'תשואה 3 שנים',      type: 'percent', align: 'center' },
        { key: 'fee',       label: 'דמי ניהול מנכסים', type: 'percent', align: 'center' },
        { key: 'liquidity', label: 'נזילות',             type: 'text',    align: 'center' },
      ],
      rows: [
        { name: 'מנורה מבטחים', y1: 18.8, y3: 43.2, fee: 0.80, liquidity: 'מלאה' },
        { name: 'הראל ביטוח',   y1: 17.6, y3: 40.1, fee: 0.90, liquidity: 'מלאה' },
        { name: 'פניקס',        y1: 17.1, y3: 38.5, fee: 0.85, liquidity: 'מלאה' },
        { name: 'כלל ביטוח',    y1: 16.5, y3: 36.8, fee: 0.95, liquidity: 'מלאה' },
        { name: 'מגדל ביטוח',   y1: 16.0, y3: 35.4, fee: 0.88, liquidity: 'מלאה' },
      ],
    },

    pension: {
      topKey: 'y1',
      columns: [
        { key: 'name',       label: 'קרן',                    type: 'text',    align: 'right'  },
        { key: 'y1',         label: 'תשואה 12 חודשים',        type: 'percent', align: 'center' },
        { key: 'y3',         label: 'תשואה 3 שנים',           type: 'percent', align: 'center' },
        { key: 'feeDeposit', label: 'דמי ניהול מהפקדה',      type: 'percent', align: 'center' },
        { key: 'feeAcc',     label: 'דמי ניהול מצבירה',      type: 'percent', align: 'center' },
      ],
      rows: [
        { name: 'מור פנסיה',          y1: 20.1, y3: 46.2, feeDeposit: 1.49, feeAcc: 0.10 },
        { name: 'אלטשולר שחם פנסיה', y1: 18.9, y3: 43.5, feeDeposit: 1.49, feeAcc: 0.10 },
        { name: 'מיטב פנסיה',         y1: 17.8, y3: 39.9, feeDeposit: 1.49, feeAcc: 0.10 },
        { name: 'הראל פנסיה',         y1: 16.7, y3: 37.1, feeDeposit: 1.49, feeAcc: 0.15 },
        { name: 'פניקס פנסיה',        y1: 16.2, y3: 36.0, feeDeposit: 1.49, feeAcc: 0.20 },
      ],
    },

    yeladim: {
      topKey: 'y1',
      columns: [
        { key: 'name',  label: 'גוף מנהל',             type: 'text',    align: 'right'  },
        { key: 'y1',    label: 'תשואה 12 חודשים',       type: 'percent', align: 'center' },
        { key: 'y3',    label: 'תשואה 3 שנים',          type: 'percent', align: 'center' },
        { key: 'fee',   label: 'דמי ניהול',             type: 'percent', align: 'center' },
        { key: 'track', label: 'מסלול',                 type: 'text',    align: 'center' },
      ],
      rows: [
        { name: 'מור',          y1: 19.5, y3: 44.8, fee: 0.40, track: 'מניות' },
        { name: 'אלטשולר שחם', y1: 18.2, y3: 41.9, fee: 0.50, track: 'מניות' },
        { name: 'מיטב',         y1: 17.0, y3: 38.1, fee: 0.45, track: 'מניות' },
        { name: 'הראל',         y1: 15.8, y3: 35.0, fee: 0.55, track: 'מניות' },
        { name: 'פניקס',        y1: 14.9, y3: 32.6, fee: 0.52, track: 'מניות' },
      ],
    },

  }, // end tables

  /* ── WHATSAPP MESSAGES per category ─────────────── */
  waMessages: {
    dashboard:  'שלום, הגעתי דרך מדד התשואות ואשמח לייעוץ פיננסי אישי',
    hashtalut:  'שלום, אשמח לייעוץ על קרן השתלמות',
    gemel:      'שלום, אשמח לייעוץ על גמל להשקעה',
    polisa:     'שלום, אשמח לייעוץ על פוליסת חיסכון',
    pension:    'שלום, אשמח לייעוץ על קרן פנסיה',
    yeladim:    'שלום, אשמח לייעוץ על חיסכון לכל ילד',
  },

}; // end YIELD_DATA
