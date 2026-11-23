(() => {
    const $ = id => document.getElementById(id);
    const tabela = $('listaPedidosAdmin');
    const aviso = $('mensagemPedidos');
    const filtro = $('filtroStatus');
    const busca = $('pesquisaPedidos');
    let pedidos = [];
    let processando = false;

    const dinheiro = valor => Number(valor || 0).toLocaleString('pt-BR',
        {style: 'currency', currency: 'BRL'});
    const statusNomes = {
        AGUARDANDO_PAGAMENTO: 'Aguardando pagamento', PAGO: 'Pago',
        ENVIADO: 'Enviado', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado'
    };
    const textoStatus = status => statusNomes[status] || status || '-';
    const avisoTexto = (texto, erro = false) => {
        aviso.textContent = texto;
        aviso.style.color = erro ? '#a33' : '#355b45';
    };
    const el = (tag, texto, classe) => {
        const node = document.createElement(tag);
        if (texto !== undefined && texto !== null) node.textContent = String(texto);
        if (classe) node.className = classe;
        return node;
    };
    const celula = (linha, texto) => {
        const td = el('td', texto);
        linha.appendChild(td);
        return td;
    };
    function botao(titulo, classe, acao) {
        const b = el('button', titulo, classe);
        b.type = 'button';
        b.disabled = processando;
        b.addEventListener('click', acao);
        return b;
    }

    function resumo() {
        const contar = status => pedidos.filter(p => p.status === status).length;
        const somar = status => pedidos.filter(p => status.includes(p.status))
            .reduce((total, p) => total + Number(p.total || 0), 0);
        $('totalPedidos').textContent = pedidos.length;
        $('pedidosPendentes').textContent = contar('AGUARDANDO_PAGAMENTO');
        $('pedidosPagos').textContent = contar('PAGO');
        $('pedidosEnviados').textContent = contar('ENVIADO');
        $('pedidosEntregues').textContent = contar('ENTREGUE');
        $('pedidosCancelados').textContent = contar('CANCELADO');
        $('receitaConfirmada').textContent = dinheiro(somar(['PAGO','ENVIADO','ENTREGUE']));
        $('pedidosRecebidos').textContent = pedidos.filter(
            p => ['PAGO','ENVIADO','ENTREGUE'].includes(p.status)).length;
        $('valorPendente').textContent = dinheiro(somar(['AGUARDANDO_PAGAMENTO']));
    }

    function filtrados() {
        const status = filtro.value;
        const termo = busca.value.trim().toLocaleLowerCase('pt-BR');
        return pedidos.filter(p => {
            const combinaStatus = status === 'TODOS' || p.status === status;
            const texto = `${p.id} ${p.cliente || ''} ${p.email || ''}`.toLocaleLowerCase('pt-BR');
            return combinaStatus && texto.includes(termo);
        });
    }

    function renderizar() {
        tabela.replaceChildren();
        const encontrados = filtrados();
        if (!encontrados.length) {
            const linha = el('tr');
            const td = celula(linha, 'Nenhum pedido encontrado para este filtro.');
            td.colSpan = 6;
            tabela.appendChild(linha);
            return;
        }
        for (const pedido of encontrados) {
            const linha = el('tr');
            celula(linha, `#${pedido.id}`);
            celula(linha, `${pedido.cliente} (${pedido.email})`);
            celula(linha, (pedido.itens || []).map(i => `${i.nome} × ${i.quantidade}`).join(', '));
            celula(linha, dinheiro(pedido.total));
            celula(linha, textoStatus(pedido.status)).className = 'pedido-status';
            const coluna = celula(linha, '');
            const acoes = el('div', null, 'pedido-acoes');
            acoes.appendChild(botao('Detalhes', 'btn btn-claro', () => abrirDetalhes(pedido.id)));
            if (pedido.status === 'PAGO') {
                acoes.appendChild(botao('Marcar como enviado', 'btn-enviar',
                    () => alterar(pedido.id, 'ENVIADO')));
            }
            if (pedido.status === 'ENVIADO') {
                acoes.appendChild(botao('Confirmar entrega', 'btn-entregar',
                    () => alterar(pedido.id, 'ENTREGUE')));
            }
            if (pedido.status === 'AGUARDANDO_PAGAMENTO') {
                acoes.appendChild(botao('Cancelar pedido', 'btn-cancelar',
                    () => alterar(pedido.id, 'CANCELADO')));
            }
            coluna.appendChild(acoes);
            tabela.appendChild(linha);
        }
    }

    function fecharDetalhes() {
        $('detalhesPedido').hidden = true;
        $('conteudoDetalhesPedido').replaceChildren();
    }
    function detalheTexto(destino, rotulo, valor) {
        const p = el('p');
        const destaque = el('strong', rotulo + ': ');
        p.append(destaque, document.createTextNode(valor == null || valor === '' ? 'Não informado' : String(valor)));
        destino.appendChild(p);
    }
    async function abrirDetalhes(id) {
        avisoTexto('Consultando detalhes do pedido...');
        try {
            const resposta = await fetch(`/api/admin/pedidos/${id}`,
                {credentials:'same-origin', cache:'no-store'});
            if (!resposta.ok) throw new Error('Não foi possível consultar os detalhes.');
            const p = await resposta.json();
            const area = $('conteudoDetalhesPedido');
            area.replaceChildren();
            $('numeroDetalhePedido').textContent = `#${p.id}`;
            const grid = el('div', null, 'detalhes-pedido-grid');
            const cliente = el('div');
            detalheTexto(cliente, 'Cliente', p.cliente);
            detalheTexto(cliente, 'E-mail', p.email);
            detalheTexto(cliente, 'Status', textoStatus(p.status));
            detalheTexto(cliente, 'Criado em', p.criadoEm ? new Date(p.criadoEm).toLocaleString('pt-BR') : '-');
            const entrega = el('div');
            detalheTexto(entrega, 'Endereço', p.endereco);
            detalheTexto(entrega, 'Bairro', p.bairro);
            detalheTexto(entrega, 'Cidade/UF', `${p.cidade}/${p.uf}`);
            detalheTexto(entrega, 'CEP', p.cep);
            detalheTexto(entrega, 'Complemento', p.complemento);
            detalheTexto(entrega, 'Pagamento', p.pagamentoMetodo ? `${p.pagamentoMetodo} - ${p.pagamentoStatus}` : 'Ainda não registrado');
            grid.append(cliente, entrega);
            area.appendChild(grid);
            area.appendChild(el('h3', 'Produtos comprados'));
            const table = el('table', null, 'admin-tabela');
            const head = el('thead');
            const linhaCabecalho = el('tr');
            for (const titulo of ['Produto','Quantidade','Preço unitário','Subtotal']) {
                linhaCabecalho.appendChild(el('th', titulo));
            }
            head.appendChild(linhaCabecalho);
            table.appendChild(head);
            const corpo = el('tbody');
            for (const item of p.itens || []) {
                const tr = el('tr');
                celula(tr, item.nome);
                celula(tr, item.quantidade);
                celula(tr, dinheiro(item.precoUnitario));
                celula(tr, dinheiro(item.subtotal));
                corpo.appendChild(tr);
            }
            table.appendChild(corpo);
            area.appendChild(table);
            detalheTexto(area, 'Total do pedido', dinheiro(p.total));
            $('detalhesPedido').hidden = false;
            $('detalhesPedido').scrollIntoView({behavior:'smooth', block:'start'});
            avisoTexto('');
        } catch (erro) { avisoTexto(erro.message, true); }
    }

    async function carregar() {
        avisoTexto('Carregando pedidos...');
        try {
            const resposta = await fetch('/api/admin/pedidos',
                {credentials:'same-origin', cache:'no-store'});
            if (!resposta.ok) throw new Error(resposta.status === 403 ?
                'Acesso exclusivo do administrador.' : 'Erro ao carregar pedidos.');
            const dados = await resposta.json();
            if (!Array.isArray(dados)) throw new Error('Resposta inválida da API.');
            pedidos = dados;
            resumo();
            renderizar();
            avisoTexto(`${pedidos.length} pedido(s) encontrado(s).`);
        } catch (erro) { avisoTexto(erro.message, true); }
    }

    async function alterar(id, status) {
        if (processando || !confirm(`Alterar pedido #${id} para ${textoStatus(status)}?`)) return;
        processando = true;
        renderizar();
        avisoTexto('Atualizando pedido...');
        try {
            const resposta = await fetch(`/api/admin/pedidos/${id}/status`, {
                method:'PATCH', credentials:'same-origin',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({status})
            });
            if (!resposta.ok) throw new Error((await resposta.text()) || 'Não foi possível atualizar.');
            fecharDetalhes();
            await carregar();
            avisoTexto(`Pedido #${id} atualizado para ${textoStatus(status)}.`);
        } catch (erro) { avisoTexto(erro.message, true); }
        finally { processando = false; renderizar(); }
    }

    function exportar() {
        const valores = [['Pedido','Cliente','E-mail','Data','Status','Total','Pagamento','Endereço']];
        for (const p of filtrados()) {
            valores.push([p.id,p.cliente,p.email,p.criadoEm,p.status,p.total,
                p.pagamentoMetodo || '',`${p.endereco}, ${p.cidade}/${p.uf}`]);
        }
        const esc = v => {
            let valor = String(v ?? '');
            if (/^[\s]*[=+@-]/.test(valor)) valor = "'" + valor;
            return `"${valor.replace(/"/g, '""')}"`;
        };
        const texto = '\uFEFF' + valores.map(l => l.map(esc).join(';')).join('\r\n');
        const url = URL.createObjectURL(new Blob([texto],{type:'text/csv;charset=utf-8;'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'relatorio-pedidos-vitrine.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    $('atualizarPedidos').addEventListener('click', carregar);
    $('exportarPedidos').addEventListener('click', exportar);
    $('fecharDetalhesPedido').addEventListener('click', fecharDetalhes);
    filtro.addEventListener('change', renderizar);
    busca.addEventListener('input', renderizar);
    carregar();
})();
