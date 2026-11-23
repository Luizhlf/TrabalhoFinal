package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.Categoria;
import br.com.dsii.loja.repository.CategoriaRepository;
import br.com.dsii.loja.repository.ProdutoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {
    private final CategoriaRepository repo;
    private final ProdutoRepository produtos;
    public CategoriaController(CategoriaRepository repo, ProdutoRepository produtos) {
        this.repo = repo; this.produtos = produtos;
    }

    @GetMapping public List<Categoria> listar() { return repo.findAll(); }
    @PostMapping public Categoria cadastrar(@RequestBody Categoria c) { return repo.save(c); }
    @PutMapping("/{id}") public Categoria atualizar(@PathVariable Long id, @RequestBody Categoria dados) {
        Categoria c = repo.findById(id).orElseThrow();
        c.setNome(dados.getNome()); c.setDescricao(dados.getDescricao());
        return repo.save(c);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        if (produtos.existsByCategoriaId(id))
            return ResponseEntity.status(409).body("Categoria vinculada a produtos.");
        repo.deleteById(id);
        return ResponseEntity.ok("Categoria excluída.");
    }
}
