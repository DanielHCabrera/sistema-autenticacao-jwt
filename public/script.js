document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const mensagem = document.getElementById('mensagem');

  if (!form) {
    console.error('Formulário não encontrado!');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
      const resposta = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        mensagem.style.color = 'green';
        mensagem.textContent = dados.mensagem;

        // Salva accessToken, refreshToken e os dados do usuário
        salvarSessao(dados.accessToken, dados.refreshToken, dados.usuario);

        setTimeout(() => {
          window.location.href = 'painel.html';
        }, 100);
      } else if (dados.emailNaoVerificado) {
        mensagem.style.color = 'red';
        mensagem.innerHTML = `${dados.mensagem} <a href="#" id="linkReenviar">Reenviar e-mail de confirmação</a>`;

        document.getElementById('linkReenviar').addEventListener('click', async (evento) => {
          evento.preventDefault();
          try {
            const respostaReenvio = await fetch('/reenviar-verificacao', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
            const dadosReenvio = await respostaReenvio.json();
            mensagem.style.color = 'green';
            mensagem.textContent = dadosReenvio.mensagem;
          } catch (erroReenvio) {
            console.error(erroReenvio);
          }
        });
      } else {
        mensagem.style.color = 'red';
        mensagem.textContent = dados.mensagem;
      }
    } catch (erro) {
      mensagem.style.color = 'red';
      mensagem.textContent = 'Erro ao conectar com o servidor.';
      console.error(erro);
    }
  });
});