<!DOCTYPE html>
<html lang="pl">
<head>
<?php partial('partials/head', [
  'title' => 'Aktualności — MISZA',
  'description' => 'Aktualności ze studia Misza — kulisy sesji, poradniki fotograficzne i ogłoszenia o nowym sezonie.',
]); ?>
</head>
<body class="is-loading">
<?php partial('partials/header', ['active' => 'news', 'onHome' => false]); ?>

<!-- ========== PAGE HEAD ========== -->
<section class="pagehead">
  <div class="wrap">
    <p class="eyebrow" data-anim="fade">01 &nbsp;//&nbsp; Aktualności</p>
    <h1 class="display display--xl" data-split>Ze studia,<br>bez filtra</h1>
    <p class="lead pagehead__lead" data-anim="fade">
      Kulisy sesji, ogłoszenia o nowych terminach i to, czego nauczyłem się przy okazji
      ostatnich zleceń. Bez marketingowego sztafażu — po prostu notatki z pracy.
    </p>
  </div>
  <div class="pagehead__scroll"><i></i></div>
</section>

<!-- ========== LISTA WPISÓW ========== -->
<section class="news-list wrap">

  <?php if ($featured !== null): ?>
  <a class="news-featured" href="/post.html?slug=<?= e(rawurlencode($featured->slug)) ?>" data-cursor="Czytaj">
    <span class="news-featured__media">
      <img src="<?= e(pic($featured->image, 'large')) ?>" alt="<?= e($featured->imageAlt) ?>" loading="lazy">
    </span>
    <span class="news-featured__body">
      <span class="news-featured__badge">Najnowszy wpis &nbsp;·&nbsp; <?= e($featured->category) ?> &nbsp;·&nbsp; <?= e(date_label_pl($featured->date)) ?></span>
      <span class="news-featured__title"><?= e($featured->title) ?></span>
      <span class="lead"><?= e($featured->excerpt) ?></span>
      <span class="btn-line magnetic"><span>Czytaj cały wpis</span><i></i></span>
    </span>
  </a>
  <?php endif; ?>

  <div class="news-grid" data-anim="stagger">
    <?php foreach ($rest as $post): ?>
    <article class="news-card">
      <a class="news-card__media" href="/post.html?slug=<?= e(rawurlencode($post->slug)) ?>" data-cursor="Czytaj">
        <span class="news-card__cat"><?= e($post->category) ?></span>
        <img src="<?= e(pic($post->image, 'thumbs')) ?>" alt="<?= e($post->imageAlt) ?>" loading="lazy">
      </a>
      <div class="news-card__body">
        <span class="news-card__meta"><?= e(date_label_pl($post->date)) ?><i></i><?= e($post->readTime) ?> czytania</span>
        <h3 class="news-card__title"><a href="/post.html?slug=<?= e(rawurlencode($post->slug)) ?>"><?= e($post->title) ?></a></h3>
        <p class="news-card__excerpt"><?= e($post->excerpt) ?></p>
        <a href="/post.html?slug=<?= e(rawurlencode($post->slug)) ?>" class="news-card__link"><span>Czytaj dalej</span><i></i></a>
      </div>
    </article>
    <?php endforeach; ?>
  </div>
</section>

<!-- ========== CTA ========== -->
<section class="cta" id="contact">
  <div class="cta__bg"><img src="<?= e(pic($ctaImage, 'large')) ?>" alt="" loading="lazy"></div>
  <div class="wrap cta__inner">
    <p class="eyebrow" data-anim="fade">02 &nbsp;//&nbsp; Kontakt</p>
    <h2 class="display display--xl" data-split>Zróbmy coś pięknego</h2>
    <a href="mailto:studio@misza.photo" class="btn-line btn-line--lg magnetic"><span>studio@misza.photo</span><i></i></a>
  </div>
</section>

<?php partial('partials/footer', ['footer' => $content->footer, 'onHome' => false]); ?>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
<script src="/js/app.js"></script>
</body>
</html>
