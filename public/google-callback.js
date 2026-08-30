document.addEventListener('DOMContentLoaded', () => {
  const parametros = new URLSearchParams(window.location.search);
  const accessToken = parametros.get('accessToken');
  const refreshToken = parametros.get('refreshToken');
  const nome = parametros.get('nome');
  const email = parametros.get('email');
  const id = parametros.get('id');

  if (!accessToken || !refreshToken) {
    window.location.href = 'index.html?erro=google';
    return;
  }

  salvarSessao(accessToken, refreshToken, { id, nome, email });

  // Redireciona sem deixar os tokens visíveis na URL/histórico do navegador
  window.location.replace('painel.html');
});