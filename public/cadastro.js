document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cadastroForm');
  const mensagem = document.getElementById('mensagem');

  if (!form) {
    console.error('Formulário não encontrado!');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const dataNascimento = document.getElementById('dataNascimento').value;
    const telefone = document.getElementById('telefone').value.trim();
    const cargo = document.getElementById('cargo').value.trim();

  // Validação de senha no frontend
if (senha.length < 8) {
  mensagem.style.color = 'red';
  mensagem.textContent = 'A senha deve ter no mínimo 8 caracteres.';
  return;
}

const temLetra = /[a-zA-Z]/.test(senha);
const temNumero = /[0-9]/.test(senha);

if (!temLetra || !temNumero) {
  mensagem.style.color = 'red';
  mensagem.textContent = 'A senha deve conter pelo menos 1 letra e 1 número.';
  return;
}

if (senha !== confirmarSenha) {
  mensagem.style.color = 'red';
  mensagem.textContent = 'As senhas não coincidem.';
  return;
}

    try {
      const resposta = await fetch('/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome, email, senha, dataNascimento, telefone, cargo })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
  mensagem.style.color = 'green';
  mensagem.textContent = dados.mensagem + ' Redirecionando...';
  form.reset();

  // Redireciona para o login depois de 1.5 segundos
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1500);
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