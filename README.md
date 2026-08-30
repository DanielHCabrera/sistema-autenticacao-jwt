# Login

Sistema de autenticação em Node.js/Express com cadastro, verificação de e-mail, login (e-mail/senha e Google OAuth), JWT e banco SQLite.

## Stack

- Node.js + Express
- SQLite (via `better-sqlite3`)
- bcrypt (hash de senha)
- jsonwebtoken (JWT)
- passport + passport-google-oauth20 (login com Google)
- express-rate-limit (limite de tentativas)
- helmet + cors (headers de segurança)
- nodemailer (envio de e-mail)
- winston + morgan (logs estruturados)

## Como rodar localmente

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

Veja `.env.example` para a lista completa e comentada. Nenhum valor real de segredo deve ser commitado no repositório.

## Estrutura

```
routes/auth.js            Rotas de login, cadastro, verificação, tokens, senha
middlewares/auth.js        Middleware de verificação de access token JWT
middlewares/tokens.js       Geração/validação de access e refresh tokens
middlewares/logAcesso.js    Registro de tentativas de login (banco + logger)
middlewares/email.js        Envio de e-mails (verificação, redefinição de senha)
db.js                       Conexão e schema do banco SQLite
logger.js                   Configuração do logger (Winston)
logs/                       Arquivos de log gerados em runtime (não versionados)
public/                     Front-end estático (HTML/CSS/JS)
```

## Funcionalidades

- Cadastro com validação de senha forte
- Verificação de e-mail obrigatória antes do primeiro login (com reenvio)
- Login com e-mail/senha (hash bcrypt) e login com Google (OAuth 2.0)
- Tokens JWT de curta duração + refresh token revogável
- Rate limiting nas rotas sensíveis (login, e-mail, senha)
- Recuperação de senha por e-mail
- Logs estruturados (arquivo + console) e log de tentativas de login (auditoria)

## Deploy em produção (Render, Railway ou similar)

1. **Suba o repositório para o GitHub** (sem `.env`, `node_modules/` ou o banco local — já cobertos pelo `.gitignore`).

2. **Crie o serviço** na plataforma escolhida, apontando para este repositório.
   - Build command: `npm install`
   - Start command: `npm start`

3. **Configure as variáveis de ambiente** no painel da plataforma (não em um arquivo `.env` — em produção, cada plataforma tem sua própria tela para isso). Use as mesmas chaves do `.env.example`, com estes ajustes:
   - `NODE_ENV=production`
   - `URL_FRONTEND=` a URL pública que a plataforma vai te dar (ex: `https://seu-projeto.onrender.com`)
   - `JWT_SECRET=` gere um novo valor aleatório só para produção (não reaproveite o de desenvolvimento)

4. **Atualize o Google Cloud Console**: em "Credenciais" > seu OAuth Client ID, adicione `https://seu-projeto.onrender.com/auth/google/callback` na lista de "URIs de redirecionamento autorizados".

5. **Banco de dados**: o SQLite é um arquivo local. Se a plataforma usa um disco efêmero (o padrão nos planos gratuitos), o banco é apagado a cada novo deploy. Para persistir os dados, verifique se a plataforma oferece um "disco persistente" (Render tem essa opção nos planos pagos) ou migre para um banco gerenciado (PostgreSQL, por exemplo) quando o projeto crescer.

6. Depois do primeiro deploy, teste o fluxo completo: cadastro → e-mail de verificação → confirmação → login → painel → logout, e o login com Google.