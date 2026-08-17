// 1. IDENTIFICA A TELA E O LOCALSTORAGE
const isDividas = window.location.pathname.includes('dividas.html');
const storageKey = isDividas ? 'cascalho_dividas' : 'cascalho_recebimentos';

let indexEditando = null;

// Controla o mês/ano que está sendo exibido no filtro (Inicia no mês atual)
let dataFiltro = new Date();

// 2. ESTRUTURA DE DADOS
let dados = JSON.parse(localStorage.getItem(storageKey));

if (!dados || (dados.length > 0 && !dados[0].itens)) {
	dados = isDividas ? [
		{ 
            referencia: 'Cartão de Thayná', 
            vencimento: '06/08/2026', 
            status: 'Pendente', 
            itens: [
                { descricao: "Mecânico", valor: 500, parcela: "1/1" },
                { descricao: "Anel", valor: 137, parcela: "4/12" }
            ] 
        }
	] : [];
	salvarNoLocalStorage();
}

function salvarNoLocalStorage() {
	localStorage.setItem(storageKey, JSON.stringify(dados));
}

// FORMATADORES DE DATA
function dataParaInput(dataBr) {
	if (!dataBr || !dataBr.includes('/')) return '';
	const [dia, mes, ano] = dataBr.split('/');
	return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

function dataParaBr(dataIso) {
	if (!dataIso || !dataIso.includes('-')) return dataIso;
	const [ano, mes, dia] = dataIso.split('-');
	return `${dia}/${mes}/${ano}`;
}

// Extrai o ano e o mês de uma string "DD/MM/AAAA" -> "YYYY-MM"
function extrairAnoMes(dataBr) {
	if (!dataBr || !dataBr.includes('/')) return '';
	const [dia, mes, ano] = dataBr.split('/');
	return `${ano}-${mes.padStart(2, '0')}`;
}

// 3. CONTROLE E NAVEGAÇÃO DE PERÍODO
const seletorPeriodo = document.querySelector('#seletor-periodo');
const btnMesAnterior = document.querySelector('#btn-mes-anterior');
const btnMesSeguinte = document.querySelector('#btn-mes-seguinte');

function atualizarInterfacePeriodo() {
	if (!seletorPeriodo) return;

	const ano = dataFiltro.getFullYear();
	const mes = String(dataFiltro.getMonth() + 1).padStart(2, '0');
	
	// Atualiza o valor do input tipo month (YYYY-MM)
	seletorPeriodo.value = `${ano}-${mes}`;

	renderizarCards();
	atualizarTotalGeral();
}

if (seletorPeriodo) {
	seletorPeriodo.addEventListener('change', (e) => {
		if (e.target.value) {
			const [ano, mes] = e.target.value.split('-');
			dataFiltro = new Date(parseInt(ano), parseInt(mes) - 1, 1);
			atualizarInterfacePeriodo();
		}
	});
}

if (btnMesAnterior) {
	btnMesAnterior.addEventListener('click', () => {
		dataFiltro.setMonth(dataFiltro.getMonth() - 1);
		atualizarInterfacePeriodo();
	});
}

if (btnMesSeguinte) {
	btnMesSeguinte.addEventListener('click', () => {
		dataFiltro.setMonth(dataFiltro.getMonth() + 1);
		atualizarInterfacePeriodo();
	});
}

// 4. FILTRAGEM E RENDERIZAÇÃO DOS CARDS
function obterCardsDoPeriodo() {
	const ano = dataFiltro.getFullYear();
	const mes = String(dataFiltro.getMonth() + 1).padStart(2, '0');
	const periodoAtualStr = `${ano}-${mes}`;

	// Filtra e mantém o índice original (_index) para garantir edição/exclusão correta no array
	return dados
		.map((card, index) => ({ ...card, _index: index }))
		.filter(card => extrairAnoMes(card.vencimento) === periodoAtualStr);
}

function criarCardHtml(cardObj) {
	const card = document.createElement('article');
	card.classList.add('card');

	const totalCard = cardObj.itens.reduce((soma, item) => soma + Number(item.valor), 0);

	const statusClass = cardObj.status.toLowerCase() === 'pago' ? 'status-pago' : 
	                    cardObj.status.toLowerCase() === 'atrasado' ? 'status-atrasado' : 'status-pendente';

	card.innerHTML = `
		<header>
			<span class="devedor">${cardObj.referencia}</span>
			<span class="status ${statusClass}">${cardObj.status.toUpperCase()}</span>
		</header>

		<div class="card-tabela">
			${cardObj.itens.map(item => `
				<div class="card-itens">
					<span class="item-desc">${item.descricao}</span>
					<div class="item-valores">
						<span class="item-valor">
							${Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
						</span>
						<span class="item-parcela">${item.parcela}</span>
					</div>
				</div>
			`).join('')}
		</div>

		<footer class="card-footer">
			<time>Val.: ${cardObj.vencimento}</time>
			<button type="button" class="editar" data-index="${cardObj._index}" aria-label="Editar">
				<span class="material-symbols-outlined">edit_square</span>
			</button>
			<span class="card-total">
				${totalCard.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
			</span>
		</footer>
	`;

	return card;
}

function renderizarCards() {
	const lista = document.querySelector('#listagem');
	if (!lista) return;

	lista.innerHTML = '';
	const cardsExibir = obterCardsDoPeriodo();

	if (cardsExibir.length === 0) {
		lista.innerHTML = `<p style="text-align: center; color: #666; margin-top: 20px;">Nenhum registro para este período.</p>`;
		return;
	}

	cardsExibir.forEach(cardObj => {
		lista.appendChild(criarCardHtml(cardObj));
	});
}

function atualizarTotalGeral() {
	const cardsExibir = obterCardsDoPeriodo();
	let totalGeral = 0;
	
	cardsExibir.forEach(card => {
		card.itens.forEach(item => { totalGeral += Number(item.valor); });
	});

	const elemento = document.querySelector('.total-geral'); //[cite: 1, 2]
	if (elemento) {
		elemento.textContent = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
	}
}

// 5. MODAL E LÓGICA DE REGISTRO
const btnAdd = document.querySelector('.add'); //[cite: 1, 2]
const modal = document.querySelector('#modal-recebimento'); //[cite: 1, 2]
const btnFechar = document.querySelector('.fechar-modal'); //[cite: 1, 2]
const formRegistro = document.querySelector('.registro'); //[cite: 1, 2]
const containerItens = document.querySelector('#itens-container');
const btnAddItem = document.querySelector('#btn-add-item');
const modalHeader = document.querySelector('.modal-header h2'); //[cite: 1, 2]
const btnSalvar = document.querySelector('.salvar'); //[cite: 1, 2]

let btnExcluir = document.querySelector('.btn-excluir');
if (!btnExcluir && formRegistro) {
	btnExcluir = document.createElement('button');
	btnExcluir.type = 'button';
	btnExcluir.className = 'btn-excluir';
	btnExcluir.textContent = 'Excluir Card Inteiro';
	btnExcluir.style.cssText = `
		background-color: #E53935; color: white; border: none; border-radius: 8px;
		padding: 12px; font-weight: bold; cursor: pointer; margin-top: 8px; display: none;
	`;
	formRegistro.appendChild(btnExcluir);
}

function adicionarLinhaItem(descricao = '', valor = '', parcelaTexto = '1/1') {
	let pAtual = 1;
	let pTotal = 1;

	if (parcelaTexto && parcelaTexto.includes('/')) {
		const partes = parcelaTexto.split('/');
		pAtual = parseInt(partes[0]) || 1;
		pTotal = parseInt(partes[1]) || 1;
	}

	const div = document.createElement('div');
	div.className = 'linha-item form-group';
	div.style.cssText = 'background: rgba(0,0,0,0.15); padding: 12px; border-radius: 8px; position: relative; gap: 8px; margin-bottom: 8px;';

	div.innerHTML = `
		<button type="button" class="remover-linha" style="position: absolute; right: 8px; top: 8px; background: #E53935; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">X</button>
		<input type="text" class="input-desc" placeholder="Descrição (Ex: Gasolina)" value="${descricao}" required>
		
		<div style="display: flex; gap: 8px; align-items: center;">
			<input type="number" class="input-valor" placeholder="Valor (R$)" step="0.01" min="0" value="${valor}" required style="width: 50%;">
			
			<div style="display: flex; gap: 4px; align-items: center; width: 50%;">
				<input type="number" class="input-parcela-atual" min="1" value="${pAtual}" required style="width: 45%; text-align: center;">
				<span style="color: white; font-weight: bold;">de</span>
				<input type="number" class="input-parcela-total" min="1" value="${pTotal}" required style="width: 45%; text-align: center;">
			</div>
		</div>
	`;

	div.querySelector('.remover-linha').addEventListener('click', () => div.remove());
	containerItens.appendChild(div);
}

if (btnAddItem) {
	btnAddItem.addEventListener('click', () => adicionarLinhaItem());
}

if (btnAdd && modal) {
	btnAdd.addEventListener('click', () => {
		indexEditando = null;
		formRegistro.reset();
		document.querySelector('#status').value = 'Pendente';
		
		// Preenche a data com o período selecionado atualmente
		const ano = dataFiltro.getFullYear();
		const mes = String(dataFiltro.getMonth() + 1).padStart(2, '0');
		document.querySelector('#vencimento').value = `${ano}-${mes}-10`;

		containerItens.innerHTML = ''; 
		adicionarLinhaItem();
		
		if (modalHeader) modalHeader.textContent = 'Novo Card';
		if (btnSalvar) btnSalvar.textContent = 'Adicionar Card';
		if (btnExcluir) btnExcluir.style.display = 'none';
		modal.showModal();
	});
}

if (btnFechar && modal) btnFechar.addEventListener('click', () => modal.close());

document.addEventListener('click', (e) => {
	const btnEditar = e.target.closest('.editar');
	if (btnEditar) {
		const index = btnEditar.getAttribute('data-index');
		if (index !== null && dados[index]) abrirModalEdicao(parseInt(index));
	}
});

function abrirModalEdicao(index) {
	indexEditando = index;
	const cardSelecionado = dados[index];

	document.querySelector('#ref').value = cardSelecionado.referencia;
	document.querySelector('#status').value = cardSelecionado.status || 'Pendente';
	document.querySelector('#vencimento').value = dataParaInput(cardSelecionado.vencimento);

	containerItens.innerHTML = '';
	cardSelecionado.itens.forEach(item => {
		adicionarLinhaItem(item.descricao, item.valor, item.parcela);
	});

	if (modalHeader) modalHeader.textContent = 'Editar Card';
	if (btnSalvar) btnSalvar.textContent = 'Salvar Alterações';
	if (btnExcluir) btnExcluir.style.display = 'block';

	modal.showModal();
}

if (btnExcluir) {
	btnExcluir.addEventListener('click', () => {
		if (indexEditando !== null) {
			dados.splice(indexEditando, 1);
			salvarNoLocalStorage();
			atualizarInterfacePeriodo();
			modal.close();
		}
	});
}

if (formRegistro) {
	formRegistro.addEventListener('submit', (e) => {
		e.preventDefault();

		const linhasDOM = document.querySelectorAll('.linha-item');
		if (linhasDOM.length === 0) {
			alert('O Card precisa ter pelo menos um item!');
			return;
		}

		const arrayItens = [];
		linhasDOM.forEach(linha => {
			const pAtual = linha.querySelector('.input-parcela-atual').value || 1;
			const pTotal = linha.querySelector('.input-parcela-total').value || 1;

			arrayItens.push({
				descricao: linha.querySelector('.input-desc').value,
				valor: parseFloat(linha.querySelector('.input-valor').value),
				parcela: `${pAtual}/${pTotal}`
			});
		});

		const novoCard = {
			referencia: document.querySelector('#ref').value,
			status: document.querySelector('#status').value,
			vencimento: dataParaBr(document.querySelector('#vencimento').value),
			itens: arrayItens
		};

		if (indexEditando !== null) {
			dados[indexEditando] = novoCard;
		} else {
			dados.push(novoCard);
		}

		salvarNoLocalStorage();
		atualizarInterfacePeriodo();
		modal.close();
	});
}

// INICIALIZA A TELA NO PERÍODO ATUAL
atualizarInterfacePeriodo();