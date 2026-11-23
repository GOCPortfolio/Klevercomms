/* Klevercomms site behaviour. Plain JavaScript, no libraries. Every effect is an enhancement: the pages work without it,
   and every animation is switched off for visitors who prefer reduced motion. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rm = matchMedia('(prefers-reduced-motion:reduce)').matches, fine = matchMedia('(hover:hover) and (pointer:fine)').matches, body = document.body;

  /* ---------- mobile menu ---------- */
  const mb = $('.mb'), nav = $('#nav');
  const closeMenu = () => { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.textContent = '☰'; };
  if (mb && nav) {
    mb.addEventListener('click', () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.textContent = o ? '✕' : '☰'; });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); mb.focus(); } });
    nav.addEventListener('click', (e) => e.target.closest('a') && closeMenu());
  }

  /* ---------- scroll reveal ---------- */
  const reveal = () => {
    const els = $$('.rv:not(.in)');
    if (rm || !('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--d', i * 90 + 'ms')));
    els.forEach((e) => io.observe(e));
  };

  /* ---------- flip cards: "Quick view" / "Back" buttons (touch + keyboard); a mouse can also just hover the .hv ones ---------- */
  $$('.flip').forEach((f) => {
    const front = $('.front', f), back = $('.back', f), open = $('[data-flip]', front);
    const set = (on) => { f.classList.toggle('is-flipped', on); front.inert = on; back.inert = !on; front.setAttribute('aria-hidden', on); back.setAttribute('aria-hidden', !on); open?.setAttribute('aria-expanded', on); (on ? $('[data-flip]', back) : open)?.focus({ preventScroll: true }); };
    $$('[data-flip]', f).forEach((b) => b.addEventListener('click', () => set(!f.classList.contains('is-flipped'))));
  });

  /* ---------- pointer effects: card tilt, glow that follows the mouse, magnetic buttons ---------- */
  if (fine) {
    $$('.tilt,.glow').forEach((el) => {
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%'); if (!rm && el.classList.contains('tilt')) { el.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg'); el.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg'); } });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
    if (!rm) $$('.mag').forEach((el) => {
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.15).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1)}px)`; });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }

  /* ---------- number counters (the real number is in the HTML; this only animates it) ---------- */
  $$('[data-count]').forEach((el) => {
    const to = +el.dataset.count, sfx = el.dataset.sfx || ''; if (rm || !('IntersectionObserver' in window)) return;
    el.textContent = '0' + sfx;
    const o = new IntersectionObserver(([x]) => { if (!x.isIntersecting) return; o.disconnect(); const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-NG') + sfx; if (k < 1) requestAnimationFrame(f); })(t0); });
    o.observe(el);
  });

  /* ---------- scroll: progress bar, solid header, parallax, process line ---------- */
  const hd = $('header.hd'), steps = $('.steps'), par = $$('[data-par]'); let tick = false;
  const onScroll = () => { if (tick) return; tick = true; requestAnimationFrame(() => { tick = false;
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--sp', h > 0 ? (y / h).toFixed(4) : 0); hd?.classList.toggle('sc', y > 20);
    if (!rm) par.forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; el.style.setProperty('--py', ((r.top + r.height / 2 - innerHeight / 2) * +el.dataset.par).toFixed(1) + 'px'); });
    if (steps) { const r = steps.getBoundingClientRect(), p = Math.max(0, Math.min(1, (innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.25))); steps.style.setProperty('--p', p.toFixed(3)); [...steps.children].forEach((c, i) => c.classList.toggle('on', p >= i / steps.children.length + 0.02)); }
  }); };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  /* ---------- hero carousel. Slide 1 is in the HTML; slides 2-3 load their images after page load so they never compete with the first image ---------- */
  const hero = $('.hero');
  if (hero) {
    const S = $$('.sl', hero), D = $$('.dot', hero), pp = $('.pp', hero); let k = 0, timer, paused = rm, hov = false;
    const loadSlide = (j) => { const im = S[j % S.length] && $('img[data-src]', S[j % S.length]); if (im) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); } };
    const show = (i) => { k = i; loadSlide(i); loadSlide(i + 1); S.forEach((s, j) => { s.classList.toggle('on', j === i); s.setAttribute('aria-hidden', j !== i); s.inert = j !== i; }); D.forEach((d, j) => d.setAttribute('aria-current', j === i)); };
    const load = () => loadSlide(1); /* only the next slide is fetched ahead; each later slide loads one step before it is shown */
    (document.readyState === 'complete' ? load : () => addEventListener('load', () => setTimeout(load, 200)))();
    const label = () => { hero.classList.toggle('paused', paused); if (pp) { pp.textContent = paused ? 'Play' : 'Pause'; pp.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow'); } };
    const start = () => { clearInterval(timer); if (!paused && S.length > 1) timer = setInterval(() => { if (!hov && !document.hidden) show((k + 1) % S.length); }, 8000); };
    D.forEach((d, i) => d.addEventListener('click', () => { show(i); start(); }));
    pp?.addEventListener('click', () => { paused = !paused; label(); start(); });
    hero.addEventListener('mouseenter', () => (hov = true)); hero.addEventListener('mouseleave', () => (hov = false));
    hero.addEventListener('focusin', () => (hov = true)); hero.addEventListener('focusout', () => (hov = false));
    let x0; hero.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    hero.addEventListener('touchend', (e) => { const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) { show((k + (d < 0 ? 1 : S.length - 1)) % S.length); start(); } });
    show(0); label(); start();
  }

  /* ---------- course catalogue: search, filter, sort (the cards are server-rendered, so this is an enhancement) ---------- */
  const cg = $('#cg');
  if (cg) {
    const q = $('#q'), md = $('#md'), so = $('#so'), cnt = $('#cnt'), cards = [...cg.children], chips = $$('.chips a'), emp = $('#none'); let cat = '';
    const run = () => { const t = q.value.trim().toLowerCase(); let n = 0;
      cards.forEach((c) => { const ok = (!cat || c.dataset.cat === cat) && (!md.value || c.dataset.modes.includes(md.value)) && (!t || c.dataset.text.includes(t)); c.hidden = !ok; if (ok) n++; });
      const key = so.value;
      cards.slice().sort((a, b) => key === 'lo' ? (+a.dataset.price || 1e12) - (+b.dataset.price || 1e12) : key === 'hi' ? (+b.dataset.price || -1) - (+a.dataset.price || -1) : a.dataset.name.localeCompare(b.dataset.name)).forEach((c) => cg.append(c));
      cnt.textContent = n + (n === 1 ? ' course found' : ' courses found'); emp.hidden = n > 0; };
    q.addEventListener('input', run); md.addEventListener('change', run); so.addEventListener('change', run);
    chips.forEach((a) => a.addEventListener('click', (e) => { if (!a.dataset.f) return; e.preventDefault(); cat = a.dataset.f === 'all' ? '' : a.dataset.f; chips.forEach((x) => x.toggleAttribute('aria-current', x === a)); run(); }));
    $('#clr')?.addEventListener('click', () => { q.value = ''; md.value = ''; so.value = 'az'; cat = ''; chips.forEach((x) => x.toggleAttribute('aria-current', x.dataset.f === 'all')); run(); });
    run();
  }

  /* ---------- forms hand over to WhatsApp (no backend on the static site) ---------- */
  $$('form[data-wa]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); const b = $('button', f); b.setAttribute('aria-busy', 'true'); const d = new FormData(f), t = f.dataset.title + '\n' + [...d].map(([k, v]) => k + ': ' + (v || '-')).join('\n'); open('https://wa.me/' + f.dataset.wa + '?text=' + encodeURIComponent(t), '_blank', 'noopener'); setTimeout(() => b.removeAttribute('aria-busy'), 1200); }));

  /* ---------- page transition: a short fade between pages (skipped for new tabs, modifier keys and reduced motion) ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.target || a.hasAttribute('download') || rm) return;
    let u; try { u = new URL(a.href, location.href); } catch { return; }
    if (u.origin !== location.origin && u.protocol !== 'file:') return;
    if (u.pathname === location.pathname && u.search === location.search) return; if (!/\.html?$|\/$/.test(u.pathname)) return;
    e.preventDefault(); body.classList.add('leaving'); setTimeout(() => (location.href = u.href), 190);
  });
  addEventListener('pageshow', (e) => e.persisted && body.classList.remove('leaving'));

  reveal();
})();
