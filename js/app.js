/* =========================================================
   MISZA — warstwa wspólna: preloader, kursor, header,
   smooth scroll, split text, reveal na scrollu
   ========================================================= */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // awaryjnie: bez GSAP (np. zablokowane CDN) strona ma działać jako statyczna,
  // inaczej preloader zostałby na ekranie na zawsze
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    window.MISZA = { splitLines: () => [], reduced, isTouch, lenis: null, scrollTo: (t) => t.scrollIntoView() };
    document.getElementById('preloader')?.remove();
    document.body.classList.remove('is-loading');
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
    document.getElementById('burger')?.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  /* ---------------------------------------------------------
     Smooth scroll (Lenis) spięty ze ScrollTriggerem
     --------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -80 });
    else target.scrollIntoView({ behavior: 'smooth' });
  };

  /* ---------------------------------------------------------
     Split text — dzieli nagłówek na linie w maskach
     --------------------------------------------------------- */
  function splitLines(el) {
    if (!el || el.dataset.splitDone) return el ? [...el.querySelectorAll('.line > span')] : [];

    const words = [];
    (function walk(node) {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          if (!child.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.style.display = 'inline-block';
            w.textContent = part;
            words.push(w);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(el);

    if (!words.length) return [];

    // grupowanie słów w linie po pozycji pionowej
    const rows = [];
    let current = null, lastTop = null;
    words.forEach((w) => {
      const top = Math.round(w.getBoundingClientRect().top);
      if (lastTop === null || Math.abs(top - lastTop) > 4) {
        lastTop = top;
        current = [];
        rows.push(current);
      }
      current.push(w);
    });

    // <br> zastąpione strukturą linii — usuwamy, żeby nie dublować odstępów
    el.querySelectorAll('br').forEach((br) => br.remove());

    const inners = [];
    rows.forEach((row) => {
      const mask = document.createElement('span');
      mask.className = 'line';
      const inner = document.createElement('span');
      mask.appendChild(inner);
      row[0].parentNode.insertBefore(mask, row[0]);

      const last = row[row.length - 1];
      let node = row[0];
      while (node) {
        const next = node.nextSibling;
        inner.appendChild(node);
        if (node === last) break;
        node = next;
      }
      inners.push(inner);
    });

    el.dataset.splitDone = '1';
    return inners;
  }

  /* ---------------------------------------------------------
     Preloader
     --------------------------------------------------------- */
  function runPreloader() {
    const pre = document.getElementById('preloader');
    if (!pre) { document.body.classList.remove('is-loading'); return Promise.resolve(); }

    const countEl = document.getElementById('preCount');
    const bar = pre.querySelector('.preloader__bar span');
    const brand = pre.querySelector('.preloader__brand');
    const counter = { v: 0 };

    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.classList.remove('is-loading');
          pre.remove();
          ScrollTrigger.refresh();
          resolve();
        }
      });

      tl.from(brand, { yPercent: 110, duration: 1, ease: 'expo.out' })
        .to(counter, {
          v: 100,
          duration: reduced ? 0.2 : 1.9,
          ease: 'power2.inOut',
          onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(2, '0'); }
        }, 0.15)
        .to(bar, { width: '100%', duration: reduced ? 0.2 : 1.9, ease: 'power2.inOut' }, 0.15)
        .to([brand, bar.parentNode, countEl.parentNode], {
          opacity: 0, duration: 0.5, ease: 'power2.in'
        }, '-=0.15')
        .to(pre, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 1.1,
          ease: 'expo.inOut'
        }, '-=0.2');
    });
  }

  /* ---------------------------------------------------------
     Kursor
     --------------------------------------------------------- */
  function initCursor() {
    const cur = document.getElementById('cursor');
    if (!cur || isTouch || reduced) return;

    const label = cur.querySelector('.cursor__label');
    const x = gsap.quickTo(cur, 'x', { duration: 0.4, ease: 'power3' });
    const y = gsap.quickTo(cur, 'y', { duration: 0.4, ease: 'power3' });

    window.addEventListener('mousemove', (e) => {
      x(e.clientX - cur.offsetWidth / 2);
      y(e.clientY - cur.offsetHeight / 2);
      if (!cur._shown) { cur._shown = true; gsap.to(cur, { opacity: 1, duration: 0.3 }); }
    });

    document.addEventListener('mouseleave', () => gsap.to(cur, { opacity: 0, duration: 0.3 }));

    const grow = (text) => {
      cur.classList.add('is-hover');
      gsap.to(cur, { width: text ? 92 : 46, height: text ? 92 : 46, duration: 0.45 });
      if (text) {
        label.textContent = text;
        gsap.to(label, { opacity: 1, scale: 1, duration: 0.35 });
      }
    };
    const shrink = () => {
      cur.classList.remove('is-hover');
      gsap.to(cur, { width: 10, height: 10, duration: 0.45 });
      gsap.to(label, { opacity: 0, scale: 0.5, duration: 0.25 });
    };

    const bind = () => {
      document.querySelectorAll('[data-cursor]').forEach((el) => {
        if (el._curBound) return;
        el._curBound = true;
        el.addEventListener('mouseenter', () => grow(el.dataset.cursor));
        el.addEventListener('mouseleave', shrink);
      });
      document.querySelectorAll('a:not([data-cursor]), button, input, .svc__row').forEach((el) => {
        if (el._curBound) return;
        el._curBound = true;
        el.addEventListener('mouseenter', () => grow(''));
        el.addEventListener('mouseleave', shrink);
      });
    };
    bind();
    window.MISZA.bindCursor = bind;
  }

  /* ---------------------------------------------------------
     Header — chowanie przy scrollu w dół + menu mobilne
     --------------------------------------------------------- */
  function initHeader() {
    const header = document.getElementById('header');
    let last = 0;

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        header.classList.toggle('is-stuck', y > 60);
        header.classList.toggle('is-hidden', y > last && y > 400 && !document.body.classList.contains('menu-open'));
        last = y;
      }
    });

    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    burger?.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      if (lenis) open ? lenis.stop() : lenis.start();
      if (open) {
        gsap.fromTo(nav.querySelectorAll('a'),
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, delay: 0.25 });
      }
    });

    // kotwice — płynne przewijanie
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        if (document.body.classList.contains('menu-open')) {
          document.body.classList.remove('menu-open');
          lenis?.start();
        }
        scrollTo(target);
      });
    });
  }

  /* ---------------------------------------------------------
     Magnetyczne przyciski
     --------------------------------------------------------- */
  function initMagnetic() {
    if (isTouch || reduced) return;
    document.querySelectorAll('.magnetic').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.35);
        y((e.clientY - r.top - r.height / 2) * 0.45);
      });
      el.addEventListener('mouseleave', () => { x(0); y(0); });
    });
  }

  /* ---------------------------------------------------------
     Marquee
     --------------------------------------------------------- */
  function initMarquee() {
    document.querySelectorAll('[data-marquee]').forEach((track) => {
      const tween = gsap.to(track, {
        xPercent: -50,
        duration: 28,
        ease: 'none',
        repeat: -1
      });
      // przyspieszenie zależne od kierunku scrolla
      ScrollTrigger.create({
        trigger: track,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          gsap.to(tween, { timeScale: self.direction === -1 ? -1.6 : 1.6, overwrite: true, duration: 0.4 });
          clearTimeout(track._t);
          track._t = setTimeout(() => gsap.to(tween, { timeScale: 1, duration: 0.6 }), 180);
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Reveal na scrollu
     --------------------------------------------------------- */
  function initReveals(scope = document) {
    // nagłówki dzielone na linie (pomijamy hero — animuje je slider)
    scope.querySelectorAll('[data-split]').forEach((el) => {
      if (el.closest('.hero')) return;
      const lines = splitLines(el);
      if (!lines.length) return;
      gsap.set(lines, { yPercent: 110 });
      gsap.to(lines, {
        yPercent: 0,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    scope.querySelectorAll('[data-anim="fade"]').forEach((el) => {
      gsap.from(el, {
        y: 34, opacity: 0, duration: 1,
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    scope.querySelectorAll('[data-anim="stagger"]').forEach((el) => {
      gsap.from(el.children, {
        y: 40, opacity: 0, duration: 1, stagger: 0.12,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // obrazy odsłaniane maską + delikatny zoom-out
    scope.querySelectorAll('.reveal-img').forEach((fig) => {
      const img = fig.querySelector('img');
      gsap.set(fig, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%' } })
        .to(fig, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' })
        .from(img, { scale: 1.35, duration: 1.6, ease: 'expo.out' }, 0);
    });

    // parallax
    if (!reduced) {
      scope.querySelectorAll('[data-parallax]').forEach((el) => {
        gsap.to(el, {
          y: parseFloat(el.dataset.parallax),
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }

    // tło CTA — powolny parallax
    const ctaBg = scope.querySelector?.('.cta__bg img');
    if (ctaBg && !reduced) {
      gsap.fromTo(ctaBg, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */
  window.MISZA = { splitLines, reduced, isTouch, get lenis() { return lenis; }, scrollTo };

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initCursor();
  initHeader();
  initMagnetic();
  initMarquee();
  initReveals();

  window.addEventListener('load', () => ScrollTrigger.refresh());

  runPreloader().then(() => {
    window.dispatchEvent(new CustomEvent('misza:ready'));
  });
})();
