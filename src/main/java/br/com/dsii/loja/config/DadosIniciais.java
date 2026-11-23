
package br.com.dsii.loja.config;

import br.com.dsii.loja.model.Categoria;
import br.com.dsii.loja.model.Produto;
import br.com.dsii.loja.repository.CategoriaRepository;
import br.com.dsii.loja.repository.ProdutoRepository;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DadosIniciais {

    @Bean
    CommandLineRunner cadastrarDados(
            CategoriaRepository categorias,
            ProdutoRepository produtos) {

        return args -> {

            Categoria eletronicos = categorias.findAll()
                .stream()
                .filter(c -> c.getNome().equals("Eletrônicos"))
                .findFirst()
                .orElseGet(() -> {
                    Categoria c = new Categoria();
                    c.setNome("Eletrônicos");
                    c.setDescricao("Produtos eletrônicos");
                    return categorias.save(c);
                });

            cadastrarProduto(produtos, eletronicos,
                "Mouse Gamer", "Mouse com iluminação RGB",
                "89.90", 20);

            cadastrarProduto(produtos, eletronicos,
                "Teclado Mecânico", "Teclado para jogos",
                "199.90", 15);

            cadastrarProduto(produtos, eletronicos,
                "Headset Gamer", "Fone com microfone",
                "149.90", 10);

            System.out.println("Dados iniciais verificados!");
        };
    }

    private void cadastrarProduto(
            ProdutoRepository repo,
            Categoria categoria,
            String nome,
            String descricao,
            String preco,
            int estoque) {

        boolean existe = repo.findAll()
            .stream()
            .anyMatch(p -> p.getNome().equals(nome));

        if (!existe) {
            Produto p = new Produto();
            p.setNome(nome);
            p.setDescricao(descricao);
            p.setPreco(new BigDecimal(preco));
            p.setEstoque(estoque);
            p.setCategoria(categoria);
            p.setAtivo(true);

            repo.save(p);
        }
    }
}
