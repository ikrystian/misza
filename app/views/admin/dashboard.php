<?php partial('admin/partials/shell-start', ['title' => 'Panel', 'username' => $username, 'active' => 'dashboard']); ?>

<header class="admin__head">
  <h1>Witaj, <?= e($username) ?></h1>
  <p>Panel administratora strony MISZA. Edytuj galerię, kategorie, aktualności i treść strony głównej.</p>
</header>

<div class="admin-stats">
  <a class="admin-stat" href="/admin/gallery">
    <span class="admin-stat__value"><?= e($stats->photos) ?></span>
    <span class="admin-stat__label">zdjęć w galerii</span>
  </a>
  <a class="admin-stat" href="/admin/gallery">
    <span class="admin-stat__value"><?= e($stats->categories) ?></span>
    <span class="admin-stat__label">kategorii</span>
  </a>
  <a class="admin-stat" href="/admin/news">
    <span class="admin-stat__value"><?= e($stats->posts) ?></span>
    <span class="admin-stat__label">wpisów aktualności</span>
  </a>
</div>

<?php partial('admin/partials/shell-end'); ?>
