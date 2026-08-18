<?php partial('admin/partials/shell-start', [
  'title' => $mode === 'create' ? 'Nowy wpis' : 'Edytuj wpis',
  'username' => $username,
  'active' => 'news',
]); ?>

<header class="admin__head">
  <a href="/admin/news" class="admin-back">← Wróć do aktualności</a>
  <h1><?= $mode === 'create' ? 'Nowy wpis' : 'Edytuj wpis' ?></h1>
</header>

<form id="newsForm" class="admin-form" enctype="multipart/form-data">
  <div class="admin-form__preview">
    <img id="imagePreview" src="<?= $item !== null ? e(pic($item->image, 'thumbs')) : '' ?>" alt=""<?= $item !== null ? '' : ' hidden' ?>>
  </div>
  <label>
    <span>Zdjęcie<?= $mode === 'create' ? ' (wymagane)' : ' — zostaw puste, aby nie zmieniać' ?></span>
    <input type="file" name="image" accept="image/jpeg,image/png,image/webp" id="imageInput"<?= $mode === 'create' ? ' required' : '' ?>>
  </label>
  <label>
    <span>Opis obrazu (alt)</span>
    <input type="text" name="imageAlt" value="<?= $item !== null ? e($item->imageAlt) : '' ?>">
  </label>
  <label>
    <span>Tytuł</span>
    <input type="text" name="title" value="<?= $item !== null ? e($item->title) : '' ?>" required>
  </label>
  <label>
    <span>Kategoria</span>
    <input type="text" name="category" value="<?= $item !== null ? e($item->category) : '' ?>" required>
  </label>
  <label>
    <span>Status</span>
    <select name="status">
      <option value="published"<?= $item === null || ($item->status ?? 'published') !== 'draft' ? ' selected' : '' ?>>Opublikowany</option>
      <option value="draft"<?= $item !== null && ($item->status ?? '') === 'draft' ? ' selected' : '' ?>>Szkic (draft)</option>
    </select>
  </label>
  <label>
    <span>Data</span>
    <input type="date" name="date" value="<?= $item !== null ? e($item->date) : '' ?>" required>
  </label>
  <label>
    <span>Czas czytania</span>
    <input type="text" name="readTime" value="<?= $item !== null ? e($item->readTime) : '3 min' ?>" placeholder="np. 3 min">
  </label>
  <label>
    <span>Zajawka</span>
    <textarea name="excerpt" rows="3" required><?= $item !== null ? e($item->excerpt) : '' ?></textarea>
  </label>

  <div class="admin-blocks">
    <span class="admin-blocks__label">Treść wpisu</span>
    <div id="blockList"></div>
    <div class="admin-blocks__add">
      <button type="button" class="admin-btn admin-btn--ghost" data-add-block="p">+ Akapit</button>
      <button type="button" class="admin-btn admin-btn--ghost" data-add-block="quote">+ Cytat</button>
    </div>
  </div>

  <div class="admin-form__actions">
    <button type="submit" class="admin-btn"><?= $mode === 'create' ? 'Dodaj wpis' : 'Zapisz zmiany' ?></button>
    <?php if ($mode === 'edit'): ?>
    <button type="button" class="admin-btn admin-btn--danger" id="deleteBtn">Usuń wpis</button>
    <?php endif; ?>
  </div>
  <p class="admin-form__error" id="formError" hidden></p>
</form>

<script id="initial-data" type="application/json"><?= json_script([
  'mode' => $mode,
  'slug' => $item !== null ? $item->slug : null,
  'content' => $item !== null ? $item->content : [],
]) ?></script>
<?php partial('admin/partials/shell-end'); ?>
