import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD0qod43LV8xa8poMBkMwR21jDZ_dRNawI",
    authDomain: "curso-bateria-f839c.firebaseapp.com",
    projectId: "curso-bateria-f839c",
    storageBucket: "curso-bateria-f839c.firebasestorage.app",
    messagingSenderId: "1010753273089",
    appId: "1:1010753273089:web:7fa6e72c7d987c6d77af00"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const EMAIL_ADMIN = "thiagodelemosferreiraa@gmail.com";

let cadastrandoAgora = false;

export async function cadastrarAluno(nome, email, senha) {
    cadastrandoAgora = true;

    try {
        const credencial = await createUserWithEmailAndPassword(auth, email, senha);
        const usuario = credencial.user;

        await sendEmailVerification(usuario);

        await setDoc(doc(db, "alunos", usuario.uid), {
            nome: nome,
            email: email,
            status: "pendente",
            criadoEm: new Date().toISOString()
        });

        await signOut(auth);

        cadastrandoAgora = false;
        return { sucesso: true };

    } catch (erro) {
        cadastrandoAgora = false;
        console.error("Erro no cadastro:", erro);
        return { sucesso: false, mensagem: traduzirErro(erro.code) };
    }
}

export async function fazerLogin(email, senha) {
    try {
        const credencial = await signInWithEmailAndPassword(auth, email, senha);
        const usuario = credencial.user;

        if (usuario.email === EMAIL_ADMIN) {
            // FIX: caminho correto a partir de index.html na raiz
            window.location.href = "./pages/admin.html";
            return null;
        }

        await usuario.reload();

        if (!usuario.emailVerified) {
            return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
        }

        const docAluno = await getDoc(doc(db, "alunos", usuario.uid));

        if (!docAluno.exists()) {
            await signOut(auth);
            return "Conta não encontrada. Entre em contato com o professor.";
        }

        if (docAluno.data().status !== "aprovado") {
            await signOut(auth);
            return "Sua conta ainda está aguardando aprovação do professor.";
        }

        // FIX: caminho correto a partir de index.html na raiz
        window.location.href = "./pages/home.html";
        return null;

    } catch (erro) {
        return traduzirErro(erro.code);
    }
}

export function protegerPagina() {
    onAuthStateChanged(auth, async (usuario) => {
        console.log("🔥 onAuthStateChanged disparou:", usuario ? usuario.email : "NULL");
        console.log("emailVerified:", usuario?.emailVerified);

        if (!usuario) {
            console.log("❌ usuario null — redirecionando");
            window.location.href = "../index.html";
            return;
        }
        // resto do código...
    });
}

export function protegerAdmin() {
    onAuthStateChanged(auth, (usuario) => {
        if (!usuario || usuario.email !== EMAIL_ADMIN) {
            // FIX: caminho correto a partir de /pages/
            window.location.href = "../index.html";
        }
    });
}

export function redirecionarSeLogado() {
    onAuthStateChanged(auth, async (usuario) => {
        if (cadastrandoAgora) return;
        if (!usuario) return;

        try {
            // 🔥 força atualizar os dados do usuário no Firebase
            await usuario.reload();

            // pega o usuário atualizado
            usuario = auth.currentUser;

            if (!usuario) return;

            // ✅ ADMIN PRIMEIRO
            if (usuario.email === EMAIL_ADMIN) {
                window.location.href = "./pages/admin.html";
                return;
            }

            // ✅ só depois verifica email
            if (!usuario.emailVerified) {
                await signOut(auth);
                return;
            }

            const docAluno = await getDoc(doc(db, "alunos", usuario.uid));

            if (!docAluno.exists()) {
                await signOut(auth);
                return;
            }

            if (docAluno.data().status === "aprovado") {
                window.location.href = "./pages/home.html";
            } else {
                await signOut(auth);
            }

        } catch (erro) {
            console.error("Erro ao verificar login:", erro);
            await signOut(auth);
        }
    });
}

export async function recuperarSenha(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { sucesso: true };
    } catch (erro) {
        return { sucesso: false, mensagem: traduzirErro(erro.code) };
    }
}

export async function fazerLogout() {
    await signOut(auth);
    // FIX: caminho correto a partir de /pages/
    window.location.href = "../index.html";
}

export function getUsuarioAtual() {
    return auth.currentUser;
}

function traduzirErro(codigo) {
    const erros = {
        "auth/user-not-found": "Nenhuma conta encontrada com esse e-mail.",
        "auth/wrong-password": "Senha incorreta. Tente novamente.",
        "auth/invalid-email": "E-mail inválido.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
        "auth/email-already-in-use": "Esse e-mail já está cadastrado.",
        "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
        "auth/network-request-failed": "Sem conexão com a internet.",
        "auth/invalid-credential": "E-mail ou senha incorretos."
    };
    return erros[codigo] || "Ocorreu um erro. Tente novamente.";
}