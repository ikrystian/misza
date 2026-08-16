/* =========================================================
   MISZA — widok pojedynczego wpisu (post.html?slug=...)
   Dane wspólne z listą aktualności — js/news-data.js
   ========================================================= */
(() => {
  'use strict';

  const posts = window.MISZA_NEWS || [];
  const slug = new URLSearchParams(location.search).get('slug');
  const index = posts.findIndex((p) => p.slug === slug);
  const post = posts[index];

  const notFound = document.getElementById('postNotFound');
  const content = document.getElementById('postContent');

  if (!post) {
    content?.remove();
    document.getElementById('contact')?.remove();
    notFound?.classList.add('is-shown');
    document.title = 'Nie znaleziono wpisu — MISZA';
    return;
  }

  /* ---------- meta strony ---------- */
  document.title = `${post.title} — MISZA`;
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', post.excerpt);

  /* ---------- nagłówek ---------- */
  document.getElementById('postCat').textContent = post.category;
  document.getElementById('postDate').textContent = post.dateLabel;
  document.getElementById('postRead').textContent = `${post.readTime} czytania`;
  document.getElementById('postTitle').textContent = post.title;
  document.getElementById('postExcerpt').textContent = post.excerpt;

  const img = document.getElementById('postImage');
  img.src = post.image;
  img.alt = post.imageAlt;

  /* ---------- treść ---------- */
  const body = document.getElementById('postBody');
  post.content.forEach((block) => {
    const el = document.createElement(block.type === 'quote' ? 'blockquote' : 'p');
    el.textContent = block.text;
    body.appendChild(el);
  });

  /* ---------- tagi ---------- */
  const tagsWrap = document.getElementById('postTags');
  const year = post.date.slice(0, 4);
  [post.category, 'Misza Photography', `Warszawa ${year}`].forEach((t) => {
    const span = document.createElement('span');
    span.textContent = t;
    tagsWrap.appendChild(span);
  });

  /* ---------- udostępnianie ---------- */
  const shareUrl = location.href;
  document.getElementById('shareMail').href =
    `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareUrl)}`;
  document.getElementById('shareFb').href =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  document.getElementById('shareX').href =
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`;

  /* ---------- poprzedni / następny (z zawijaniem) ---------- */
  const prev = posts[(index - 1 + posts.length) % posts.length];
  const next = posts[(index + 1) % posts.length];

  const prevEl = document.getElementById('postPrev');
  const nextEl = document.getElementById('postNext');
  prevEl.href = `post.html?slug=${prev.slug}`;
  prevEl.querySelector('.post-nav__title').textContent = prev.title;
  prevEl.dataset.cursor = 'Czytaj';
  nextEl.href = `post.html?slug=${next.slug}`;
  nextEl.querySelector('.post-nav__title').textContent = next.title;
  nextEl.dataset.cursor = 'Czytaj';

  if (posts.length < 2) {
    document.getElementById('postNav')?.remove();
  }

  /* ---------- powiązane wpisy ---------- */
  const others = posts.filter((p) => p.slug !== post.slug);
  const sameCategory = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  const related = [...sameCategory, ...rest].slice(0, 3);

  const relatedWrap = document.getElementById('postRelated');
  if (related.length) {
    related.forEach((p) => {
      const art = document.createElement('article');
      art.className = 'news-card';
      art.innerHTML = `
        <a class="news-card__media" href="post.html?slug=${p.slug}" data-cursor="Czytaj">
          <span class="news-card__cat">${p.category}</span>
          <img src="${p.thumb}" alt="${p.imageAlt}" loading="lazy">
        </a>
        <div class="news-card__body">
          <span class="news-card__meta">${p.dateLabel}<i></i>${p.readTime} czytania</span>
          <h3 class="news-card__title"><a href="post.html?slug=${p.slug}">${p.title}</a></h3>
          <p class="news-card__excerpt">${p.excerpt}</p>
          <a href="post.html?slug=${p.slug}" class="news-card__link"><span>Czytaj dalej</span><i></i></a>
        </div>`;
      relatedWrap.appendChild(art);
    });
  } else {
    document.querySelector('.post-related')?.remove();
  }

  /* ---------- dowiązanie kursora / odświeżenie scrolltriggerów ---------- */
  window.MISZA?.bindCursor?.();
  window.addEventListener('load', () => window.ScrollTrigger?.refresh());
})();
