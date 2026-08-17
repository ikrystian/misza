/* =========================================================
   MISZA — strona główna: slider hero, poziomy showcase,
   usługi z podglądem, liczniki
   ========================================================= */
(() => {
  'use strict';

  if (typeof gsap === 'undefined') return;
  const { splitLines, reduced, isTouch } = window.MISZA;

  /* =========================================================
     HERO SLIDER
     ========================================================= */
  const slides = [...document.querySelectorAll('[data-slide]')];
  let index = 0, animating = false, autoplay = null;

  const numEl = document.getElementById('slideNum');
  const totalEl = document.getElementById('slideTotal');
  const dotsWrap = document.getElementById('heroDots');
  const progress = document.getElementById('heroProgress');
  const pad = (n) => String(n + 1).padStart(2, '0');

  // przygotowanie: tekst w maskach, obrazy powiększone
  const copyLines = slides.map((s) => {
    const parts = [];
    s.querySelectorAll('[data-split]').forEach((el) => parts.push(...splitLines(el)));
    const btn = s.querySelector('.btn-line');
    gsap.set(parts, { yPercent: 110 });
    gsap.set(btn, { opacity: 0, y: 24 });
    return { parts, btn };
  });

  if (slides.length) {
    totalEl.textContent = pad(slides.length - 1);
    gsap.set(slides.map((s) => s.querySelector('.slide__media img')), { scale: 1.18 });

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `Slajd ${i + 1}`);
      dot.addEventListener('click', () => goTo(i, i > index ? 1 : -1));
      dotsWrap.appendChild(dot);
    });
  }

  function animateCopy(i, dir) {
    const { parts, btn } = copyLines[i];
    return gsap.timeline()
      .to(parts, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.08 }, 0)
      .to(btn, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.35);
  }

  function hideCopy(i) {
    const { parts, btn } = copyLines[i];
    return gsap.timeline()
      .to(parts, { yPercent: -110, duration: 0.7, ease: 'power3.in', stagger: 0.04 }, 0)
      .to(btn, { opacity: 0, y: -16, duration: 0.4, ease: 'power2.in' }, 0);
  }

  function goTo(next, dir = 1) {
    if (animating || next === index || !slides.length) return;
    animating = true;
    stopAutoplay();

    const from = slides[index];
    const to = slides[next];
    const fromImg = from.querySelector('.slide__media img');
    const toImg = to.querySelector('.slide__media img');
    const toMedia = to.querySelector('.slide__media');

    to.classList.add('is-active');
    gsap.set(toMedia, { clipPath: dir > 0 ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)' });
    gsap.set(toImg, { scale: 1.25 });

    const tl = gsap.timeline({
      onComplete: () => {
        from.classList.remove('is-active');
        index = next;
        animating = false;
        startAutoplay();
      }
    });

    tl.add(hideCopy(index), 0)
      .to(toMedia, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' }, 0.15)
      .to(toImg, { scale: 1, duration: 1.9, ease: 'expo.out' }, 0.15)
      .to(fromImg, { scale: 1.12, duration: 1.4, ease: 'power2.inOut' }, 0.15)
      .add(animateCopy(next, dir), 0.75)
      .call(() => {
        numEl.textContent = pad(next);
        [...dotsWrap.children].forEach((d, i) => d.classList.toggle('is-active', i === next));
      }, null, 0.3);

    // licznik przeskakuje z lekkim „glitchem"
    gsap.fromTo(numEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, delay: 0.3 });
  }

  const nextSlide = () => goTo((index + 1) % slides.length, 1);
  const prevSlide = () => goTo((index - 1 + slides.length) % slides.length, -1);

  document.querySelectorAll('.hero__arrow').forEach((btn) => {
    btn.addEventListener('click', () => (+btn.dataset.dir > 0 ? nextSlide() : prevSlide()));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  });

  // swipe na dotyku
  if (isTouch && slides.length) {
    let startX = null;
    const hero = document.getElementById('hero');
    hero.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 60) (dx < 0 ? nextSlide() : prevSlide());
      startX = null;
    }, { passive: true });
  }

  function startAutoplay() {
    if (reduced || slides.length < 2) return;
    gsap.set(progress, { width: '0%' });
    autoplay = gsap.to(progress, {
      width: '100%',
      duration: 6,
      ease: 'none',
      onComplete: nextSlide
    });
  }
  function stopAutoplay() {
    autoplay?.kill();
    gsap.set(progress, { width: '0%' });
  }

  // pauza autoplay, gdy hero jest poza ekranem
  if (slides.length) {
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top bottom',
      end: 'bottom top',
      onLeave: stopAutoplay,
      onLeaveBack: stopAutoplay,
      onEnterBack: startAutoplay
    });
  }

  /* intro hero po preloaderze */
  window.addEventListener('misza:ready', () => {
    if (!slides.length) return;
    const first = slides[0];
    gsap.timeline()
      .from(first.querySelector('.slide__media'), {
        clipPath: 'inset(18% 22% 18% 22%)',
        duration: 1.6,
        ease: 'expo.inOut'
      }, 0)
      .to(first.querySelector('.slide__media img'), { scale: 1, duration: 2.2, ease: 'expo.out' }, 0)
      .add(animateCopy(0, 1), 0.55)
      .from('.header > *', { y: -30, opacity: 0, duration: 1, stagger: 0.1 }, 0.3)
      .from(['.hero__side', '.hero__nav', '.hero__dots', '.hero__scroll'], {
        opacity: 0, duration: 1, stagger: 0.08
      }, 0.8)
      .call(startAutoplay);
  });

  /* =========================================================
     POZIOMY SHOWCASE — pinowana sekcja
     ========================================================= */
  const track = document.getElementById('showcaseTrack');
  const showcase = document.getElementById('showcase');

  if (track && showcase) {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 901px)', () => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const scrollTween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: showcase,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      // karty wjeżdżają, gdy wchodzą w kadr poziomego przewijania
      const items = gsap.utils.toArray('.show-item');
      items.forEach((item) => {
        gsap.from(item, {
          y: 90,
          opacity: 0,
          duration: 1,
          scrollTrigger: {
            trigger: item,
            containerAnimation: scrollTween,
            start: 'left 96%'
          }
        });
      });

      return () => gsap.set(track, { clearProps: 'x' });
    });
  }

  /* =========================================================
     POZIOMY SHOWCASE — robin-dela hover effect
     ========================================================= */
  function initShowcaseHover() {
    if (typeof hoverEffect === 'undefined' || typeof THREE === 'undefined') return;

    const mediaElements = document.querySelectorAll('.show-item__media.has-hover-effect');
    mediaElements.forEach((el) => {
      const img1 = el.dataset.img1;
      const img2 = el.dataset.img2;
      if (!img1 || !img2) return;

      try {
        new hoverEffect({
          parent: el,
          intensity: 0.3,
          speedIn: 1.2,
          speedOut: 1.0,
          easing: 'expo.out',
          image1: img1,
          image2: img2,
          displacementImage: '/public/images/displacement.png',
          onLoaded: () => {
            el.classList.add('is-loaded');
          }
        });
      } catch (err) {
        console.warn('Could not initialize hoverEffect on', el, err);
      }
    });
  }

  initShowcaseHover();

  /* =========================================================
     USŁUGI — podgląd zdjęcia przy kursorze
     ========================================================= */
  const preview = document.getElementById('svcPreview');
  const rows = [...document.querySelectorAll('.svc__row')];

  if (preview && rows.length && !isTouch && !reduced) {
    const img = preview.querySelector('img');
    const px = gsap.quickTo(preview, 'x', { duration: 0.65, ease: 'power3' });
    const py = gsap.quickTo(preview, 'y', { duration: 0.65, ease: 'power3' });
    let visible = false;

    // wstępne wczytanie miniatur, żeby podmiana była natychmiastowa
    rows.forEach((r) => { new Image().src = r.dataset.img; });

    const move = (e) => {
      px(e.clientX - preview.offsetWidth / 2);
      py(e.clientY - preview.offsetHeight / 2);
    };

    rows.forEach((row) => {
      row.addEventListener('mouseenter', (e) => {
        img.src = row.dataset.img;
        move(e);
        if (!visible) {
          visible = true;
          gsap.fromTo(preview,
            { opacity: 0, scale: 0.86, rotate: -4 },
            { opacity: 1, scale: 1, rotate: 0, duration: 0.55, ease: 'expo.out' });
        }
      });
      row.addEventListener('mousemove', move);
      row.addEventListener('mouseleave', () => {
        visible = false;
        gsap.to(preview, { opacity: 0, scale: 0.9, duration: 0.35 });
      });
    });
  }

  /* =========================================================
     FORMULARZ KONTAKTOWY — wysyłka przez mailto
     ========================================================= */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const subject = contactForm.subject.value.trim() || `Wiadomość od ${name}`;
      const message = contactForm.message.value.trim();
      const body = `${message}\n\n— ${name}${email ? ` (${email})` : ''}`;
      window.location.href = `mailto:${contactForm.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* =========================================================
     LICZNIKI
     ========================================================= */
  document.querySelectorAll('.about__list b').forEach((el) => {
    const raw = el.textContent.trim();
    const target = parseFloat(raw);
    if (Number.isNaN(target)) return;
    const suffix = raw.replace(/[\d.,\s]/g, '');
    const obj = { v: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; }
        });
      }
    });
  });
})();
