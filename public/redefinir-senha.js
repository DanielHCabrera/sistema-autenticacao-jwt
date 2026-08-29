document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('redefinirSenhaForm');
  const mensagem = document.getElementById('mensagem');

  if (!form) {
    console.error('Formulário não encontrado!');
    return;
  }

  const parametros = new URLSearchParams(window.location.search);
  const token = parametros.get('token');

  if (!token) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Link inválido: token não encontrado. Solicite a redefinição novamente.';
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (novaSenha.length < 8) {
      mensagem.style.color = 'red';
      mensagem.textContent = 'A senha deve ter no mínimo 8 caracteres.';
      return;
    }

    const temLetra = /[a-zA-Z]/.test(novaSenha);
    const temNumero = /[0-9]/.test(novaSenha);

    if (!temLetra || !temNumero) {
      mensagem.style.color = 'red';
      mensagem.textContent = 'A senha deve conter pelo menos 1 letra e 1 número.';
      return;
    }

    if (novaSenha !== confirmarSenha) {
      mensagem.style.color = 'red';
      mensagem.textContent = 'As senhas não coincidem.';
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    try {
      const resposta = await fetch('/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
      });

      const dados = await resposta.json();

      mensagem.style.color = resposta.ok ? 'green' : 'red';
      mensagem.textContent = dados.mensagem || 'Erro ao redefinir a senha.';

      if (resposta.ok) {
        form.reset();
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        botao.disabled = false;
      }
    } catch (erro) {
      mensagem.style.color = 'red';
      mensagem.textContent = 'Erro ao conectar com o servidor.';
      console.error(erro);
      botao.disabled = false;
    }
  });
});