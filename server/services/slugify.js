const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

// ł/Ł nie mają dekompozycji NFKD (to osobne litery, nie l + znak diakrytyczny),
// więc trzeba je zamienić ręcznie przed resztą normalizacji
const POLISH_MAP = { ł: 'l', Ł: 'L' };

function slugify(str) {
  return String(str)
    .replace(/[łŁ]/g, (ch) => POLISH_MAP[ch])
    .normalize('NFKD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { slugify };
