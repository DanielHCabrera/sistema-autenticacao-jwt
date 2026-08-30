document.addEventListener('DOMContentLoaded', async () => {
  const mensagem = document.getElementById('mensagem');
  const parametros = new URLSearchParams(window.location.search);
  const token = parametros.get('token');

  if (!token) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Link inválido: token não encontrado.';
    return;
  }

  try {
    const resposta = await fetch('/verificar-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const dados = await resposta.json();

    mensagem.style.color = resposta.ok ? 'green' : 'red';
    mensagem.textContent = dados.mensagem || 'Erro ao confirmar o e-mail.';
  } catch (erro) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro ao conectar com o servidor.';
    console.error(erro);
  }
});