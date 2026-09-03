// Envio de e-mail via API HTTP da Brevo (não via SMTP).
// Motivo: provedores de hospedagem gratuitos (Render, Railway, etc.) costumam
// bloquear as portas de saída de SMTP (25, 465, 587) para evitar spam.
// A API da Brevo funciona por HTTPS normal (porta 443), sem esse bloqueio.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const brevoConfigurado = Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);

async function enviarViaBrevo({ destinatario, assunto, texto, html }) {
  const resposta = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NOME || 'Login' },
      to: [{ email: destinatario }],
      subject: assunto,
      textContent: texto,
      htmlContent: html
    })
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    throw new Error(`Brevo respondeu ${resposta.status}: ${corpo}`);
  }
}

async function enviarEmailRedefinicaoSenha(destinatario, linkRedefinicao) {
  if (!brevoConfigurado) {
    console.log('--- [MODO DEV: BREVO_API_KEY/EMAIL_FROM não configurados] ---');
    console.log(`Link de redefinição de senha para ${destinatario}:`);
    console.log(linkRedefinicao);
    console.log('-----------------------------------------');
    return;
  }

  await enviarViaBrevo({
    destinatario,
    assunto: 'Redefinição de senha',
    texto: `Clique no link para redefinir sua senha (válido por 1 hora): ${linkRedefinicao}`,
    html: `<p>Clique no link abaixo para redefinir sua senha (válido por 1 hora):</p><p><a href="${linkRedefinicao}">${linkRedefinicao}</a></p>`
  });
}

async function enviarEmailVerificacao(destinatario, linkVerificacao) {
  if (!brevoConfigurado) {
    console.log('--- [MODO DEV: BREVO_API_KEY/EMAIL_FROM não configurados] ---');
    console.log(`Link de verificação de e-mail para ${destinatario}:`);
    console.log(linkVerificacao);
    console.log('-----------------------------------------');
    return;
  }

  await enviarViaBrevo({
    destinatario,
    assunto: 'Confirme seu e-mail',
    texto: `Clique no link para confirmar seu e-mail (válido por 24 horas): ${linkVerificacao}`,
    html: `<p>Clique no link abaixo para confirmar seu e-mail (válido por 24 horas):</p><p><a href="${linkVerificacao}">${linkVerificacao}</a></p>`
  });
}

module.exports = { enviarEmailRedefinicaoSenha, enviarEmailVerificacao };