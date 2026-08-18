<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($title) ?> — Panel MISZA</title>
<link rel="stylesheet" href="/public/admin/admin.css">
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
</head>
<body>
<div class="admin">
  <aside class="admin__side">
    <a class="admin__logo" href="/admin">MISZA<i>®</i> <span>Admin</span></a>
    <nav class="admin__nav">
      <a href="/admin"<?= $active === 'dashboard' ? ' class="is-active"' : '' ?>>Panel</a>
      <a href="/admin/gallery"<?= $active === 'gallery' ? ' class="is-active"' : '' ?>>Galeria</a>
      <a href="/admin/news"<?= $active === 'news' ? ' class="is-active"' : '' ?>>Aktualności</a>
      <a href="/admin/content"<?= $active === 'content' ? ' class="is-active"' : '' ?>>Treść strony</a>
    </nav>
    <div class="admin__side-foot">
      <span class="admin__user"><?= e($username) ?></span>
      <button type="button" id="logoutBtn" class="admin-btn admin-btn--ghost">Wyloguj</button>
    </div>
  </aside>
  <main class="admin__main">
