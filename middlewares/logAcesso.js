const db = require('../db');

const inserirLog = db.prepare(`
  INSERT INTO logs_acesso (email, sucesso, ip, userAgent)
  VALUES (?, ?, ?, ?)
`);

function registrarTentativaLogin(req, email, sucesso) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;

  inserirLog.run(email || null, sucesso ? 1 : 0, ip, userAgent);
}

module.exports = { registrarTentativaLogin };