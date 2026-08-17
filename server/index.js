const env = require('./config/env');
const app = require('./app');

app.listen(env.port, () => {
  console.log(`MISZA — serwer działa: http://localhost:${env.port}`);
});
