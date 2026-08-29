const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const {
  gerarAccessToken,
  gerarRefreshToken,
  validarRefreshToken,
  revogarRefreshToken,
  revogarTodosRefreshTokensDoUsuario
} = require('../middlewares/tokens');
const { registrarTentativaLogin } = require('../middlewares/logAcesso');
const { enviarEmailRedefinicaoSenha } = require('../middlewares/email');

const router = express.Router();
const SALT_ROUNDS = 10;
const DURACAO_TOKEN_RESET_HORAS = 1;

// Limita tentativas de login por IP para dificultar ataques de força bruta
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { sucesso: false, mensagem: 'Muitas tentativas de login. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

const limiteRefresh = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

const limiteEsqueciSenha = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { sucesso: false, mensagem: 'Muitas solicitações. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

const buscarUsuarioPorEmail = db.prepare('SELECT * FROM usuarios WHERE email = ?');
const buscarUsuarioPorId = db.prepare('SELECT * FROM usuarios WHERE id = ?');
const atualizarSenhaUsuario = db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?');

const inserirTokenReset = db.prepare(`
  INSERT INTO tokens_redefinicao_senha (token, usuarioId, expiraEm)
  VALUES (?, ?, ?)
`);
const buscarTokenReset = db.prepare('SELECT * FROM tokens_redefinicao_senha WHERE token = ?');
const marcarTokenResetUsado = db.prepare('UPDATE tokens_redefinicao_senha SET usado = 1 WHERE token = ?');

// ========== LOGIN ==========
router.post('/login', limiteLogin, async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: 'Preencha e-mail e senha.' });
  }

  const usuario = buscarUsuarioPorEmail.get(email);

  if (!usuario || !usuario.senha) {
    registrarTentativaLogin(req, email, false);
    return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha incorretos.' });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

  if (!senhaCorreta) {
    registrarTentativaLogin(req, email, false);
    return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha incorretos.' });
  }

  registrarTentativaLogin(req, email, true);

  const accessToken = gerarAccessToken(usuario);
  const refreshToken = gerarRefreshToken(usuario.id);

  return res.json({
    sucesso: true,
    mensagem: 'Login realizado com sucesso!',
    accessToken,
    refreshToken,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
  });
});

// ========== REFRESH ==========
router.post('/refresh', limiteRefresh, (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ sucesso: false, mensagem: 'Refresh token não fornecido.' });
  }

  const registro = validarRefreshToken(refreshToken);

  if (!registro) {
    return res.status(401).json({ sucesso: false, mensagem: 'Refresh token inválido ou expirado.' });
  }

  const usuario = buscarUsuarioPorId.get(registro.usuarioId);

  if (!usuario) {
    return res.status(401).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
  }

  return res.json({ sucesso: true, accessToken: gerarAccessToken(usuario) });
});

// ========== LOGOUT ==========
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    revogarRefreshToken(refreshToken);
  }

  return res.json({ sucesso: true, mensagem: 'Logout realizado.' });
});

// ========== CADASTRO ==========
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, dataNascimento, telefone } = req.body;

  if (!nome || !email || !senha || !dataNascimento || !telefone) {
    return res.status(400).json({ sucesso: false, mensagem: 'Preencha todos os campos.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Digite um e-mail válido.' });
  }

  if (senha.length < 8) {
    return res.status(400).json({ sucesso: false, mensagem: 'A senha deve ter no mínimo 8 caracteres.' });
  }

  const temLetra = /[a-zA-Z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);

  if (!temLetra || !temNumero) {
    return res.status(400).json({ sucesso: false, mensagem: 'A senha deve conter pelo menos 1 letra e 1 número.' });
  }

  const emailExiste = buscarUsuarioPorEmail.get(email);
  if (emailExiste) {
    return res.status(409).json({ sucesso: false, mensagem: 'Este e-mail já está cadastrado.' });
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

// ========== ESQUECI MINHA SENHA ==========
router.post('/esqueci-senha', limiteEsqueciSenha, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ sucesso: false, mensagem: 'Informe o e-mail.' });
  }

  const usuario = buscarUsuarioPorEmail.get(email);

  // Resposta idêntica exista ou não o e-mail, para não revelar quais e-mails estão cadastrados
  const respostaPadrao = {
    sucesso: true,
    mensagem: 'Se o e-mail existir em nossa base, você receberá um link de redefinição.'
  };

  if (!usuario) {
    return res.json(respostaPadrao);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + DURACAO_TOKEN_RESET_HORAS * 60 * 60 * 1000).toISOString();

  inserirTokenReset.run(token, usuario.id, expiraEm);

  const urlBase = process.env.URL_FRONTEND || 'http://localhost:3000';
  const linkRedefinicao = `${urlBase}/redefinir-senha.html?token=${token}`;

  await enviarEmailRedefinicaoSenha(usuario.email, linkRedefinicao);

  return res.json(respostaPadrao);
});

// ========== REDEFINIR SENHA ==========
router.post('/redefinir-senha', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    return res.status(400).json({ sucesso: false, mensagem: 'Token e nova senha são obrigatórios.' });
  }

  if (novaSenha.length < 8 || !/[a-zA-Z]/.test(novaSenha) || !/[0-9]/.test(novaSenha)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'A senha deve ter no mínimo 8 caracteres, com letra e número.'
    });
  }

  const registro = buscarTokenReset.get(token);

  if (!registro || registro.usado || new Date(registro.expiraEm).getTime() < Date.now()) {
    return res.status(400).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });
  }

  const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
  atualizarSenhaUsuario.run(senhaHash, registro.usuarioId);
  marcarTokenResetUsado.run(token);

  // Por segurança, derruba todas as sessões ativas desse usuário
  revogarTodosRefreshTokensDoUsuario(registro.usuarioId);

  return res.json({ sucesso: true, mensagem: 'Senha redefinida com sucesso. Faça login novamente.' });
});

module.exports = router;