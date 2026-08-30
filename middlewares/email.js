const nodemailer = require('nodemailer');

// Se as variáveis SMTP_* não estiverem no .env, o link de redefinição
// é apenas impresso no console — útil para testar sem precisar de um servidor de e-mail de verdade.
const smtpConfigurado = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

let transporter = null;

if (smtpConfigurado) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function enviarEmailRedefinicaoSenha(destinatario, linkRedefinicao) {
  if (!smtpConfigurado) {
    console.log('--- [MODO DEV: SMTP não configurado] ---');
    console.log(`Link de redefinição de senha para ${destinatario}:`);
    console.log(linkRedefinicao);
    console.log('-----------------------------------------');
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destinatario,
    subject: 'Redefinição de senha',
    text: `Clique no link para redefinir sua senha (válido por 1 hora): ${linkRedefinicao}`,
    html: `<p>Clique no link abaixo para redefinir sua senha (válido por 1 hora):</p><p><a href="${linkRedefinicao}">${linkRedefinicao}</a></p>`
  });
}

async function enviarEmailVerificacao(destinatario, linkVerificacao) {
  if (!smtpConfigurado) {
    console.log('--- [MODO DEV: SMTP não configurado] ---');
    console.log(`Link de verificação de e-mail para ${destinatario}:`);
    console.log(linkVerificacao);
    console.log('-----------------------------------------');
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destinatario,
    subject: 'Confirme seu e-mail',
    text: `Clique no link para confirmar seu e-mail (válido por 24 horas): ${linkVerificacao}`,
    html: `<p>Clique no link abaixo para confirmar seu e-mail (válido por 24 horas):</p><p><a href="${linkVerificacao}">${linkVerificacao}</a></p>`
  });
}

module.exports = { enviarEmailRedefinicaoSenha, enviarEmailVerificacao };