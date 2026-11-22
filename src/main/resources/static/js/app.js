
const API = '/api';

let produtos = [];
let carrinho = [];

const dinheiro = valor =>
    Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

// Carrega o carrinho salvo no navegador
function carregarCarrinhoSalvo() {
    try {
        const salvo = JSON.parse(
            localStorage.getItem('carrinho') || '[]'
        );

        carrinho = Array.isArray(salvo) ? salvo : [];

    } catch (erro) {
        carrinho = [];
    }
}

// Salva o carrinho
function salvarCarrinho() {
    localStorage.setItem(
        'carrinho',
        JSON.stringify(carrinho)
    );
}

// Verifica se a imagem possui uma URL válida
function imagemProduto(url) {

    if (typeof url !== 'string' || !url.trim()) {
        return 'https://placehold.co/600x400?text=Produto';
    }

    try {
        const endereco = new URL(url, window.location.origin);

        if (endereco.protocol === 'http:' ||
            endereco.protocol === 'https:') {
            return endereco.href;
        }

    } catch (erro) {
        // Utiliza a imagem padrão
    }

    return 'https://placehold.co/600x400?text=Produto';
}

// Cria elementos de texto
function criarElemento(tag, texto, classe) {

    const elemento = document.createElement(tag);

    if (texto !== undefined && texto !== null) {
        elemento.textContent = texto;
    }

    if (classe) {
        elemento.className = classe;
    }

    return elemento;
}

// Busca os produtos no banco
async function carregar() {

    const area = document.getElementById('listaProdutos');

    try {

        const resposta = await fetch(API + '/produtos', {
            credentials: 'same-origin',
            cache: 'no-store'
        });

        if (!resposta.ok) {
            throw new Error(
                'Não foi possível carregar os produtos.'
            );
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error('Resposta inválida da API.');
        }

        // Mostra somente produtos ativos
        produtos = dados.filter(
            produto => produto.ativo !== false
        );

        // Atualiza os itens do carrinho
        // conforme o estoque atual do banco
        carrinho = carrinho
            .map(item => {

                const produto = produtos.find(
                    p => Number(p.id) === Number(item.id)
                );

                if (!produto ||
                    Number(produto.estoque) < 1) {
                    return null;
                }

                const quantidade = Math.min(
                    Math.max(
                        1,
                        Math.floor(Number(item.qtd) || 1)
                    ),
                    Number(produto.estoque)
                );

                return {
                    id: Number(produto.id),
                    nome: produto.nome,
                    preco: Number(produto.preco),
                    qtd: quantidade
                };
            })
            .filter(Boolean);

        salvarCarrinho();

        filtrarProdutos();

        atualizarCarrinho();

    } catch (erro) {

        console.error(erro);

        area.replaceChildren(
            criarElemento(
                'p',
                'Não foi possível carregar os produtos.'
            )
        );
    }
}

// Monta o card de um produto
function criarCardProduto(produto) {

    const card = criarElemento(
        'article', null, 'produto'
    );

    const imagem = document.createElement('img');

    imagem.src = imagemProduto(produto.imagemUrl);
    imagem.alt = produto.nome || 'Produto';
    imagem.loading = 'lazy';

    imagem.onerror = function () {
        this.onerror = null;
        this.src =
            'https://placehold.co/600x400?text=Produto';
    };

    const info = criarElemento(
        'div', null, 'produto-info'
    );

    const categoria = criarElemento(
        'small',
        produto.categoria?.nome || 'Destaque'
    );

    const nome = criarElemento(
        'h3',
        produto.nome
    );

    const descricao = criarElemento(
        'p',
        produto.descricao || ''
    );

    const preco = criarElemento(
        'strong',
        dinheiro(produto.preco)
    );

    const botao = criarElemento(
        'button',
        Number(produto.estoque) < 1
            ? 'Sem estoque'
            : 'Adicionar ao carrinho',
        'btn'
    );

    botao.type = 'button';
    botao.dataset.id = produto.id;

    if (Number(produto.estoque) < 1) {
        botao.disabled = true;
    }

    info.append(
        categoria,
        nome,
        descricao,
        preco,
        botao
    );

    card.append(imagem, info);

    return card;
}

// Exibe os produtos
function renderizar(lista) {

    const area = document.getElementById('listaProdutos');

    area.replaceChildren();

    if (!lista.length) {

        area.appendChild(
            criarElemento(
                'p',
                'Nenhum produto encontrado.'
            )
        );

        return;
    }

    lista.forEach(produto => {
        area.appendChild(criarCardProduto(produto));
    });
}

// Pesquisa pelo nome do produto
function filtrarProdutos() {

    const campo = document.getElementById('pesquisa');

    const busca = campo.value
        .trim()
        .toLowerCase();

    const filtrados = produtos.filter(
        produto =>
            String(produto.nome || '')
                .toLowerCase()
                .includes(busca)
    );

    renderizar(filtrados);
}

// Adiciona ao carrinho
function adicionar(id) {

    const produto = produtos.find(
        p => Number(p.id) === Number(id)
    );

    if (!produto) {
        return;
    }

    const estoque = Number(produto.estoque);

    if (estoque < 1) {
        alert('Produto sem estoque.');
        return;
    }

    const item = carrinho.find(
        p => p.id === Number(id)
    );

    const quantidadeAtual = item ? item.qtd : 0;

    if (quantidadeAtual >= estoque) {

        alert(
            'Quantidade máxima disponível em estoque.'
        );

        return;
    }

    if (item) {

        item.qtd++;

    } else {

        carrinho.push({
            id: Number(produto.id),
            nome: produto.nome,
            preco: Number(produto.preco),
            qtd: 1
        });
    }

    salvarCarrinho();
    atualizarCarrinho();
}

// Aumenta a quantidade
function aumentar(id) {

    const item = carrinho.find(
        p => p.id === Number(id)
    );

    const produto = produtos.find(
        p => Number(p.id) === Number(id)
    );

    if (!item || !produto) {
        return;
    }

    if (item.qtd >= Number(produto.estoque)) {

        alert('Estoque insuficiente.');
        return;
    }

    item.qtd++;

    salvarCarrinho();
    atualizarCarrinho();
}

// Diminui a quantidade
function diminuir(id) {

    const item = carrinho.find(
        p => p.id === Number(id)
    );

    if (!item) {
        return;
    }

    if (item.qtd > 1) {

        item.qtd--;

        salvarCarrinho();
        atualizarCarrinho();

    } else {

        remover(id);
    }
}

// Remove um produto
function remover(id) {

    carrinho = carrinho.filter(
        p => p.id !== Number(id)
    );

    salvarCarrinho();
    atualizarCarrinho();
}

// Atualiza a visualização do carrinho
function atualizarCarrinho() {

    const contador =
        document.getElementById('contador');

    const area =
        document.getElementById('itensCarrinho');

    const total =
        document.getElementById('total');

    const quantidadeTotal = carrinho.reduce(
        (soma, item) => soma + item.qtd,
        0
    );

    contador.textContent = quantidadeTotal;

    area.replaceChildren();

    if (carrinho.length === 0) {

        area.appendChild(
            criarElemento(
                'p',
                'Seu carrinho está vazio.'
            )
        );

    } else {

        carrinho.forEach(item => {

            const linha = criarElemento(
                'div', null, 'linha-carrinho'
            );

            const conteudo =
                document.createElement('div');

            const nome = criarElemento(
                'strong',
                item.nome
            );

            const preco = criarElemento(
                'p',
                dinheiro(item.preco * item.qtd)
            );

            const controle = criarElemento(
                'div', null, 'controle-quantidade'
            );

            const menos = criarElemento('button', '−');
            menos.type = 'button';
            menos.dataset.acao = 'diminuir';
            menos.dataset.id = item.id;

            const quantidade = criarElemento(
                'span',
                item.qtd
            );

            const mais = criarElemento('button', '+');
            mais.type = 'button';
            mais.dataset.acao = 'aumentar';
            mais.dataset.id = item.id;

            const excluir = criarElemento(
                'button',
                'Remover',
                'btn-remover'
            );

            excluir.type = 'button';
            excluir.dataset.acao = 'remover';
            excluir.dataset.id = item.id;

            controle.append(
                menos,
                quantidade,
                mais,
                excluir
            );

            conteudo.append(
                nome,
                preco,
                controle
            );

            linha.appendChild(conteudo);
            area.appendChild(linha);
        });
    }

    const valorTotal = carrinho.reduce(
        (soma, item) =>
            soma + item.preco * item.qtd,
        0
    );

    total.textContent = dinheiro(valorTotal);
}

// Configura os eventos da página
function configurarEventos() {

    // Botões dos produtos
    document.getElementById('listaProdutos')
        .addEventListener('click', evento => {

            const botao = evento.target.closest(
                'button[data-id]'
            );

            if (!botao) {
                return;
            }

            adicionar(Number(botao.dataset.id));
        });

    // Controles do carrinho
    document.getElementById('itensCarrinho')
        .addEventListener('click', evento => {

            const botao = evento.target.closest(
                'button[data-acao]'
            );

            if (!botao) {
                return;
            }

            const id = Number(botao.dataset.id);

            switch (botao.dataset.acao) {

                case 'aumentar':
                    aumentar(id);
                    break;

                case 'diminuir':
                    diminuir(id);
                    break;

                case 'remover':
                    remover(id);
                    break;
            }
        });

    // Abre o carrinho
    document.getElementById('abrirCarrinho')
        .addEventListener('click', () => {

            document.getElementById('carrinho')
                .classList.remove('escondido');
        });

    // Fecha o carrinho
    document.getElementById('fecharCarrinho')
        .addEventListener('click', () => {

            document.getElementById('carrinho')
                .classList.add('escondido');
        });

    // Pesquisa
    document.getElementById('pesquisa')
        .addEventListener('input', filtrarProdutos);
}

// Inicialização
function iniciarLoja() {

    carregarCarrinhoSalvo();

    configurarEventos();

    atualizarCarrinho();

    carregar();
}

if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        iniciarLoja
    );

} else {

    iniciarLoja();
}
