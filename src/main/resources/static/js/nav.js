
async function carregarNavegacao() {

    let usuario = {
        autenticado: false,
        papel: null
    };

    // Verifica quem está logado
    try {
        const resposta = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });

        if (resposta.ok) {
            const dados = await resposta.json();

            usuario.autenticado =
                dados.autenticado === true;

            usuario.papel = dados.papel || null;

        } else {
            console.warn(
                'Não foi possível consultar a sessão:',
                resposta.status
            );
        }

    } catch (erro) {
        console.error(
            'Erro ao verificar usuário:',
            erro
        );
    }

    // Aceita ADMIN, CLIENTE e também ROLE_ADMIN/ROLE_CLIENTE
    const papel = String(usuario.papel || '')
        .replace(/^ROLE_/, '')
        .toUpperCase();

    // Localiza ou cria o cabeçalho
    let topo = document.querySelector('header.topo');

    if (!topo) {
        topo = document.createElement('header');
        topo.className = 'topo';

        const marca = document.createElement('a');
        marca.className = 'marca';
        marca.href = '/';
        marca.textContent = 'Vitrine';

        const ponto = document.createElement('span');
        ponto.textContent = '.';

        marca.appendChild(ponto);
        topo.appendChild(marca);

        document.body.prepend(topo);
    }

    let menu = topo.querySelector('nav');

    if (!menu) {
        menu = document.createElement('nav');
        topo.appendChild(menu);
    }

    // Preserva o botão original do carrinho,
    // incluindo seu evento de clique
    const botaoCarrinho =
        document.getElementById('abrirCarrinho');

    // Reconstrói somente o menu superior
    menu.replaceChildren();

    function adicionarLink(texto, destino) {

        const link = document.createElement('a');

        link.href = destino;
        link.textContent = texto;

        menu.appendChild(link);
    }

    function adicionarBotaoSair() {

        const sair = document.createElement('button');

        sair.type = 'button';
        sair.className = 'btn btn-sair';
        sair.textContent = 'Sair';

        sair.addEventListener('click', async () => {

            sair.disabled = true;
            sair.textContent = 'Saindo...';

            try {
                const resposta = await fetch(
                    '/api/auth/logout',
                    {
                        method: 'POST',
                        credentials: 'same-origin'
                    }
                );

                if (!resposta.ok) {
                    throw new Error(
                        'Não foi possível encerrar a sessão.'
                    );
                }

                // Limpa o carrinho após sair
                localStorage.removeItem('carrinho');

                // Só vai para o login quando clicar em Sair
                window.location.replace('/login.html');

            } catch (erro) {
                console.error(erro);

                alert('Erro ao sair da conta.');

                sair.disabled = false;
                sair.textContent = 'Sair';
            }
        });

        menu.appendChild(sair);
    }

    // Link disponível para todos
    adicionarLink('Produtos', '/#produtos');

    if (!usuario.autenticado) {

        // VISITANTE
        adicionarLink('Entrar', '/login.html');
        adicionarLink('Cadastrar', '/cadastro.html');

    } else if (papel === 'ADMIN') {

        // ADMINISTRADOR
        adicionarLink(
            'Painel administrativo',
            '/admin.html'
        );

    } else if (papel === 'CLIENTE') {

        // CLIENTE
        adicionarLink(
            'Meus pedidos',
            '/meus-pedidos.html'
        );

        adicionarLink(
            'Meus endereços',
            '/endereco.html'
        );

    } else {

        console.warn(
            'Perfil de usuário não reconhecido:',
            usuario.papel
        );
    }

    // Carrinho: aparece na página inicial
    if (botaoCarrinho) {
        menu.appendChild(botaoCarrinho);
    }

    // O botão Sair aparece para qualquer usuário logado
    if (usuario.autenticado) {
        adicionarBotaoSair();
    }
}

// Executa ao carregar a página
if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        carregarNavegacao
    );

} else {

    carregarNavegacao();
}
