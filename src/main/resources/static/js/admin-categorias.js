
(function () {

    const form = document.getElementById('formCategoria');
    const campoNome = document.getElementById('nomeCategoria');
    const campoId = document.getElementById('categoriaEdicaoId');
    const botaoSalvar = document.getElementById('salvarCategoria');
    const botaoCancelar = document.getElementById('cancelarEdicaoCategoria');
    const mensagem = document.getElementById('mensagemCategorias');
    const tabela = document.getElementById('listaCategoriasAdmin');

    let categorias = [];

    function mostrarMensagem(texto, erro = false) {
        mensagem.textContent = texto;
        mensagem.style.color = erro ? '#a33' : '#355b45';
    }

    function criarCelula(linha, texto) {
        const celula = document.createElement('td');
        celula.textContent = texto;
        linha.appendChild(celula);
        return celula;
    }

    function limparFormulario() {
        form.reset();
        campoId.value = '';
        botaoSalvar.textContent = 'Cadastrar categoria';
        botaoCancelar.hidden = true;
    }

    function editarCategoria(id) {

        const categoria = categorias.find(
            c => Number(c.id) === Number(id)
        );

        if (!categoria) {
            mostrarMensagem('Categoria não encontrada.', true);
            return;
        }

        campoId.value = categoria.id;
        campoNome.value = categoria.nome;

        botaoSalvar.textContent = 'Salvar alterações';
        botaoCancelar.hidden = false;

        campoNome.focus();
        campoNome.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    function renderizarCategorias() {

        tabela.replaceChildren();

        if (categorias.length === 0) {

            const linha = document.createElement('tr');
            const celula = document.createElement('td');

            celula.colSpan = 3;
            celula.textContent = 'Nenhuma categoria cadastrada.';

            linha.appendChild(celula);
            tabela.appendChild(linha);

            return;
        }

        categorias.forEach(categoria => {

            const linha = document.createElement('tr');

            criarCelula(linha, categoria.id);
            criarCelula(linha, categoria.nome);

            const colunaAcoes = document.createElement('td');

            const botaoEditar = document.createElement('button');

            botaoEditar.type = 'button';
            botaoEditar.className = 'btn btn-claro';
            botaoEditar.textContent = 'Editar';

            botaoEditar.addEventListener('click', () => {
                editarCategoria(categoria.id);
            });

            colunaAcoes.appendChild(botaoEditar);

            const botaoExcluir = document.createElement('button');
            botaoExcluir.type = 'button';
            botaoExcluir.className = 'btn btn-claro';
            botaoExcluir.textContent = 'Excluir';
            botaoExcluir.addEventListener('click', async () => {
                if (!confirm(`Excluir a categoria "${categoria.nome}"? A exclusão só é permitida sem produtos vinculados.`)) return;
                botaoExcluir.disabled = true;
                try {
                    const resposta = await fetch(`/api/admin/categorias/${categoria.id}`, {
                        method: 'DELETE', credentials: 'same-origin'
                    });
                    if (!resposta.ok) throw new Error((await resposta.text()) || 'Não foi possível excluir.');
                    if (campoId.value === String(categoria.id)) limparFormulario();
                    await carregarCategoriasAdmin();
                    atualizarSelectProdutos();
                    mostrarMensagem('Categoria excluída com sucesso!');
                } catch (erro) {
                    mostrarMensagem(erro.message, true);
                } finally { botaoExcluir.disabled = false; }
            });
            colunaAcoes.appendChild(botaoExcluir);
            linha.appendChild(colunaAcoes);
            tabela.appendChild(linha);
        });
    }

    async function carregarCategoriasAdmin() {

        try {

            const resposta = await fetch('/api/admin/categorias', {
                credentials: 'same-origin',
                cache: 'no-store'
            });

            if (!resposta.ok) {
                throw new Error('Erro ao carregar categorias.');
            }

            const dados = await resposta.json();

            if (!Array.isArray(dados)) {
                throw new Error('Resposta inválida da API.');
            }

            categorias = dados;

            renderizarCategorias();

        } catch (erro) {

            console.error(erro);
            mostrarMensagem(erro.message, true);
        }
    }

    // Atualiza o select do cadastro de produtos
    function atualizarSelectProdutos() {

        const select = document.getElementById('categoria');

        if (!select) return;

        const valorAnterior = select.value;

        const opcoes = categorias.map(categoria => {

            const opcao = document.createElement('option');

            opcao.value = categoria.id;
            opcao.textContent = categoria.nome;

            return opcao;
        });

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Selecione';

        select.replaceChildren(placeholder, ...opcoes);

        if (categorias.some(c =>
                String(c.id) === valorAnterior)) {
            select.value = valorAnterior;
        }
    }

    form.addEventListener('submit', async evento => {

        evento.preventDefault();

        const nome = campoNome.value.trim();
        const id = campoId.value;

        if (!nome) {
            mostrarMensagem('Informe o nome da categoria.', true);
            return;
        }

        const editando = id !== '';

        botaoSalvar.disabled = true;

        mostrarMensagem(
            editando
                ? 'Salvando alterações...'
                : 'Cadastrando categoria...'
        );

        try {

            const url = editando
                ? `/api/admin/categorias/${id}`
                : '/api/admin/categorias';

            const resposta = await fetch(url, {
                method: editando ? 'PUT' : 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome })
            });

            if (!resposta.ok) {

                const texto = await resposta.text();

                throw new Error(
                    texto || 'Não foi possível salvar a categoria.'
                );
            }

            limparFormulario();

            await carregarCategoriasAdmin();

            atualizarSelectProdutos();

            mostrarMensagem(
                editando
                    ? 'Categoria atualizada com sucesso!'
                    : 'Categoria cadastrada com sucesso!'
            );

        } catch (erro) {

            console.error(erro);
            mostrarMensagem(erro.message, true);

        } finally {

            botaoSalvar.disabled = false;
        }
    });

    botaoCancelar.addEventListener('click', () => {

        limparFormulario();
        mostrarMensagem('Edição cancelada.');
    });

    // Inicialização
    carregarCategoriasAdmin();

})();
