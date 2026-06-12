import {
    redirecionarSeLogado,
    fazerLogin,
    cadastrarAluno,
    recuperarSenha
} from "./auth.js";

redirecionarSeLogado();

const telaLogin = document.getElementById("tela-login");
const telaCadastro = document.getElementById("tela-cadastro");
const telaRecuperar = document.getElementById("tela-recuperar");

const btnEntrar = document.getElementById("btn-entrar");
const btnCadastrar = document.getElementById("btn-cadastrar");
const btnRecuperar = document.getElementById("btn-recuperar");

const linkCadastrar = document.getElementById("link-cadastrar");
const linkEsqueci = document.getElementById("link-esqueci");
const linkVoltar = document.getElementById("link-voltar");
const linkVoltarLogin = document.getElementById("link-voltar-login");

const msgErro = document.getElementById("msg-erro");
const msgCadastro = document.getElementById("msg-cadastro");
const msgRecuperar = document.getElementById("msg-recuperar");

function mostrarTela(tela) {
    telaLogin.style.display = "none";
    telaCadastro.style.display = "none";
    telaRecuperar.style.display = "none";
    tela.style.display = "block";
}

linkCadastrar.addEventListener("click", (e) => {
    e.preventDefault();
    mostrarTela(telaCadastro);
});

linkEsqueci.addEventListener("click", (e) => {
    e.preventDefault();
    mostrarTela(telaRecuperar);
});

linkVoltar.addEventListener("click", (e) => {
    e.preventDefault();
    mostrarTela(telaLogin);
});

linkVoltarLogin.addEventListener("click", (e) => {
    e.preventDefault();
    mostrarTela(telaLogin);
});

btnEntrar.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
        mostrarErro(msgErro, "Preencha e-mail e senha.");
        return;
    }

    btnEntrar.textContent = "Entrando...";
    btnEntrar.disabled = true;

    const erro = await fazerLogin(email, senha);

    if (erro) {
        mostrarErro(msgErro, erro);
        btnEntrar.textContent = "Entrar";
        btnEntrar.disabled = false;
    }
});

btnCadastrar.addEventListener("click", async () => {
    const nome = document.getElementById("cad-nome").value.trim();
    const email = document.getElementById("cad-email").value.trim();
    const senha = document.getElementById("cad-senha").value;
    const senha2 = document.getElementById("cad-senha2").value;

    // Validações
    if (!nome || !email || !senha || !senha2) {
        mostrarErro(msgCadastro, "Preencha todos os campos.");
        return;
    }

    if (senha !== senha2) {
        mostrarErro(msgCadastro, "As senhas não coincidem.");
        return;
    }

    if (senha.length < 6) {
        mostrarErro(msgCadastro, "A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    btnCadastrar.textContent = "Criando conta...";
    btnCadastrar.disabled = true;

    const resultado = await cadastrarAluno(nome, email, senha);

    if (resultado.sucesso) {
        msgCadastro.style.display = "block";
        msgCadastro.style.background = "rgba(34,197,94,0.15)";
        msgCadastro.style.borderColor = "rgba(34,197,94,0.4)";
        msgCadastro.style.color = "#4ade80";
        msgCadastro.textContent =
            "Conta criada! Verifique seu e-mail e aguarde a aprovação do professor.";
    } else {
        mostrarErro(msgCadastro, resultado.mensagem);
    }

    btnCadastrar.textContent = "Criar conta";
    btnCadastrar.disabled = false;
});

btnRecuperar.addEventListener("click", async () => {
    const email = document.getElementById("email-recuperar").value.trim();

    if (!email) {
        mostrarErro(msgRecuperar, "Digite seu e-mail.");
        return;
    }

    btnRecuperar.textContent = "Enviando...";
    btnRecuperar.disabled = true;

    const resultado = await recuperarSenha(email);

    if (resultado.sucesso) {
        msgRecuperar.style.display = "block";
        msgRecuperar.style.background = "rgba(34,197,94,0.15)";
        msgRecuperar.style.borderColor = "rgba(34,197,94,0.4)";
        msgRecuperar.style.color = "#4ade80";
        msgRecuperar.textContent = "Link enviado! Verifique seu e-mail.";
    } else {
        mostrarErro(msgRecuperar, resultado.mensagem);
    }

    btnRecuperar.textContent = "Enviar link";
    btnRecuperar.disabled = false;
});

function mostrarErro(elemento, mensagem) {
    elemento.style.background = "";
    elemento.style.borderColor = "";
    elemento.style.color = "";
    elemento.textContent = mensagem;
    elemento.style.display = "block";
}