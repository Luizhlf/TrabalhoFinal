
const lista = document.getElementById('listaPedidos');

const dinheiro = valor =>
    Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

// Adiciona textos ao cartão do pedido
function adicionarTexto(elemento, texto, destaque = false) {

    const p = document.createElement('p');

    p.textContent = texto;

    if (destaque) {
        p.style.fontWeight = 'bold';
    }

    elemento.appendChild(p);
}

// Converte o status para um texto mais amigável
function nomeStatus(status) {

    const nomes = {
        AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
        PAGO: 'Pago',
        ENVIADO: 'Enviado',
        ENTREGUE: 'Entregue',
        CANCELADO: 'Cancelado'
    };

    return nomes[status] || status || 'Desconhecido';
}

// Consulta os pedidos do cliente
async function carregarPedidos() {

    lista.textContent = 'Carregando pedidos...';

    try {

        const resposta = await fetch('/api/pedidos/meus', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });

        if (resposta.status === 401 ||
            resposta.status === 403) {

            throw new Error(
                'Faça login para consultar seus pedidos.'
            );
        }

        if (!resposta.ok) {

            throw new Error(
                'Erro ao carregar pedidos.'
            );
        }

        const pedidos = await resposta.json();

        // Verifica se a API retornou uma lista
        if (!Array.isArray(pedidos)) {

            throw new Error(
                'A API retornou um formato inválido de pedidos.'
            );
        }

        lista.replaceChildren();

        if (pedidos.length === 0) {

            lista.textContent =
                'Você ainda não realizou pedidos.';

            return;
        }

        // Exibe cada pedido
        pedidos.forEach(pedido => {

            const card = document.createElement('article');

            card.className = 'pedido-card';

            // Número do pedido
            const titulo = document.createElement('h2');

            titulo.textContent = 'Pedido nº ' + pedido.id;

            card.appendChild(titulo);

            // Status do pedido
            adicionarTexto(
                card,
                'Status: ' + nomeStatus(pedido.status)
            );

            // Data do pedido
            if (pedido.criadoEm) {

                adicionarTexto(
                    card,
                    'Data: ' + new Date(pedido.criadoEm)
                        .toLocaleString('pt-BR')
                );
            }

            // Endereço de entrega
            adicionarTexto(
                card,
                'Entrega: ' + (pedido.endereco || 'Não informado')
            );

            // Produtos comprados
            const itens = Array.isArray(pedido.itens)
                ? pedido.itens
                : [];

            if (itens.length > 0) {

                const subtitulo =
                    document.createElement('h3');

                subtitulo.textContent = 'Produtos comprados';

                card.appendChild(subtitulo);

                itens.forEach(item => {

                    const nomeProduto =
                        item.produto || item.nome || 'Produto';

                    const quantidade =
                        Number(item.quantidade) || 0;

                    const precoUnitario =
                        Number(item.precoUnitario) || 0;

                    adicionarTexto(
                        card,
                        `${nomeProduto} × ${quantidade} - ` +
                        dinheiro(precoUnitario * quantidade)
                    );

                });

            } else {

                adicionarTexto(
                    card,
                    'Itens do pedido não disponíveis.'
                );
            }

            // Valor total
            adicionarTexto(
                card,
                'Total: ' + dinheiro(pedido.total),
                true
            );

            // Botão de pagamento
            if (pedido.status === 'AGUARDANDO_PAGAMENTO') {

                const botaoPagar =
                    document.createElement('a');

                botaoPagar.className = 'btn';

                botaoPagar.textContent = 'Pagar pedido';

                botaoPagar.href =
                    '/pagamento.html?pedidoId=' +
                    encodeURIComponent(pedido.id);

                card.appendChild(botaoPagar);
            }

            // Cancelamento antes do pagamento
            if (pedido.status === 'AGUARDANDO_PAGAMENTO') {
                const botaoCancelar = document.createElement('button');
                botaoCancelar.type = 'button';
                botaoCancelar.className = 'btn btn-claro';
                botaoCancelar.textContent = 'Cancelar pedido';
                botaoCancelar.style.marginLeft = '10px';
                botaoCancelar.addEventListener('click', async () => {
                    if (!confirm(`Cancelar o pedido nº ${pedido.id}? Os itens voltarão ao estoque.`)) return;
                    botaoCancelar.disabled = true;
                    try {
                        const resposta = await fetch(`/api/pedidos/${pedido.id}/cancelar`, {
                            method: 'POST', credentials: 'same-origin'
                        });
                        if (!resposta.ok) throw new Error((await resposta.text()) || 'Erro ao cancelar o pedido.');
                        await carregarPedidos();
                    } catch (erro) {
                        alert(erro.message);
                        botaoCancelar.disabled = false;
                    }
                });
                card.appendChild(botaoCancelar);
            }

            // Pedido entregue
            if (pedido.status === 'ENTREGUE') {

                adicionarTexto(
                    card,
                    'Pedido entregue com sucesso.'
                );
            }

            // Pedido cancelado
            if (pedido.status === 'CANCELADO') {

                adicionarTexto(
                    card,
                    'Este pedido foi cancelado.'
                );
            }

            lista.appendChild(card);
        });

    } catch (erro) {

        console.error(
            'Erro ao consultar pedidos:',
            erro
        );

        lista.textContent = erro.message;
    }
}

// Inicialização
carregarPedidos();
