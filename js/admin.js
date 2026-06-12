// ============================================
// ADMIN.JS — Painel do professor
// ============================================

import {
    protegerAdmin,
    fazerLogout,
    getUsuarioAtual
} from "./auth.js";

import { getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- Reutiliza o Firebase já iniciado no auth.js ---
const db = getFirestore(getApp());

// --- Protege a página ---
protegerAdmin();

// --- Estado local ---
let todosAlunos = [];
let filtroAtivo = "todos";
let termoBusca = "";

// --- Elementos ---
const corpoTabela = document.getElementById("corpo-tabela");
const inputBusca = document.getElementById("busca");
const infoProfessor = document.getElementById("info-professor");

// --- Info do professor logado ---
// Aguarda o auth estar pronto antes de buscar o usuário
setTimeout(() => {
    const professor = getUsuarioAtual();
    if (professor) {
        infoProfessor.textContent = "👤 " + professor.email;
    }
}, 1000);

// --- Logout ---
document.getElementById("link-logout").addEventListener("click", async (e) => {
    e.preventDefault();
    await fazerLogout();
});

// --- Carregar alunos do Firestore ---
async function carregarAlunos() {
    try {
        const snapshot = await getDocs(collection(db, "alunos"));
        todosAlunos = [];

        snapshot.forEach((docSnap) => {
            todosAlunos.push({ uid: docSnap.id, ...docSnap.data() });
        });

        atualizarStats();
        renderizarTabela();

    } catch (erro) {
        console.error("Erro ao carregar alunos:", erro);
        corpoTabela.innerHTML = `
            <tr><td colspan="5">
                <div class="tabela-vazia">
                    <span>❌</span>
                    Erro ao carregar alunos. Verifique as regras do Firestore.
                </div>
            </td></tr>`;
    }
}

// --- Atualizar cards de estatísticas ---
function atualizarStats() {
    const aprovados = todosAlunos.filter(a => a.status === "aprovado").length;
    const pendentes = todosAlunos.filter(a => a.status === "pendente").length;
    const bloqueados = todosAlunos.filter(a => a.status === "bloqueado").length;

    document.getElementById("stat-total").textContent = todosAlunos.length;
    document.getElementById("stat-aprovados").textContent = aprovados;
    document.getElementById("stat-pendentes").textContent = pendentes;
    document.getElementById("stat-bloqueados").textContent = bloqueados;
}

// --- Renderizar tabela ---
function renderizarTabela() {
    let lista = todosAlunos;

    if (filtroAtivo !== "todos") {
        lista = lista.filter(a => a.status === filtroAtivo);
    }

    if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        lista = lista.filter(a =>
            a.nome.toLowerCase().includes(termo) ||
            a.email.toLowerCase().includes(termo)
        );
    }

    if (lista.length === 0) {
        corpoTabela.innerHTML = `
            <tr><td colspan="5">
                <div class="tabela-vazia">
                    <span>🔍</span>
                    Nenhum aluno encontrado.
                </div>
            </td></tr>`;
        return;
    }

    corpoTabela.innerHTML = lista.map(aluno => `
        <tr>
            <td><strong>${aluno.nome}</strong></td>
            <td style="color: var(--cor-texto-suave);">${aluno.email}</td>
            <td style="color: var(--cor-texto-suave); font-size: 0.8rem;">
                ${formatarData(aluno.criadoEm)}
            </td>
            <td>
                <span class="status-badge status-${aluno.status}">
                    ${iconeStatus(aluno.status)} ${aluno.status}
                </span>
            </td>
            <td>
                <div class="acoes-grupo">
                    ${aluno.status !== "aprovado" ? `
                        <button class="btn-aprovar" onclick="alterarStatus('${aluno.uid}', 'aprovado')">
                            ✅ Aprovar
                        </button>` : ""}
                    ${aluno.status !== "bloqueado" ? `
                        <button class="btn-bloquear" onclick="alterarStatus('${aluno.uid}', 'bloqueado')">
                            🚫 Bloquear
                        </button>` : ""}
                    ${aluno.status === "bloqueado" ? `
                        <button class="btn-aprovar" onclick="alterarStatus('${aluno.uid}', 'pendente')">
                            🔄 Reativar
                        </button>` : ""}
                </div>
            </td>
        </tr>
    `).join("");
}

// --- Alterar status ---
window.alterarStatus = async function (uid, novoStatus) {
    try {
        await updateDoc(doc(db, "alunos", uid), { status: novoStatus });

        const index = todosAlunos.findIndex(a => a.uid === uid);
        if (index !== -1) todosAlunos[index].status = novoStatus;

        atualizarStats();
        renderizarTabela();

    } catch (erro) {
        console.error("Erro ao atualizar:", erro);
        alert("Erro ao atualizar status. Tente novamente.");
    }
};

// --- Filtros ---
document.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        filtroAtivo = btn.dataset.filtro;
        renderizarTabela();
    });
});

// --- Busca ---
inputBusca.addEventListener("input", (e) => {
    termoBusca = e.target.value.trim();
    renderizarTabela();
});

// --- Utilitários ---
function formatarData(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR");
}

function iconeStatus(status) {
    const icones = { pendente: "⏳", aprovado: "✅", bloqueado: "🚫" };
    return icones[status] || "•";
}

// --- Iniciar ---
carregarAlunos();