/* ============================================================
   ENZO — main.js
   ============================================================ */
'use strict';

/* ── FABRIC DATA (inline — no fetch required) ─────────────── */
const FABRICS = [
  {
    id: 'nova-silk-01',
    category: 'nova-silk',
    categoryLabel: 'Nova Silk',
    name: 'Nova Silk — Classic',
    desc: 'A luxurious blend capturing the sheen and softness of pure silk with enhanced durability. Ideal for formal menswear and high-end tailoring.',
    badge: 'Signature',
    badgeAccent: true,
    swatchClass: 'fabric-card__swatch--nova-silk',
    specs: [
      { label: 'Weight', value: '120 gsm' },
      { label: 'Width',  value: '58 in'   },
      { label: 'Comp.',  value: '60% Viscose / 40% Polyester' }
    ]
  },
  {
    id: 'nova-silk-02',
    category: 'nova-silk',
    categoryLabel: 'Nova Silk',
    name: 'Nova Silk — Matte',
    desc: 'A subdued finish variant of our Nova Silk — reduced lustre for understated daywear and bespoke suit linings.',
    badge: null,
    badgeAccent: false,
    swatchClass: 'fabric-card__swatch--nova-silk',
    specs: [
      { label: 'Weight', value: '115 gsm' },
      { label: 'Width',  value: '58 in'   },
      { label: 'Comp.',  value: '55% Viscose / 45% Polyester' }
    ]
  },
  {
    id: 'cross-slub-01',
    category: 'cross-slub',
    categoryLabel: 'Cross Slub',
    name: 'Cross Slub — Charcoal',
    desc: 'Woven with deliberate textural irregularities for depth and distinct character. Perfect for those who value understated sophistication.',
    badge: 'Signature',
    badgeAccent: true,
    swatchClass: 'fabric-card__swatch--cross-slub',
    specs: [
      { label: 'Weight', value: '180 gsm'       },
      { label: 'Width',  value: '60 in'          },
      { label: 'Comp.',  value: '100% Cotton Slub' }
    ]
  },
  {
    id: 'cross-slub-02',
    category: 'cross-slub',
    categoryLabel: 'Cross Slub',
    name: 'Cross Slub — Natural',
    desc: 'An undyed construction showcasing the raw beauty of slub weave. Available for custom dyeing to specification.',
    badge: 'Custom Dye',
    badgeAccent: false,
    swatchClass: 'fabric-card__swatch--neps-slub',
    specs: [
      { label: 'Weight', value: '175 gsm'       },
      { label: 'Width',  value: '60 in'          },
      { label: 'Comp.',  value: '100% Cotton Slub' }
    ]
  },
  {
    id: 'mohair-01',
    category: 'mohair',
    categoryLabel: 'Mohair Blend',
    name: 'Mohair Blend — Camel',
    desc: 'A premium Mohair blend offering exceptional softness and natural lustre. Sourced under ethically certified supply chains.',
    badge: 'Certified',
    badgeAccent: false,
    swatchClass: 'fabric-card__swatch--mohair',
    specs: [
      { label: 'Weight', value: '220 gsm'          },
      { label: 'Width',  value: '58 in'             },
      { label: 'Comp.',  value: '70% Mohair / 30% Wool' }
    ]
  },
  {
    id: 'dyed-yarn-01',
    category: 'dyed-yarn',
    categoryLabel: 'Dyed Yarn',
    name: 'Dyed Yarn Fabric — Forest',
    desc: 'Constructed from in-house dyed yarn, providing rich consistent colour from fibre to finish with excellent washfastness.',
    badge: null,
    badgeAccent: false,
    swatchClass: 'fabric-card__swatch--dyed-yarn',
    specs: [
      { label: 'Weight', value: '160 gsm'          },
      { label: 'Width',  value: '58 in'             },
      { label: 'Comp.',  value: '100% Combed Cotton' }
    ]
  },
  {
    id: 'neps-slub-01',
    category: 'neps-slub',
    categoryLabel: 'Neps Slub',
    name: 'Neps Slub — Ecru',
    desc: 'Specialty yarn construction featuring nep inclusions for a naturally textured, artisanal aesthetic. A heritage offering from Humayun Ibrahim Textile.',
    badge: 'Heritage',
    badgeAccent: false,
    swatchClass: 'fabric-card__swatch--neps-slub',
    specs: [
      { label: 'Weight', value: '150 gsm'          },
      { label: 'Width',  value: '60 in'             },
      { label: 'Comp.',  value: '100% Cotton Neps'  }
    ]
  },
  {
    id: 'neps-slub-02',
    category: 'neps-slub',
    categoryLabel: 'Neps Slub',
    name: 'Neps Slub — Melange',
    desc: 'A blended melange combining dyed and undyed fibres for subtle two-tone visual depth. Available in custom colour combinations.',
    badge: 'Custom Dye',
    badgeAccent: false,
    swatchClass: 'fabric-card__swatch--neps-slub',
    specs: [
      { label: 'Weight', value: '155 gsm'                    },
      { label: 'Width',  value: '60 in'                       },
      { label: 'Comp.',  value: '85% Cotton / 15% Polyester'  }
    ]
  }
];

/* ── RUN — defer guarantees DOM is ready, no wrapper needed ── */
initHeader();
initMobileMenu();
initFabricLibrary();
initScrollReveals();
initRFQForm();
initSmoothScroll();


/* ============================================================
   1. HEADER
   ============================================================ */
function initHeader() {
  var header = document.getElementById('site-header');
  if (!header) return;

  var ticking = false;

  function updateHeader() {
    if (window.scrollY > 60) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateHeader();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateHeader();
}


/* ============================================================
   2. MOBILE MENU
   ============================================================ */
function initMobileMenu() {
  var toggle = document.getElementById('nav-toggle');
  var menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  var isOpen = false;

  function openMenu() {
    isOpen = true;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    var lines = toggle.querySelectorAll('.hamburger-line');
    if (lines[0]) lines[0].style.transform = 'translateY(6.5px) rotate(45deg)';
    if (lines[1]) lines[1].style.opacity   = '0';
    if (lines[2]) lines[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    isOpen = false;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    var lines = toggle.querySelectorAll('.hamburger-line');
    if (lines[0]) lines[0].style.transform = '';
    if (lines[1]) lines[1].style.opacity   = '';
    if (lines[2]) lines[2].style.transform = '';
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', function () {
    isOpen ? closeMenu() : openMenu();
  });

  menu.querySelectorAll('.mobile-nav-link').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', function (e) {
    if (isOpen && !menu.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });
}


/* ============================================================
   3. FABRIC LIBRARY
   ============================================================ */
function initFabricLibrary() {
  var grid       = document.getElementById('fabric-grid');
  var filterBtns = document.querySelectorAll('.filter-btn');
  if (!grid) return;

  var activeFilter = 'all';

  // Render all on load
  renderCards(FABRICS);

  // Filter buttons
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.dataset.filter;
      if (filter === activeFilter) return;

      activeFilter = filter;

      filterBtns.forEach(function (b) {
        b.classList.remove('filter-btn--active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('filter-btn--active');
      btn.setAttribute('aria-pressed', 'true');

      var filtered = filter === 'all'
        ? FABRICS
        : FABRICS.filter(function (f) { return f.category === filter; });

      renderCards(filtered);
    });
  });
}

function buildCardHTML(fabric) {
  var badgeHTML = fabric.badge
    ? '<span class="fabric-card__badge ' + (fabric.badgeAccent ? 'fabric-card__badge--accent' : '') + '">' + fabric.badge + '</span>'
    : '';

  var specsHTML = fabric.specs.map(function (s) {
    return '<div class="fabric-card__spec">' +
      '<span class="fabric-card__spec-label">' + s.label + '</span>' +
      '<span class="fabric-card__spec-value">' + s.value + '</span>' +
      '</div>';
  }).join('');

  return '<article class="fabric-card reveal" role="listitem" data-category="' + fabric.category + '">' +
    '<div class="fabric-card__swatch ' + fabric.swatchClass + '">' + badgeHTML + '</div>' +
    '<div class="fabric-card__body">' +
      '<span class="fabric-card__category">' + fabric.categoryLabel + '</span>' +
      '<h3 class="fabric-card__name">' + fabric.name + '</h3>' +
      '<p class="fabric-card__desc">' + fabric.desc + '</p>' +
      '<div class="fabric-card__specs">' + specsHTML + '</div>' +
      '<div class="fabric-card__actions">' +
        '<a href="#rfq" class="btn btn--ghost-dark">Request Sample</a>' +
        '<a href="#rfq" class="btn btn--primary">Get Quote</a>' +
      '</div>' +
    '</div>' +
  '</article>';
}

function renderCards(fabrics) {
  var grid = document.getElementById('fabric-grid');
  if (!grid) return;

  if (!fabrics.length) {
    grid.innerHTML = '<p class="fabric-grid__loading">No fabrics in this category.</p>';
    return;
  }

  grid.innerHTML = fabrics.map(buildCardHTML).join('');

  // Staggered reveal
  requestAnimationFrame(function () {
    var cards = grid.querySelectorAll('.reveal');
    cards.forEach(function (card, i) {
      setTimeout(function () {
        card.classList.add('is-visible');
      }, i * 60);
    });
  });
}


/* ============================================================
   4. SCROLL REVEALS
   ============================================================ */
function initScrollReveals() {
  var selectors = [
    '.section-heading', '.eyebrow', '.body-copy',
    '.credential-card', '.section-header',
    '.about-text', '.estimator-form-panel',
    '.rfq-intro', '.rfq-form-wrapper',
    '.hero-trust', '.quote-strip__text'
  ];

  var els = document.querySelectorAll(selectors.join(', '));

  els.forEach(function (el) {
    if (!el.closest('#fabric-grid')) {
      el.classList.add('reveal');
    }
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: just show everything
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  var credGrid = document.querySelector('.about-credentials');
  if (credGrid) credGrid.classList.add('reveal-stagger');
}


/* ============================================================
   5. RFQ FORM
   ============================================================ */
function initRFQForm() {
  var form     = document.getElementById('rfq-form');
  var feedback = document.getElementById('rfq-feedback');
  var submit   = document.getElementById('rfq-submit');
  if (!form) return;

  // Blur validation
  var fields = form.querySelectorAll('.form-input, .form-select, .form-textarea');
  fields.forEach(function (field) {
    field.addEventListener('blur', function () { validateField(field); });
    field.addEventListener('input', function () {
      if (field.classList.contains('is-error')) validateField(field);
    });
  });

  // Submit
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var required = form.querySelectorAll('[required]');
    var isValid  = true;

    required.forEach(function (field) {
      if (!validateField(field)) isValid = false;
    });

    if (!isValid) {
      showFeedback(feedback, 'error', 'Please complete all required fields before submitting.');
      var firstError = form.querySelector('.is-error');
      if (firstError) firstError.focus();
      return;
    }

    submit.disabled    = true;
    submit.textContent = 'Sending…';

    // Simulate async submit (replace with real endpoint)
    var data = new FormData(form);

    fetch(form.action, {
    method: 'POST',
    body: data,
    headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
    if (response.ok) {
        form.reset();
        showFeedback(feedback, 'success', '✦ Thank you. Your RFQ has been received — we will respond within 1 business day.');
    } else {
        showFeedback(feedback, 'error', 'Submission failed. Please email us at contact@enzolhr.com');
    }
    submit.textContent = 'Submit RFQ';
    submit.disabled    = false;
    })
    .catch(function () {
    showFeedback(feedback, 'error', 'Network error. Please email us at contact@enzolhr.com');
    submit.textContent = 'Submit RFQ';
    submit.disabled    = false;
    });

    return false;
  });
}

function validateField(field) {
  var group   = field.closest('.form-group');
  var isValid = true;
  var message = '';

  if (field.required) {
    if (field.type === 'checkbox') {
      isValid = field.checked;
      message = 'You must agree to continue.';
    } else {
      isValid = field.value.trim() !== '';
      message = 'This field is required.';
    }
  }

  if (isValid && field.type === 'email' && field.value.trim()) {
    isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
    message = 'Please enter a valid email address.';
  }

  if (isValid && field.type === 'number' && field.min && field.value) {
    isValid = Number(field.value) >= Number(field.min);
    message = 'Minimum value is ' + field.min + '.';
  }

  if (group) {
    field.classList.toggle('is-error', !isValid);
    group.classList.toggle('has-error', !isValid);

    var errMsg = group.querySelector('.form-error-msg');
    if (!isValid) {
      if (!errMsg) {
        errMsg = document.createElement('span');
        errMsg.className = 'form-error-msg';
        field.insertAdjacentElement('afterend', errMsg);
      }
      errMsg.textContent = message;
    } else if (errMsg) {
      errMsg.remove();
    }
  }

  return isValid;
}

function showFeedback(el, type, message) {
  if (!el) return;
  el.hidden    = false;
  el.textContent = message;
  el.className = 'form-feedback form-feedback--' + type;
  if (type === 'success') {
    setTimeout(function () { el.hidden = true; }, 8000);
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/* ============================================================
   6. SMOOTH SCROLL
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10
      ) || 72;
      var top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
}