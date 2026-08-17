/* Generuje hash bcrypt dla hasła administratora do wklejenia w .env jako ADMIN_PASSWORD_HASH. */
const readline = require('node:readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Podaj hasło administratora: ', async (password) => {
  rl.close();
  if (!password) {
    console.error('Hasło nie może być puste.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  console.log('\nADMIN_PASSWORD_HASH=' + hash);
  console.log('\nWklej powyższą linię do pliku .env.');
});
