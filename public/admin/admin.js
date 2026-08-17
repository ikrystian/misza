(() => {
  'use strict';

  /* ---------- helpery ---------- */
  function getInitialData() {
    const el = document.getElementById('initial-data');
    return el ? JSON.parse(el.textContent) : null;
  }

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function api(url, options = {}) {
    const res = await fetch(url, options);
    let data = null;
    try { data = await res.json(); } catch { /* brak treści JSON */ }
    if (!res.ok) throw new Error((data && data.error) || `Błąd żądania (${res.status}).`);
    return data;
  }

  function showError(el, err) {
    if (!el) return;
    el.textContent = err.message || String(err);
    el.hidden = false;
  }

  function picUrl(file, variant) {
    return `/pictures/${variant}/${file}`;
  }

  /* ---------- logowanie / wylogowanie ---------- */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const errorEl = document.getElementById('loginError');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      try {
        await api('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loginForm.username.value, password: loginForm.password.value }),
        });
        window.location.href = '/admin';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    });
  }

  /* =========================================================
     GALERIA — lista + kategorie
     ========================================================= */
  const galleryGrid = document.getElementById('galleryGrid');
  if (galleryGrid) {
    const categoryList = document.getElementById('categoryList');
    const categoryForm = document.getElementById('categoryForm');
    const categoryError = document.getElementById('categoryError');

    function renderCategories(categories) {
      categoryList.innerHTML = categories.map((c) => `
        <li class="admin-chip" data-slug="${esc(c.slug)}">
          <span class="admin-chip__label" data-rename>${esc(c.label)}</span>
          <span class="admin-chip__count">${c.count}</span>
          <button type="button" class="admin-chip__remove" data-remove-category title="Usuń kategorię">✕</button>
        </li>
      `).join('') || '<p class="admin-empty">Brak kategorii.</p>';
    }

    function renderGallery(gallery, categories) {
      const labelBySlug = new Map(categories.map((c) => [c.slug, c.label]));
      galleryGrid.innerHTML = gallery.map((item) => `
        <figure class="admin-photo" data-id="${esc(item.id)}">
          <img src="${picUrl(item.file, 'thumbs')}" alt="">
          <figcaption>
            <b>${esc(item.title)}</b>
            <span>${esc(labelBySlug.get(item.category) || item.category)}</span>
          </figcaption>
          <div class="admin-photo__actions">
            <a href="/admin/gallery/${esc(item.id)}/edit">Edytuj</a>
            <button type="button" data-remove-photo>Usuń</button>
          </div>
        </figure>
      `).join('') || '<p class="admin-empty">Brak zdjęć. Dodaj pierwsze zdjęcie.</p>';
    }

    let sortable = null;
    function initSortable() {
      if (sortable || typeof Sortable === 'undefined') return;
      sortable = Sortable.create(galleryGrid, {
        animation: 150,
        onEnd: async () => {
          const order = [...galleryGrid.querySelectorAll('.admin-photo')].map((el) => el.dataset.id);
          try {
            await api('/api/gallery/reorder', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order }),
            });
          } catch (err) {
            alert('Nie udało się zapisać kolejności: ' + err.message);
            await refresh();
          }
        },
      });
    }

    async function refresh() {
      const [gallery, categories] = await Promise.all([
        api('/api/gallery'),
        api('/api/categories'),
      ]);
      renderCategories(categories);
      renderGallery(gallery, categories);
      initSortable();
    }

    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      categoryError.hidden = true;
      try {
        await api('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: categoryForm.label.value }),
        });
        categoryForm.reset();
        await refresh();
      } catch (err) {
        showError(categoryError, err);
      }
    });

    categoryList.addEventListener('click', async (e) => {
      const chip = e.target.closest('.admin-chip');
      if (!chip) return;
      const slug = chip.dataset.slug;

      if (e.target.matches('[data-remove-category]')) {
        if (!confirm('Usunąć tę kategorię?')) return;
        try {
          await api(`/api/categories/${encodeURIComponent(slug)}`, { method: 'DELETE' });
          await refresh();
        } catch (err) {
          alert(err.message);
        }
        return;
      }

      if (e.target.matches('[data-rename]')) {
        const current = e.target.textContent;
        const next = prompt('Nowa nazwa kategorii:', current);
        if (!next || next.trim() === current) return;
        try {
          await api(`/api/categories/${encodeURIComponent(slug)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: next.trim() }),
          });
          await refresh();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    galleryGrid.addEventListener('click', async (e) => {
      if (!e.target.matches('[data-remove-photo]')) return;
      const fig = e.target.closest('.admin-photo');
      if (!confirm('Usunąć to zdjęcie z galerii?')) return;
      try {
        await api(`/api/gallery/${encodeURIComponent(fig.dataset.id)}`, { method: 'DELETE' });
        await refresh();
      } catch (err) {
        alert(err.message);
      }
    });

    const initial = getInitialData();
    if (initial) {
      renderCategories(initial.categories);
      renderGallery(initial.gallery, initial.categories);
      initSortable();
    }
  }

  /* =========================================================
     GALERIA — formularz dodaj/edytuj zdjęcie
     ========================================================= */
  const galleryForm = document.getElementById('galleryForm');
  if (galleryForm) {
    const { mode, id } = getInitialData();
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const formError = document.getElementById('formError');
    const deleteBtn = document.getElementById('deleteBtn');

    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { imagePreview.src = reader.result; imagePreview.hidden = false; };
      reader.readAsDataURL(file);
    });

    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.hidden = true;
      const submitBtn = galleryForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        if (mode === 'create') {
          await api('/api/gallery', { method: 'POST', body: new FormData(galleryForm) });
        } else {
          await api(`/api/gallery/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: galleryForm.title.value,
              alt: galleryForm.alt.value,
              category: galleryForm.category.value,
            }),
          });
          if (imageInput.files[0]) {
            const fd = new FormData();
            fd.append('image', imageInput.files[0]);
            await api(`/api/gallery/${encodeURIComponent(id)}/image`, { method: 'PUT', body: fd });
          }
        }
        window.location.href = '/admin/gallery';
      } catch (err) {
        showError(formError, err);
        submitBtn.disabled = false;
      }
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Usunąć to zdjęcie z galerii?')) return;
        try {
          await api(`/api/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' });
          window.location.href = '/admin/gallery';
        } catch (err) {
          showError(formError, err);
        }
      });
    }
  }

  /* =========================================================
     AKTUALNOŚCI — lista
     ========================================================= */
  document.querySelectorAll('[data-delete-slug]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Usunąć ten wpis?')) return;
      try {
        await api(`/api/news/${encodeURIComponent(btn.dataset.deleteSlug)}`, { method: 'DELETE' });
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  /* =========================================================
     AKTUALNOŚCI — formularz dodaj/edytuj wpis
     ========================================================= */
  const newsForm = document.getElementById('newsForm');
  if (newsForm) {
    const { mode, slug, content } = getInitialData();
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const formError = document.getElementById('formError');
    const deleteBtn = document.getElementById('deleteBtn');
    const blockList = document.getElementById('blockList');

    let blocks = Array.isArray(content) ? content.map((b) => ({ ...b })) : [];

    function renderBlocks() {
      blockList.innerHTML = blocks.map((b, i) => `
        <div class="admin-block" data-index="${i}">
          <div class="admin-block__head">
            <span>${b.type === 'quote' ? 'Cytat' : 'Akapit'}</span>
            <div class="admin-block__actions">
              <button type="button" data-move="-1" ${i === 0 ? 'disabled' : ''}>▲</button>
              <button type="button" data-move="1" ${i === blocks.length - 1 ? 'disabled' : ''}>▼</button>
              <button type="button" data-remove-block>✕</button>
            </div>
          </div>
          <textarea rows="${b.type === 'quote' ? 2 : 4}" data-block-text>${esc(b.text)}</textarea>
        </div>
      `).join('') || '<p class="admin-empty">Brak treści — dodaj akapit lub cytat.</p>';
    }

    function syncBlocksFromDom() {
      blockList.querySelectorAll('.admin-block').forEach((el, i) => {
        blocks[i].text = el.querySelector('[data-block-text]').value;
      });
    }

    blockList.addEventListener('click', (e) => {
      const row = e.target.closest('.admin-block');
      if (!row) return;
      syncBlocksFromDom();
      const i = Number(row.dataset.index);

      if (e.target.matches('[data-remove-block]')) {
        blocks.splice(i, 1);
        renderBlocks();
      } else if (e.target.matches('[data-move]')) {
        const dir = Number(e.target.dataset.move);
        const j = i + dir;
        if (j < 0 || j >= blocks.length) return;
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        renderBlocks();
      }
    });

    document.querySelectorAll('[data-add-block]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncBlocksFromDom();
        blocks.push({ type: btn.dataset.addBlock, text: '' });
        renderBlocks();
        blockList.querySelector('.admin-block:last-child textarea')?.focus();
      });
    });

    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { imagePreview.src = reader.result; imagePreview.hidden = false; };
      reader.readAsDataURL(file);
    });

    renderBlocks();

    newsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.hidden = true;
      syncBlocksFromDom();
      const submitBtn = newsForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const fd = new FormData(newsForm);
      fd.set('content', JSON.stringify(blocks));

      try {
        if (mode === 'create') {
          await api('/api/news', { method: 'POST', body: fd });
        } else {
          await api(`/api/news/${encodeURIComponent(slug)}`, { method: 'PUT', body: fd });
        }
        window.location.href = '/admin/news';
      } catch (err) {
        showError(formError, err);
        submitBtn.disabled = false;
      }
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Usunąć ten wpis?')) return;
        try {
          await api(`/api/news/${encodeURIComponent(slug)}`, { method: 'DELETE' });
          window.location.href = '/admin/news';
        } catch (err) {
          showError(formError, err);
        }
      });
    }
  }

  /* =========================================================
     TREŚĆ STRONY — zakładki + sekcje
     ========================================================= */
  const contentTabs = document.getElementById('contentTabs');
  if (contentTabs) {
    const data = getInitialData();

    contentTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.admin-tab');
      if (!btn) return;
      document.querySelectorAll('.admin-tab').forEach((b) => b.classList.toggle('is-active', b === btn));
      document.querySelectorAll('.admin-tabpanel').forEach((p) => {
        p.classList.toggle('is-active', p.dataset.tabpanel === btn.dataset.tab);
      });
    });

    async function uploadImage(file) {
      const fd = new FormData();
      fd.append('image', file);
      return api('/api/upload', { method: 'POST', body: fd });
    }

    async function saveSection(section, payload, statusEl) {
      statusEl.textContent = 'Zapisywanie…';
      statusEl.hidden = false;
      try {
        await api(`/api/content/${section}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        statusEl.textContent = 'Zapisano.';
        statusEl.className = 'admin-save-status is-ok';
      } catch (err) {
        statusEl.textContent = err.message;
        statusEl.className = 'admin-save-status is-error';
      }
      setTimeout(() => { statusEl.hidden = true; }, 3000);
    }

    function imageField(prefix, file, variant, alt) {
      return `
        <div class="admin-image-field" data-image-field data-variant="${variant}">
          <img src="${file ? picUrl(file, variant) : ''}" alt="" ${file ? '' : 'hidden'}>
          <input type="hidden" data-file value="${esc(file || '')}">
          <label class="admin-btn admin-btn--ghost admin-btn--sm">
            Zmień zdjęcie
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden data-upload>
          </label>
          ${alt !== undefined ? `<input type="text" placeholder="Opis (alt)" value="${esc(alt)}" data-alt>` : ''}
        </div>`;
    }

    function bindImageFields(scope) {
      scope.querySelectorAll('[data-image-field]').forEach((field) => {
        const input = field.querySelector('[data-upload]');
        input.addEventListener('change', async () => {
          const file = input.files[0];
          if (!file) return;
          const img = field.querySelector('img');
          const reader = new FileReader();
          reader.onload = () => { img.src = reader.result; img.hidden = false; };
          reader.readAsDataURL(file);
          try {
            const result = await uploadImage(file);
            field.querySelector('[data-file]').value = result.file;
          } catch (err) {
            alert('Nie udało się wgrać zdjęcia: ' + err.message);
          }
        });
      });
    }

    function readImageField(field) {
      return {
        file: field.querySelector('[data-file]').value,
        variant: field.dataset.variant,
        ...(field.querySelector('[data-alt]') ? { alt: field.querySelector('[data-alt]').value } : {}),
      };
    }

    /* ---------- HERO ---------- */
    const heroPanel = document.getElementById('panel-hero');
    function renderHero() {
      heroPanel.innerHTML = `
        <div id="heroSlides"></div>
        <button type="button" class="admin-btn admin-btn--ghost" id="heroAdd">+ Dodaj slajd</button>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" id="heroSave">Zapisz sekcję Hero</button>
          <span class="admin-save-status" id="heroStatus" hidden></span>
        </div>`;
      const slidesEl = heroPanel.querySelector('#heroSlides');

      function renderSlides() {
        slidesEl.innerHTML = data.hero.slides.map((s, i) => `
          <div class="admin-repeat-item" data-index="${i}">
            <div class="admin-repeat-item__handle" data-drag-handle title="Przeciągnij, aby zmienić kolejność">⠿</div>
            ${imageField('hero', s.file, 'large', undefined)}
            <button type="button" class="admin-btn admin-btn--ghost admin-btn--sm" data-toggle-fields aria-expanded="false">Pokaż opis, nadtytuł i tytuł</button>
            <div class="admin-collapsible__body" data-fields-body hidden>
              <input type="text" placeholder="Opis (alt)" value="${esc(s.alt)}" data-alt>
              <input type="text" placeholder="Nadtytuł (np. Portret)" value="${esc(s.eyebrow)}" data-eyebrow>
              <input type="text" placeholder="Tytuł slajdu" value="${esc(s.title)}" data-title>
            </div>
            <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-remove>Usuń slajd</button>
          </div>`).join('');
        bindImageFields(slidesEl);
      }
      renderSlides();

      let heroSortable = null;
      function initHeroSortable() {
        if (heroSortable || typeof Sortable === 'undefined') return;
        heroSortable = Sortable.create(slidesEl, {
          handle: '[data-drag-handle]',
          animation: 150,
          forceFallback: true,
          onEnd: () => {
            syncHero();
            renderSlides();
          },
        });
      }
      initHeroSortable();

      slidesEl.addEventListener('click', (e) => {
        if (e.target.matches('[data-toggle-fields]')) {
          const body = e.target.closest('.admin-repeat-item').querySelector('[data-fields-body]');
          body.hidden = !body.hidden;
          e.target.textContent = body.hidden ? 'Pokaż opis, nadtytuł i tytuł' : 'Ukryj opis, nadtytuł i tytuł';
          e.target.setAttribute('aria-expanded', String(!body.hidden));
          return;
        }
        if (!e.target.matches('[data-remove]')) return;
        const i = Number(e.target.closest('.admin-repeat-item').dataset.index);
        syncHero();
        data.hero.slides.splice(i, 1);
        renderSlides();
      });

      function syncHero() {
        slidesEl.querySelectorAll('.admin-repeat-item').forEach((el, i) => {
          const img = readImageField(el.querySelector('[data-image-field]'));
          data.hero.slides[i] = {
            file: img.file,
            variant: img.variant,
            alt: el.querySelector('[data-alt]').value,
            eyebrow: el.querySelector('[data-eyebrow]').value,
            title: el.querySelector('[data-title]').value,
          };
        });
      }

      heroPanel.querySelector('#heroAdd').addEventListener('click', () => {
        syncHero();
        data.hero.slides.push({ file: '', variant: 'large', alt: '', eyebrow: '', title: '' });
        renderSlides();
      });

      heroPanel.querySelector('#heroSave').addEventListener('click', () => {
        syncHero();
        saveSection('hero', data.hero, heroPanel.querySelector('#heroStatus'));
      });
    }
    renderHero();

    /* ---------- ABOUT ---------- */
    const aboutPanel = document.getElementById('panel-about');
    function renderAbout() {
      const mainImg = data.about.images.find((i) => i.size === 'main') || { file: '', variant: 'large', alt: '' };
      const smallImg = data.about.images.find((i) => i.size === 'small') || { file: '', variant: 'large', alt: '' };
      aboutPanel.innerHTML = `
        <label><span>Nadtytuł</span><input type="text" value="${esc(data.about.eyebrow)}" data-field="eyebrow"></label>
        <label><span>Nagłówek</span><input type="text" value="${esc(data.about.heading)}" data-field="heading"></label>
        <label><span>Tekst</span><textarea rows="4" data-field="text">${esc(data.about.text)}</textarea></label>
        <div class="admin-two-col">
          <div><span class="admin-blocks__label">Zdjęcie główne</span>${imageField('about-main', mainImg.file, 'large', mainImg.alt)}</div>
          <div><span class="admin-blocks__label">Zdjęcie małe</span>${imageField('about-small', smallImg.file, 'large', smallImg.alt)}</div>
        </div>
        <span class="admin-blocks__label">Statystyki</span>
        <div id="aboutStats"></div>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" id="aboutSave">Zapisz sekcję O studio</button>
          <span class="admin-save-status" id="aboutStatus" hidden></span>
        </div>`;
      bindImageFields(aboutPanel);

      const statsEl = aboutPanel.querySelector('#aboutStats');
      statsEl.innerHTML = data.about.stats.map((s, i) => `
        <div class="admin-stat-row" data-index="${i}">
          <input type="text" placeholder="Wartość (np. 12)" value="${esc(s.value)}" data-value>
          <input type="text" placeholder="Etykieta" value="${esc(s.label)}" data-label>
        </div>`).join('');

      aboutPanel.querySelector('#aboutSave').addEventListener('click', () => {
        const images = [...aboutPanel.querySelectorAll('[data-image-field]')];
        const stats = [...statsEl.querySelectorAll('.admin-stat-row')].map((row) => ({
          value: row.querySelector('[data-value]').value,
          label: row.querySelector('[data-label]').value,
        }));
        const payload = {
          eyebrow: aboutPanel.querySelector('[data-field="eyebrow"]').value,
          heading: aboutPanel.querySelector('[data-field="heading"]').value,
          text: aboutPanel.querySelector('[data-field="text"]').value,
          images: [
            { ...readImageField(images[0]), size: 'main' },
            { ...readImageField(images[1]), size: 'small' },
          ],
          stats,
        };
        data.about = payload;
        saveSection('about', payload, aboutPanel.querySelector('#aboutStatus'));
      });
    }
    renderAbout();

    /* ---------- SHOWCASE ---------- */
    const showcasePanel = document.getElementById('panel-showcase');
    function renderShowcase() {
      showcasePanel.innerHTML = `
        <label><span>Nadtytuł</span><input type="text" value="${esc(data.showcase.eyebrow)}" data-field="eyebrow"></label>
        <label><span>Nagłówek (Enter = nowa linia)</span><textarea rows="2" data-field="heading">${esc(data.showcase.heading)}</textarea></label>
        <label><span>Lead</span><textarea rows="2" data-field="lead">${esc(data.showcase.lead)}</textarea></label>
        <div id="showcaseItems"></div>
        <button type="button" class="admin-btn admin-btn--ghost" id="showcaseAdd">+ Dodaj kadr</button>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" id="showcaseSave">Zapisz sekcję Wybrane kadry</button>
          <span class="admin-save-status" id="showcaseStatus" hidden></span>
        </div>`;
      const itemsEl = showcasePanel.querySelector('#showcaseItems');

      function renderItems() {
        itemsEl.innerHTML = data.showcase.items.map((it, i) => `
          <div class="admin-repeat-item" data-index="${i}">
            ${imageField('showcase', it.file, 'thumbs', it.alt)}
            <input type="text" placeholder="Tytuł" value="${esc(it.title)}" data-title>
            <input type="text" placeholder="Podtytuł (np. Portret · 2025)" value="${esc(it.subtitle)}" data-subtitle>
            <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-remove>Usuń kadr</button>
          </div>`).join('');
        bindImageFields(itemsEl);
      }
      renderItems();

      function sync() {
        itemsEl.querySelectorAll('.admin-repeat-item').forEach((el, i) => {
          const img = readImageField(el.querySelector('[data-image-field]'));
          data.showcase.items[i] = {
            ...img,
            width: data.showcase.items[i]?.width || 1000,
            height: data.showcase.items[i]?.height || 667,
            title: el.querySelector('[data-title]').value,
            subtitle: el.querySelector('[data-subtitle]').value,
          };
        });
      }

      itemsEl.addEventListener('click', (e) => {
        if (!e.target.matches('[data-remove]')) return;
        sync();
        data.showcase.items.splice(Number(e.target.closest('.admin-repeat-item').dataset.index), 1);
        renderItems();
      });

      showcasePanel.querySelector('#showcaseAdd').addEventListener('click', () => {
        sync();
        data.showcase.items.push({ file: '', variant: 'thumbs', alt: '', width: 1000, height: 667, title: '', subtitle: '' });
        renderItems();
      });

      showcasePanel.querySelector('#showcaseSave').addEventListener('click', () => {
        sync();
        const payload = {
          eyebrow: showcasePanel.querySelector('[data-field="eyebrow"]').value,
          heading: showcasePanel.querySelector('[data-field="heading"]').value,
          lead: showcasePanel.querySelector('[data-field="lead"]').value,
          items: data.showcase.items,
        };
        data.showcase = payload;
        saveSection('showcase', payload, showcasePanel.querySelector('#showcaseStatus'));
      });
    }
    renderShowcase();

    /* ---------- SERVICES ---------- */
    const servicesPanel = document.getElementById('panel-services');
    function renderServices() {
      servicesPanel.innerHTML = `
        <label><span>Nadtytuł</span><input type="text" value="${esc(data.services.eyebrow)}" data-field="eyebrow"></label>
        <label><span>Nagłówek</span><input type="text" value="${esc(data.services.heading)}" data-field="heading"></label>
        <div id="servicesItems"></div>
        <button type="button" class="admin-btn admin-btn--ghost" id="servicesAdd">+ Dodaj usługę</button>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" id="servicesSave">Zapisz sekcję Usługi</button>
          <span class="admin-save-status" id="servicesStatus" hidden></span>
        </div>`;
      const itemsEl = servicesPanel.querySelector('#servicesItems');

      function renderItems() {
        itemsEl.innerHTML = data.services.items.map((it, i) => `
          <div class="admin-repeat-item" data-index="${i}">
            ${imageField('services', it.file, 'thumbs')}
            <input type="text" placeholder="Numer (np. 01)" value="${esc(it.number)}" data-number>
            <input type="text" placeholder="Tytuł" value="${esc(it.title)}" data-title>
            <input type="text" placeholder="Tagi (np. Editorial · Lookbook)" value="${esc(it.tags)}" data-tags>
            <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-remove>Usuń usługę</button>
          </div>`).join('');
        bindImageFields(itemsEl);
      }
      renderItems();

      function sync() {
        itemsEl.querySelectorAll('.admin-repeat-item').forEach((el, i) => {
          const img = readImageField(el.querySelector('[data-image-field]'));
          data.services.items[i] = {
            file: img.file,
            variant: img.variant,
            number: el.querySelector('[data-number]').value,
            title: el.querySelector('[data-title]').value,
            tags: el.querySelector('[data-tags]').value,
          };
        });
      }

      itemsEl.addEventListener('click', (e) => {
        if (!e.target.matches('[data-remove]')) return;
        sync();
        data.services.items.splice(Number(e.target.closest('.admin-repeat-item').dataset.index), 1);
        renderItems();
      });

      servicesPanel.querySelector('#servicesAdd').addEventListener('click', () => {
        sync();
        data.services.items.push({ file: '', variant: 'thumbs', number: '', title: '', tags: '' });
        renderItems();
      });

      servicesPanel.querySelector('#servicesSave').addEventListener('click', () => {
        sync();
        const payload = {
          eyebrow: servicesPanel.querySelector('[data-field="eyebrow"]').value,
          heading: servicesPanel.querySelector('[data-field="heading"]').value,
          items: data.services.items,
        };
        data.services = payload;
        saveSection('services', payload, servicesPanel.querySelector('#servicesStatus'));
      });
    }
    renderServices();

    /* ---------- CTA ---------- */
    const ctaPanel = document.getElementById('panel-cta');
    function renderCta() {
      ctaPanel.innerHTML = `
        <label><span>Nadtytuł</span><input type="text" value="${esc(data.cta.eyebrow)}" data-field="eyebrow"></label>
        <label><span>Nagłówek</span><input type="text" value="${esc(data.cta.heading)}" data-field="heading"></label>
        <label><span>Tekst</span><textarea rows="2" data-field="text">${esc(data.cta.text)}</textarea></label>
        <label><span>E-mail</span><input type="email" value="${esc(data.cta.email)}" data-field="email"></label>
        <span class="admin-blocks__label">Tło sekcji</span>
        ${imageField('cta-bg', data.cta.backgroundFile, 'large')}
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" id="ctaSave">Zapisz sekcję CTA</button>
          <span class="admin-save-status" id="ctaStatus" hidden></span>
        </div>`;
      bindImageFields(ctaPanel);

      ctaPanel.querySelector('#ctaSave').addEventListener('click', () => {
        const img = readImageField(ctaPanel.querySelector('[data-image-field]'));
        const payload = {
          eyebrow: ctaPanel.querySelector('[data-field="eyebrow"]').value,
          heading: ctaPanel.querySelector('[data-field="heading"]').value,
          text: ctaPanel.querySelector('[data-field="text"]').value,
          email: ctaPanel.querySelector('[data-field="email"]').value,
          backgroundFile: img.file,
          backgroundVariant: img.variant,
        };
        data.cta = payload;
        saveSection('cta', payload, ctaPanel.querySelector('#ctaStatus'));
      });
    }
    renderCta();

    /* ---------- INSTAGRAM ---------- */
    const instaPanel = document.getElementById('panel-instagram');
    function renderInstagram() {
      instaPanel.innerHTML = `
        <label><span>Nazwa użytkownika (np. @misza.photo)</span><input type="text" value="${esc(data.instagram.handle)}" data-field="handle"></label>
        <label><span>Link do profilu</span><input type="text" value="${esc(data.instagram.profileUrl)}" data-field="profileUrl"></label>
        <div id="instaItems"></div>
        <button type="button" class="admin-btn admin-btn--ghost" id="instaAdd">+ Dodaj zdjęcie</button>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" id="instaSave">Zapisz sekcję Instagram</button>
          <span class="admin-save-status" id="instaStatus" hidden></span>
        </div>`;
      const itemsEl = instaPanel.querySelector('#instaItems');

      function renderItems() {
        itemsEl.innerHTML = data.instagram.items.map((it, i) => `
          <div class="admin-repeat-item admin-repeat-item--sm" data-index="${i}">
            ${imageField('insta', it.file, 'thumbs')}
            <input type="text" placeholder="Link (opcjonalnie)" value="${esc(it.link || '#')}" data-link>
            <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-remove>Usuń</button>
          </div>`).join('');
        bindImageFields(itemsEl);
      }
      renderItems();

      function sync() {
        itemsEl.querySelectorAll('.admin-repeat-item').forEach((el, i) => {
          const img = readImageField(el.querySelector('[data-image-field]'));
          data.instagram.items[i] = {
            file: img.file,
            variant: img.variant,
            alt: '',
            link: el.querySelector('[data-link]').value || '#',
          };
        });
      }

      itemsEl.addEventListener('click', (e) => {
        if (!e.target.matches('[data-remove]')) return;
        sync();
        data.instagram.items.splice(Number(e.target.closest('.admin-repeat-item').dataset.index), 1);
        renderItems();
      });

      instaPanel.querySelector('#instaAdd').addEventListener('click', () => {
        sync();
        data.instagram.items.push({ file: '', variant: 'thumbs', alt: '', link: '#' });
        renderItems();
      });

      instaPanel.querySelector('#instaSave').addEventListener('click', () => {
        sync();
        const payload = {
          handle: instaPanel.querySelector('[data-field="handle"]').value,
          profileUrl: instaPanel.querySelector('[data-field="profileUrl"]').value,
          items: data.instagram.items,
        };
        data.instagram = payload;
        saveSection('instagram', payload, instaPanel.querySelector('#instaStatus'));
      });
    }
    renderInstagram();

    /* ---------- FOOTER ---------- */
    const footerPanel = document.getElementById('panel-footer');
    function renderFooter() {
      footerPanel.innerHTML = `
        <label><span>Hasło / tagline</span><input type="text" value="${esc(data.footer.tagline)}" data-field="tagline"></label>
        <label><span>Adres</span><input type="text" value="${esc(data.footer.address)}" data-field="address"></label>
        <label><span>E-mail</span><input type="email" value="${esc(data.footer.email)}" data-field="email"></label>
        <label><span>Telefon</span><input type="text" value="${esc(data.footer.phone)}" data-field="phone"></label>
        <span class="admin-blocks__label">Linki społecznościowe</span>
        <div id="footerSocial"></div>
        <button type="button" class="admin-btn admin-btn--ghost" id="footerAdd">+ Dodaj link</button>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn" id="footerSave">Zapisz stopkę</button>
          <span class="admin-save-status" id="footerStatus" hidden></span>
        </div>`;
      const socialEl = footerPanel.querySelector('#footerSocial');

      function renderSocial() {
        socialEl.innerHTML = data.footer.social.map((s, i) => `
          <div class="admin-stat-row" data-index="${i}">
            <input type="text" placeholder="Nazwa (np. Instagram)" value="${esc(s.label)}" data-label>
            <input type="text" placeholder="URL" value="${esc(s.url)}" data-url>
            <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-remove>✕</button>
          </div>`).join('');
      }
      renderSocial();

      function sync() {
        socialEl.querySelectorAll('.admin-stat-row').forEach((row, i) => {
          data.footer.social[i] = {
            label: row.querySelector('[data-label]').value,
            url: row.querySelector('[data-url]').value,
          };
        });
      }

      socialEl.addEventListener('click', (e) => {
        if (!e.target.matches('[data-remove]')) return;
        sync();
        data.footer.social.splice(Number(e.target.closest('.admin-stat-row').dataset.index), 1);
        renderSocial();
      });

      footerPanel.querySelector('#footerAdd').addEventListener('click', () => {
        sync();
        data.footer.social.push({ label: '', url: '#' });
        renderSocial();
      });

      footerPanel.querySelector('#footerSave').addEventListener('click', () => {
        sync();
        const payload = {
          tagline: footerPanel.querySelector('[data-field="tagline"]').value,
          address: footerPanel.querySelector('[data-field="address"]').value,
          email: footerPanel.querySelector('[data-field="email"]').value,
          phone: footerPanel.querySelector('[data-field="phone"]').value,
          social: data.footer.social,
        };
        data.footer = payload;
        saveSection('footer', payload, footerPanel.querySelector('#footerStatus'));
      });
    }
    renderFooter();
  }
})();
