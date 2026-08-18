<!DOCTYPE html>
<html lang="pl">
<head>
<?php partial('partials/head', [
  'title' => $post !== null ? $post->title . ' — MISZA' : 'Nie znaleziono wpisu — MISZA',
  'description' => $post !== null ? $post->excerpt : 'Aktualności ze studia Misza.',
]); ?>
</head>
<body class="is-loading">
<?php partial('partials/header', ['active' => 'news', 'onHome' => false]); ?>

<?php if ($post === null): ?>
<!-- ========== WPIS NIE ZNALEZIONY ========== -->
<section class="pagehead post-notfound">
  <div class="wrap">
    <p class="eyebrow">404</p>
    <h1 class="display display--xl">Nie znaleziono<br>tego wpisu</h1>
    <p class="lead">Ten adres nie prowadzi już do żadnej aktualności — mógł zostać przeniesiony albo usunięty.</p>
    <a href="/aktualnosci.html" class="btn-line magnetic"><span>Wróć do aktualności</span><i></i></a>
  </div>
</section>
<?php else: ?>

<div id="postContent">

  <!-- ========== NAGŁÓWEK WPISU ========== -->
  <section class="post-head">
    <div class="wrap">
      <a href="/aktualnosci.html" class="post-head__back"><i></i><span>Wszystkie wpisy</span></a>
      <p class="post-head__meta" data-anim="fade">
        <b><?= e($post->category) ?></b><i></i><span><?= e(date_label_pl($post->date)) ?></span><i></i><span><?= e($post->readTime) ?> czytania</span>
      </p>
      <h1 class="display display--xl" data-anim="fade"><?= e($post->title) ?></h1>
      <p class="lead pagehead__lead" data-anim="fade"><?= e($post->excerpt) ?></p>
    </div>
  </section>

  <!-- ========== ZDJĘCIE GŁÓWNE ========== -->
  <section class="post-hero">
    <div class="wrap">
      <figure class="post-hero__media reveal-img">
        <img src="<?= e(pic($post->image, 'large')) ?>" alt="<?= e($post->imageAlt) ?>">
      </figure>
    </div>
  </section>

  <!-- ========== TREŚĆ ========== -->
  <article class="post-body wrap" data-anim="fade">
    <?php foreach ($post->content as $block): ?>
      <?php if ($block->type === 'quote'): ?>
    <blockquote><?= e($block->text) ?></blockquote>
      <?php else: ?>
    <p><?= e($block->text) ?></p>
      <?php endif; ?>
    <?php endforeach; ?>
  </article>

  <div class="wrap post-body" style="padding-top:0">
    <div class="post-tags" data-anim="fade">
      <span><?= e($post->category) ?></span>
      <span>Misza Photography</span>
      <span>Warszawa <?= e(substr((string) $post->date, 0, 4)) ?></span>
    </div>
    <div class="post-share" data-anim="fade">
      <span>Udostępnij</span>
      <a href="mailto:?subject=<?= e(rawurlencode($post->title)) ?>&body=<?= e(rawurlencode($shareUrl)) ?>">E-mail</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=<?= e(rawurlencode($shareUrl)) ?>" target="_blank" rel="noopener">Facebook</a>
      <a href="https://twitter.com/intent/tweet?url=<?= e(rawurlencode($shareUrl)) ?>&text=<?= e(rawurlencode($post->title)) ?>" target="_blank" rel="noopener">X</a>
    </div>
  </div>

  <?php if ($hasMultiplePosts): ?>
  <!-- ========== NAWIGACJA MIĘDZY WPISAMI ========== -->
  <nav class="post-nav" data-anim="fade">
    <a class="post-nav__item post-nav__item--prev" href="/post.html?slug=<?= e(rawurlencode($prevPost->slug)) ?>" data-cursor="Czytaj">
      <span class="post-nav__label"><i></i><span>Poprzedni wpis</span></span>
      <span class="post-nav__title"><?= e($prevPost->title) ?></span>
    </a>
    <a class="post-nav__item post-nav__item--next" href="/post.html?slug=<?= e(rawurlencode($nextPost->slug)) ?>" data-cursor="Czytaj">
      <span class="post-nav__label"><span>Następny wpis</span><i></i></span>
      <span class="post-nav__title"><?= e($nextPost->title) ?></span>
    </a>
  </nav>
  <?php endif; ?>

  <?php if (count($related) > 0): ?>
  <!-- ========== POWIĄZANE WPISY ========== -->
  <section class="post-related">
    <div class="wrap">
      <header class="section__head">
        <p class="eyebrow" data-anim="fade">Zobacz też</p>
        <h2 class="display" data-split>Powiązane wpisy</h2>
      </header>
      <div class="news-grid">
        <?php foreach ($related as $item): ?>
        <article class="news-card">
          <a class="news-card__media" href="/post.html?slug=<?= e(rawurlencode($item->slug)) ?>" data-cursor="Czytaj">
            <span class="news-card__cat"><?= e($item->category) ?></span>
            <img src="<?= e(pic($item->image, 'thumbs')) ?>" alt="<?= e($item->imageAlt) ?>" loading="lazy">
          </a>
          <div class="news-card__body">
            <span class="news-card__meta"><?= e(date_label_pl($item->date)) ?><i></i><?= e($item->readTime) ?> czytania</span>
            <h3 class="news-card__title"><a href="/post.html?slug=<?= e(rawurlencode($item->slug)) ?>"><?= e($item->title) ?></a></h3>
            <p class="news-card__excerpt"><?= e($item->excerpt) ?></p>
            <a href="/post.html?slug=<?= e(rawurlencode($item->slug)) ?>" class="news-card__link"><span>Czytaj dalej</span><i></i></a>
          </div>
        </article>
        <?php endforeach; ?>
      </div>
    </div>
  </section>
  <?php endif; ?>

</div>

<!-- ========== CTA ========== -->
<section class="cta" id="contact">
  <div class="cta__bg"><img src="<?= e(pic($ctaImage, 'large')) ?>" alt="" loading="lazy"></div>
  <div class="wrap cta__inner">
    <p class="eyebrow" data-anim="fade">Kontakt</p>
    <h2 class="display display--xl" data-split>Zróbmy coś pięknego</h2>
    <a href="mailto:studio@misza.photo" class="btn-line btn-line--lg magnetic"><span>studio@misza.photo</span><i></i></a>
  </div>
</section>
<?php endif; ?>

<?php partial('partials/footer', ['footer' => $content->footer, 'onHome' => false]); ?>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
<script src="/js/app.js"></script>
</body>
</html>
