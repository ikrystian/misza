/* Masowe (re)generowanie wariantów thumbs/ i large/ z oryginałów w pictures/.
   Odpowiednik dawnej pętli ImageMagick z README — użyteczne po ręcznym
   dorzuceniu plików bezpośrednio do pictures/ (poza panelem administratora). */
const fs = require('fs');
const path = require('path');
const imageService = require('../server/services/imageService');

const ROOT = path.join(__dirname, '..');
const PICTURES = path.join(ROOT, 'pictures');
const EXT_RE = /\.(jpe?g|png|webp)$/i;
const SKIP_DIRS = new Set(['thumbs', 'large']);

function findOriginals(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      found.push(...findOriginals(path.join(dir, entry.name)));
    } else if (EXT_RE.test(entry.name)) {
      found.push(path.join(dir, entry.name));
    }
  }
  return found;
}

async function main() {
  const files = findOriginals(PICTURES);

  if (!files.length) {
    console.log('Brak oryginałów w pictures/ (poza thumbs/ i large/) — nic do zrobienia.');
    return;
  }

  console.log(`Znaleziono ${files.length} oryginałów. Generuję warianty…`);
  for (const filePath of files) {
    const filename = path.basename(filePath);
    const buffer = fs.readFileSync(filePath);
    const { width, height } = await imageService.generateVariants(buffer, filename);
    console.log(`  ${filename} -> ${width}x${height}`);
  }
  console.log('Gotowe.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
