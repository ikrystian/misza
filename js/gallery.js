/* =========================================================
   MISZA — galeria: filtry (Flip), wejście kafli,
   tilt 3D, lightbox
   ========================================================= */
(() => {
  'use strict';

  if (typeof gsap === 'undefined') return;
  const { reduced, isTouch } = window.MISZA;

  const hasFlip = typeof Flip !== 'undefined';
  if (hasFlip) gsap.registerPlugin(Flip);

  const grid = document.getElementById('grid');
  const cards = [...document.querySelectorAll('.card')];
  const empty = document.getElementById('gridEmpty');
  if (!grid || !cards.length) return;

  /* =========================================================
     MASONRY — kafle zachowują oryginalne proporcje zdjęć,
     a wysokość wiersza wynika z liczby 8-pikselowych rzędów
     ========================================================= */
  const ROW = 1; // rząd 1px => pionowe odstępy równe kolumnowym co do piksela

  function layoutMasonry() {
    grid.classList.add('is-masonry');
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    // najpierw wszystkie odczyty wysokości, potem wszystkie zapisy —
    // przeplatanie read/write w jednej pętli wymuszałoby synchroniczny
    // reflow przy każdym kaflu (layout thrashing) i to właśnie zawieszało
    // przełączanie kategorii przy większej liczbie kafli
    const heights = cards.map((card) => (
      card.classList.contains('is-hidden') ? null : card.getBoundingClientRect().height
    ));
    cards.forEach((card, i) => {
      if (heights[i] === null) return;
      card.style.gridRowEnd = `span ${Math.max(1, Math.ceil((heights[i] + gap) / ROW))}`;
    });
  }

  layoutMasonry();

  // ResizeObserver łapie każdą zmianę wysokości kafla — dociągnięty font w podpisie,
  // zawinięty tytuł, zmianę szerokości kolumny — więc spany nigdy nie są nieaktualne
  if (window.ResizeObserver) {
    let queued = false;
    const ro = new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; layoutMasonry(); ScrollTrigger.refresh(); });
    });
    cards.forEach((card) => ro.observe(card));
  } else {
    document.fonts?.ready.then(layoutMasonry);
    window.addEventListener('load', () => { layoutMasonry(); ScrollTrigger.refresh(); });
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { layoutMasonry(); ScrollTrigger.refresh(); }, 150);
    });
  }

  /* =========================================================
     WEJŚCIE KAFLI
     ========================================================= */
  cards.forEach((card) => {
    const media = card.querySelector('.card__media');
    const img = media.querySelector('img');
    const cap = card.querySelector('figcaption');

    gsap.set(media, { clipPath: 'inset(0% 0% 100% 0%)' });
    // transition:transform z CSS (hover) walczy z GSAP o klatki podczas wejścia —
    // bez wyłączenia jej tutaj obrazek zostaje wizualnie zablokowany w powiększeniu 1.4x
    gsap.set(img, { transition: 'none' });

    gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 90%' } })
      .to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out' })
      .from(img, {
        scale: 1.4,
        duration: 1.5,
        ease: 'expo.out',
        onComplete: () => gsap.set(img, { clearProps: 'transition' }),
      }, 0)
      .from(cap, { y: 26, opacity: 0, duration: 0.8 }, 0.35);
  });

  /* =========================================================
     TILT 3D
     ========================================================= */
  if (!isTouch && !reduced) {
    cards.forEach((card) => {
      const media = card.querySelector('.card__media');
      const rx = gsap.quickTo(media, 'rotationX', { duration: 0.7, ease: 'power3' });
      const ry = gsap.quickTo(media, 'rotationY', { duration: 0.7, ease: 'power3' });

      media.addEventListener('mousemove', (e) => {
        const r = media.getBoundingClientRect();
        rx(-((e.clientY - r.top) / r.height - 0.5) * 9);
        ry(((e.clientX - r.left) / r.width - 0.5) * 11);
      });
      media.addEventListener('mouseleave', () => { rx(0); ry(0); });
    });
  }

  /* =========================================================
     FILTRY — animowany układ przez Flip
     ========================================================= */
  const filters = [...document.querySelectorAll('.filter')];
  const URL_PARAM = 'kategoria';

  function setFilterUrl(cat) {
    const url = new URL(location.href);
    if (cat === 'all') url.searchParams.delete(URL_PARAM);
    else url.searchParams.set(URL_PARAM, cat);
    history.pushState({ cat }, '', url);
  }

  function applyFilter(cat, { animate = true, updateUrl = true } = {}) {
    filters.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === cat));
    if (updateUrl) setFilterUrl(cat);

    const state = animate && hasFlip ? Flip.getState(cards, { props: 'opacity' }) : null;

    let shown = 0;
    cards.forEach((card) => {
      const match = cat === 'all' || card.dataset.cat === cat;
      card.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    empty.classList.toggle('is-shown', shown === 0);

    if (!state) { layoutMasonry(); ScrollTrigger.refresh(); return; }

    Flip.from(state, {
      duration: 0.75,
      ease: 'power2.inOut',
      scale: true,
      absolute: true,
      stagger: 0.025,
      onEnter: (els) => gsap.fromTo(els,
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.04 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.35 }),
      onComplete: () => { layoutMasonry(); ScrollTrigger.refresh(); }
    });
  }

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      applyFilter(btn.dataset.filter);
    });
  });

  window.addEventListener('popstate', () => {
    const cat = new URLSearchParams(location.search).get(URL_PARAM) || 'all';
    applyFilter(cat, { updateUrl: false });
  });

  // kategoria z adresu URL przy wejściu na stronę (np. link z social mediów)
  const initialCat = new URLSearchParams(location.search).get(URL_PARAM);
  if (initialCat && filters.some((b) => b.dataset.filter === initialCat)) {
    applyFilter(initialCat, { animate: false, updateUrl: false });
  }

  /* =========================================================
     LIGHTBOX
     ========================================================= */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbTitle = document.getElementById('lbTitle');
  const lbMeta = document.getElementById('lbMeta');
  const lbNum = document.getElementById('lbNum');
  const lbTotal = document.getElementById('lbTotal');
  const pad = (n) => String(n + 1).padStart(2, '0');

  let current = 0;
  let pool = cards;

  const visibleCards = () => cards.filter((c) => !c.classList.contains('is-hidden'));

  function fill(i) {
    const card = pool[i];
    const link = card.querySelector('.card__media');
    const thumb = card.querySelector('img');

    lbImg.src = thumb.currentSrc || thumb.src;
    lbImg.alt = thumb.alt;
    lbTitle.textContent = card.querySelector('h3').textContent;
    lbMeta.textContent = card.querySelector('figcaption span').textContent;
    lbNum.textContent = pad(i);
    lbTotal.textContent = pad(pool.length - 1);

    // wersja w pełnej rozdzielczości doładowuje się w tle
    const hi = new Image();
    hi.onload = () => { if (current === i && lb.classList.contains('is-open')) lbImg.src = hi.src; };
    hi.src = link.getAttribute('href');

    return thumb;
  }

  function open(i) {
    pool = visibleCards();
    current = Math.max(0, pool.indexOf(cards[i]));

    const thumb = fill(current);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    window.MISZA.lenis?.stop();

    gsap.set(lb, { opacity: 1 });
    gsap.from(lb, { opacity: 0, duration: 0.45, ease: 'power2.out' });
    gsap.from(['.lightbox__close', '.lightbox__arrow', '.lightbox__count'], {
      opacity: 0, duration: 0.5, delay: 0.25, stagger: 0.05
    });
    gsap.from(lbImg.nextElementSibling, { y: 24, opacity: 0, duration: 0.7, delay: 0.35 });

    // przejście z miniatury do pełnego kadru
    const run = () => {
      const tr = thumb.getBoundingClientRect();
      const ir = lbImg.getBoundingClientRect();
      if (!ir.width || !ir.height) return;
      const scale = Math.max(tr.width / ir.width, tr.height / ir.height);
      gsap.from(lbImg, {
        x: (tr.left + tr.width / 2) - (ir.left + ir.width / 2),
        y: (tr.top + tr.height / 2) - (ir.top + ir.height / 2),
        scale,
        duration: 0.95,
        ease: 'expo.inOut'
      });
    };
    lbImg.complete ? run() : lbImg.addEventListener('load', run, { once: true });
  }

  function close() {
    gsap.to(lb, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        window.MISZA.lenis?.start();
      }
    });
    gsap.to(lbImg, { scale: 0.94, duration: 0.45, ease: 'power2.in', clearProps: 'transform' });
  }

  function step(dir) {
    if (pool.length < 2) return;
    current = (current + dir + pool.length) % pool.length;
    gsap.timeline()
      .to([lbImg, lbImg.nextElementSibling], {
        opacity: 0, x: -40 * dir, duration: 0.35, ease: 'power2.in'
      })
      .call(() => fill(current))
      .fromTo([lbImg, lbImg.nextElementSibling],
        { opacity: 0, x: 40 * dir },
        { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05 });
  }

  cards.forEach((card, i) => {
    card.querySelector('.card__media').addEventListener('click', (e) => {
      e.preventDefault();
      open(i);
    });
  });

  document.getElementById('lbClose').addEventListener('click', close);
  document.querySelectorAll('[data-lb]').forEach((b) => {
    b.addEventListener('click', () => step(+b.dataset.lb));
  });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

  window.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  // swipe w lightboxie
  let sx = null;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
    sx = null;
  }, { passive: true });
})();
