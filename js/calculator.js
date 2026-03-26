/* ============================================================
   ENZO — calculator.js
   ============================================================ */
'use strict';

var FABRIC_PRICING = {
  'nova-silk':  { base: [4.50, 7.00], label: 'Nova Silk'           },
  'cross-slub': { base: [2.80, 4.50], label: 'Cross Slub'          },
  'mohair':     { base: [6.00, 9.50], label: 'Mohair Blend'        },
  'dyed-yarn':  { base: [2.20, 3.80], label: 'Dyed Yarn'           },
  'neps-slub':  { base: [2.50, 4.20], label: 'Neps Slub'           },
  'custom':     { base: [3.50, 8.00], label: 'Custom Construction' }
};

var FINISH_MULTIPLIERS = {
  'none':     { multiplier: 1.00, label: 'Greige / Raw'       },
  'bleached': { multiplier: 1.08, label: 'Bleached'           },
  'dyed':     { multiplier: 1.18, label: 'Solid Dyed'         },
  'printed':  { multiplier: 1.32, label: 'Printed'            },
  'coated':   { multiplier: 1.45, label: 'Coated / Laminated' }
};

var WIDTH_SURCHARGE = {
  '44': { surcharge: 0.00, label: '44 in (112 cm)' },
  '58': { surcharge: 0.10, label: '58 in (147 cm)' },
  '60': { surcharge: 0.12, label: '60 in (152 cm)' },
  '72': { surcharge: 0.22, label: '72 in (183 cm)' }
};

var VOLUME_TIERS = [
  { min: 0,     max: 999,      discount: 0.00 },
  { min: 1000,  max: 4999,     discount: 0.04 },
  { min: 5000,  max: 14999,    discount: 0.08 },
  { min: 15000, max: 49999,    discount: 0.12 },
  { min: 50000, max: Infinity, discount: 0.16 }
];

function getVolumeTier(qty) {
  for (var i = 0; i < VOLUME_TIERS.length; i++) {
    if (qty >= VOLUME_TIERS[i].min && qty <= VOLUME_TIERS[i].max) {
      return VOLUME_TIERS[i];
    }
  }
  return VOLUME_TIERS[0];
}

function calcLeadTime(qty, finish) {
  var base  = qty > 50000 ? 42 : qty > 15000 ? 35 : qty > 5000 ? 28 : 21;
  var extra = { none: 0, bleached: 3, dyed: 7, printed: 10, coated: 12 };
  var total = base + (extra[finish] || 0);
  return total + '\u2013' + (total + 7) + ' business days';
}

function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

function markError(field, message) {
  if (!field) return;
  field.classList.add('is-error');
  var err = document.createElement('span');
  err.className     = 'form-error-msg';
  err.style.display = 'block';
  err.textContent   = message;
  field.insertAdjacentElement('afterend', err);
  field.focus();
}

/* ── INIT — called directly, no DOMContentLoaded wrapper ──── */
function initEstimator() {
  var form        = document.getElementById('estimator-form');
  var idlePanel   = document.getElementById('results-idle');
  var outputPanel = document.getElementById('results-output');
  var qtyInput    = document.getElementById('est-quantity');

  if (!form) return;

  /* Live quantity hint */
  if (qtyInput) {
    qtyInput.addEventListener('input', function () {
      var hint = qtyInput.nextElementSibling;
      if (!hint || !hint.classList.contains('form-hint')) return;
      var val  = parseInt(qtyInput.value, 10);
      if (!isNaN(val) && val >= 500) {
        var tier = getVolumeTier(val);
        hint.textContent = tier.discount > 0
          ? (tier.discount * 100).toFixed(0) + '% volume discount applies'
          : 'Minimum order: 500 metres';
      } else {
        hint.textContent = 'Minimum order: 500 metres';
      }
    });
  }

  /* Submit handler */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Clear old errors */
    form.querySelectorAll('.is-error').forEach(function (el) {
      el.classList.remove('is-error');
    });
    form.querySelectorAll('.form-error-msg').forEach(function (el) {
      el.remove();
    });

    var fabricType = document.getElementById('est-fabric-type').value;
    var quantity   = parseInt(document.getElementById('est-quantity').value, 10);
    var width      = document.getElementById('est-width').value;
    var finish     = document.getElementById('est-finish').value || 'none';

    /* Validate */
    var hasError = false;
    if (!fabricType) {
      markError(document.getElementById('est-fabric-type'), 'Please select a fabric category.');
      hasError = true;
    }
    if (!quantity || isNaN(quantity) || quantity < 500) {
      markError(document.getElementById('est-quantity'), 'Minimum quantity is 500 metres.');
      hasError = true;
    }
    if (!width) {
      markError(document.getElementById('est-width'), 'Please select a width.');
      hasError = true;
    }
    if (hasError) return;

    /* Price calculation */
    var pricing    = FABRIC_PRICING[fabricType]  || FABRIC_PRICING['custom'];
    var finishData = FINISH_MULTIPLIERS[finish]   || FINISH_MULTIPLIERS['none'];
    var widthData  = WIDTH_SURCHARGE[width]       || WIDTH_SURCHARGE['58'];
    var tier       = getVolumeTier(quantity);

    var priceLow  = (pricing.base[0] + widthData.surcharge) * finishData.multiplier * (1 - tier.discount);
    var priceHigh = (pricing.base[1] + widthData.surcharge) * finishData.multiplier * (1 - tier.discount);
    var totalLow  = Math.round(priceLow  * quantity);
    var totalHigh = Math.round(priceHigh * quantity);

    /* Populate result fields */
    setText('res-fabric-type', pricing.label);
    setText('res-quantity',    quantity.toLocaleString('en-US') + ' metres');
    setText('res-width',       widthData.label);
    setText('res-finish',      finishData.label);
    setText('res-lead-time',   calcLeadTime(quantity, finish));

    var priceEl = document.getElementById('res-price');
    if (priceEl) {
      priceEl.textContent = '$' + totalLow.toLocaleString('en-US') +
                            ' \u2013 $' + totalHigh.toLocaleString('en-US');
    }

    /* Per-metre note */
    var perMetreNote = outputPanel.querySelector('.per-metre-note');
    if (!perMetreNote) {
      perMetreNote = document.createElement('p');
      perMetreNote.className = 'results-disclaimer per-metre-note';
      if (priceEl) priceEl.insertAdjacentElement('afterend', perMetreNote);
    }
    perMetreNote.textContent = '$' + priceLow.toFixed(2) +
                               ' \u2013 $' + priceHigh.toFixed(2) + ' per metre';

    /* Volume discount note */
    var discountNote = outputPanel.querySelector('.discount-note');
    if (tier.discount > 0) {
      if (!discountNote) {
        discountNote = document.createElement('p');
        discountNote.className    = 'results-disclaimer discount-note';
        discountNote.style.color  = 'var(--color-accent-light)';
        perMetreNote.insertAdjacentElement('afterend', discountNote);
      }
      discountNote.textContent = '\u2756 ' + (tier.discount * 100).toFixed(0) + '% volume discount applied';
    } else if (discountNote) {
      discountNote.remove();
    }

    /* Show results panel */
    if (idlePanel)   idlePanel.style.display = 'none';
    if (outputPanel) outputPanel.hidden = false;

    /* Scroll on mobile */
    if (window.innerWidth < 1024) {
      var panel = document.querySelector('.estimator-results-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

/* ── Run immediately — defer already guarantees DOM is ready ─ */
initEstimator();