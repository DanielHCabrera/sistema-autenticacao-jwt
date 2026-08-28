document.addEventListener('DOMContentLoaded', () => {
  // Verifica se veio token pela URL (login com Google)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  const nomeFromUrl = urlParams.get('nome');

  if (tokenFromUrl) {
    localStorage.setItem('token', tokenFromUrl);
    localStorage.setItem('usuarioLogado', JSON.stringify({
      nome: nomeFromUrl || 'Usuário',
      email: ''
    }));
    // Limpa a URL
    window.history.replaceState({}, document.title, '/painel.html');
  }

  const token = localStorage.getItem('token');
  const usuarioLogado = localStorage.getItem('usuarioLogado');

  if (!token || !usuarioLogado) {
    window.location.href = 'index.html';
    return;
  }

  const dados = JSON.parse(usuarioLogado);
  document.getElementById('bemvindo').textContent = 
    `Olá, ${dados.nome || 'Usuário'}! Você está logado.`;

  document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
  });
});