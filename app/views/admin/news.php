<?php partial('admin/partials/shell-start', ['title' => 'Aktualności', 'username' => $username, 'active' => 'news']); ?>

<header class="admin__head admin__head--row">
  <div>
    <h1>Aktualności</h1>
    <p>Zarządzaj wpisami aktualności.</p>
  </div>
  <a href="/admin/news/new" class="admin-btn">+ Dodaj wpis</a>
</header>

<?php if (count($news) > 0): ?>
<table class="admin-table">
  <thead><tr><th>Tytuł</th><th>Kategoria</th><th>Data</th><th>Status</th><th></th></tr></thead>
  <tbody>
    <?php foreach ($news as $post): ?>
    <tr>
      <td><?= e($post->title) ?></td>
      <td><?= e($post->category) ?></td>
      <td><?= e($post->date) ?></td>
      <td>
        <?php if (($post->status ?? 'published') === 'draft'): ?>
          <span class="admin-status-badge admin-status-badge--draft">Szkic</span>
        <?php else: ?>
          <span class="admin-status-badge admin-status-badge--published">Opublikowany</span>
        <?php endif; ?>
      </td>
      <td class="admin-table__actions">
        <a href="/admin/news/<?= e(rawurlencode($post->slug)) ?>/edit">Edytuj</a>
        <button type="button" class="admin-link-btn admin-link-btn--danger" data-delete-slug="<?= e($post->slug) ?>">Usuń</button>
      </td>
    </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php else: ?>
<p class="admin-empty">Brak wpisów aktualności.</p>
<?php endif; ?>

<?php partial('admin/partials/shell-end'); ?>
