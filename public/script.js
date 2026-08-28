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

  // Salva o token e os dados do usuário
  localStorage.setItem('token',dados.token);
  localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));

  setTimeout (() => {
    window.location.href = 'painel.html';
  }, 100);
  } else {
    mensagem.style.color = 'red';
    mensagem.textContent = dados.mensagem;
  }

  // Salva os dados do usuário no navegador
  localStorage.setItem('usuarioLogado', JSON.stringify({
    email: document.getElementById('email').value
  }));

    } catch (erro) {
      mensagem.style.color = 'red';
      mensagem.textContent = 'Erro ao conectar com o servidor.';
      console.error(erro);
    }
  });
});