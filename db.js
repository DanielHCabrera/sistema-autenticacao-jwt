const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Cria a tabela de usuários se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT,
    googleId TEXT,
    dataNascimento TEXT,
    telefone TEXT,
    emailVerificado INTEGER DEFAULT 0,
    criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Refresh tokens (sessões de longa duração, permitem renovar o access token e revogar sessões)
db.exec(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    usuarioId INTEGER NOT NULL,
    criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
    expiraEm TEXT NOT NULL,
    FOREIGN KEY (usuarioId) REFERENCES usuarios (id) ON DELETE CASCADE
  )
`);

// Tokens de redefinição de senha ("esqueci minha senha")
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens_redefinicao_senha (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    usuarioId INTEGER NOT NULL,
    criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
    expiraEm TEXT NOT NULL,
    usado INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (usuarioId) REFERENCES usuarios (id) ON DELETE CASCADE
  )
`);

// Logs de auditoria de acesso (tentativas de login, sucesso ou falha)
db.exec(`
  CREATE TABLE IF NOT EXISTS logs_acesso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    sucesso INTEGER NOT NULL,
    ip TEXT,
    userAgent TEXT,
    criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('Banco de dados SQLite conectado com sucesso!');

module.exports = db;