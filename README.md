# Lumora — Loja Online

Projeto acadêmico desenvolvido para a disciplina de **Desenvolvimento de Software II (DS-II)**.

A Lumora é uma aplicação web de comércio eletrônico que permite aos clientes consultar produtos, gerenciar o carrinho de compras, cadastrar endereços e realizar pedidos com pagamento simulado. Os administradores podem gerenciar produtos, categorias e pedidos.

## Integrantes

- **Luiz Henrique dos Passos Silva** — GitHub: [@Luizhlf](https://github.com/Luizhlf)
- **Yohans Silva Bezerra** — GitHub: [@YohansSilva](https://github.com/YohansSilva)

## Tecnologias utilizadas

- **Backend:** Java 17, Spring Boot 3.5.7, Spring Web, Spring Security e Spring Data JPA/Hibernate.
- **Frontend:** HTML5, CSS3 e JavaScript.
- **Banco de dados:** PostgreSQL (Neon).
- **Gerenciamento de dependências:** Maven.
- **API externa:** ViaCEP, para consulta de endereços pelo CEP.
- **Ferramentas de desenvolvimento:** Eclipse e Git/GitHub.

## Funcionalidades

### Clientes

- Cadastro e autenticação de usuários.
- Consulta de produtos e categorias.
- Carrinho de compras.
- Cadastro e gerenciamento de endereços.
- Consulta de CEP.
- Realização e acompanhamento de pedidos.
- Cancelamento de pedidos.
- Pagamento simulado.
- Avaliação de produtos.

### Administradores

- Gerenciamento de produtos.
- Cadastro, edição e exclusão de categorias.
- Consulta e gerenciamento de pedidos.
- Atualização do status dos pedidos.

## Como executar

**Pré-requisitos:** JDK 17, Maven e acesso a um banco PostgreSQL.

1. Clone o repositório:

   `git clone https://github.com/Luizhlf/TrabalhoFinal.git`

2. Acesse a pasta que contém o arquivo `pom.xml`.

3. Configure as credenciais do PostgreSQL no arquivo local `src/main/resources/application-local.properties`.

   As informações de conexão são particulares de cada ambiente e não devem ser enviadas ao GitHub.

4. Inicie a aplicação utilizando o Maven:

   `mvn spring-boot:run`

5. Acesse o sistema no navegador:

   `http://localhost:8080`

O projeto também pode ser importado no Eclipse pela opção **Existing Maven Projects** e executado com o goal `spring-boot:run`.

## Documentação da API REST

A Lumora utiliza controladores REST desenvolvidos com Spring Boot para realizar operações de autenticação, gerenciamento de produtos, categorias, pedidos, pagamentos, endereços e avaliações.

### 1. Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/cadastro` | Cadastra um usuário. |
| POST | `/api/auth/login` | Realiza o login. |
| GET | `/api/auth/me` | Consulta o usuário autenticado. |
| POST | `/api/auth/logout` | Encerra a sessão. |

### 2. Produtos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/produtos` | Lista os produtos. |
| GET | `/api/produtos/{id}` | Consulta um produto. |
| POST | `/api/produtos` | Cadastra um produto. |
| PUT | `/api/produtos/{id}` | Atualiza um produto. |
| DELETE | `/api/produtos/{id}` | Exclui um produto. |

### 3. Categorias

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/categorias` | Lista as categorias. |
| POST | `/api/categorias` | Cadastra uma categoria. |
| PUT | `/api/categorias/{id}` | Atualiza uma categoria. |
| DELETE | `/api/categorias/{id}` | Exclui uma categoria. |

### 4. Administração de categorias

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/admin/categorias` | Lista categorias no módulo administrativo. |
| POST | `/api/admin/categorias` | Cadastra uma categoria. |
| PUT | `/api/admin/categorias/{id}` | Atualiza uma categoria. |
| DELETE | `/api/admin/categorias/{id}` | Exclui uma categoria. |

### 5. Pedidos

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/pedidos` | Cria um pedido. |
| GET | `/api/pedidos/meus` | Consulta os pedidos do usuário. |
| POST | `/api/pedidos/{id}/cancelar` | Solicita o cancelamento de um pedido. |

### 6. Administração de pedidos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/admin/pedidos` | Lista os pedidos no módulo administrativo. |
| GET | `/api/admin/pedidos/{id}` | Consulta um pedido específico. |
| PATCH | `/api/admin/pedidos/{id}/status` | Atualiza o status de um pedido. |

### 7. Pagamentos

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/pagamentos/{pedidoId}` | Registra ou processa o pagamento simulado de um pedido. |

### 8. Endereços

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/enderecos` | Lista os endereços do usuário. |
| POST | `/api/enderecos` | Cadastra um endereço. |
| PUT | `/api/enderecos/{id}` | Atualiza um endereço. |
| DELETE | `/api/enderecos/{id}` | Exclui um endereço. |

### 9. Consulta de CEP

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/cep/{cep}` | Consulta informações de endereço pelo CEP. |

### 10. Avaliações

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/avaliacoes/produto/{produtoId}` | Lista as avaliações de um produto. |
| POST | `/api/avaliacoes` | Cadastra uma avaliação. |

### Observações sobre a API

- A API utiliza os métodos HTTP GET, POST, PUT, PATCH e DELETE.
- Os parâmetros entre chaves representam identificadores informados na URL.
- O projeto utiliza Spring Security para autenticação e controle de acesso.
- Algumas operações exigem autenticação ou permissões específicas.
- A documentação apresenta os endpoints identificados nos controladores da aplicação.

## Estrutura do projeto

- `src/main/java/br/com/dsii/loja/model/` — Entidades do banco de dados.
- `src/main/java/br/com/dsii/loja/repository/` — Repositórios de acesso aos dados.
- `src/main/java/br/com/dsii/loja/service/` — Regras de negócio.
- `src/main/java/br/com/dsii/loja/controller/` — Controladores da API REST.
- `src/main/java/br/com/dsii/loja/config/` — Configurações da aplicação e segurança.
- `src/main/resources/static/` — Arquivos HTML, CSS e JavaScript.
- `src/main/resources/` — Configurações da aplicação.
- `database/` — Scripts SQL do projeto.

## Links

- **Repositório:** https://github.com/Luizhlf/TrabalhoFinal

---

*O projeto foi desenvolvido para fins acadêmicos. Os pagamentos são simulados, sem realização de cobranças reais.*
