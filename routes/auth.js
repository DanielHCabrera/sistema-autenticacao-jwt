const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const verificarToken = require('../middlewares/auth');
const db = require('../db');

const router = express.Router();
const SALT_ROUNDS = 10;

// Limita tentativas de login por IP para dificultar ataques de força bruta
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP nesse período
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de login. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Consultas preparadas (reaproveitadas entre requisições, mais rápidas e seguras)
const buscarUsuarioPorEmail = db.prepare('SELECT * FROM usuarios WHERE email = ?');
const inserirUsuario = db.prepare(`
  INSERT INTO usuarios (nome, email, senha, dataNascimento, telefone, cargo)
  VALUES (@nome, @email, @senha, @dataNascimento, @telefone, @cargo)
`);

// Rota de Login
router.post('/login', limiteLogin, async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Preencha e-mail e senha.'
    });
  }

  const usuarioEncontrado = buscarUsuarioPorEmail.get(email);

  if (!usuarioEncontrado) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'E-mail ou senha incorretos.'
    });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuarioEncontrado.senha);

  if (senhaCorreta) {
    // Gera o token JWT
    const token = jwt.sign(
      {
        email: usuarioEncontrado.email,
        nome: usuarioEncontrado.nome,
        cargo: usuarioEncontrado.cargo
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      token: token,
      usuario: {
        nome: usuarioEncontrado.nome,
        email: usuarioEncontrado.email,
        cargo: usuarioEncontrado.cargo
      }
    });
  }

  return res.status(401).json({
    sucesso: false,
    mensagem: 'E-mail ou senha incorretos.'
  });
});

// Rota de Cadastro
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, dataNascimento, telefone, cargo } = req.body;

  // Validação de campos obrigatórios
  if (!nome || !email || !senha || !dataNascimento || !telefone || !cargo) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Preencha todos os campos.'
    });
  }

  // Validação de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Digite um e-mail válido.'
    });
  }

  // Validação de senha forte
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

  // Sanitização básica dos campos de texto livre
  const nomeSanitizado = validator.escape(nome.trim());
  const telefoneSanitizado = telefone.replace(/\D/g, ''); // mantém só números
  const emailSanitizado = validator.normalizeEmail(email) || email;

  const emailJaCadastrado = buscarUsuarioPorEmail.get(emailSanitizado);

  if (emailJaCadastrado) {
    return res.status(409).json({
      sucesso: false,
      mensagem: 'Este e-mail já está cadastrado.'
    });
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  try {
    inserirUsuario.run({
      nome: nomeSanitizado,
      email: emailSanitizado,
      senha: senhaHash,
      dataNascimento,
      telefone: telefoneSanitizado,
      cargo
    });
  } catch (erro) {
    // Ex.: corrida de duas requisições tentando cadastrar o mesmo e-mail ao mesmo tempo
    if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Este e-mail já está cadastrado.'
      });
    }
    throw erro;
  }

  return res.status(201).json({
    sucesso: true,
    mensagem: 'Cadastro realizado com sucesso!'
  });
});

// Rota protegida de exemplo
router.get('/painel', verificarToken, (req, res) => {
  return res.json({
    sucesso: true,
    mensagem: 'Acesso autorizado',
    usuario: req.usuario
  });
});

module.exports = router;