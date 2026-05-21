// =============================================
// CONFIGURAÇÃO INICIAL
// =============================================

// Nome do banco no localStorage
const STORAGE_KEY = 'pwa-tarefas';

// Variável que guarda o evento de instalação
let eventoInstalacao = null;

// Filtro ativo no momento
let filtroAtivo = 'todas';

// Array com todas as tarefas
let tarefas = [];

// =============================================
// SELETORES DOS ELEMENTOS HTML
// =============================================
const inputTarefa        = document.getElementById('inputTarefa');
const btnAdicionar       = document.getElementById('btnAdicionar');
const listaTarefas       = document.getElementById('listaTarefas');
const listaVazia         = document.getElementById('listaVazia');
const contadorPendentes  = document.getElementById('contadorPendentes');
const statusBadge        = document.getElementById('statusBadge');
const bannerInstalacao   = document.getElementById('bannerInstalacao');
const btnInstalar        = document.getElementById('btnInstalar');
const btnFecharBanner    = document.getElementById('btnFecharBanner');
const btnLimparConcluidas = document.getElementById('btnLimparConcluidas');
const filtrosBtns        = document.querySelectorAll('.filtro-btn');

// =============================================
// REGISTRO DO SERVICE WORKER
// =============================================
if ('serviceWorker' in navigator) {
  // Aguarda o HTML carregar completamente antes de registrar
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registro => {
        console.log('Service Worker registrado:', registro.scope);
      })
      .catch(erro => {
        console.error('Falha ao registrar Service Worker:', erro);
      });
  });
}

// =============================================
// LOCALSTORAGE — carregar e salvar tarefas
// =============================================
function carregarTarefas() {
  const dados = localStorage.getItem(STORAGE_KEY);
  // Se não houver dados, começa com array vazio
  return dados ? JSON.parse(dados) : [];
}

function salvarTarefas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
}

// =============================================
// LÓGICA DAS TAREFAS
// =============================================
function adicionarTarefa() {
  const texto = inputTarefa.value.trim();

  // Não adiciona tarefa vazia
  if (!texto) {
    inputTarefa.focus();
    return;
  }

  // Cria objeto da tarefa com ID único
  const novaTarefa = {
    id: Date.now(),       // timestamp como ID único
    texto: texto,
    concluida: false,
    criadaEm: new Date().toISOString()
  };

  tarefas.push(novaTarefa);
  salvarTarefas();
  renderizarLista();

  // Limpa o campo e coloca foco para digitar a próxima
  inputTarefa.value = '';
  inputTarefa.focus();
}

function alternarTarefa(id) {
  tarefas = tarefas.map(t =>
    t.id === id ? { ...t, concluida: !t.concluida } : t
  );
  salvarTarefas();
  renderizarLista();
}

function excluirTarefa(id) {
  tarefas = tarefas.filter(t => t.id !== id);
  salvarTarefas();
  renderizarLista();
}

function limparConcluidas() {
  tarefas = tarefas.filter(t => !t.concluida);
  salvarTarefas();
  renderizarLista();
}

// =============================================
// FILTROS
// =============================================
function tarefasFiltradas() {
  if (filtroAtivo === 'pendentes')  return tarefas.filter(t => !t.concluida);
  if (filtroAtivo === 'concluidas') return tarefas.filter(t => t.concluida);
  return tarefas; // 'todas'
}

// =============================================
// RENDERIZAÇÃO DA LISTA
// =============================================
function renderizarLista() {
  const lista = tarefasFiltradas();

  // Limpa a lista atual
  listaTarefas.innerHTML = '';

  // Mostra mensagem se não houver tarefas
  if (lista.length === 0) {
    listaVazia.classList.add('visivel');
  } else {
    listaVazia.classList.remove('visivel');
  }

  // Cria um item para cada tarefa
  lista.forEach(tarefa => {
    const li = document.createElement('li');
    li.className = `tarefa-item${tarefa.concluida ? ' concluida' : ''}`;

    li.innerHTML = `
      <input
        type="checkbox"
        class="tarefa-check"
        ${tarefa.concluida ? 'checked' : ''}
        aria-label="Marcar tarefa como concluída"
      >
      <span class="tarefa-texto">${escaparHTML(tarefa.texto)}</span>
      <button class="btn-excluir" aria-label="Excluir tarefa">✕</button>
    `;

    // Eventos do item
    li.querySelector('.tarefa-check').addEventListener('change', () => {
      alternarTarefa(tarefa.id);
    });

    li.querySelector('.btn-excluir').addEventListener('click', () => {
      excluirTarefa(tarefa.id);
    });

    listaTarefas.appendChild(li);
  });

  // Atualiza o contador de pendentes
  const pendentes = tarefas.filter(t => !t.concluida).length;
  contadorPendentes.textContent = pendentes;
}

// Evita XSS ao inserir texto do usuário no HTML
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(texto));
  return div.innerHTML;
}

// =============================================
// STATUS ONLINE / OFFLINE
// =============================================
function atualizarStatus() {
  if (navigator.onLine) {
    statusBadge.textContent = 'online';
    statusBadge.classList.remove('offline');
  } else {
    statusBadge.textContent = 'offline';
    statusBadge.classList.add('offline');
  }
}

window.addEventListener('online',  atualizarStatus);
window.addEventListener('offline', atualizarStatus);

// =============================================
// INSTALAÇÃO DO APP (banner customizado)
// =============================================

// O browser dispara esse evento quando detecta que a PWA
// pode ser instalada. Guardamos o evento para usar depois.
window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault(); // impede o prompt automático
  eventoInstalacao = evento;
  bannerInstalacao.hidden = false; // mostra nosso banner
});

// Ao clicar em "Instalar", dispara o prompt nativo
btnInstalar.addEventListener('click', async () => {
  if (!eventoInstalacao) return;

  eventoInstalacao.prompt();

  const { outcome } = await eventoInstalacao.userChoice;
  console.log('Decisão do usuário:', outcome); // 'accepted' ou 'dismissed'

  eventoInstalacao = null;
  bannerInstalacao.hidden = true;
});

// Fecha o banner sem instalar
btnFecharBanner.addEventListener('click', () => {
  bannerInstalacao.hidden = true;
});

// Esconde o banner se o app já foi instalado
window.addEventListener('appinstalled', () => {
  bannerInstalacao.hidden = true;
  console.log('App instalado com sucesso!');
});

// =============================================
// EVENTOS DE INTERAÇÃO
// =============================================

// Botão adicionar
btnAdicionar.addEventListener('click', adicionarTarefa);

// Enter no input também adiciona
inputTarefa.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') adicionarTarefa();
});

// Filtros
filtrosBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filtrosBtns.forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    filtroAtivo = btn.dataset.filtro;
    renderizarLista();
  });
});

// Limpar concluídas
btnLimparConcluidas.addEventListener('click', limparConcluidas);

// =============================================
// INICIALIZAÇÃO
// =============================================
tarefas = carregarTarefas(); // carrega do localStorage
atualizarStatus();            // verifica se está online
renderizarLista();            // renderiza as tarefas salvas