# Login

Sistema de autenticação em Node.js/Express com cadastro, login (e-mail/senha e Google OAuth), JWT e banco SQLite.

## Stack

- Node.js + Express
- SQLite (via `better-sqlite3`)
- bcrypt (hash de senha)
- jsonwebtoken (JWT)
- passport + passport-google-oauth20 (login com Google)
- express-rate-limit (limite de tentativas de login)
- validator (sanitização de dados)

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente e preencha com seus valores:
   ```bash
   cp .env.example .env
   ```

3. Inicie o servidor:
   ```bash
   npm start
   ```

4. Acesse `http://localhost:3000`

## Variáveis de ambiente

Veja `.env.example` para a lista completa. Nenhum valor real de segredo deve ser commitado no repositório.

## Estrutura

```
routes/auth.js        Rotas de login, cadastro e afins
middlewares/auth.js    Middleware de verificação de token JWT
middlewares/tokens.js  Geração/validação de access e refresh tokens
middlewares/logAcesso.js  Registro de tentativas de login
middlewares/email.js   Envio de e-mail de redefinição de senha
db.js                  Conexão e schema do banco SQLite
public/                Front-end estático (HTML/CSS/JS)
```

## Funcionalidades

- Cadastro com validação de senha forte e sanitização de dados
- Login com e-mail/senha (hash bcrypt) e login com Google (OAuth 2.0)
- Tokens JWT de curta duração + refresh token revogável
- Rate limiting nas rotas sensíveis (login, redefinição de senha)
- Recuperação de senha por e-mail
- Log de tentativas de login (auditoria)