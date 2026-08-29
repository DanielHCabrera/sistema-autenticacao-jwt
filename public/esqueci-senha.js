document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('esqueciSenhaForm');
  const mensagem = document.getElementById('mensagem');

  if (!form) {
    console.error('Formulário não encontrado!');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();

    if (!email) {
      mensagem.style.color = 'red';
      mensagem.textContent = 'Informe seu e-mail.';
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    try {
      const resposta = await fetch('/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const dados = await resposta.json();

      mensagem.style.color = resposta.ok ? 'green' : 'red';
      mensagem.textContent = dados.mensagem || 'Erro ao processar a solicitação.';

      if (resposta.ok) {
        form.reset();
      }
    } catch (erro) {
      mensagem.style.color = 'red';
      mensagem.textContent = 'Erro ao conectar com o servidor.';
      console.error(erro);
    } finally {
      botao.disabled = false;
    }
  });
});