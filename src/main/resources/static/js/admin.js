
const API = "/api";
let produtos = [];

const campo = id => document.getElementById(id);

const dinheiro = valor =>
    Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

function mensagem(texto, erro = false) {
    campo("mensagem").textContent = texto;
    campo("mensagem").style.color =
        erro ? "#a33" : "#355b45";
}

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, {
        credentials: "same-origin",
        ...opcoes
    });

    if (!resposta.ok) {
        if (resposta.status === 401 ||
            resposta.status === 403) {
            throw new Error("Acesso negado. Entre como administrador.");
        }

        throw new Error("Erro na operação: " + resposta.status);
    }

    const texto = await resposta.text();

    try {
        return JSON.parse(texto);
    } catch {
        return texto;
    }
}

async function carregarCategorias() {
    const categorias = await requisicao(API + "/categorias");
    const select = campo("categoria");

    select.innerHTML = '<option value="">Selecione</option>';

    categorias.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.nome;
        select.appendChild(option);
    });
}

async function carregarProdutos() {
    produtos = await requisicao(API + "/produtos");

    const tabela = campo("listaProdutos");
    tabela.replaceChildren();

    produtos.forEach(p => {
        const linha = document.createElement("tr");

        [p.id, p.nome, dinheiro(p.preco), p.estoque]
            .forEach(valor => {
                const td = document.createElement("td");
                td.textContent = valor;
                linha.appendChild(td);
            });

        const acoes = document.createElement("td");

        const editar = document.createElement("button");
        editar.textContent = "Editar";
        editar.onclick = () => editarProduto(p.id);

        const excluir = document.createElement("button");
        excluir.textContent = "Desativar";
        excluir.onclick = () => desativarProduto(p.id);

        acoes.append(editar, excluir);
        linha.appendChild(acoes);
        tabela.appendChild(linha);
    });
}

function editarProduto(id) {
    const p = produtos.find(item => item.id === id);
    if (!p) return;

    campo("produtoId").value = p.id;
    campo("nome").value = p.nome;
    campo("descricao").value = p.descricao || "";
    campo("preco").value = p.preco;
    campo("estoque").value = p.estoque;
    campo("imagemUrl").value = p.imagemUrl || "";
    campo("categoria").value = p.categoria.id;

    campo("tituloFormulario").textContent = "Editar produto";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function limparFormulario() {
    campo("formProduto").reset();
    campo("produtoId").value = "";
    campo("tituloFormulario").textContent = "Cadastrar produto";
}

campo("cancelarEdicao").onclick = limparFormulario;

campo("formProduto").addEventListener("submit", async evento => {
    evento.preventDefault();

    const id = campo("produtoId").value;

    const produto = {
        nome: campo("nome").value,
        descricao: campo("descricao").value,
        preco: Number(campo("preco").value),
        estoque: Number(campo("estoque").value),
        imagemUrl: campo("imagemUrl").value,
        categoriaId: Number(campo("categoria").value)
    };

    try {
        await requisicao(
            API + "/produtos" + (id ? "/" + id : ""),
            {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(produto)
            }
        );

        mensagem(id ? "Produto atualizado!" : "Produto cadastrado!");
        limparFormulario();
        await carregarProdutos();

    } catch (erro) {
        mensagem(erro.message, true);
    }
});

async function desativarProduto(id) {
    if (!confirm("Deseja desativar este produto?")) {
        return;
    }

    try {
        await requisicao(API + "/produtos/" + id, {
            method: "DELETE"
        });

        mensagem("Produto desativado!");
        await carregarProdutos();

    } catch (erro) {
        mensagem(erro.message, true);
    }
}

campo("sair").onclick = async () => {
    try {
        await requisicao(API + "/auth/logout", {
            method: "POST"
        });
        window.location.href = "/login.html";
    } catch (erro) {
        mensagem(erro.message, true);
    }
};

async function iniciar() {
    try {
        await carregarCategorias();
        await carregarProdutos();
    } catch (erro) {
        mensagem(erro.message, true);
    }
}

iniciar();
