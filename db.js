const path = require('path');
const Database = require('better-sqlite3');

const CAMINHO_BANCO = path.join(__dirname, 'banco.sqlite');

const db = new Database(CAMINHO_BANCO);

// Boas práticas de performance/confiabilidade do SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Cria a tabela de usuários caso ainda não exista
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    dataNascimento TEXT,
    telefone TEXT,
    cargo TEXT,
    criadoEm TEXT DEFAULT (datetime('now'))
  )
`);

module.exports = db;