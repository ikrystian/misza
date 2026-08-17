require('dotenv').config();

const required = ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'SESSION_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(
    `Brakuje zmiennych środowiskowych: ${missing.join(', ')}. ` +
    'Skopiuj .env.example do .env, uzupełnij dane i wygeneruj hash hasła poleceniem `npm run hash-password`.'
  );
}

module.exports = {
  port: Number(process.env.PORT) || 4173,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  adminUsername: process.env.ADMIN_USERNAME,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  sessionSecret: process.env.SESSION_SECRET,
};
