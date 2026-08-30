require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authRoutes = require('./routes/auth');
const db = require('./db');
const logger = require('./logger');
const { gerarAccessToken, gerarRefreshToken } = require('./middlewares/tokens');

const app = express();
const PORT = process.env.PORT || 3000;
const URL_BASE = process.env.URL_FRONTEND || `http://localhost:${PORT}`;

// Necessário quando o app roda atrás de um proxy reverso (Render, Railway, Heroku, etc.),
// para que req.ip e os cookies "secure" funcionem corretamente.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Configuração do Passport + Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${URL_BASE}/auth/google/callback`
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
  origin: URL_BASE,
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (mensagem) => logger.http(mensagem.trim()) }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.JWT_SECRET || 'segredo_temporario',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production'
  }
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

      logger.info('Login via Google', { email, id: usuario.id });

      const accessToken = gerarAccessToken(usuario);
      const refreshToken = gerarRefreshToken(usuario.id);

      res.redirect(
        `/google-callback.html?accessToken=${accessToken}&refreshToken=${refreshToken}` +
        `&nome=${encodeURIComponent(usuario.nome)}&email=${encodeURIComponent(usuario.email)}&id=${usuario.id}`
      );
    } catch (erro) {
      logger.error('Erro no callback do Google', { erro: erro.message });
      res.redirect('/?erro=callback');
    }
  }
);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handler de erros não tratados nas rotas (garante que tudo passe pelo logger)
app.use((erro, req, res, next) => {
  logger.error('Erro não tratado', { erro: erro.message, stack: erro.stack, rota: req.originalUrl });
  res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  logger.info(`Servidor rodando em ${URL_BASE}`);
});