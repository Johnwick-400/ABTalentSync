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
})();
