# Loja Online

Projeto acadêmico desenvolvido para a disciplina de **Desenvolvimento de Software II (DS-II)**.

A Vitrine é uma aplicação web de comércio eletrônico que permite aos clientes consultar produtos, gerenciar o carrinho de compras, cadastrar endereços e realizar pedidos com pagamento simulado. Os administradores podem gerenciar produtos, categorias e pedidos.

## Integrantes

- **Luiz Henrique dos Passos Silva** — GitHub: [@Luizhlf](https://github.com/Luizhlf)
- **Yohans Silva Bezerra** — GitHub: [@Yohans Silva](https://github.com/YohansSilva)

## Tecnologias utilizadas

- **Backend:** Java 17, Spring Boot 3.5.7, Spring Web, Spring Security e Spring Data JPA/Hibernate.
- **Frontend:** HTML5, CSS3 e JavaScript.
- **Banco de dados:** PostgreSQL (Neon).
- **Gerenciamento e testes:** Maven, JUnit e Spring Boot Test.
- **API externa:** ViaCEP, para consulta de endereços pelo CEP.

## Como executar

**Pré-requisitos:** JDK 17, Maven e acesso a um banco PostgreSQL.

1. Clone o repositório:

   `git clone https://github.com/Luizhlf/TrabalhoFinal.git`

2. Acesse a pasta que contém o arquivo `pom.xml`.

3. Configure a conexão com o PostgreSQL no arquivo `src/main/resources/application.properties`, utilizando os dados do seu banco.

4. Execute os testes:

   `mvn test`

5. Inicie a aplicação:

   `mvn spring-boot:run`

6. Acesse o sistema em **http://localhost:8080**.

O projeto também pode ser importado no Eclipse utilizando a opção **Existing Maven Projects** e executado com o goal `spring-boot:run`.

## Links

- **Repositório:** https://github.com/Luizhlf/TrabalhoFinal
- **Aplicação publicada (deploy):** [Adicionar link]
- **Swagger/OpenAPI:** [Adicionar link caso seja implementado]

*O pagamento é simulado para fins acadêmicos, sem cobrança real.*
