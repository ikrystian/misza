<!DOCTYPE html>
<html lang="pl">
<head>
<?php partial('partials/head', [
  'title' => 'Galeria — MISZA',
  'description' => 'Portfolio studia Misza — koncerty, portret, reportaż, street i natura.',
]); ?>
</head>
<body class="is-loading">
<?php partial('partials/header', ['active' => 'gallery', 'onHome' => false]); ?>

<!-- ========== PAGE HEAD ========== -->
<section class="pagehead">
  <div class="wrap">
    <p class="eyebrow" data-anim="fade">01 &nbsp;//&nbsp; Portfolio</p>
    <h1 class="display display--xl" data-split>Kadry, które<br>zostają na dłużej</h1>
    <p class="lead pagehead__lead" data-anim="fade">
      Koncerty, portrety, reportaż i to, co po drodze. Każdy kadr w oryginalnych proporcjach —
      kliknij, żeby otworzyć podgląd.
    </p>
  </div>
  <div class="pagehead__scroll"><i></i></div>
</section>

<!-- ========== FILTERS ========== -->
<div class="filters wrap" id="filters">
    <button class="filter is-active" data-filter="all">Wszystko <sup><?= count($gallery) ?></sup></button>
    <?php foreach ($categories as $category): ?>
    <button class="filter" data-filter="<?= e($category->slug) ?>"><?= e($category->label) ?> <sup><?= e($category->count) ?></sup></button>
    <?php endforeach; ?>
</div>

<!-- ========== GRID ========== -->
<section class="gallery wrap">
  <div class="grid" id="grid">
    <?php foreach ($gallery as $item): ?>
    <figure class="card" data-cat="<?= e($item->category) ?>">
      <a class="card__media" href="<?= e(pic($item->file, 'large')) ?>" data-cursor="Podgląd">
        <img src="<?= e(pic($item->file, 'thumbs')) ?>" width="<?= e($item->width) ?>" height="<?= e($item->height) ?>" alt="<?= e($item->alt) ?>" loading="lazy">
      </a>
      <figcaption><h3><?= e($item->title) ?></h3><span><?= e($labelBySlug[$item->category] ?? $item->category) ?></span></figcaption>
    </figure>
    <?php endforeach; ?>
  </div>

  <p class="grid__empty" id="gridEmpty">Brak prac w tej kategorii.</p>
</section>

<!-- ========== CTA ========== -->
<section class="cta">
  <div class="cta__bg"><img src="https://picsum.photos/seed/misza-cta2/1920/1100" alt=""></div>
  <div class="wrap cta__inner">
    <p class="eyebrow" data-anim="fade">02 &nbsp;//&nbsp; Kontakt</p>
    <h2 class="display display--xl" data-split>Twoja sesja jest następna</h2>
    <a href="mailto:studio@misza.photo" class="btn-line btn-line--lg magnetic"><span>studio@misza.photo</span><i></i></a>
  </div>
</section>

<?php partial('partials/footer', ['footer' => $content->footer, 'onHome' => false]); ?>

<!-- ========== LIGHTBOX ========== -->
<div class="lightbox" id="lightbox" aria-hidden="true">
  <button class="lightbox__close" id="lbClose" aria-label="Zamknij"></button>
  <button class="lightbox__arrow lightbox__arrow--prev" data-lb="-1" aria-label="Poprzednie"></button>
  <button class="lightbox__arrow lightbox__arrow--next" data-lb="1" aria-label="Następne"></button>
  <figure class="lightbox__stage">
    <img id="lbImg" src="" alt="">
    <figcaption><h3 id="lbTitle"></h3><span id="lbMeta"></span></figcaption>
  </figure>
  <div class="lightbox__count"><b id="lbNum">01</b><em></em><span id="lbTotal"><?= pad2(count($gallery) - 1) ?></span></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Flip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
<script src="/js/app.js"></script>
<script src="/js/gallery.js"></script>
</body>
</html>
