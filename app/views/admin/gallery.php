<?php partial('admin/partials/shell-start', ['title' => 'Galeria', 'username' => $username, 'active' => 'gallery']); ?>

<header class="admin__head admin__head--row">
  <div>
    <h1>Galeria</h1>
    <p>Zarządzaj zdjęciami, kategoriami i ich kolejnością.</p>
  </div>
  <a href="/admin/gallery/new" class="admin-btn">+ Dodaj zdjęcie</a>
</header>

<section class="admin-panel">
  <h2>Kategorie</h2>
  <form id="categoryForm" class="admin-inline-form">
    <input type="text" name="label" placeholder="Nazwa nowej kategorii" required>
    <button type="submit" class="admin-btn">Dodaj</button>
  </form>
  <p class="admin-form__error" id="categoryError" hidden></p>
  <ul class="admin-category-list" id="categoryList"></ul>
</section>

<section class="admin-panel">
  <h2>Zdjęcia <span class="admin-hint">przeciągnij kafelek, żeby zmienić kolejność</span></h2>
  <div class="admin-gallery-grid" id="galleryGrid"></div>
</section>

<?php
// panel liczy kategorie w locie — dokładamy `count`, tak jak robi to /api/categories
$counts = [];
foreach ($gallery as $item) {
    $counts[$item->category] = ($counts[$item->category] ?? 0) + 1;
}
$categoriesWithCounts = [];
foreach ($categories as $category) {
    $withCount = clone $category;
    $withCount->count = $counts[$category->slug] ?? 0;
    $categoriesWithCounts[] = $withCount;
}
?>
<script id="initial-data" type="application/json"><?= json_script(['gallery' => $gallery, 'categories' => $categoriesWithCounts]) ?></script>
<?php partial('admin/partials/shell-end'); ?>
