<!DOCTYPE html>
<html lang="pl">
<head>
<?php partial('partials/head', [
  'title' => 'MISZA — Studio Fotografii Modowej',
  'description' => 'Misza — studio fotografii modowej, portretowej i editorial. Kadry, które zostają na dłużej.',
]); ?>
</head>
<body class="is-loading">
<?php partial('partials/header', ['active' => 'home', 'onHome' => true]); ?>

<!-- ========== HERO SLIDER ========== -->
<section class="hero" id="hero">
  <canvas class="hero__smoke" id="heroSmokeCanvas"></canvas>
  <div class="hero__slides">
    <?php foreach ($content->hero->slides as $i => $slide): ?>
    <article class="slide<?= $i === 0 ? ' is-active' : '' ?>" data-slide>
      <div class="slide__media"><img src="<?= e(pic($slide->file, $slide->variant)) ?>" alt="<?= e($slide->alt) ?>"></div>
      <div class="slide__copy">
        <p class="eyebrow" data-split><?= e($slide->eyebrow) ?></p>
        <h2 class="slide__title" data-split><?= e($slide->title) ?></h2>
        <a href="/gallery.html" class="btn-line magnetic"><span>Zobacz sesję</span><i></i></a>
      </div>
    </article>
    <?php endforeach; ?>
  </div>

  <div class="hero__side">Wybrane prace</div>

  <div class="hero__nav">
    <button class="hero__arrow" data-dir="-1"><span>Prev</span></button>
    <div class="hero__count"><b id="slideNum">01</b><em></em><span id="slideTotal"><?= pad2(count($content->hero->slides)) ?></span></div>
    <button class="hero__arrow" data-dir="1"><span>Next</span></button>
  </div>

  <div class="hero__dots" id="heroDots"></div>
  <div class="hero__progress"><i id="heroProgress"></i></div>

  <a href="#about" class="hero__scroll"><span>Przewiń</span><i></i></a>
</section>

<!-- ========== MARQUEE ========== -->
<div class="marquee" aria-hidden="true">
  <div class="marquee__track" data-marquee>
    <span>Fotografia modowa <i>✦</i> Portret <i>✦</i> Editorial <i>✦</i> Beauty <i>✦</i> Lookbook <i>✦</i></span>
    <span>Fotografia modowa <i>✦</i> Portret <i>✦</i> Editorial <i>✦</i> Beauty <i>✦</i> Lookbook <i>✦</i></span>
  </div>
</div>

<!-- ========== ABOUT ========== -->
<?php
$mainImg = null;
$smallImg = null;
foreach ($content->about->images as $image) {
    if (($image->size ?? '') === 'main') {
        $mainImg = $image;
    } elseif (($image->size ?? '') === 'small') {
        $smallImg = $image;
    }
}
?>
<section class="about section" id="about">
  <div class="wrap about__grid">

    <div class="about__media">
      <figure class="reveal-img" data-parallax="-60">
        <img src="<?= e(pic(prop($mainImg, 'file'), prop($mainImg, 'variant'))) ?>" alt="<?= e(prop($mainImg, 'alt')) ?>" loading="lazy">
      </figure>
      <figure class="reveal-img about__media--small" data-parallax="60">
        <img src="<?= e(pic(prop($smallImg, 'file'), prop($smallImg, 'variant'))) ?>" alt="<?= e(prop($smallImg, 'alt')) ?>" loading="lazy">
      </figure>
    </div>

    <div class="about__body">
      <p class="eyebrow" data-anim="fade"><?= eyebrow_html($content->about->eyebrow) ?></p>
      <h2 class="display" data-split><?= e($content->about->heading) ?></h2>
      <p class="lead" data-anim="fade">
        <?= e($content->about->text) ?>
      </p>

      <ul class="about__list" data-anim="stagger">
        <?php foreach ($content->about->stats as $stat): ?>
        <li><b><?= e($stat->value) ?></b><span><?= e($stat->label) ?></span></li>
        <?php endforeach; ?>
      </ul>

      <a href="/gallery.html" class="btn-line magnetic"><span>Zobacz portfolio</span><i></i></a>
    </div>

  </div>
</section>

<!-- ========== HORIZONTAL SHOWCASE ========== -->
<section class="showcase" id="showcase">
  <div class="showcase__track" id="showcaseTrack">

    <div class="showcase__intro">
      <p class="eyebrow"><?= eyebrow_html($content->showcase->eyebrow) ?></p>
      <h2 class="display"><?= multiline_html($content->showcase->heading) ?></h2>
      <p class="lead"><?= e($content->showcase->lead) ?></p>
      <span class="showcase__hint"><i></i> przeciągnij lub scrolluj</span>
    </div>

    <?php foreach ($content->showcase->items as $i => $item): ?>
    <?php $variant = $item->variant ?? 'thumbs'; ?>
    <article class="show-item" data-index="<?= pad2($i + 1) ?>">
      <a href="/gallery.html"
         class="show-item__media<?= !empty($item->hoverFile) ? ' has-hover-effect' : '' ?>"
         data-cursor="Zobacz"
         data-img1="<?= e(pic($item->file, $variant)) ?>"
         <?php if (!empty($item->hoverFile)): ?>data-img2="<?= e(pic($item->hoverFile, $variant)) ?>"<?php endif; ?>>
        <img src="<?= e(pic($item->file, $variant)) ?>" width="<?= e($item->width) ?>" height="<?= e($item->height) ?>" alt="<?= e($item->alt) ?>" loading="lazy">
      </a>
      <div class="show-item__meta"><h3><?= e($item->title) ?></h3><span><?= e($item->subtitle) ?></span></div>
    </article>
    <?php endforeach; ?>

    <article class="show-item show-item--end">
      <a href="/gallery.html" class="show-item__all magnetic"><span>Cała<br>galeria</span><i></i></a>
    </article>

  </div>
</section>

<!-- ========== AKTUALNOŚCI ========== -->
<section class="news-home section" id="news">
  <div class="wrap">
    <header class="section__head">
      <p class="eyebrow" data-anim="fade">03 &nbsp;//&nbsp; Aktualności</p>
      <h2 class="display" data-split>Ze studia</h2>
    </header>

    <div class="news-grid" data-anim="stagger">
      <?php foreach ($latestNews as $post): ?>
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

    <div class="news-home__foot">
      <a href="/aktualnosci.html" class="btn-line magnetic"><span>Wszystkie wpisy</span><i></i></a>
    </div>
  </div>
</section>

<!-- ========== SERVICES ========== -->
<section class="services section" id="services">
  <div class="wrap">
    <header class="section__head">
      <p class="eyebrow" data-anim="fade"><?= eyebrow_html($content->services->eyebrow) ?></p>
      <h2 class="display" data-split><?= e($content->services->heading) ?></h2>
    </header>

    <ul class="svc" id="svcList">
      <?php foreach ($content->services->items as $item): ?>
      <li class="svc__row" data-img="<?= e(pic($item->file, $item->variant)) ?>">
        <span class="svc__num"><?= e($item->number) ?></span>
        <h3 class="svc__title"><?= e($item->title) ?></h3>
        <span class="svc__tags"><?= e($item->tags) ?></span>
        <i class="svc__arrow"></i>
      </li>
      <?php endforeach; ?>
    </ul>
  </div>

  <div class="svc__preview" id="svcPreview"><img src="" alt=""></div>
</section>

<!-- ========== CTA ========== -->
<section class="cta">
  <div class="cta__bg"><img src="<?= e(pic($content->cta->backgroundFile, $content->cta->backgroundVariant)) ?>" alt="" loading="lazy"></div>
  <div class="wrap cta__inner">
    <p class="eyebrow" data-anim="fade"><?= eyebrow_html($content->cta->eyebrow) ?></p>
    <h2 class="display display--xl" data-split><?= e($content->cta->heading) ?></h2>
    <p class="lead" data-anim="fade"><?= e($content->cta->text) ?></p>
    <a href="mailto:<?= e($content->cta->email) ?>" class="btn-line btn-line--lg magnetic"><span><?= e($content->cta->email) ?></span><i></i></a>
  </div>
</section>

<!-- ========== INSTAGRAM ========== -->
<section class="insta">
  <p class="eyebrow insta__label" data-anim="fade">Obserwuj na Instagramie <b><?= e($content->instagram->handle) ?></b></p>
  <div class="insta__row">
    <?php foreach ($content->instagram->items as $item): ?>
    <a href="<?= e($item->link) ?>" class="insta__item" data-cursor="Instagram"><img src="<?= e(pic($item->file, $item->variant)) ?>" alt="" loading="lazy"></a>
    <?php endforeach; ?>
  </div>
</section>

<!-- ========== KONTAKT ========== -->
<section class="contact section" id="contact">
  <div class="wrap contact__grid">
    <div class="contact__info">
      <p class="eyebrow" data-anim="fade"><?= eyebrow_html($content->cta->eyebrow) ?></p>
      <h2 class="display" data-split><?= e($content->cta->heading) ?></h2>
      <p class="lead" data-anim="fade"><?= e($content->cta->text) ?></p>

      <ul class="contact__details" data-anim="stagger">
        <li>
          <span>E-mail</span>
          <a href="mailto:<?= e($content->footer->email) ?>"><?= e($content->footer->email) ?></a>
        </li>
        <li>
          <span>Telefon</span>
          <a href="tel:<?= e(preg_replace('/\s+/', '', $content->footer->phone)) ?>"><?= e($content->footer->phone) ?></a>
        </li>
        <li>
          <span>Studio</span>
          <span><?= e($content->footer->address) ?></span>
        </li>
      </ul>

      <div class="contact__social">
        <?php foreach ($content->footer->social as $social): ?>
        <a href="<?= e($social->url) ?>"><?= e($social->label) ?></a>
        <?php endforeach; ?>
      </div>
    </div>

    <form class="contact__form" id="contactForm" data-anim="fade" data-to="<?= e($content->footer->email) ?>">
      <div class="contact__form-row">
        <label><span>Imię i nazwisko</span><input type="text" name="name" required></label>
        <label><span>E-mail</span><input type="email" name="email" required></label>
      </div>
      <label><span>Temat</span><input type="text" name="subject" placeholder="Np. sesja portretowa"></label>
      <label><span>Wiadomość</span><textarea name="message" rows="5" required></textarea></label>
      <button type="submit" class="btn-line btn-line--lg magnetic"><span>Wyślij wiadomość</span><i></i></button>
    </form>
  </div>
</section>

<?php partial('partials/footer', ['footer' => $content->footer, 'onHome' => true]); ?>

<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
<script src="/js/hover-effect.umd.js"></script>
<script src="/js/smokey-cursor.js"></script>
<script src="/js/app.js"></script>
<script src="/js/home.js"></script>
</body>
</html>
