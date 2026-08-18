<footer class="footer">
  <div class="wrap footer__grid">
    <div class="footer__col footer__col--brand">
      <a class="header__logo" href="/">MISZA<i>®</i></a>
      <p><?= e($footer->tagline) ?><br><?= e($footer->address) ?></p>
    </div>
    <div class="footer__col">
      <h4>Nawigacja</h4>
      <a href="/">Start</a>
      <a href="/gallery.html">Galeria</a>
      <a href="<?= $onHome ? '#about' : '/#about' ?>">O studio</a>
      <a href="/aktualnosci.html">Aktualności</a>
      <a href="<?= $onHome ? '#services' : '/#services' ?>">Usługi</a>
    </div>
    <div class="footer__col">
      <h4>Kontakt</h4>
      <a href="mailto:<?= e($footer->email) ?>"><?= e($footer->email) ?></a>
      <a href="tel:<?= e(preg_replace('/\s+/', '', $footer->phone)) ?>"><?= e($footer->phone) ?></a>
      <?php foreach ($footer->social as $social): ?>
      <a href="<?= e($social->url) ?>"><?= e($social->label) ?></a>
      <?php endforeach; ?>
    </div>
    <div class="footer__col footer__col--news">
      <h4>Newsletter</h4>
      <form class="news" onsubmit="return false">
        <input type="email" placeholder="Twój e-mail" aria-label="E-mail" required>
        <button type="submit">Zapisz się</button>
      </form>
    </div>
  </div>
  <div class="wrap footer__bottom">
    <span>© <span id="year"></span> Misza Photography. Wszystkie prawa zastrzeżone.</span>
    <span>Warszawa · PL</span>
  </div>
</footer>
