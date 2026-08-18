<?php partial('admin/partials/shell-start', [
  'title' => $mode === 'create' ? 'Nowe zdjęcie' : 'Edytuj zdjęcie',
  'username' => $username,
  'active' => 'gallery',
]); ?>

<header class="admin__head">
  <a href="/admin/gallery" class="admin-back">← Wróć do galerii</a>
  <h1><?= $mode === 'create' ? 'Nowe zdjęcie' : 'Edytuj zdjęcie' ?></h1>
</header>

<form id="galleryForm" class="admin-form" enctype="multipart/form-data">
  <div class="admin-form__preview">
    <img id="imagePreview" src="<?= $item !== null ? e(pic($item->file, 'thumbs')) : '' ?>" alt=""<?= $item !== null ? '' : ' hidden' ?>>
  </div>
  <label>
    <span>Zdjęcie<?= $mode === 'create' ? ' (wymagane)' : ' — zostaw puste, aby nie zmieniać' ?></span>
    <input type="file" name="image" accept="image/jpeg,image/png,image/webp" id="imageInput"<?= $mode === 'create' ? ' required' : '' ?>>
  </label>
  <label>
    <span>Tytuł</span>
    <input type="text" name="title" value="<?= $item !== null ? e($item->title) : '' ?>" required>
  </label>
  <label>
    <span>Opis (alt)</span>
    <input type="text" name="alt" value="<?= $item !== null ? e($item->alt) : '' ?>">
  </label>
  <label>
    <span>Kategoria</span>
    <select name="category" required>
      <?php foreach ($categories as $category): ?>
      <option value="<?= e($category->slug) ?>"<?= $item !== null && $item->category === $category->slug ? ' selected' : '' ?>><?= e($category->label) ?></option>
      <?php endforeach; ?>
    </select>
  </label>
  <div class="admin-form__actions">
    <button type="submit" class="admin-btn"><?= $mode === 'create' ? 'Dodaj zdjęcie' : 'Zapisz zmiany' ?></button>
    <?php if ($mode === 'edit'): ?>
    <button type="button" class="admin-btn admin-btn--danger" id="deleteBtn">Usuń zdjęcie</button>
    <?php endif; ?>
  </div>
  <p class="admin-form__error" id="formError" hidden></p>
</form>

<script id="initial-data" type="application/json"><?= json_script(['mode' => $mode, 'id' => $item !== null ? $item->id : null]) ?></script>
<?php partial('admin/partials/shell-end'); ?>
