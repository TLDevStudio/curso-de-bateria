import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── Firebase init ────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyD0qod43LV8xa8poMBkMwR21jDZ_dRNawI",
    authDomain: "curso-bateria-f839c.firebaseapp.com",
    projectId: "curso-bateria-f839c",
    storageBucket: "curso-bateria-f839c.firebasestorage.app",
    messagingSenderId: "1010753273089",
    appId: "1:1010753273089:web:7fa6e72c7d987c6d77af00"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const EMAIL_ADMIN = "thiagodelemosferreiraa@gmail.com";

// ─── Estado global ────────────────────────────────────────────────────────────
let usuarioAtual = null;
let dadosAluno = null;
let progressoAluno = null;
let unsubscribeChat = null;

// ─── Estrutura dos módulos e aulas ───────────────────────────────────────────
const MODULOS = [
    {
        id: "modulo1",
        nome: "Módulo 1 — Fundamentos",
        desc: "Partes da bateria, postura e primeiros toques",
        cor: "#1e2a10",
        corIcone: "#5acd2a",
        icone: "ti-check",
        aulas: [
            { id: "m1a1", nome: "Conhecendo a bateria", dur: "10min", disponivel: true },
            { id: "m1a2", nome: "Postura e pegada das baquetas", dur: "12min", disponivel: true },
            { id: "m1a3", nome: "Primeiros toques no tambor", dur: "8min", disponivel: true },
            { id: "m1a4", nome: "Coordenação inicial pé e mão", dur: "15min", disponivel: true },
            { id: "m1a5", nome: "Leitura rítmica básica", dur: "11min", disponivel: true },
        ]
    },
    {
        id: "modulo2",
        nome: "Módulo 2 — Ritmo e Groove",
        desc: "Rudimentos, padrões de groove e variações",
        cor: "#2a1e00",
        corIcone: "#e8c94a",
        icone: "ti-music",
        aulas: [
            { id: "m2a1", nome: "Introdução ao groove", dur: "8min", disponivel: true },
            { id: "m2a2", nome: "Padrão básico de rock", dur: "12min", disponivel: true },
            { id: "m2a3", nome: "Variações no chimbal", dur: "10min", disponivel: true },
            { id: "m2a4", nome: "Rudimento: flam", dur: "9min", disponivel: true },
            { id: "m2a5", nome: "Groove no funk", dur: "14min", disponivel: true },
            { id: "m2a6", nome: "Groove no samba-rock", dur: "15min", disponivel: true },
            { id: "m2a7", nome: "Fills de 1 compasso", dur: "11min", disponivel: false },
            { id: "m2a8", nome: "Dinâmica: forte e piano", dur: "9min", disponivel: false },
            { id: "m2a9", nome: "Projeto final do módulo", dur: "20min", disponivel: false },
        ]
    },
    {
        id: "modulo3",
        nome: "Módulo 3 — Coordenação",
        desc: "Independência dos membros e polirritmos",
        cor: "#0a1e2a",
        corIcone: "#4ab8e8",
        icone: "ti-adjustments-horizontal",
        aulas: [
            { id: "m3a1", nome: "Pé direito e mão esquerda", dur: "10min", disponivel: false },
            { id: "m3a2", nome: "Padrões em 3/4", dur: "12min", disponivel: false },
            { id: "m3a3", nome: "Independência dos 4 membros", dur: "14min", disponivel: false },
            { id: "m3a4", nome: "Polirritmos básicos", dur: "16min", disponivel: false },
            { id: "m3a5", nome: "Exercícios de coordenação", dur: "13min", disponivel: false },
            { id: "m3a6", nome: "Aplicando em músicas reais", dur: "18min", disponivel: false },
            { id: "m3a7", nome: "Coordenação avançada", dur: "15min", disponivel: false },
            { id: "m3a8", nome: "Projeto final", dur: "20min", disponivel: false },
        ]
    },
    {
        id: "modulo4",
        nome: "Módulo 4 — Estilos Musicais",
        desc: "Rock, samba, jazz, funk e muito mais",
        cor: "#1a0a1e",
        corIcone: "#b87ee8",
        icone: "ti-star",
        aulas: [
            { id: "m4a1", nome: "Rock clássico", dur: "12min", disponivel: false },
            { id: "m4a2", nome: "Samba", dur: "15min", disponivel: false },
            { id: "m4a3", nome: "Jazz básico", dur: "14min", disponivel: false },
            { id: "m4a4", nome: "Funk avançado", dur: "16min", disponivel: false },
            { id: "m4a5", nome: "Bossa Nova", dur: "13min", disponivel: false },
            { id: "m4a6", nome: "Metal", dur: "15min", disponivel: false },
            { id: "m4a7", nome: "Blues", dur: "12min", disponivel: false },
            { id: "m4a8", nome: "Reggae e baião", dur: "14min", disponivel: false },
            { id: "m4a9", nome: "Fusão de estilos", dur: "18min", disponivel: false },
            { id: "m4a10", nome: "Performance final", dur: "25min", disponivel: false },
        ]
    }
];

const TOTAL_AULAS = MODULOS.reduce((acc, m) => acc + m.aulas.length, 0);

// ─── Proteção de página ───────────────────────────────────────────────────────
// FIX: reload() é feito ANTES de qualquer decisão; admin é identificado primeiro
onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        window.location.href = "../index.html";
        return;
    }

    // FIX: reload sempre primeiro para garantir emailVerified atualizado
    try {
        await usuario.reload();
    } catch (e) {
        // se o reload falhar (ex: offline), continua com o estado atual
        console.warn("Reload falhou:", e);
    }

    // FIX: admin identificado ANTES de qualquer outra verificação
    if (usuario.email === EMAIL_ADMIN) {
        usuarioAtual = usuario;
        dadosAluno = { nome: "Professor", email: usuario.email, status: "aprovado" };
        await inicializar();
        return;
    }

    // Aluno comum: precisa ter email verificado
    if (!usuario.emailVerified) {
        await signOut(auth);
        window.location.href = "../index.html";
        return;
    }

    try {
        const docRef = doc(db, "alunos", usuario.uid);
        const snap = await getDoc(docRef);

        if (!snap.exists() || snap.data().status !== "aprovado") {
            await signOut(auth);
            window.location.href = "../index.html";
            return;
        }

        usuarioAtual = usuario;
        dadosAluno = snap.data();
        await inicializar();
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
        await signOut(auth);
        window.location.href = "../index.html";
    }
});

// ─── Inicialização principal ──────────────────────────────────────────────────
async function inicializar() {
    await carregarProgresso();
    renderizarNome();
    renderizarAvatar();
    renderizarProgresso();
    renderizarStreak();
    renderizarModulos();
    renderizarProximaAula();
    iniciarChat();
    configurarNavegacao();
    configurarLogout();
}

// ─── Progresso do aluno ───────────────────────────────────────────────────────
async function carregarProgresso() {
    const ref = doc(db, "progresso", usuarioAtual.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        progressoAluno = snap.data();
    } else {
        progressoAluno = {
            aulasCompletas: [],
            streak: 0,
            ultimoEstudo: null,
            recordeStreak: 0,
            diasEstudados: []
        };
        await setDoc(ref, progressoAluno);
    }

    calcularStreak();
}

async function salvarProgresso() {
    const ref = doc(db, "progresso", usuarioAtual.uid);
    await updateDoc(ref, progressoAluno);
}

function calcularStreak() {
    const hoje = dataHoje();

    if (!progressoAluno.diasEstudados) {
        progressoAluno.diasEstudados = [];
    }

    if (progressoAluno.ultimoEstudo === hoje && !progressoAluno.diasEstudados.includes(hoje)) {
        progressoAluno.diasEstudados.push(hoje);
    }

    const dias = [...new Set(progressoAluno.diasEstudados)].sort();
    let streak = 0;
    let data = new Date();

    for (let i = 0; i < 365; i++) {
        const d = formatarData(data);
        if (dias.includes(d)) {
            streak++;
            data.setDate(data.getDate() - 1);
        } else if (i === 0) {
            data.setDate(data.getDate() - 1);
            continue;
        } else {
            break;
        }
    }

    progressoAluno.streak = streak;
    if (streak > (progressoAluno.recordeStreak || 0)) {
        progressoAluno.recordeStreak = streak;
    }
}

async function marcarAulaCompleta(aulaId) {
    if (!progressoAluno.aulasCompletas.includes(aulaId)) {
        progressoAluno.aulasCompletas.push(aulaId);
    }

    const hoje = dataHoje();
    progressoAluno.ultimoEstudo = hoje;

    if (!progressoAluno.diasEstudados) progressoAluno.diasEstudados = [];
    if (!progressoAluno.diasEstudados.includes(hoje)) {
        progressoAluno.diasEstudados.push(hoje);
    }

    calcularStreak();
    await salvarProgresso();

    renderizarProgresso();
    renderizarStreak();
    renderizarModulos();
    renderizarProximaAula();
}

// ─── Renderização do nome e avatar ───────────────────────────────────────────
function renderizarNome() {
    const primeiroNome = (dadosAluno.nome || "Aluno").split(" ")[0].toUpperCase();

    const elNome = document.querySelector(".welcome-text h1");
    if (elNome) elNome.innerHTML = `OLÁ, <span>${primeiroNome}!</span>`;
}

function renderizarAvatar() {
    const partes = (dadosAluno.nome || "AL").split(" ");
    const iniciais = partes.length >= 2
        ? partes[0][0] + partes[1][0]
        : partes[0].substring(0, 2);

    const avatarEl = document.querySelector(".avatar");
    if (avatarEl) avatarEl.textContent = iniciais.toUpperCase();

    document.querySelectorAll(".msg-av[data-eu]").forEach(el => {
        el.textContent = iniciais.toUpperCase();
    });

    window._alunoIniciais = iniciais.toUpperCase();
}

// ─── Renderização do progresso ────────────────────────────────────────────────
function renderizarProgresso() {
    const completas = progressoAluno.aulasCompletas.length;
    const pct = Math.round((completas / TOTAL_AULAS) * 100);

    const numEl = document.querySelector(".progress-num");
    const fillEl = document.getElementById("progressFill");
    const labelEl = document.querySelector(".progress-card div[style*='font-size:12px']");

    if (numEl) numEl.textContent = pct + "%";
    if (fillEl) {
        setTimeout(() => { fillEl.style.width = pct + "%"; }, 300);
    }
    if (labelEl) labelEl.textContent = `${completas} de ${TOTAL_AULAS} aulas concluídas`;
}

// ─── Renderização da streak ───────────────────────────────────────────────────
function renderizarStreak() {
    const streak = progressoAluno.streak || 0;
    const recorde = progressoAluno.recordeStreak || 0;

    const streakNumEl = document.querySelector(".streak-num");
    const streakLblEl = document.querySelector(".streak-lbl");
    const recordeEl = document.querySelector(".streak-card > div:last-child div:last-child");

    if (streakNumEl) streakNumEl.textContent = streak;
    if (streakLblEl) streakLblEl.textContent = `dia${streak !== 1 ? "s" : ""} seguido${streak !== 1 ? "s" : ""} 🔥`;
    if (recordeEl) recordeEl.textContent = recorde + " dias";

    const dotsEl = document.querySelector(".streak-days");
    if (dotsEl) {
        dotsEl.innerHTML = "";
        const hoje = dataHoje();
        const diasEstudados = progressoAluno.diasEstudados || [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = formatarData(d);

            const dot = document.createElement("div");
            if (ds === hoje) {
                dot.className = "day-dot " + (diasEstudados.includes(ds) ? "done" : "today");
            } else {
                dot.className = "day-dot " + (diasEstudados.includes(ds) ? "done" : "");
            }
            dotsEl.appendChild(dot);
        }
    }
}

// ─── Renderização dos módulos ─────────────────────────────────────────────────
function renderizarModulos() {
    const container = document.querySelector(".modulos-wrap");
    if (!container) return;

    const titulo = container.querySelector(".section-title");
    container.innerHTML = "";
    if (titulo) container.appendChild(titulo);

    MODULOS.forEach((modulo, idx) => {
        const aulasCompletas = modulo.aulas.filter(a =>
            progressoAluno.aulasCompletas.includes(a.id)
        ).length;
        const totalAulas = modulo.aulas.length;
        const pct = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;
        const concluido = aulasCompletas === totalAulas;
        const emAndamento = aulasCompletas > 0 && !concluido;
        const bloqueado = idx > 0 && MODULOS[idx - 1].aulas.filter(a =>
            progressoAluno.aulasCompletas.includes(a.id)
        ).length < MODULOS[idx - 1].aulas.filter(a => a.disponivel).length;

        const modId = modulo.id;
        const card = document.createElement("div");
        card.className = "modulo-card" + (emAndamento ? " em-andamento" : "");
        card.id = modId;

        let statusBadge = "";
        if (concluido) {
            statusBadge = `<span style="color:#5acd2a;font-weight:700;">Concluído</span>`;
        } else if (emAndamento) {
            statusBadge = `<span style="font-size:12px;background:#3a2e00;color:#e8c94a;padding:2px 8px;border-radius:5px;font-weight:700;">Em andamento</span>`;
        } else {
            statusBadge = `<span style="font-size:12px;color:#555;">${aulasCompletas}/${totalAulas} aulas</span>`;
        }

        const chevColor = emAndamento ? "#e8c94a" : concluido ? "#5acd2a" : "#555";
        const chevRot = emAndamento ? "rotate(180deg)" : "";
        const chevEl = concluido
            ? `<i class="ti ti-chevron-down" id="${modId}-chev" style="color:${chevColor};font-size:16px;transition:transform 0.2s;"></i>`
            : bloqueado && idx > 0
                ? `<i class="ti ti-lock" style="color:#555;font-size:16px;"></i>`
                : `<i class="ti ti-chevron-down" id="${modId}-chev" style="color:${chevColor};font-size:16px;transition:transform 0.2s;transform:${chevRot};"></i>`;

        card.innerHTML = `
            <div class="modulo-header" onclick="toggleMod('${modId}-body')">
                <div class="modulo-icon" style="background:${modulo.cor};">
                    <i class="ti ${modulo.icone}" style="color:${modulo.corIcone};font-size:20px;"></i>
                </div>
                <div class="modulo-meta">
                    <div class="modulo-nome">${modulo.nome}</div>
                    <div class="modulo-desc">${modulo.desc}</div>
                </div>
                <div class="modulo-stats">
                    ${statusBadge}
                    ${chevEl}
                </div>
            </div>
            <div class="modulo-prog-wrap" id="${modId}-body" style="display:${emAndamento ? 'block' : 'none'};">
                ${totalAulas > 0 ? `
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#888;margin-bottom:6px;">
                    <span>${aulasCompletas} de ${totalAulas} aulas concluídas</span>
                    <span style="color:${modulo.corIcone};font-weight:700;">${pct}%</span>
                </div>
                <div style="background:#2a2a2a;border-radius:99px;height:4px;margin-bottom:12px;">
                    <div style="background:${modulo.corIcone};border-radius:99px;height:4px;width:${pct}%;transition:width 0.5s;"></div>
                </div>` : ""}
                <div class="aulas-list">
                    ${modulo.aulas.map(aula => renderizarAulaItem(aula, modulo)).join("")}
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function renderizarAulaItem(aula, modulo) {
    const completa = progressoAluno.aulasCompletas.includes(aula.id);
    const proxima = !completa && aula.disponivel && proximaAulaId() === aula.id;
    const bloqueada = !aula.disponivel;

    if (completa) {
        return `
            <div class="aula-item">
                <div class="aula-status done"><i class="ti ti-check" style="font-size:11px;"></i></div>
                <span class="aula-nome done">${aula.nome}</span>
                <span class="aula-dur">${aula.dur}</span>
            </div>`;
    } else if (proxima) {
        return `
            <div class="aula-item" style="background:#1e1800;border-radius:8px;cursor:pointer;" onclick="abrirAula('${aula.id}', '${modulo.id}')">
                <div class="aula-status current"><i class="ti ti-player-play" style="font-size:11px;"></i></div>
                <span class="aula-nome current">${aula.nome}</span>
                <span class="aula-dur" style="color:${modulo.corIcone};">${aula.dur}</span>
            </div>`;
    } else if (bloqueada) {
        return `
            <div class="aula-item" style="opacity:0.5;">
                <div class="aula-status locked"><i class="ti ti-lock" style="font-size:11px;"></i></div>
                <span class="aula-nome" style="color:#555;">${aula.nome}</span>
                <span class="aula-dur">${aula.dur}</span>
            </div>`;
    } else {
        return `
            <div class="aula-item" style="cursor:pointer;" onclick="abrirAula('${aula.id}', '${modulo.id}')">
                <div class="aula-status" style="width:20px;height:20px;border-radius:50%;background:#2a2a2a;display:flex;align-items:center;justify-content:center;">
                    <i class="ti ti-player-play" style="font-size:11px;color:#555;"></i>
                </div>
                <span class="aula-nome" style="color:#888;">${aula.nome}</span>
                <span class="aula-dur">${aula.dur}</span>
            </div>`;
    }
}

// ─── Próxima aula ─────────────────────────────────────────────────────────────
function proximaAulaId() {
    for (const modulo of MODULOS) {
        for (const aula of modulo.aulas) {
            if (!progressoAluno.aulasCompletas.includes(aula.id) && aula.disponivel) {
                return aula.id;
            }
        }
    }
    return null;
}

function dadosProximaAula() {
    for (const modulo of MODULOS) {
        for (let i = 0; i < modulo.aulas.length; i++) {
            const aula = modulo.aulas[i];
            if (!progressoAluno.aulasCompletas.includes(aula.id) && aula.disponivel) {
                return { aula, modulo, index: i + 1 };
            }
        }
    }
    return null;
}

function renderizarProximaAula() {
    const dados = dadosProximaAula();
    const tagEl = document.querySelector(".pa-tag");
    const tituloEl = document.querySelector(".pa-titulo");
    const durEl = document.querySelector(".proxima-aula > div[style*='gap:8px']");
    const btnEl = document.querySelector(".pa-btn");

    if (!dados) {
        if (tagEl) tagEl.textContent = "Curso concluído! 🎉";
        if (tituloEl) tituloEl.textContent = "Parabéns! Você completou todos os módulos disponíveis.";
        if (btnEl) btnEl.style.display = "none";
        return;
    }

    const { aula, modulo, index } = dados;
    const moduloNum = MODULOS.indexOf(modulo) + 1;

    if (tagEl) tagEl.textContent = `Módulo ${moduloNum} · Aula ${index}`;
    if (tituloEl) tituloEl.textContent = aula.nome;
    if (durEl) {
        durEl.querySelector("span").textContent = aula.dur + " · Nível " + nivelModulo(moduloNum);
    }
    if (btnEl) {
        btnEl.onclick = () => abrirAula(aula.id, modulo.id);
    }
}

function nivelModulo(num) {
    const niveis = ["iniciante", "básico", "intermediário", "avançado"];
    return niveis[num - 1] || "intermediário";
}

// ─── Abrir aula ───────────────────────────────────────────────────────────────
window.abrirAula = async function (aulaId, moduloId) {
    const modulo = MODULOS.find(m => m.id === moduloId);
    const aula = modulo?.aulas.find(a => a.id === aulaId);
    if (!aula) return;

    const overlay = document.createElement("div");
    overlay.id = "aula-modal";
    overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.85);
        display:flex;align-items:center;justify-content:center;
        z-index:1000;backdrop-filter:blur(4px);
    `;
    overlay.innerHTML = `
        <div style="background:#181818;border:1px solid #2a2a2a;border-radius:16px;
                    padding:40px;max-width:520px;width:90%;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">🥁</div>
            <div style="font-size:12px;background:#3a2e00;color:#e8c94a;
                        padding:4px 12px;border-radius:5px;display:inline-block;
                        margin-bottom:12px;">
                ${modulo.nome}
            </div>
            <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;
                       color:#fff;margin:8px 0 4px;">${aula.nome}</h2>
            <p style="color:#888;font-size:13px;margin-bottom:32px;">
                ${aula.dur} de conteúdo
            </p>
            <p style="color:#555;font-size:12px;margin-bottom:24px;">
                (Aqui será carregado o vídeo/conteúdo da aula quando disponível)
            </p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <button id="btn-marcar" style="
                    background:#e8c94a;color:#000;border:none;
                    border-radius:8px;padding:12px 24px;font-weight:700;
                    font-size:14px;cursor:pointer;font-family:Nunito,sans-serif;">
                    ✅ Marcar como concluída
                </button>
                <button onclick="fecharModal()" style="
                    background:transparent;border:1px solid #2a2a2a;color:#888;
                    border-radius:8px;padding:12px 24px;font-size:14px;
                    cursor:pointer;font-family:Nunito,sans-serif;">
                    Fechar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const btnMarcar = document.getElementById("btn-marcar");
    const jaCompleta = progressoAluno.aulasCompletas.includes(aulaId);

    if (jaCompleta) {
        btnMarcar.textContent = "✅ Já concluída";
        btnMarcar.style.opacity = "0.6";
        btnMarcar.disabled = true;
    } else {
        btnMarcar.onclick = async () => {
            btnMarcar.textContent = "Salvando...";
            btnMarcar.disabled = true;
            await marcarAulaCompleta(aulaId);
            btnMarcar.textContent = "✅ Concluída!";
            setTimeout(() => fecharModal(), 1000);
        };
    }

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) fecharModal();
    });
};

window.fecharModal = function () {
    const modal = document.getElementById("aula-modal");
    if (modal) modal.remove();
};

// ─── Chat aluno–professor ─────────────────────────────────────────────────────
function iniciarChat() {
    const iniciais = window._alunoIniciais || "AL";

    document.querySelectorAll(".msg[style*='row-reverse'] .msg-av").forEach(el => {
        el.textContent = iniciais;
    });

    const chatRef = collection(db, "chats", usuarioAtual.uid, "mensagens");
    const q = query(chatRef, orderBy("criadoEm", "asc"));

    const chatMsgs = document.getElementById("chatMessages");
    if (!chatMsgs) return;

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) return;

        chatMsgs.innerHTML = "";
        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            appendMensagem(msg, iniciais);
        });
        chatMsgs.scrollTop = chatMsgs.scrollHeight;

        const naolidas = snapshot.docs.filter(d =>
            d.data().autor === "professor" && !d.data().lida
        ).length;
        const badge = document.querySelector(".unread-badge");
        if (badge) {
            badge.textContent = naolidas || "";
            badge.style.display = naolidas ? "flex" : "none";
        }
    });

    const input = document.getElementById("chatInput");
    const btnSend = document.querySelector(".chat-send");

    if (input) {
        input.onkeydown = (e) => { if (e.key === "Enter") enviarMensagem(); };
    }
    if (btnSend) {
        btnSend.onclick = enviarMensagem;
    }
}

function appendMensagem(msg, minhasIniciais) {
    const chatMsgs = document.getElementById("chatMessages");
    const euEnviei = msg.autor === "aluno";

    const div = document.createElement("div");
    div.className = "msg" + (msg.autor === "professor" ? " professor" : "");
    if (euEnviei) div.style.flexDirection = "row-reverse";

    const av = euEnviei
        ? `<div class="msg-av" style="background:#2a1e00;color:#e8c94a;">${minhasIniciais}</div>`
        : `<div class="msg-av" style="background:#2a4a10;color:#5acd2a;">P</div>`;

    const body = euEnviei
        ? `<div class="msg-body" style="text-align:right;">
               <div class="msg-author" style="color:#e8c94a;">Você</div>
               <div class="msg-text" style="border-radius:10px 4px 4px 10px;">${escapeHtml(msg.texto)}</div>
           </div>`
        : `<div class="msg-body">
               <div class="msg-author" style="color:#5acd2a;">${escapeHtml(msg.nomeAutor || "Prof. Carlos")}</div>
               <div class="msg-text">${escapeHtml(msg.texto)}</div>
           </div>`;

    div.innerHTML = av + body;
    chatMsgs.appendChild(div);
}

async function enviarMensagem() {
    const input = document.getElementById("chatInput");
    const texto = input?.value.trim();
    if (!texto) return;

    input.value = "";

    const chatRef = collection(db, "chats", usuarioAtual.uid, "mensagens");

    try {
        await addDoc(chatRef, {
            texto,
            autor: "aluno",
            nomeAutor: dadosAluno.nome,
            alunoId: usuarioAtual.uid,
            criadoEm: serverTimestamp(),
            lida: true
        });

        await setDoc(doc(db, "chats", usuarioAtual.uid), {
            alunoId: usuarioAtual.uid,
            nomeAluno: dadosAluno.nome,
            emailAluno: dadosAluno.email,
            ultimaMensagem: texto,
            atualizadoEm: serverTimestamp(),
            naolidas: 1
        }, { merge: true });

    } catch (e) {
        console.error("Erro ao enviar mensagem:", e);
    }
}

// ─── Navegação ────────────────────────────────────────────────────────────────
function configurarNavegacao() {
    const links = document.querySelectorAll(".nav-links a");

    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            links.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            const texto = link.textContent.trim();

            if (texto === "Início") {
                mostrarSecao("inicio");
            } else if (texto === "Módulos") {
                mostrarSecao("modulos");
            } else if (texto === "Biblioteca") {
                mostrarSecao("biblioteca");
            }
        });
    });
}

function mostrarSecao(secao) {
    const mainContent = document.querySelector(".main-content");
    const heroSection = document.querySelector(".hero-section");

    if (secao === "inicio") {
        if (heroSection) heroSection.style.display = "";
        if (mainContent) mainContent.style.display = "";

        const tmp = document.getElementById("secao-temporaria");
        if (tmp) tmp.remove();

    } else if (secao === "modulos") {
        if (heroSection) heroSection.style.display = "none";
        if (mainContent) mainContent.style.display = "none";

        mostrarSecaoTemporaria("modulos");

    } else if (secao === "biblioteca") {
        if (heroSection) heroSection.style.display = "none";
        if (mainContent) mainContent.style.display = "none";

        mostrarSecaoTemporaria("biblioteca");
    }
}

function mostrarSecaoTemporaria(tipo) {
    const existente = document.getElementById("secao-temporaria");
    if (existente) existente.remove();

    const drumApp = document.querySelector(".drum-app");
    const div = document.createElement("div");
    div.id = "secao-temporaria";
    div.style.cssText = "max-width:900px;margin:40px auto;padding:0 24px;";

    if (tipo === "modulos") {
        div.innerHTML = `
            <h2 style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:#fff;margin-bottom:8px;">
                Todos os Módulos
            </h2>
            <p style="color:#888;margin-bottom:32px;">Acompanhe seu progresso em cada módulo do curso.</p>
            <div id="modulos-completo" class="modulos-wrap" style="max-width:100%;">
                <div class="section-title" style="display:none;"></div>
            </div>
        `;
        drumApp.appendChild(div);

        const container = div.querySelector(".modulos-wrap");
        MODULOS.forEach((modulo) => {
            const aulasCompletas = modulo.aulas.filter(a =>
                progressoAluno.aulasCompletas.includes(a.id)
            ).length;
            const totalAulas = modulo.aulas.length;
            const pct = Math.round((aulasCompletas / totalAulas) * 100);
            const concluido = aulasCompletas === totalAulas;
            const emAndamento = aulasCompletas > 0 && !concluido;
            const modId = modulo.id + "-full";

            let statusBadge = concluido
                ? `<span style="color:#5acd2a;font-weight:700;">Concluído</span>`
                : emAndamento
                    ? `<span style="font-size:12px;background:#3a2e00;color:#e8c94a;padding:2px 8px;border-radius:5px;font-weight:700;">Em andamento</span>`
                    : `<span style="font-size:12px;color:#555;">${aulasCompletas}/${totalAulas} aulas</span>`;

            const card = document.createElement("div");
            card.className = "modulo-card" + (emAndamento ? " em-andamento" : "");
            card.innerHTML = `
                <div class="modulo-header" onclick="toggleMod('${modId}-body')">
                    <div class="modulo-icon" style="background:${modulo.cor};">
                        <i class="ti ${modulo.icone}" style="color:${modulo.corIcone};font-size:20px;"></i>
                    </div>
                    <div class="modulo-meta">
                        <div class="modulo-nome">${modulo.nome}</div>
                        <div class="modulo-desc">${modulo.desc}</div>
                    </div>
                    <div class="modulo-stats">
                        ${statusBadge}
                        <i class="ti ti-chevron-down" id="${modId}-chev" style="color:#555;font-size:16px;transition:transform 0.2s;"></i>
                    </div>
                </div>
                <div class="modulo-prog-wrap" id="${modId}-body" style="display:none;">
                    <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#888;margin-bottom:6px;">
                        <span>${aulasCompletas} de ${totalAulas} aulas concluídas</span>
                        <span style="color:${modulo.corIcone};font-weight:700;">${pct}%</span>
                    </div>
                    <div style="background:#2a2a2a;border-radius:99px;height:4px;margin-bottom:12px;">
                        <div style="background:${modulo.corIcone};border-radius:99px;height:4px;width:${pct}%;"></div>
                    </div>
                    <div class="aulas-list">
                        ${modulo.aulas.map(aula => renderizarAulaItem(aula, modulo)).join("")}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } else if (tipo === "biblioteca") {
        div.innerHTML = `
            <h2 style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:#fff;margin-bottom:8px;">
                Biblioteca
            </h2>
            <p style="color:#888;margin-bottom:32px;">
                Materiais complementares, partituras e backing tracks do curso.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">
                ${["Partitura — Groove Básico", "Backing Track — Rock 90bpm",
                "Partitura — Rudimentos", "Backing Track — Funk 100bpm",
                "PDF — Teoria Rítmica", "Backing Track — Samba-Rock"].map(item => `
                    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;
                                display:flex;align-items:center;gap:12px;">
                        <div style="width:40px;height:40px;background:#2a2a2a;border-radius:8px;
                                    display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">
                            ${item.includes("Partitura") ? "🎼" : item.includes("PDF") ? "📄" : "🎵"}
                        </div>
                        <div>
                            <div style="font-size:14px;font-weight:600;color:#ddd;">${item}</div>
                            <div style="font-size:12px;color:#555;margin-top:2px;">Em breve</div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
        drumApp.appendChild(div);
    }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function configurarLogout() {
    const avatar = document.querySelector(".avatar");
    if (avatar) {
        avatar.style.cursor = "pointer";
        avatar.title = "Clique para sair";
        avatar.onclick = () => {
            if (confirm("Deseja sair da sua conta?")) {
                if (unsubscribeChat) unsubscribeChat();
                signOut(auth).then(() => {
                    window.location.href = "../index.html";
                });
            }
        };
    }
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function dataHoje() {
    return formatarData(new Date());
}

function formatarData(d) {
    return d.toISOString().split("T")[0];
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ─── toggleMod (global) ───────────────────────────────────────────────────────
window.toggleMod = function (id) {
    const body = document.getElementById(id);
    const chevId = id.replace("-body", "-chev");
    const chev = document.getElementById(chevId);
    if (!body) return;
    const isOpen = body.style.display !== "none";
    body.style.display = isOpen ? "none" : "block";
    if (chev) chev.style.transform = isOpen ? "" : "rotate(180deg)";
};