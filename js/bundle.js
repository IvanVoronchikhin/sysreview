/**
 * bundle.js — Standalone IIFE bundle
 * Все модули объединены. Работает с file:// без сервера.
 * Заменяет: navigation.js, animations.js, accordion.js, main.js
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
  ═══════════════════════════════════════════════════════════ */
  function Navigation() {
    this.navbar     = document.querySelector('.navbar');
    this.hamburger  = document.querySelector('.navbar__hamburger');
    this.navMenu    = document.querySelector('.navbar__nav');
    this.overlay    = this._createOverlay();
    this._bind();
  }

  Navigation.prototype._createOverlay = function () {
    var el = document.querySelector('.page-transition-overlay');
    if (!el) {
      el = document.createElement('div');
      el.className = 'page-transition-overlay';
      document.body.appendChild(el);
    }
    return el;
  };

  Navigation.prototype._bind = function () {
    var self = this;

    /* Sticky shadow */
    if (self.navbar) {
      window.addEventListener('scroll', function () {
        self.navbar.classList.toggle('scrolled', window.scrollY > 20);
      }, { passive: true });
    }

    /* Hamburger */
    if (self.hamburger && self.navMenu) {
      self.hamburger.addEventListener('click', function () { self._toggleMenu(); });
      document.addEventListener('click', function (e) {
        if (self.navbar && !self.navbar.contains(e.target)) self._closeMenu();
      });
    }

    /* Page transitions — все внутренние ссылки */
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('http') === 0 || href.indexOf('mailto') === 0) return;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        self._navigateTo(href);
      });
    });

    /* Fade-in при загрузке */
    var ov = self.overlay;
    ov.classList.add('active');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ov.classList.remove('active'); });
    });
  };

  Navigation.prototype._toggleMenu = function () {
    var open = this.navMenu.classList.toggle('open');
    this.hamburger.setAttribute('aria-expanded', String(open));
    this._animateHamburger(open);
  };

  Navigation.prototype._closeMenu = function () {
    if (!this.navMenu) return;
    this.navMenu.classList.remove('open');
    if (this.hamburger) this.hamburger.setAttribute('aria-expanded', 'false');
    this._animateHamburger(false);
  };

  Navigation.prototype._animateHamburger = function (open) {
    var spans = this.hamburger ? this.hamburger.querySelectorAll('span') : [];
    if (spans.length < 3) return;
    if (open) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    }
  };

  Navigation.prototype._navigateTo = function (href) {
    var ov = this.overlay;
    ov.classList.add('active');
    setTimeout(function () { window.location.href = href; }, 280);
  };

  /* ═══════════════════════════════════════════════════════════
     ANIMATIONS
  ═══════════════════════════════════════════════════════════ */
  function Animations() {
    this._initRipple();
    this._initCounters();
    this._initParallaxOrbs();
    this._initCardTilt();
  }

  Animations.prototype._initRipple = function () {
    /* Inject keyframe once */
    if (!document.querySelector('#ripple-style')) {
      var s = document.createElement('style');
      s.id = 'ripple-style';
      s.textContent = '@keyframes ripple-expand { to { transform: scale(1); opacity: 0; } }';
      document.head.appendChild(s);
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn, .section-card');
      if (!btn) return;

      var ripple = document.createElement('span');
      var rect   = btn.getBoundingClientRect();
      var size   = Math.max(rect.width, rect.height) * 1.5;
      var x      = e.clientX - rect.left - size / 2;
      var y      = e.clientY - rect.top  - size / 2;

      ripple.style.cssText = [
        'position:absolute',
        'width:'  + size + 'px',
        'height:' + size + 'px',
        'left:'   + x    + 'px',
        'top:'    + y    + 'px',
        'border-radius:50%',
        'background:rgba(255,255,255,0.25)',
        'transform:scale(0)',
        'animation:ripple-expand 500ms ease-out forwards',
        'pointer-events:none'
      ].join(';');

      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); });
    });
  };

  Animations.prototype._initCounters = function () {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el       = entry.target;
        var target   = parseFloat(el.dataset.count);
        var suffix   = el.dataset.suffix || '';
        var duration = 1400;
        var start    = performance.now();

        function tick(now) {
          var elapsed  = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var ease     = 1 - Math.pow(1 - progress, 3);
          var value    = target * ease;
          el.textContent = (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (c) { io.observe(c); });
  };

  Animations.prototype._initParallaxOrbs = function () {
    var orbs = document.querySelectorAll('.hero__bg-orb');
    if (!orbs.length) return;
    var ticking = false;

    window.addEventListener('mousemove', function (e) {
      if (ticking) return;
      requestAnimationFrame(function () {
        var cx = window.innerWidth  / 2;
        var cy = window.innerHeight / 2;
        var dx = (e.clientX - cx) / cx;
        var dy = (e.clientY - cy) / cy;

        orbs.forEach(function (orb, i) {
          var f = (i + 1) * 18;
          orb.style.transform = 'translate(' + (dx * f) + 'px,' + (dy * f) + 'px)';
        });
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  };

  Animations.prototype._initCardTilt = function () {
    document.querySelectorAll('.section-card, .hero__card-float').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width  - 0.5;
        var y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform = 'perspective(800px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
        card.style.transform  = '';
        setTimeout(function () { card.style.transition = ''; }, 500);
      });
    });
  };

  /* ═══════════════════════════════════════════════════════════
     ACCORDION
  ═══════════════════════════════════════════════════════════ */
  function Accordion(containerSelector) {
    this.containers = document.querySelectorAll(containerSelector);
    if (!this.containers.length) return;
    this._init();
  }

  Accordion.prototype._init = function () {
    var self = this;
    self.containers.forEach(function (container) {
      container.querySelectorAll('.accordion-item').forEach(function (item, index) {
        var trigger = item.querySelector('.accordion-trigger');
        var body    = item.querySelector('.accordion-body');
        if (!trigger || !body) return;

        body.style.height   = '0px';
        body.style.overflow = 'hidden';
        body.style.transition = 'height 360ms cubic-bezier(0.4,0,0.2,1)';
        item.dataset.open   = 'false';
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', 'accordion-body-' + index);
        body.id = 'accordion-body-' + index;
        body.setAttribute('role', 'region');

        trigger.addEventListener('click', function () {
          self._toggle(container, item, body, trigger);
        });
      });
    });
  };

  Accordion.prototype._toggle = function (container, clickedItem, clickedBody, clickedTrigger) {
    var self   = this;
    var isOpen = clickedItem.dataset.open === 'true';

    /* Close all in container */
    container.querySelectorAll('.accordion-item').forEach(function (item) {
      if (item.dataset.open === 'true') {
        self._close(item, item.querySelector('.accordion-body'), item.querySelector('.accordion-trigger'));
      }
    });

    if (!isOpen) self._open(clickedItem, clickedBody, clickedTrigger);
  };

  Accordion.prototype._open = function (item, body, trigger) {
    item.dataset.open = 'true';
    trigger.setAttribute('aria-expanded', 'true');
    item.classList.add('is-open');

    body.style.height = 'auto';
    var fullH = body.scrollHeight + 'px';
    body.style.height = '0px';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { body.style.height = fullH; });
    });

    body.addEventListener('transitionend', function () {
      if (item.dataset.open === 'true') body.style.height = 'auto';
    }, { once: true });
  };

  Accordion.prototype._close = function (item, body, trigger) {
    item.dataset.open = 'false';
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    item.classList.remove('is-open');

    body.style.height = body.scrollHeight + 'px';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { body.style.height = '0px'; });
    });
  };

  /* Public API */
  Accordion.prototype.openAt = function (containerSelector, index) {
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var items = container.querySelectorAll('.accordion-item');
    if (!items[index]) return;
    var body    = items[index].querySelector('.accordion-body');
    var trigger = items[index].querySelector('.accordion-trigger');
    this._toggle(container, items[index], body, trigger);
  };

  Accordion.prototype.closeAll = function (containerSelector) {
    var self      = this;
    var container = document.querySelector(containerSelector);
    if (!container) return;
    container.querySelectorAll('.accordion-item').forEach(function (item) {
      if (item.dataset.open === 'true') {
        self._close(item, item.querySelector('.accordion-body'), item.querySelector('.accordion-trigger'));
      }
    });
  };

  /* ═══════════════════════════════════════════════════════════
     MAIN — Bootstrap
  ═══════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function initActiveNavLink() {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    /* file:// может вернуть пустую строку — дополнительно проверяем hash */
    if (!current || current === '') current = 'index.html';
    document.querySelectorAll('.navbar__link').forEach(function (link) {
      var href = (link.getAttribute('href') || '').split('/').pop();
      if (href === current) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initSmoothScrollLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: top, behavior: 'smooth' });
        document.querySelectorAll('.local-nav__link').forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
      });
    });
  }

  /* Quick-jump кнопки (disk-tools + security) */
  function initAccordionJumps(accordion) {
    document.querySelectorAll('[data-open-accordion]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var idx = parseInt(btn.dataset.openAccordion, 10);
        accordion.openAt('[data-accordion]', idx);
        var container = document.querySelector('[data-accordion]');
        if (container) {
          var top = container.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  /* disk.html — metric bars animation */
  function initMetricBars() {
    var bars = document.querySelectorAll('.metric-bar[data-width]');
    if (!bars.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.width = e.target.dataset.width + '%';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });

    bars.forEach(function (b) {
      var orig = parseInt(b.style.width, 10) || 0;
      b.dataset.width = orig;
      b.style.width   = '0%';
      io.observe(b);
    });
  }

  /* ── DOM Ready ── */
  document.addEventListener('DOMContentLoaded', function () {
    new Navigation();
    new Animations();

    initScrollReveal();
    initActiveNavLink();
    initSmoothScrollLinks();
    initMetricBars();

    var hasAccordion = document.querySelector('[data-accordion]');
    if (hasAccordion) {
      var acc = new Accordion('[data-accordion]');
      initAccordionJumps(acc);
    }
  });

})(); /* end IIFE */
