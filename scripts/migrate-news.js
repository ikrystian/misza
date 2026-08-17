/* Jednorazowa migracja: js/news-data.js -> data/news.json */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'js', 'news-data.js'), 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const posts = sandbox.window.MISZA_NEWS || [];

function basename(p) {
  return p.split('/').pop();
}

const news = posts.map(({ dateLabel, image, thumb, ...rest }) => ({
  ...rest,
  image: basename(image),
}));

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'news.json'), JSON.stringify(news, null, 2) + '\n');

console.log(`Zmigrowano ${news.length} wpisów aktualności.`);
