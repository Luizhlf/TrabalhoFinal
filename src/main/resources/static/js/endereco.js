
const campo = id => document.getElementById(id);

let enderecos = [];

function mensagem(texto, erro = false) {
    campo('mensagem').textContent = texto;
    campo('mensagem').style.color =
        erro ? '#a33' : 'green';
}

// Consulta de CEP pelo ViaCEP
async function buscarCep() {

    const cep = campo('cep').value.replace(/\D/g, '');

    if (cep.length !== 8) {
        mensagem('Informe um CEP com 8 números.', true);
        return;
    }

    mensagem('Consultando CEP...');

    try {
        const resposta = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        );

        if (!resposta.ok) {
            throw new Error('Erro ao consultar o CEP.');
        }

        const dados = await resposta.json();

        if (dados.erro) {
            mensagem('CEP não encontrado.', true);
            return;
        }

        campo('cep').value = dados.cep || cep;
        campo('logradouro').value = dados.logradouro || '';
        campo('bairro').value = dados.bairro || '';
        campo('cidade').value = dados.localidade || '';
        campo('uf').value = dados.uf || '';

        mensagem('CEP encontrado com sucesso!');
        campo('numero').focus();

    } catch (erro) {
        mensagem('Não foi possível consultar o CEP.', true);
    }
}

// Limpa o formulário
function limparFormulario() {

    campo('formEndereco').reset();

    campo('enderecoId').value = '';

    campo('tituloFormulario').textContent =
        'Cadastrar endereço';

    campo('salvar').textContent = 'Salvar endereço';

    campo('cancelarEdicao').hidden = true;
}

// Carrega os endereços
async function carregarEnderecos() {

    const lista = campo('listaEnderecos');

    try {
        const resposta = await fetch('/api/enderecos', {
            credentials: 'same-origin'
        });

        if (resposta.status === 401 ||
            resposta.status === 403) {
            throw new Error(
                'Faça login para acessar seus endereços.'
            );
        }

        if (!resposta.ok) {
            throw new Error('Erro ao carregar endereços.');
        }

        enderecos = await resposta.json();

        lista.replaceChildren();

        if (!enderecos.length) {
            lista.textContent = 'Nenhum endereço cadastrado.';
            return;
        }

        enderecos.forEach(e => {

            const div = document.createElement('div');
            div.className = 'endereco-item';

            const titulo = document.createElement('strong');
            titulo.textContent =
                `${e.logradouro}, ${e.numero || 'S/N'}`;

            const local = document.createElement('p');
            local.textContent =
                `${e.bairro} - ${e.cidade}/${e.uf}`;

            const cep = document.createElement('p');
            cep.textContent = `CEP: ${e.cep}`;

            const complemento = document.createElement('p');
            complemento.textContent = e.complemento || '';

            div.append(titulo, local, cep, complemento);

            if (e.utilizadoEmPedido) {

                const aviso = document.createElement('p');
                aviso.className = 'endereco-aviso';

                aviso.textContent =
                    'Este endereço está associado a um pedido ' +
                    'e não pode ser alterado ou excluído.';

                div.appendChild(aviso);

            } else {

                const acoes = document.createElement('div');
                acoes.className = 'acoes-endereco';

                const editar = document.createElement('button');
                editar.className = 'btn';
                editar.textContent = 'Editar';
                editar.onclick = () => editarEndereco(e.id);

                const excluir = document.createElement('button');
                excluir.className = 'btn-excluir';
                excluir.textContent = 'Excluir';
                excluir.onclick = () => excluirEndereco(e.id);

                acoes.append(editar, excluir);
                div.appendChild(acoes);
            }

            lista.appendChild(div);
        });

    } catch (erro) {
        lista.textContent = erro.message;
    }
}

// Preenche o formulário para edição
function editarEndereco(id) {

    const e = enderecos.find(item => item.id === id);

    if (!e || e.utilizadoEmPedido) return;

    campo('enderecoId').value = e.id;
    campo('cep').value = e.cep;
    campo('logradouro').value = e.logradouro;
    campo('numero').value = e.numero || '';
    campo('complemento').value = e.complemento || '';
    campo('bairro').value = e.bairro;
    campo('cidade').value = e.cidade;
    campo('uf').value = e.uf;

    campo('tituloFormulario').textContent =
        'Editar endereço';

    campo('salvar').textContent = 'Salvar alterações';

    campo('cancelarEdicao').hidden = false;

    mensagem('');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Envia cadastro ou edição
async function salvarEndereco(evento) {

    evento.preventDefault();

    const id = campo('enderecoId').value;

    const endereco = {
        cep: campo('cep').value.replace(/\D/g, ''),
        logradouro: campo('logradouro').value.trim(),
        numero: campo('numero').value.trim(),
        complemento: campo('complemento').value.trim(),
        bairro: campo('bairro').value.trim(),
        cidade: campo('cidade').value.trim(),
        uf: campo('uf').value.trim().toUpperCase()
    };

    if (endereco.cep.length !== 8 ||
        endereco.uf.length !== 2) {

        mensagem('Verifique o CEP e o estado.', true);
        return;
    }

    const url = id
        ? `/api/enderecos/${id}`
        : '/api/enderecos';

    const metodo = id ? 'PUT' : 'POST';

    const botao = campo('salvar');
    botao.disabled = true;

    try {
        const resposta = await fetch(url, {
            method: metodo,
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(endereco)
        });

        if (!resposta.ok) {
            const texto = await resposta.text();

            throw new Error(
                texto || 'Não foi possível salvar o endereço.'
            );
        }

        limparFormulario();

        await carregarEnderecos();

        mensagem(id
            ? 'Endereço atualizado com sucesso!'
            : 'Endereço cadastrado com sucesso!');

    } catch (erro) {
        mensagem(erro.message, true);

    } finally {
        botao.disabled = false;
    }
}

// Exclui um endereço
async function excluirEndereco(id) {

    const confirmar = confirm(
        'Deseja realmente excluir este endereço?'
    );

    if (!confirmar) return;

    try {
        const resposta = await fetch(
            `/api/enderecos/${id}`,
            {
                method: 'DELETE',
                credentials: 'same-origin'
            }
        );

        if (!resposta.ok) {
            const texto = await resposta.text();

            throw new Error(
                texto || 'Não foi possível excluir o endereço.'
            );
        }

        if (campo('enderecoId').value === String(id)) {
            limparFormulario();
        }

        await carregarEnderecos();

        mensagem('Endereço excluído com sucesso!');

    } catch (erro) {
        mensagem(erro.message, true);
    }
}

// Eventos
campo('buscarCep').addEventListener('click', buscarCep);

campo('formEndereco')
    .addEventListener('submit', salvarEndereco);

campo('cancelarEdicao')
    .addEventListener('click', limparFormulario);

// Inicialização
carregarEnderecos();
