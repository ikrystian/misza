/* Jednorazowa migracja: gallery.html -> data/gallery.json + data/categories.json */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'gallery.html'), 'utf8');
const $ = cheerio.load(html);

const categories = [];
$('#filters .filter').each((i, el) => {
  const $el = $(el);
  const slug = $el.attr('data-filter');
  if (slug === 'all') return;
  const label = $el.clone().children('sup').remove().end().text().trim();
  categories.push({ slug, label, order: categories.length + 1 });
});

function basename(p) {
  return p.split('/').pop();
}

const gallery = [];
$('#grid .card').each((i, el) => {
  const $el = $(el);
  const link = $el.find('.card__media');
  const img = link.find('img');
  const largeFile = basename(link.attr('href') || '');
  const thumbFile = basename(img.attr('src') || '');

  if (largeFile !== thumbFile) {
    console.warn(`Uwaga: różne nazwy pliku thumb/large dla kafla #${i + 1}: ${thumbFile} vs ${largeFile}`);
  }

  gallery.push({
    id: crypto.randomUUID(),
    category: $el.attr('data-cat'),
    title: $el.find('figcaption h3').text().trim(),
    alt: img.attr('alt') || '',
    file: thumbFile,
    width: Number(img.attr('width')) || null,
    height: Number(img.attr('height')) || null,
    order: i + 1,
  });
});

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'categories.json'), JSON.stringify(categories, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'data', 'gallery.json'), JSON.stringify(gallery, null, 2) + '\n');

console.log(`Zmigrowano ${categories.length} kategorii i ${gallery.length} zdjęć.`);
const counts = {};
gallery.forEach((g) => { counts[g.category] = (counts[g.category] || 0) + 1; });
console.log('Liczba zdjęć w kategoriach:', counts);
