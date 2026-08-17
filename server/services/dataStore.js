const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const locks = new Map();

function withLock(name, fn) {
  const prev = locks.get(name) || Promise.resolve();
  const next = prev.then(fn, fn).finally(() => {
    if (locks.get(name) === next) locks.delete(name);
  });
  locks.set(name, next);
  return next;
}

async function readJSON(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function writeJSON(name, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, `${name}.json`);
  const tmp = path.join(DATA_DIR, `.${name}.${process.pid}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, file);
}

// czyta, przekazuje dane do updater(data), zapisuje wynik — pod blokadą per plik,
// żeby dwa równoczesne zapisy (np. dwie karty otwarte w panelu) się nie nadpisały
async function update(name, updater) {
  return withLock(name, async () => {
    const data = await readJSON(name);
    const result = await updater(data);
    const toWrite = result !== undefined ? result : data;
    await writeJSON(name, toWrite);
    return toWrite;
  });
}

module.exports = { readJSON, writeJSON, update, DATA_DIR };
