/* ============================================================
   AB TALENT SYNC — Interaction Layer
   Vanilla JS · no dependencies
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Nav: frosted-glass on scroll + active link ---------- */
  const nav = $('.nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
    // scroll progress bar
    const bar = $('.scroll-progress');
    if (bar) {
      const h = document.documentElement;
      const pct = (h.scrollTop || document.body.scrollTop) / ((h.scrollHeight - h.clientHeight) || 1);
      bar.style.width = (pct * 100) + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* highlight nav link matching current page */
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('.nav__link').forEach((a) => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === here || (here === '' && href === 'index.html')) a.classList.add('active');
  });

  /* ---------- Mobile menu ---------- */
  const burger = $('.nav__burger');
  const overlay = $('.nav__overlay');
  if (burger && overlay) {
    const toggle = (open) => {
      const willOpen = open ?? !overlay.classList.contains('open');
      overlay.classList.toggle('open', willOpen);
      burger.classList.toggle('open', willOpen);
      burger.setAttribute('aria-expanded', String(willOpen));
      document.body.style.overflow = willOpen ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle());
    $$('.nav__overlay a').forEach((a) => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  const revealEls = $$('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---------- Count-up stats ---------- */
  const counters = $$('[data-count]');
  if (counters.length) {
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      if (reduceMotion) { el.textContent = formatNum(target) + suffix; return; }
      let start = null;
      const tick = (t) => {
        if (start === null) start = t;
        const p = Math.min((t - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = formatNum(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const formatNum = (n) => n.toLocaleString('en-US');
    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
    } else {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.5 });
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ---------- Hero word cycler ---------- */
  const cycler = $('.hero__cycler');
  if (cycler && !reduceMotion) {
    const words = $$('.word', cycler);
    let i = 0;
    words[0].classList.add('in');
    // size the inline-grid to the widest word so layout doesn't jump
    setInterval(() => {
      const cur = words[i];
      const next = words[(i + 1) % words.length];
      cur.classList.remove('in'); cur.classList.add('out');
      next.classList.remove('out'); next.classList.add('in');
      setTimeout(() => cur.classList.remove('out'), 650);
      i = (i + 1) % words.length;
    }, 2600);
  } else if (cycler) {
    $('.word', cycler).classList.add('in');
  }

  /* ---------- Magnetic buttons ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('[data-magnetic]').forEach((btn) => {
      const strength = 0.32;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y}px) scale(1.03)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Card spotlight (pointer-follow glow) ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('.card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ---------- Hero particle / network canvas ---------- */
  const canvas = $('#hero-canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, points, raf, running = false;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = Math.min(Math.floor((w * h) / 16000), 90);
      points = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.6,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const linkDist = 132;
      for (let a = 0; a < points.length; a++) {
        const p = points[a];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // mouse repel
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 120) { p.x += (mdx / md) * 0.8; p.y += (mdy / md) * 0.8; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
        ctx.fill();

        for (let b = a + 1; b < points.length; b++) {
          const q = points[b];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const o = (1 - d / linkDist) * 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${o})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    const play = () => { if (running) return; running = true; draw(); };
    const pause = () => { running = false; cancelAnimationFrame(raf); };
    window.addEventListener('resize', () => { resize(); });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    // pause when offscreen to save CPU
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { e.isIntersecting ? play() : pause(); });
    }, { threshold: 0 });
    resize();
    vio.observe(canvas);
  }

  /* ---------- Hero parallax on background ---------- */
  if (canvas && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    const hero = $('.hero');
    hero?.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.width / 2) / r.width;
      const y = (e.clientY - r.height / 2) / r.height;
      canvas.style.transform = `translate(${x * 14}px, ${y * 14}px) scale(1.04)`;
    });
    hero?.addEventListener('mouseleave', () => { canvas.style.transform = ''; });
  }

  /* ---------- Contact form (no <form> tag — JS handled) ---------- */
  const submit = $('#contact-submit');
  if (submit) {
    const block = $('#contact-block');
    const success = $('#contact-success');
    const fields = $$('[data-field]', block);

    const validators = {
      name:    (v) => v.trim().length >= 2,
      email:   (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      phone:   (v) => v.trim() === '' || /^[\d\s()+\-]{7,}$/.test(v.trim()),
      type:    (v) => v.trim() !== '',
      message: (v) => v.trim().length >= 10,
    };

    submit.addEventListener('click', () => {
      let ok = true;
      fields.forEach((wrap) => {
        const input = $('input, textarea, select', wrap);
        const key = wrap.dataset.field;
        const valid = validators[key] ? validators[key](input.value) : true;
        wrap.classList.toggle('invalid', !valid);
        if (!valid && ok) { input.focus(); }
        if (!valid) ok = false;
      });
      if (!ok) return;

      submit.textContent = 'Sending…';
      submit.disabled = true;
      setTimeout(() => {
        block.style.display = 'none';
        success.classList.add('show');
        success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }, 700);
    });

    // clear error on input
    fields.forEach((wrap) => {
      const input = $('input, textarea, select', wrap);
      input.addEventListener('input', () => wrap.classList.remove('invalid'));
    });
  }

  /* ---------- Footer year ---------- */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Page entrance flash ---------- */
  const flash = document.createElement('div');
  flash.className = 'page-flash';
  document.body.prepend(flash);
  setTimeout(() => flash.remove(), 600);

  /* ---------- Custom cursor ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    const dot  = document.createElement('div');
    const ring = document.createElement('div');
    dot.className  = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = -300, my = -300, rx = -300, ry = -300;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    (function lerpRing() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(lerpRing);
    })();

    const hoverEls = $$('a, button, [data-magnetic], input, textarea, select, .card, .quote');
    hoverEls.forEach((el) => {
      el.addEventListener('mouseenter', () => { dot.classList.add('hovered'); ring.classList.add('hovered'); });
      el.addEventListener('mouseleave', () => { dot.classList.remove('hovered'); ring.classList.remove('hovered'); });
    });
  }

  /* ---------- 3D card tilt ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('.card, .quote').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        const ry = +(x * 11).toFixed(2);
        const rx = +(-y *  9).toFixed(2);
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.015)`;
        card.classList.add('tilting');
        // spotlight position
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.classList.remove('tilting');
      });
    });
  }

  /* ---------- Hero letter stagger ---------- */
  const splitLine = $('.hero__line--split');
  if (splitLine && !reduceMotion) {
    const raw = splitLine.textContent.trim();
    // Group by word so "Spring" and "Into" never break mid-word
    const words = raw.split(/\s+/);
    let charIdx = 0;
    splitLine.innerHTML = words.map((word, wi) => {
      const chars = word.split('').map((c) => {
        const span = `<span class="ch" data-i="${charIdx}">${c}</span>`;
        charIdx++;
        return span;
      }).join('');
      const space = wi < words.length - 1
        ? '<span class="ch-space" style="display:inline-block;width:0.28em;opacity:1"> </span>'
        : '';
      return `<span class="word-wrap">${chars}</span>${space}`;
    }).join('');

    setTimeout(() => {
      splitLine.classList.add('letters-in');
      $$('.ch', splitLine).forEach((ch) => {
        const i = parseInt(ch.dataset.i, 10);
        ch.style.transitionDelay = (0.06 + i * 0.048) + 's';
      });
    }, 320);
  }

  /* ---------- Stat pulse ring after count-up ---------- */
  $$('.stat__num[data-count]').forEach((el) => {
    const origRun = el._countRan;
    const observer = new MutationObserver(() => {
      const val = parseFloat(el.dataset.count);
      if (parseFloat(el.textContent) >= val) {
        el.classList.add('counted');
        setTimeout(() => el.classList.remove('counted'), 900);
        observer.disconnect();
      }
    });
    observer.observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* ---------- Enhanced hero canvas: dual-colour particles ---------- */
  const existingCanvas = $('#hero-canvas');
  if (existingCanvas && !reduceMotion) {
    // After the existing canvas initialises (deferred), patch its colours
    requestAnimationFrame(() => {
      setTimeout(() => {
        const ctx2 = existingCanvas.getContext('2d');
        const origDraw = ctx2.arc.bind(ctx2);
        let toggle = 0;
        ctx2.arc = function (...args) {
          if (ctx2.fillStyle === 'rgba(0, 212, 255, 0.6)') {
            ctx2.fillStyle = toggle++ % 3 === 0 ? 'rgba(0,255,136,0.55)' : 'rgba(0,212,255,0.60)';
          }
          return origDraw(...args);
        };
      }, 300);
    });
  }

  /* ---------- Smooth link transitions ---------- */
  if (!reduceMotion) {
    $$('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel')) return;
      a.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        const f = document.createElement('div');
        f.className = 'page-flash';
        f.style.background = 'rgba(0,212,255,0.07)';
        f.style.animation = 'none';
        f.style.opacity = '1';
        f.style.transition = 'opacity 0.28s';
        document.body.prepend(f);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          f.style.opacity = '0';
          setTimeout(() => { window.location.href = href; }, 280);
        }));
      });
    });
  }
})();
