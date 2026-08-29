const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

const DURACAO_ACCESS_TOKEN = '15m';
const DURACAO_REFRESH_TOKEN_DIAS = 7;

const inserirRefreshToken = db.prepare(`
  INSERT INTO refresh_tokens (token, usuarioId, expiraEm)
  VALUES (?, ?, ?)
`);
const buscarRefreshToken = db.prepare(`
  SELECT * FROM refresh_tokens WHERE token = ?
`);
const apagarRefreshToken = db.prepare(`
  DELETE FROM refresh_tokens WHERE token = ?
`);
const apagarRefreshTokensDoUsuario = db.prepare(`
  DELETE FROM refresh_tokens WHERE usuarioId = ?
`);

function gerarAccessToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome
    },
    process.env.JWT_SECRET,
    { expiresIn: DURACAO_ACCESS_TOKEN }
  );
}

// Gera um refresh token opaco (não é JWT) e salva no banco, para poder ser revogado
function gerarRefreshToken(usuarioId) {
  const token = crypto.randomBytes(40).toString('hex');
  const expiraEm = new Date(Date.now() + DURACAO_REFRESH_TOKEN_DIAS * 24 * 60 * 60 * 1000).toISOString();

  inserirRefreshToken.run(token, usuarioId, expiraEm);

  return token;
}

function validarRefreshToken(token) {
  const registro = buscarRefreshToken.get(token);

  if (!registro) return null;

  if (new Date(registro.expiraEm).getTime() < Date.now()) {
    apagarRefreshToken.run(token);
    return null;
  }

  return registro;
}

function revogarRefreshToken(token) {
  apagarRefreshToken.run(token);
}

function revogarTodosRefreshTokensDoUsuario(usuarioId) {
  apagarRefreshTokensDoUsuario.run(usuarioId);
}

module.exports = {
  gerarAccessToken,
  gerarRefreshToken,
  validarRefreshToken,
  revogarRefreshToken,
  revogarTodosRefreshTokensDoUsuario,
  DURACAO_ACCESS_TOKEN
};