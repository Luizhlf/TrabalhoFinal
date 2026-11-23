
const parametros = new URLSearchParams(window.location.search);

const pedidoId = Number(parametros.get('pedidoId'));

const campo = id => document.getElementById(id);

const dinheiro = valor =>
    Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

// Exibe mensagens na página
function mensagem(texto, erro = false) {
    campo('mensagem').textContent = texto;
    campo('mensagem').style.color =
        erro ? '#a33' : 'green';
}

// Consulta os dados do pedido
async function carregarPedido() {

    if (!Number.isSafeInteger(pedidoId) || pedidoId < 1) {
        mensagem('Pedido inválido.', true);
        return;
    }

    try {
        const resposta = await fetch('/api/pedidos/meus', {
            credentials: 'same-origin'
        });

        if (resposta.status === 401 ||
            resposta.status === 403) {
            throw new Error('Faça login para pagar seu pedido.');
        }

        if (!resposta.ok) {
            throw new Error('Não foi possível consultar o pedido.');
        }

        const pedidos = await resposta.json();

        const pedido = pedidos.find(p => p.id === pedidoId);

        if (!pedido) {
            throw new Error('Pedido não encontrado.');
        }

        campo('numeroPedido').textContent =
            `Pedido nº ${pedido.id}`;

        campo('valorPedido').textContent =
            `Total: ${dinheiro(pedido.total)}`;

        if (pedido.status !== 'AGUARDANDO_PAGAMENTO') {
            mensagem(
                'Este pedido não está aguardando pagamento.',
                true
            );
            return;
        }

        campo('confirmarPagamento').disabled = false;

    } catch (erro) {
        mensagem(erro.message, true);
    }
}

// Confirma o pagamento simulado
async function confirmarPagamento(evento) {

    evento.preventDefault();

    const selecionado = document.querySelector(
        'input[name="metodo"]:checked'
    );

    if (!selecionado) {
        mensagem('Selecione uma forma de pagamento.', true);
        return;
    }

    const botao = campo('confirmarPagamento');

    botao.disabled = true;

    mensagem('Registrando pagamento simulado...');

    try {
        const resposta = await fetch(
            `/api/pagamentos/${pedidoId}`,
            {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    metodo: selecionado.value
                })
            }
        );

        if (!resposta.ok) {
            const texto = await resposta.text();

            if (resposta.status === 401 ||
                resposta.status === 403) {
                throw new Error('Faça login novamente.');
            }

            throw new Error(
                texto || 'Não foi possível registrar o pagamento.'
            );
        }

        const pagamento = await resposta.json();

        mensagem(
            `Pagamento simulado confirmado! ` +
            `Status do pedido: ${pagamento.statusPedido}`
        );

        botao.textContent = 'Pagamento confirmado';

        setTimeout(() => {
            window.location.href = '/meus-pedidos.html';
        }, 1500);

    } catch (erro) {
        mensagem(erro.message, true);
        botao.disabled = false;
    }
}

// Evento do formulário
campo('formPagamento').addEventListener(
    'submit',
    confirmarPagamento
);

// Carrega o pedido
carregarPedido();
