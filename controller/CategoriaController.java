package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.Categoria;
import br.com.dsii.loja.repository.CategoriaRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {
    private final CategoriaRepository repo;
    public CategoriaController(CategoriaRepository repo) { this.repo = repo; }

    @GetMapping public List<Categoria> listar() { return repo.findAll(); }
    @PostMapping public Categoria cadastrar(@RequestBody Categoria c) { return repo.save(c); }
    @PutMapping("/{id}") public Categoria atualizar(@PathVariable Long id, @RequestBody Categoria dados) {
        Categoria c = repo.findById(id).orElseThrow();
        c.setNome(dados.getNome()); c.setDescricao(dados.getDescricao());
        return repo.save(c);
    }
    @DeleteMapping("/{id}") public void excluir(@PathVariable Long id) { repo.deleteById(id); }
}
