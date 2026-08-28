const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SALT_ROUNDS = 10;

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Preencha e-mail e senha.'
    });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

  if (usuario && usuario.senha) {
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (senhaCorreta) {
      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        sucesso: true,
        mensagem: 'Login realizado com sucesso!',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      });
    }
  }

  return res.status(401).json({
    sucesso: false,
    mensagem: 'E-mail ou senha incorretos.'
  });
});

// ========== CADASTRO ==========
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, dataNascimento, telefone } = req.body;

  if (!nome || !email || !senha || !dataNascimento || !telefone) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Preencha todos os campos.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Digite um e-mail válido.'
    });
  }

  if (senha.length < 8) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'A senha deve ter no mínimo 8 caracteres.'
    });
  }

  const temLetra = /[a-zA-Z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);

  if (!temLetra || !temNumero) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'A senha deve conter pelo menos 1 letra e 1 número.'
    });
  }

  // Verifica se o e-mail já existe
  const emailExiste = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (emailExiste) {
    return res.status(409).json({
      sucesso: false,
      mensagem: 'Este e-mail já está cadastrado.'
    });
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  const stmt = db.prepare(`
    INSERT INTO usuarios (nome, email, senha, dataNascimento, telefone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const info = stmt.run(nome, email, senhaHash, dataNascimento, telefone);

  return res.status(201).json({
    sucesso: true,
    mensagem: 'Cadastro realizado com sucesso!',
    id: info.lastInsertRowid
  });
});

module.exports = router;