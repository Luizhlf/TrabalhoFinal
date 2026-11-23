
const carrinho = JSON.parse(
    localStorage.getItem('carrinho') || '[]'
);

const campo = id => document.getElementById(id);

const dinheiro = valor =>
    Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

function mensagem(texto, erro = false) {
    campo('mensagem').textContent = texto;
    campo('mensagem').style.color =
        erro ? '#a33' : 'green';
}

// Exibe os produtos do carrinho
function mostrarResumo() {
    const area = campo('resumo');

    area.replaceChildren();

    if (!carrinho.length) {
        area.textContent = 'Seu carrinho está vazio.';
        campo('confirmar').disabled = true;
        return;
    }

    let total = 0;

    carrinho.forEach(item => {
        const subtotal = Number(item.preco) * item.qtd;

        total += subtotal;

        const div = document.createElement('div');
        div.className = 'checkout-item';

        div.textContent =
            `${item.nome} × ${item.qtd} — ${dinheiro(subtotal)}`;

        area.appendChild(div);
    });

    campo('totalCompra').textContent = dinheiro(total);
}

// Busca os endereços cadastrados
async function carregarEnderecos() {
    try {
        const resposta = await fetch('/api/enderecos', {
            credentials: 'same-origin'
        });

        if (resposta.status === 401 ||
            resposta.status === 403) {
            throw new Error('Faça login para finalizar a compra.');
        }

        if (!resposta.ok) {
            throw new Error('Erro ao carregar endereços.');
        }

        const enderecos = await resposta.json();

        const select = campo('endereco');

        select.replaceChildren();

        const inicial = document.createElement('option');
        inicial.value = '';
        inicial.textContent = 'Selecione um endereço';

        select.appendChild(inicial);

        enderecos.forEach(e => {
            const option = document.createElement('option');

            option.value = e.id;
            option.textContent =
                `${e.logradouro}, ${e.numero} - ${e.cidade}/${e.uf}`;

            select.appendChild(option);
        });

        if (!enderecos.length) {
            mensagem('Cadastre um endereço antes de comprar.', true);
        }

    } catch (erro) {
        mensagem(erro.message, true);
    }
}

// Confirma a compra
async function finalizarCompra() {

    if (!carrinho.length) {
        mensagem('Seu carrinho está vazio.', true);
        return;
    }

    const enderecoId = Number(campo('endereco').value);

    if (!enderecoId) {
        mensagem('Selecione um endereço.', true);
        return;
    }

    const pedido = {
        enderecoId: enderecoId,
        itens: carrinho.map(item => ({
            produtoId: item.id,
            quantidade: item.qtd
        }))
    };

    const botao = campo('confirmar');
    botao.disabled = true;

    mensagem('Registrando pedido...');

    try {
        const resposta = await fetch('/api/pedidos', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedido)
        });

        if (!resposta.ok) {
            const erro = await resposta.text();

            if (resposta.status === 401 ||
                resposta.status === 403) {
                throw new Error('Faça login novamente.');
            }

            throw new Error(erro || 'Erro ao finalizar pedido.');
        }

        const dados = await resposta.json();

        // Limpa o carrinho somente após a confirmação
        localStorage.removeItem('carrinho');

        mensagem(`Pedido nº ${dados.id} registrado com sucesso!`);

        botao.textContent = 'Pedido registrado';

        setTimeout(() => {
            location.href = '/meus-pedidos.html';
        }, 1200);

    } catch (erro) {
        mensagem(erro.message, true);
        botao.disabled = false;
    }
}

campo('confirmar').addEventListener('click', finalizarCompra);

mostrarResumo();
carregarEnderecos();
