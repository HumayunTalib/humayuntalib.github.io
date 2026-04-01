/* ============================================================
   ENZO — calculator.js  (Professional Mill Calculator)
   ============================================================ */
'use strict';

/* ── FX STATE ───────────────────────────────────────────────── */
var FX            = { PKR: 1 };   // PKR-based rates from API
var FX_PKR_PER_USD = 278.5;       // fallback
var LAST_RESULT   = null;         // stored so currency toggle can reformat
var ACTIVE_CCY    = 'PKR';

/* ── CURRENCY CONFIG ────────────────────────────────────────── */
var CURRENCIES = [
  { code: 'PKR', label: 'PKR ₨',  symbol: '₨'  },
  { code: 'USD', label: 'USD $',  symbol: '$'   },
  { code: 'CAD', label: 'CAD $',  symbol: 'C$'  },
  { code: 'AUD', label: 'AUD $',  symbol: 'A$'  },
  { code: 'AED', label: 'AED د.إ',symbol: 'د.إ' },
  { code: 'IRR', label: 'IRR ﷼',  symbol: '﷼'  },
  { code: 'AFN', label: 'AFN ؋',  symbol: '؋'  }
];

/* ── INIT ───────────────────────────────────────────────────── */
initCalculator();

function initCalculator() {
  fetchFXRates();

  var form = document.getElementById('calc-form');
  if (!form) return;

  /* Submit */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = gatherInputs(form);
    if (!inp) return;
    LAST_RESULT = calculate(inp);
    displayResults(LAST_RESULT, ACTIVE_CCY);
  });

  /* Currency toggle */
  document.querySelectorAll('.currency-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      ACTIVE_CCY = btn.dataset.currency;
      document.querySelectorAll('.currency-btn').forEach(function (b) {
        b.classList.toggle('currency-btn--active', b.dataset.currency === ACTIVE_CCY);
      });
      if (LAST_RESULT) displayResults(LAST_RESULT, ACTIVE_CCY);
    });
  });

  /* Print */
  var printBtn = document.getElementById('calc-print');
  if (printBtn) printBtn.addEventListener('click', doPrint);

  /* Bag unit toggle */
  var bagUnit = document.getElementById('calc-bag-unit');
  var bagLabel = document.getElementById('bag-unit-label');
  if (bagUnit && bagLabel) {
    bagUnit.addEventListener('change', function () {
      bagLabel.textContent = bagUnit.checked ? 'kg' : 'lbs';
    });
  }
}

/* ============================================================
   FX RATES
   ============================================================ */
function fetchFXRates() {
  var statusEl = document.getElementById('fx-status');
  var rateEl   = document.getElementById('calc-fx-display');

  function setStatus(msg, ok) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className   = 'fx-status ' + (ok ? 'fx-status--live' : 'fx-status--warn');
  }

  setStatus('Fetching live rates…', true);

  fetch('https://open.exchangerate-api.com/v6/latest/PKR')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.rates) {
        FX = data.rates;
        FX.PKR = 1;

        /* PKR per USD for reference field */
        if (FX.USD && FX.USD > 0) {
          FX_PKR_PER_USD = parseFloat((1 / FX.USD).toFixed(2));
        }

        var t = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
        setStatus('Live rates fetched at ' + t + ' — used for currency display only.', true);
        if (rateEl) rateEl.textContent = '1 USD \u2248 ' + FX_PKR_PER_USD.toFixed(2) + ' PKR';
      } else {
        throw new Error('bad response');
      }
    })
    .catch(function () {
      FX = { PKR: 1, USD: 1 / FX_PKR_PER_USD };
      setStatus('Live rate unavailable. Conversion figures are estimates — verify before use.', false);
      if (rateEl) rateEl.textContent = '1 USD \u2248 ' + FX_PKR_PER_USD + ' PKR (default)';
    });
}

/* ============================================================
   GATHER & VALIDATE INPUTS
   ============================================================ */
function gatherInputs(form) {
  clearErrors(form);
  var ok = true;

  function req(id, label) {
    var el  = document.getElementById(id);
    var val = el ? parseFloat(el.value) : NaN;
    if (!el || el.value.trim() === '' || isNaN(val) || val < 0) {
      showErr(id, label + ' is required.');
      ok = false;
      return null;
    }
    return val;
  }

  function reqPos(id, label, min) {
    var v = req(id, label);
    if (v !== null && v < (min || 0.001)) {
      showErr(id, label + ' must be greater than ' + (min || 0) + '.');
      ok = false;
      return null;
    }
    return v;
  }

  var yarnType   = document.getElementById('calc-yarn') ? document.getElementById('calc-yarn').value : '';
  var widthVal   = document.getElementById('calc-width') ? parseFloat(document.getElementById('calc-width').value) : NaN;
  var reed       = reqPos('calc-reed',       'Reed',            1);
  var pick       = reqPos('calc-pick',       'Pick (per inch)', 1);
  var warpCount  = reqPos('calc-warp-count', 'Warp Count',      2);  /* must be > 1 so (count-1) != 0 */
  var weftCount  = reqPos('calc-weft-count', 'Weft Count',      1);
  var warpRate   = reqPos('calc-warp-rate',  'Warp Rate',       0);
  var weftRate   = reqPos('calc-weft-rate',  'Weft Rate',       0);
  var convRate   = reqPos('calc-conv-rate',  'Conversion Rate', 0);
  var kinaraRate = req('calc-kinara',        'Kinara Rate');
  var fabricLen  = reqPos('calc-length',     'Fabric Length',   1);

  if (!yarnType)          { showErr('calc-yarn',  'Please select a yarn type.'); ok = false; }
  if (isNaN(widthVal))    { showErr('calc-width', 'Please select a width.');     ok = false; }
  if (warpCount !== null && warpCount < 2) {
    showErr('calc-warp-count', 'Warp Count must be at least 2 (Count - 1 cannot be zero).');
    ok = false; warpCount = null;
  }

  if (!ok) {
    var first = form.querySelector('.calc-input.is-error, .calc-select.is-error');
    if (first) first.focus();
    return null;
  }

  /* Optional / toggled */
  var hookType   = document.getElementById('calc-hook') ? document.getElementById('calc-hook').value : '32';
  var brokerage  = document.getElementById('calc-brokerage') ? document.getElementById('calc-brokerage').checked : false;
  var bagUnitKg  = document.getElementById('calc-bag-unit')  ? document.getElementById('calc-bag-unit').checked  : false;
  var bagWeightRaw = parseFloat(document.getElementById('calc-bag-weight') ? document.getElementById('calc-bag-weight').value : '') || (bagUnitKg ? 45.36 : 100);
  var bagWeightLbs = bagUnitKg ? bagWeightRaw / 0.453592 : bagWeightRaw;

  var clientName = document.getElementById('calc-client') ? document.getElementById('calc-client').value.trim() : '';
  var refNo      = document.getElementById('calc-ref')    ? document.getElementById('calc-ref').value.trim()    : '';
  var finishing  = document.getElementById('calc-finish') ? document.getElementById('calc-finish').value        : 'none';

  return {
    yarnType   : yarnType,
    width      : widthVal,
    reed       : reed,
    pick       : pick,
    warpCount  : warpCount,
    weftCount  : weftCount,
    warpRate   : warpRate,
    weftRate   : weftRate,
    convRate   : convRate,
    kinaraRate : kinaraRate,
    hookType   : hookType,
    brokerage  : brokerage,
    fabricLen  : fabricLen,
    bagWeightLbs: bagWeightLbs,
    bagUnitKg  : bagUnitKg,
    clientName : clientName,
    refNo      : refNo,
    finishing  : finishing
  };
}

/* ============================================================
   CALCULATIONS
   ============================================================ */
function calculate(inp) {
  /* 1. Warp */
  var totalEnds     = (inp.reed + 4) * inp.width;
  var warpWeightLbs = totalEnds / 731 / (inp.warpCount - 1);    /* lbs per metre */
  var warpCost      = warpWeightLbs * inp.warpRate;              /* PKR per metre */

  /* 2. Weft */
  var weftWeightLbs = (inp.pick * inp.width) / 731 / inp.weftCount; /* lbs per metre */
  var weftCost      = weftWeightLbs * inp.weftRate;                  /* PKR per metre */

  /* 3. Conversion */
  var convCost      = inp.convRate * inp.pick;   /* PKR per metre */

  /* 4. Base */
  var baseCost      = warpCost + weftCost + convCost + inp.kinaraRate; /* PKR/m */

  /* 5. Markup 10% */
  var withMarkup    = baseCost * 1.10;

  /* 6. Brokerage 1% (on marked-up cost) */
  var brokeragePKR  = inp.brokerage ? withMarkup * 0.01 : 0;

  /* 7. Final PKR per metre */
  var finalMeterPKR = withMarkup + brokeragePKR;

  /* 8. Final PKR per yard */
  var finalYardPKR  = finalMeterPKR * 0.9144;

  /* 9. Inventory (per order) */
  var warpKgPerM    = warpWeightLbs * 0.453592;
  var weftKgPerM    = weftWeightLbs * 0.453592;
  var totalKgPerM   = warpKgPerM + weftKgPerM;
  var totalKg       = totalKgPerM * inp.fabricLen;
  var totalLbs      = totalKg / 0.453592;
  var bagsNeeded    = totalKg / (inp.bagWeightLbs * 0.453592);

  return {
    /* construction */
    totalEnds      : totalEnds,
    warpWeightLbs  : warpWeightLbs,
    warpWeightKg   : warpKgPerM,
    weftWeightLbs  : weftWeightLbs,
    weftWeightKg   : weftKgPerM,
    /* costs PKR/m */
    warpCost       : warpCost,
    weftCost       : weftCost,
    convCost       : convCost,
    kinaraRate     : inp.kinaraRate,
    baseCost       : baseCost,
    withMarkup     : withMarkup,
    brokeragePKR   : brokeragePKR,
    finalMeterPKR  : finalMeterPKR,
    finalYardPKR   : finalYardPKR,
    /* inventory */
    totalLbs       : totalLbs,
    totalKg        : totalKg,
    bagsNeeded     : bagsNeeded,
    /* meta */
    inp            : inp,
    date           : new Date().toLocaleDateString('en-PK', { day:'2-digit', month:'long', year:'numeric' })
  };
}

/* ============================================================
   DISPLAY RESULTS
   ============================================================ */
function displayResults(res, ccy) {
  var panel = document.getElementById('calc-results');
  if (!panel) return;
  panel.hidden = false;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  ccy = ccy || 'PKR';

  /* Conversion factor: 1 PKR → target currency */
  var rate = (FX && FX[ccy] && ccy !== 'PKR') ? FX[ccy] : 1;

  function fmt(pkrVal) {
    var converted = pkrVal * rate;
    var sym = (CURRENCIES.find(function(c){ return c.code === ccy; }) || {}).symbol || ccy + ' ';
    return sym + converted.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtN(val, dec) {
    return val.toLocaleString('en-PK', {
      minimumFractionDigits: dec !== undefined ? dec : 4,
      maximumFractionDigits: dec !== undefined ? dec : 4
    });
  }

  var cName = res.inp.clientName || '—';
  var cRef  = res.inp.refNo      || '—';

  panel.innerHTML =
    /* ── Header ── */
    '<div class="cr-header print-only-block">' +
      '<div class="cr-brand"><span class="cr-logo">ENZO</span>' +
        '<span class="cr-brand-sub">by Humayun Ibrahim Textile</span></div>' +
      '<div class="cr-meta">' +
        '<div class="cr-meta-row"><span>Date</span><strong>' + res.date + '</strong></div>' +
        '<div class="cr-meta-row"><span>Client</span><strong>' + cName + '</strong></div>' +
        '<div class="cr-meta-row"><span>Ref #</span><strong>' + cRef + '</strong></div>' +
        '<div class="cr-meta-row"><span>Currency</span><strong>' + ccy + '</strong></div>' +
      '</div>' +
    '</div>' +

    /* ── Construction Summary ── */
    '<div class="cr-section">' +
      '<h3 class="cr-section-title">Construction Details</h3>' +
      '<div class="cr-table">' +
        crRow('Yarn Type',           res.inp.yarnType)   +
        crRow('Finishing',           res.inp.finishing)  +
        crRow('Width',               res.inp.width + ' inches') +
        crRow('Reed',                res.inp.reed) +
        crRow('Pick (per inch)',      res.inp.pick) +
        crRow('Warp Count',          res.inp.warpCount) +
        crRow('Weft Count',          res.inp.weftCount) +
        crRow('Hook Type',           res.inp.hookType + ' hook') +
        crRow('Total Ends',          fmtN(res.totalEnds, 0)) +
        crRow('Warp Weight (lbs/m)', fmtN(res.warpWeightLbs) + ' lbs  |  ' + fmtN(res.warpWeightKg) + ' kg') +
        crRow('Weft Weight (lbs/m)', fmtN(res.weftWeightLbs) + ' lbs  |  ' + fmtN(res.weftWeightKg) + ' kg') +
      '</div>' +
    '</div>' +

    /* ── Cost Breakdown ── */
    '<div class="cr-section">' +
      '<h3 class="cr-section-title">Cost Breakdown <span class="cr-ccy-note">(' + ccy + ' per metre)</span></h3>' +
      '<div class="cr-table">' +
        crRow('Warp Cost',           fmt(res.warpCost))   +
        crRow('Weft Cost',           fmt(res.weftCost))   +
        crRow('Conversion Cost',     fmt(res.convCost))   +
        crRow('Kinara Rate',         fmt(res.kinaraRate)) +
        crRowSub('Base Cost',        fmt(res.baseCost))   +
        crRow('Markup (10%)',        fmt(res.withMarkup - res.baseCost)) +
        crRowSub('After Markup',     fmt(res.withMarkup)) +
        (res.brokeragePKR > 0 ? crRow('Brokerage (1%)', fmt(res.brokeragePKR)) : '') +
      '</div>' +
    '</div>' +

    /* ── Final Costs ── */
    '<div class="cr-section cr-section--highlight">' +
      '<div class="cr-final-grid">' +
        '<div class="cr-final-item">' +
          '<span class="cr-final-label">Cost per Metre</span>' +
          '<span class="cr-final-value" id="cr-meter">' + fmt(res.finalMeterPKR) + '</span>' +
        '</div>' +
        '<div class="cr-final-item">' +
          '<span class="cr-final-label">Cost per Yard</span>' +
          '<span class="cr-final-value" id="cr-yard">' + fmt(res.finalYardPKR) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* ── Inventory ── */
    '<div class="cr-section">' +
      '<h3 class="cr-section-title">Inventory — ' + fmtN(res.inp.fabricLen, 0) + ' metres</h3>' +
      '<div class="cr-table">' +
        crRow('Total Yarn Weight',   fmtN(res.totalLbs, 2) + ' lbs  |  ' + fmtN(res.totalKg, 2) + ' kg') +
        crRow('Bag Weight (standard)', fmtN(res.inp.bagWeightLbs, 2) + ' lbs  |  ' + fmtN(res.inp.bagWeightLbs * 0.453592, 2) + ' kg') +
        crRow('Bags Required',       fmtN(res.bagsNeeded, 2) + ' bags  (' + Math.ceil(res.bagsNeeded) + ' full bags)') +
        crRow('Cones (5 lb / cone)', Math.ceil(res.bagsNeeded * 20) + ' cones') +
        crRow('Cones (2.5 lb / cone)', Math.ceil(res.bagsNeeded * 40) + ' cones') +
      '</div>' +
    '</div>' +

    /* ── FX Note ── */
    (ccy !== 'PKR' ?
      '<p class="cr-fx-note">* ' + ccy + ' values converted from PKR using live rates. Rate used: 1 PKR = ' +
        (FX[ccy] ? FX[ccy].toFixed(6) : 'N/A') + ' ' + ccy + '</p>' : '') +

    /* ── Actions ── */
    '<div class="cr-actions no-print">' +
      '<button id="calc-print" class="btn btn--ghost-dark">&#128438; Print Cost Sheet</button>' +
    '</div>';

  /* Re-wire print button */
  var pb = document.getElementById('calc-print');
  if (pb) pb.addEventListener('click', doPrint);
}

function crRow(label, value) {
  return '<div class="cr-row"><span class="cr-row__label">' + label + '</span>' +
    '<span class="cr-row__value">' + value + '</span></div>';
}

function crRowSub(label, value) {
  return '<div class="cr-row cr-row--sub"><span class="cr-row__label">' + label + '</span>' +
    '<span class="cr-row__value">' + value + '</span></div>';
}

/* ============================================================
   PRINT
   ============================================================ */
function doPrint() {
  if (!LAST_RESULT) return;

  /* Force PKR on print sheet for clarity */
  var printCcy = ACTIVE_CCY;

  /* Build a clean print-only window */
  var rate = (FX && FX[printCcy] && printCcy !== 'PKR') ? FX[printCcy] : 1;
  var sym  = (CURRENCIES.find(function(c){ return c.code === printCcy; }) || {}).symbol || printCcy + ' ';

  function pFmt(pkrVal) {
    var v = pkrVal * rate;
    return sym + v.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pN(v, d) {
    return v.toLocaleString('en-PK', {
      minimumFractionDigits: d !== undefined ? d : 4,
      maximumFractionDigits: d !== undefined ? d : 4
    });
  }

  var r   = LAST_RESULT;
  var inp = r.inp;

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>ENZO Cost Sheet</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;color:#1a1714;margin:0;padding:32px;font-size:13px;}' +
    'h1{font-size:28px;font-weight:900;letter-spacing:4px;margin:0;}' +
    '.sub{font-size:10px;letter-spacing:2px;color:#9e9589;text-transform:uppercase;}' +
    '.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1c3a2f;padding-bottom:16px;margin-bottom:24px;}' +
    '.meta-row{display:flex;gap:16px;font-size:12px;margin-top:4px;}' +
    '.meta-row span{color:#9e9589;min-width:60px;}' +
    'h2{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b87d3b;border-bottom:1px solid #e5e0d8;padding-bottom:6px;margin:20px 0 8px;}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:16px;}' +
    'td{padding:6px 8px;font-size:12px;border-bottom:1px solid #f0ede8;}' +
    'td:last-child{text-align:right;font-family:monospace;}' +
    'tr.sub td{background:#f8f5f0;font-weight:700;}' +
    '.highlight{background:#1c3a2f;color:white;border-radius:6px;padding:16px 20px;display:flex;justify-content:space-around;margin:16px 0;}' +
    '.hl-item{text-align:center;}' +
    '.hl-label{font-size:10px;letter-spacing:1px;text-transform:uppercase;opacity:.7;display:block;margin-bottom:4px;}' +
    '.hl-value{font-size:22px;font-weight:700;color:#d4a264;}' +
    '.footer{margin-top:40px;border-top:1px solid #e5e0d8;padding-top:12px;font-size:10px;color:#9e9589;display:flex;justify-content:space-between;}' +
    '.notice{font-size:10px;color:#9e9589;font-style:italic;margin-top:8px;}' +
    '@media print{body{padding:20px;}}' +
    '</style></head><body>' +

    /* Header */
    '<div class="header">' +
      '<div><h1>ENZO</h1><div class="sub">by Humayun Ibrahim Textile</div></div>' +
      '<div>' +
        '<div class="sub" style="text-align:right;margin-bottom:6px;">Fabric Cost Sheet</div>' +
        '<div class="meta-row"><span>Date</span><strong>' + r.date + '</strong></div>' +
        '<div class="meta-row"><span>Client</span><strong>' + (inp.clientName || '—') + '</strong></div>' +
        '<div class="meta-row"><span>Ref #</span><strong>' + (inp.refNo || '—') + '</strong></div>' +
        '<div class="meta-row"><span>Currency</span><strong>' + printCcy + '</strong></div>' +
      '</div>' +
    '</div>' +

    /* Construction */
    '<h2>Construction Details</h2>' +
    '<table>' +
      ptr('Yarn Type',         inp.yarnType) +
      ptr('Finishing',         inp.finishing) +
      ptr('Width',             inp.width + ' inches') +
      ptr('Reed',              inp.reed) +
      ptr('Pick (per inch)',   inp.pick) +
      ptr('Warp Count',        inp.warpCount) +
      ptr('Weft Count',        inp.weftCount) +
      ptr('Hook Type',         inp.hookType + ' hook') +
      ptr('Total Ends',        pN(r.totalEnds, 0)) +
      ptr('Warp Weight / m',   pN(r.warpWeightLbs) + ' lbs  (' + pN(r.warpWeightKg) + ' kg)') +
      ptr('Weft Weight / m',   pN(r.weftWeightLbs) + ' lbs  (' + pN(r.weftWeightKg) + ' kg)') +
    '</table>' +

    /* Cost Breakdown */
    '<h2>Cost Breakdown (' + printCcy + ' per metre)</h2>' +
    '<table>' +
      ptr('Warp Cost',         pFmt(r.warpCost)) +
      ptr('Weft Cost',         pFmt(r.weftCost)) +
      ptr('Conversion Cost',   pFmt(r.convCost)) +
      ptr('Kinara Rate',       pFmt(r.kinaraRate)) +
      ptrSub('Base Cost',      pFmt(r.baseCost)) +
      ptr('Markup (10%)',      pFmt(r.withMarkup - r.baseCost)) +
      ptrSub('After Markup',   pFmt(r.withMarkup)) +
      (r.brokeragePKR > 0 ? ptr('Brokerage (1%)', pFmt(r.brokeragePKR)) : '') +
    '</table>' +

    /* Highlight */
    '<div class="highlight">' +
      '<div class="hl-item"><span class="hl-label">Cost per Metre</span><span class="hl-value">' + pFmt(r.finalMeterPKR) + '</span></div>' +
      '<div class="hl-item"><span class="hl-label">Cost per Yard</span><span class="hl-value">' + pFmt(r.finalYardPKR) + '</span></div>' +
    '</div>' +

    /* Inventory */
    '<h2>Inventory — ' + pN(inp.fabricLen, 0) + ' Metres</h2>' +
    '<table>' +
      ptr('Total Yarn Weight',     pN(r.totalLbs, 2) + ' lbs  (' + pN(r.totalKg, 2) + ' kg)') +
      ptr('Standard Bag Weight',   pN(inp.bagWeightLbs, 2) + ' lbs  (' + pN(inp.bagWeightLbs * 0.453592, 2) + ' kg)') +
      ptr('Bags Required',         pN(r.bagsNeeded, 2) + '  (' + Math.ceil(r.bagsNeeded) + ' full bags)') +
      ptr('Cones @ 5 lb each',     Math.ceil(r.bagsNeeded * 20) + ' cones') +
      ptr('Cones @ 2.5 lb each',   Math.ceil(r.bagsNeeded * 40) + ' cones') +
    '</table>' +

    (printCcy !== 'PKR' ?
      '<p class="notice">* ' + printCcy + ' values converted from PKR. Rate: 1 PKR = ' +
        (FX[printCcy] ? FX[printCcy].toFixed(6) : 'N/A') + ' ' + printCcy + '</p>' : '') +

    /* Footer */
    '<div class="footer">' +
      '<span>ENZO by Humayun Ibrahim Textile &nbsp;|&nbsp; 44 A HBFC Faisal Town, Lahore, Pakistan</span>' +
      '<span>info@enzolhr.com &nbsp;|&nbsp; +92 321 8230266</span>' +
    '</div>' +

    '<p class="notice">* This is an indicative cost sheet. Final pricing subject to confirmation. Estimates are based on mill inputs at time of calculation.</p>' +

    '</body></html>';

  var win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function () { win.print(); }, 400);
}

function ptr(label, value) {
  return '<tr><td>' + label + '</td><td>' + value + '</td></tr>';
}
function ptrSub(label, value) {
  return '<tr class="sub"><td>' + label + '</td><td>' + value + '</td></tr>';
}

/* ============================================================
   ERROR HELPERS
   ============================================================ */
function showErr(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.add('is-error');
  var err = document.createElement('span');
  err.className     = 'form-error-msg';
  err.style.display = 'block';
  err.textContent   = msg;
  el.insertAdjacentElement('afterend', err);
}

function clearErrors(form) {
  form.querySelectorAll('.is-error').forEach(function (el) { el.classList.remove('is-error'); });
  form.querySelectorAll('.form-error-msg').forEach(function (el) { el.remove(); });
}