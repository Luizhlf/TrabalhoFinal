
package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.Categoria;
import br.com.dsii.loja.repository.CategoriaRepository;
import br.com.dsii.loja.repository.ProdutoRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admin/categorias")
public class AdminCategoriaController {

    private final CategoriaRepository categorias;
    private final ProdutoRepository produtos;

    public AdminCategoriaController(
            CategoriaRepository categorias,
            ProdutoRepository produtos) {

        this.categorias = categorias;
        this.produtos = produtos;
    }

    public record CategoriaRequest(String nome) {}

    public record CategoriaResponse(
            Long id,
            String nome) {}

    private CategoriaResponse converter(Categoria categoria) {
        return new CategoriaResponse(
                categoria.getId(),
                categoria.getNome()
        );
    }

    // Lista as categorias cadastradas
    @GetMapping
    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar() {

        return categorias.findAll()
                .stream()
                .sorted(Comparator.comparing(
                        Categoria::getNome,
                        String.CASE_INSENSITIVE_ORDER
                ))
                .map(this::converter)
                .toList();
    }

    // Verifica se existe outra categoria com o mesmo nome
    private boolean nomeJaExiste(String nome, Long ignorarId) {

        return categorias.findAll()
                .stream()
                .anyMatch(categoria ->
                        !categoria.getId().equals(ignorarId)
                        && categoria.getNome()
                                .equalsIgnoreCase(nome)
                );
    }

    // Cadastra uma nova categoria
    @PostMapping
    @Transactional
    public ResponseEntity<?> cadastrar(
            @RequestBody CategoriaRequest req) {

        if (req == null ||
                req.nome() == null ||
                req.nome().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Informe o nome da categoria.");
        }

        String nome = req.nome().trim();

        if (nome.length() > 80) {

            return ResponseEntity.badRequest()
                    .body("O nome deve ter no máximo 80 caracteres.");
        }

        if (nomeJaExiste(nome, null)) {

            return ResponseEntity.badRequest()
                    .body("Essa categoria já está cadastrada.");
        }

        Categoria categoria = new Categoria();
        categoria.setNome(nome);

        categoria = categorias.save(categoria);

        return ResponseEntity.ok(converter(categoria));
    }

    // Edita o nome de uma categoria existente
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> editar(
            @PathVariable Long id,
            @RequestBody CategoriaRequest req) {

        Categoria categoria = categorias
                .findById(id)
                .orElse(null);

        if (categoria == null) {
            return ResponseEntity.notFound().build();
        }

        if (req == null ||
                req.nome() == null ||
                req.nome().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Informe o nome da categoria.");
        }

        String nome = req.nome().trim();

        if (nome.length() > 80) {

            return ResponseEntity.badRequest()
                    .body("O nome deve ter no máximo 80 caracteres.");
        }

        if (nomeJaExiste(nome, id)) {

            return ResponseEntity.badRequest()
                    .body("Já existe outra categoria com esse nome.");
        }

        categoria.setNome(nome);
        categoria = categorias.save(categoria);

        return ResponseEntity.ok(converter(categoria));
    }

    // Exclui somente categorias que nunca foram vinculadas a produtos
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        Categoria categoria = categorias.findById(id).orElse(null);
        if (categoria == null) return ResponseEntity.notFound().build();
        if (produtos.existsByCategoriaId(id)) {
            return ResponseEntity.status(409)
                    .body("A categoria possui produtos vinculados e não pode ser excluída.");
        }
        categorias.delete(categoria);
        return ResponseEntity.ok("Categoria excluída com sucesso.");
    }
}
