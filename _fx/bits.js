/* morphik bits v2 — showcase-grade vanilla motion (GSAP + Lenis).
   v1 lesson: waiting for window.load made effects fire on an already-visible page = flicker.
   v2: initial states are set synchronously at script-exec (end of body, pre-paint), choreography
   starts at DOMContentLoaded, image reveals never wait for decode (clip-path wipes).
   Guards: prefers-reduced-motion => nothing runs & nothing is hidden; pointer:fine gates
   Lenis/magnetic/cursor/tilt/spotlight; pinned scenes desktop-only. */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(pointer: fine)').matches;
  var DESK = matchMedia('(min-width: 900px)').matches;
  var FX = window.FX = { off: RM || !window.gsap };
  if (!FX.off) gsap.registerPlugin(ScrollTrigger);

  var css = [
    '.fxshine{background-image:linear-gradient(120deg,currentColor 40%,#fff 50%,currentColor 60%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:fxshine 3.2s linear infinite}',
    '@keyframes fxshine{0%{background-position:120% 0}100%{background-position:-120% 0}}',
    '.fxspot{position:relative;overflow:hidden}',
    '.fxspot::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(240px circle at var(--fxx,50%) var(--fxy,50%),var(--fxspot,rgba(255,255,255,.14)),transparent 65%)}',
    '.fxspot:hover::after{opacity:1}',
    '.fxgrain{position:fixed;inset:-60px;z-index:4;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.86\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'240\' height=\'240\' filter=\'url(%23n)\'/%3E%3C/svg%3E")}',
    '@keyframes fxgrain{0%{transform:translate(0,0)}25%{transform:translate(-24px,14px)}50%{transform:translate(12px,-22px)}75%{transform:translate(-10px,-8px)}100%{transform:translate(0,0)}}',
    '.fxcurtain{position:fixed;inset:0;z-index:999;display:flex;flex-direction:column;pointer-events:none}',
    '.fxcurtain i{flex:1;display:block}',
    '.fxcurtain .fxcl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;letter-spacing:.14em}',
    '.fxmq{overflow:hidden;white-space:nowrap;position:relative;padding-block:18px}',
    '.fxmq .fxrow{display:inline-block;white-space:nowrap;will-change:transform}',
    '.fxmq span{display:inline-block;padding-inline:.35em;font-weight:800;letter-spacing:.05em;-webkit-text-stroke:1.5px var(--fxmq,#c9a227);color:transparent}',
    '.fxmq span.fill{color:var(--fxmq,#c9a227);-webkit-text-stroke:0}',
    '.fxcursor{position:fixed;left:0;top:0;z-index:998;width:340px;height:340px;margin:-170px 0 0 -170px;pointer-events:none;border-radius:50%;background:radial-gradient(circle,var(--fxglow,rgba(217,169,63,.16)),transparent 65%);opacity:0}',
    '.fxchar{display:inline-block;will-change:transform}',
    '.fxw{display:inline-block;white-space:nowrap}'
  ].join('');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function q(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  var AR = /[؀-ۿ]/;

  /* ---------- boot ---------- */
  var boot = [];
  FX.ready = function (fn) {
    if (FX.off) return;
    boot.push(fn);
    if (FX._armed) return; FX._armed = 1;
    var run = function () { boot.forEach(function (f) { f(); }); ScrollTrigger.refresh(); };
    if (document.readyState !== 'loading') run(); else addEventListener('DOMContentLoaded', run);
  };

  FX.lenis = function () {
    if (!FINE || !window.Lenis) return null;
    var l = new Lenis({ lerp: 0.1 });
    l.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { l.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    FX._lenis = l; return l;
  };

  /* ---------- the wow layer ---------- */
  FX.curtain = function (bg, label, color) {      /* branded 1s curtain that splits away */
    var d = document.createElement('div');
    d.className = 'fxcurtain';
    d.innerHTML = '<i style="background:' + bg + '"></i><i style="background:' + bg + '"></i>' +
      '<div class="fxcl" style="color:' + (color || '#fff') + ';font-size:clamp(26px,5vw,54px)"></div>';
    document.body.appendChild(d);
    var lab = d.querySelector('.fxcl');
    var parts = label.split(/\s+/);
    parts.forEach(function (w, i) {
      var wrap = document.createElement('span'); wrap.className = 'fxw'; wrap.style.overflow = 'hidden';
      if (AR.test(w)) { var s = document.createElement('span'); s.className = 'fxchar'; s.textContent = w; wrap.appendChild(s); }
      else w.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'fxchar'; s.textContent = c; wrap.appendChild(s); });
      lab.appendChild(wrap);
      if (i < parts.length - 1) lab.appendChild(document.createTextNode(' '));
    });
    var tl = gsap.timeline();
    tl.from(lab.querySelectorAll('.fxchar'), { yPercent: 120, duration: .55, ease: 'power4.out', stagger: .035 })
      .to(lab, { autoAlpha: 0, y: -20, duration: .3, ease: 'power2.in' }, '+=.25')
      .to(d.children[0], { yPercent: -101, duration: .65, ease: 'power4.inOut' }, '<')
      .to(d.children[1], { yPercent: 101, duration: .65, ease: 'power4.inOut' }, '<')
      .add(function () { d.remove(); });
    return tl;
  };

  FX.chars = function (sel) {                     /* char cascade — Latin chars, Arabic whole words (joining-safe) */
    var targets = [], whole = [];
    q(sel).forEach(function (el) {
      if (el.dataset.fxsplit) return; el.dataset.fxsplit = '1';
      /* background-clip:text won't paint through transformed child spans (Chrome) — animate whole */
      var cs = getComputedStyle(el);
      if ((cs.webkitBackgroundClip || cs.backgroundClip || '').indexOf('text') > -1) { whole.push(el); return; }
      var words = el.textContent.trim().split(/\s+/); el.textContent = '';
      words.forEach(function (w, i) {
        var wrap = document.createElement('span'); wrap.className = 'fxw'; wrap.style.overflow = 'hidden'; wrap.style.verticalAlign = 'top';
        if (AR.test(w)) { var s = document.createElement('span'); s.className = 'fxchar'; s.textContent = w; wrap.appendChild(s); }
        else w.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'fxchar'; s.textContent = c; wrap.appendChild(s); });
        el.appendChild(wrap);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
      targets.push(el);
    });
    return function (delay) {
      targets.forEach(function (el) {
        gsap.fromTo(el.querySelectorAll('.fxchar'),
          { yPercent: 115, rotate: 6, opacity: 0 },
          { yPercent: 0, rotate: 0, opacity: 1, duration: .8, ease: 'power4.out', stagger: .028, delay: delay || 0 });
      });
      whole.forEach(function (el) {
        gsap.fromTo(el, { autoAlpha: 0, y: 40, scale: .96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: 'power4.out', delay: delay || 0 });
      });
    };
  };

  FX.clipReveal = function (sel, dir) {           /* awwwards wipe: clip-path + inner counter-scale */
    q(sel).forEach(function (el, i) {
      var from = dir === 'x' ? 'inset(0 100% 0 0)' : 'inset(100% 0 0 0)';
      gsap.set(el, { clipPath: from, webkitClipPath: from });
      var img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (img) gsap.set(img, { scale: 1.25 });
      ScrollTrigger.create({
        trigger: el, start: 'top 86%', once: true,
        onEnter: function () {
          gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', webkitClipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'power4.inOut', delay: (i % 3) * .08 });
          if (img) gsap.to(img, { scale: 1, duration: 1.4, ease: 'power3.out', delay: (i % 3) * .08 });
        }
      });
    });
  };

  FX.marquee = function (afterSel, text, color, size) {   /* scroll-velocity marquee (ScrollVelocity port) */
    var host = document.querySelector(afterSel); if (!host) return;
    var sec = document.createElement('div'); sec.className = 'fxmq'; sec.dir = 'ltr';
    sec.style.setProperty('--fxmq', color); sec.style.fontSize = size || 'clamp(34px,6vw,84px)';
    var row = document.createElement('div'); row.className = 'fxrow'; sec.appendChild(row);
    var unit = '';
    for (var r = 0; r < 6; r++) text.split('·').forEach(function (t, i) {
      unit += '<span class="' + (i % 2 ? 'fill' : '') + '">' + t.trim() + '</span><span>·</span>';
    });
    row.innerHTML = unit;
    host.parentNode.insertBefore(sec, host.nextSibling);
    var tw = gsap.to(row, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = gsap.utils.clamp(-8, 8, self.getVelocity() / 220);
        gsap.to(tw, { timeScale: 1 + Math.abs(v), duration: .25, overwrite: true });
      }
    });
  };

  FX.pinRow = function (wrapSel, rowSel) {        /* pinned horizontal scene (desktop only) */
    if (!DESK) return;
    var wrap = document.querySelector(wrapSel), row = document.querySelector(rowSel);
    if (!wrap || !row) return;
    var dist = function () { return Math.max(0, row.scrollWidth - wrap.clientWidth); };
    if (dist() < 80) return;
    gsap.to(row, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top 12%', end: function () { return '+=' + (dist() + 200); }, pin: true, scrub: .6, invalidateOnRefresh: true }
    });
  };

  FX.magnetic = function (sel, pull) {            /* buttons lean toward the cursor */
    if (!FINE) return; pull = pull || 22;
    q(sel).forEach(function (el) {
      var sx = gsap.quickTo(el, 'x', { duration: .35, ease: 'power3.out' });
      var sy = gsap.quickTo(el, 'y', { duration: .35, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        sx(((e.clientX - r.left) / r.width - .5) * pull);
        sy(((e.clientY - r.top) / r.height - .5) * pull);
      });
      el.addEventListener('pointerleave', function () { sx(0); sy(0); });
    });
  };

  FX.cursorGlow = function (color) {              /* soft light that follows the pointer */
    if (!FINE) return;
    var d = document.createElement('div'); d.className = 'fxcursor';
    if (color) d.style.setProperty('--fxglow', color);
    document.body.appendChild(d);
    var sx = gsap.quickTo(d, 'x', { duration: .5, ease: 'power3.out' });
    var sy = gsap.quickTo(d, 'y', { duration: .5, ease: 'power3.out' });
    addEventListener('pointermove', function (e) { d.style.opacity = 1; sx(e.clientX); sy(e.clientY); });
  };

  /* ---------- keepers from v1 (fixed timing) ---------- */
  FX.heroIntro = function (steps, opts) {
    opts = opts || {};
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: opts.delay || 0 });
    if (opts.photo) {
      var ph = document.querySelector(opts.photo);
      if (ph) tl.fromTo(ph, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: 'power2.out' }, 0);
    }
    steps.forEach(function (sel, i) {
      var els = q(sel); if (!els.length) return;
      tl.from(els, { autoAlpha: 0, y: 30, duration: .9, stagger: .08 }, (opts.at || .1) + i * .12);
    });
    return tl;
  };
  FX.parallax = function (sel, pct) {
    q(sel).forEach(function (el) {
      gsap.fromTo(el, { yPercent: -pct, scale: 1 + pct / 45 }, {
        yPercent: pct, ease: 'none',
        scrollTrigger: { trigger: el.closest('header,section') || el, start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  };
  FX.countUp = function (sel) {
    q(sel).forEach(function (el) {
      var raw = el.textContent.trim();
      if (!/^[\d.,]+$/.test(raw)) return;
      var dm = raw.match(/^(\d+)([.,])(\d)$/), sep = dm ? dm[2] : null;
      var num = dm ? parseFloat(dm[1] + '.' + dm[3]) : parseInt(raw.replace(/[.,]/g, ''), 10);
      if (isNaN(num)) return;
      var o = { v: 0 };
      gsap.to(o, {
        v: num, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: function () {
          el.textContent = sep ? o.v.toFixed(1).replace('.', sep)
            : Math.round(o.v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        },
        onComplete: function () { el.textContent = raw; }
      });
    });
  };
  FX.shiny = function (sel) { q(sel).forEach(function (el) { el.classList.add('fxshine'); }); };
  FX.spotlight = function (sel, color) {
    if (!FINE) return;
    q(sel).forEach(function (el) {
      el.classList.add('fxspot');
      if (color) el.style.setProperty('--fxspot', color);
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--fxx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--fxy', (e.clientY - r.top) + 'px');
      });
    });
  };
  FX.tilt = function (sel, max) {
    if (!FINE) return; max = max || 5;
    q(sel).forEach(function (el) {
      el.style.transformStyle = 'preserve-3d'; el.style.willChange = 'transform';
      var set = gsap.quickTo(el, 'rotationY', { duration: .5, ease: 'power2.out' });
      var setX = gsap.quickTo(el, 'rotationX', { duration: .5, ease: 'power2.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        set(((e.clientX - r.left) / r.width - .5) * 2 * max);
        setX(-((e.clientY - r.top) / r.height - .5) * 2 * max);
      });
      el.addEventListener('pointerleave', function () { set(0); setX(0); });
    });
  };
  FX.grain = function (op) {
    var d = document.createElement('div');
    d.className = 'fxgrain'; d.style.opacity = op || .05;
    d.style.animation = 'fxgrain .9s steps(4) infinite';
    document.body.appendChild(d);
  };
  FX.batch = function (sel, y) {
    var els = q(sel); if (!els.length) return;
    ScrollTrigger.batch(els, {
      start: 'top 88%', once: true,
      onEnter: function (b) { gsap.from(b, { autoAlpha: 0, y: y || 34, duration: .8, ease: 'power3.out', stagger: .1 }); }
    });
  };
})();
