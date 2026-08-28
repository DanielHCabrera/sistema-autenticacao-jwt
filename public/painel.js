document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const usuarioLogado = localStorage.getItem('usuarioLogado');

  // Se não tiver token, volta para o login
  if (!token || !usuarioLogado) {
    window.location.href = 'index.html';
    return;
  }

  const dados = JSON.parse(usuarioLogado);
  document.getElementById('bemvindo').textContent = 
    `Olá, ${dados.nome || dados.email}! Você está logado.`;

  // Botão de sair
  document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
  });
});