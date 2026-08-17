/* Jednorazowa migracja: index.html -> data/site-content.json
   Format obrazków: { file: "nazwa.jpg", variant: "thumbs"|"large" } — ścieżka budowana
   przy renderze jako pictures/<variant>/<file>, spójnie z konwencją galerii. */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const $ = cheerio.load(html);

function imgRef($img) {
  const src = ($img.attr('src') || '').trim();
  const parts = src.split('/'); // pictures/<variant>/<file>
  return { file: parts[2] || parts.pop(), variant: parts[1] || 'large', alt: $img.attr('alt') || '' };
}

function text(sel, scope = $) {
  return scope(sel).first().text().replace(/\s+/g, ' ').trim();
}

/* ---------- hero ---------- */
const slides = [];
$('#hero [data-slide]').each((i, el) => {
  const $el = $(el);
  const img = imgRef($el.find('.slide__media img'));
  slides.push({
    ...img,
    eyebrow: text('.eyebrow', $el.find.bind($el)),
    title: text('.slide__title', $el.find.bind($el)),
  });
});

/* ---------- about ---------- */
const aboutImgs = $('#about .about__media figure img');
const about = {
  eyebrow: text('#about .eyebrow'),
  heading: text('#about .display'),
  text: text('#about .lead'),
  images: [
    { ...imgRef($(aboutImgs.get(0))), size: 'main' },
    { ...imgRef($(aboutImgs.get(1))), size: 'small' },
  ],
  stats: $('#about .about__list li').map((i, el) => ({
    value: $(el).find('b').text().trim(),
    label: $(el).find('span').text().trim(),
  })).get(),
};

/* ---------- showcase ---------- */
const showcase = {
  eyebrow: text('#showcase .showcase__intro .eyebrow'),
  heading: $('#showcase .showcase__intro .display').first().html().replace(/<br\s*\/?>/gi, '\n').replace(/\s*\n\s*/g, '\n').trim(),
  lead: text('#showcase .showcase__intro .lead'),
  items: $('#showcase .show-item[data-index]').map((i, el) => {
    const $el = $(el);
    const $img = $el.find('img');
    return {
      ...imgRef($img),
      width: Number($img.attr('width')) || null,
      height: Number($img.attr('height')) || null,
      title: text('h3', $el.find.bind($el)),
      subtitle: text('.show-item__meta span', $el.find.bind($el)),
    };
  }).get(),
};

/* ---------- services ---------- */
const services = {
  eyebrow: text('#services .section__head .eyebrow'),
  heading: text('#services .section__head .display'),
  items: $('#services .svc__row').map((i, el) => {
    const $el = $(el);
    const imgSrc = ($el.attr('data-img') || '').split('/');
    return {
      number: text('.svc__num', $el.find.bind($el)),
      title: text('.svc__title', $el.find.bind($el)),
      tags: text('.svc__tags', $el.find.bind($el)),
      file: imgSrc[2] || imgSrc.pop(),
      variant: imgSrc[1] || 'thumbs',
    };
  }).get(),
};

/* ---------- cta ---------- */
const ctaImg = imgRef($('#contact .cta__bg img'));
const cta = {
  eyebrow: text('#contact .eyebrow'),
  heading: text('#contact .display--xl'),
  text: text('#contact .lead'),
  email: $('#contact a[href^="mailto:"]').first().text().trim(),
  backgroundFile: ctaImg.file,
  backgroundVariant: ctaImg.variant,
};

/* ---------- instagram ---------- */
const instagram = {
  handle: $('.insta__label b').text().trim(),
  profileUrl: $('.insta__label').closest('section').find('a').first().attr('href') || '#',
  items: $('.insta__row .insta__item').map((i, el) => {
    const $el = $(el);
    return { ...imgRef($el.find('img')), link: $el.attr('href') || '#' };
  }).get(),
};

/* ---------- footer ---------- */
const brandP = $('.footer__col--brand p').first();
const brandHtml = brandP.html() || '';
const [tagline, address] = brandHtml.split(/<br\s*\/?>/i).map((s) => s.replace(/<[^>]+>/g, '').trim());

const kontaktCol = $('.footer__col').filter((i, el) => $(el).find('h4').text().trim() === 'Kontakt');
const footer = {
  tagline: tagline || '',
  address: address || '',
  email: kontaktCol.find('a[href^="mailto:"]').text().trim(),
  phone: kontaktCol.find('a[href^="tel:"]').text().trim(),
  social: kontaktCol.find('a').filter((i, el) => {
    const href = $(el).attr('href') || '';
    return !href.startsWith('mailto:') && !href.startsWith('tel:');
  }).map((i, el) => ({ label: $(el).text().trim(), url: $(el).attr('href') })).get(),
};

const content = { hero: { slides }, about, showcase, services, cta, instagram, footer };

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'site-content.json'), JSON.stringify(content, null, 2) + '\n');

console.log('Zmigrowano treść strony głównej: site-content.json');
console.log(`  hero: ${slides.length} slajdów, about: ${about.images.length} zdjęć / ${about.stats.length} statystyk,`);
console.log(`  showcase: ${showcase.items.length} kafli, services: ${services.items.length} pozycji,`);
console.log(`  instagram: ${instagram.items.length} zdjęć, footer social: ${footer.social.length} linków.`);
