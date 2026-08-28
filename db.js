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

console.log('Banco de dados SQLite conectado com sucesso!');

module.exports = db;