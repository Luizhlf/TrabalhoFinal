package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.*;
import br.com.dsii.loja.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {
    private final ProdutoRepository produtos;
    private final CategoriaRepository categorias;

    public ProdutoController(ProdutoRepository produtos, CategoriaRepository categorias) {
        this.produtos = produtos; this.categorias = categorias;
    }

    @GetMapping
    public List<Produto> listar() { return produtos.findAll().stream().filter(Produto::isAtivo).toList(); }

    @GetMapping("/{id}")
    public ResponseEntity<Produto> buscar(@PathVariable Long id) {
        return produtos.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody ProdutoRequest req) {
        Categoria categoria = categorias.findById(req.categoriaId()).orElse(null);
        if (categoria == null) return ResponseEntity.badRequest().body("Categoria não encontrada.");
        Produto p = new Produto();
        preencher(p, req, categoria);
        return ResponseEntity.ok(produtos.save(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody ProdutoRequest req) {
        return produtos.findById(id).map(p -> {
            Categoria c = categorias.findById(req.categoriaId()).orElse(null);
            if (c == null) return ResponseEntity.badRequest().body("Categoria não encontrada.");
            preencher(p, req, c);
            return ResponseEntity.ok(produtos.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        return produtos.findById(id).map(p -> {
            p.setAtivo(false); produtos.save(p);
            return ResponseEntity.ok("Produto desativado.");
        }).orElse(ResponseEntity.notFound().build());
    }

    private void preencher(Produto p, ProdutoRequest r, Categoria c) {
        p.setNome(r.nome()); p.setDescricao(r.descricao()); p.setPreco(r.preco());
        p.setEstoque(r.estoque()); p.setImagemUrl(r.imagemUrl()); p.setCategoria(c); p.setAtivo(true);
    }
    public record ProdutoRequest(String nome, String descricao, java.math.BigDecimal preco,
                                 Integer estoque, String imagemUrl, Long categoriaId) {}
}
