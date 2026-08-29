require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const CAMINHO_USUARIOS = path.join(__dirname, 'usuarios.json');

// Funções auxiliares
function lerUsuarios() {
  if (!fs.existsSync(CAMINHO_USUARIOS)) return [];
  const dados = fs.readFileSync(CAMINHO_USUARIOS, 'utf8');
  return JSON.parse(dados || '[]');
}

function salvarUsuarios(usuarios) {
  fs.writeFileSync(CAMINHO_USUARIOS, JSON.stringify(usuarios, null, 4), 'utf8');
}

// Configuração do Passport + Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Middlewares
app.use(helmet({
  // Desativado por padrão: o CSP restritivo do Helmet bloqueia scripts/estilos
  // inline que as páginas em public/ ainda usam. Ative e ajuste as diretivas
  // quando quiser reforçar isso (veja https://helmetjs.github.io/#content-security-policy).
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.URL_FRONTEND || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.JWT_SECRET || 'segredo_temporario',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Rotas normais de login/cadastro
app.use('/', authRoutes);

// ========== ROTAS DO GOOGLE ==========

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?erro=google' }),
  (req, res) => {
    try {
      const profile = req.user;
      const email = profile.emails?.[0]?.value;
      const nome = profile.displayName;
      const googleId = profile.id;

      if (!email) {
        return res.redirect('/?erro=sem-email');
      }

      let usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

      if (!usuario) {
        const stmt = db.prepare(`
          INSERT INTO usuarios (nome, email, googleId, emailVerificado)
          VALUES (?, ?, ?, 1)
        `);
        const info = stmt.run(nome, email, googleId);
        usuario = { id: info.lastInsertRowid, nome, email };
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      res.redirect(`/painel.html?token=${token}&nome=${encodeURIComponent(usuario.nome)}`);
    } catch (erro) {
      console.error('Erro no callback do Google:', erro);
      res.redirect('/?erro=callback');
    }
  }
);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});