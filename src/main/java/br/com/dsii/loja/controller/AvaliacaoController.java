package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.*;
import br.com.dsii.loja.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/avaliacoes")
public class AvaliacaoController {
    private final AvaliacaoRepository repo;
    private final ProdutoRepository produtos;
    private final UsuarioRepository usuarios;
    public AvaliacaoController(AvaliacaoRepository repo, ProdutoRepository produtos, UsuarioRepository usuarios) {
        this.repo=repo; this.produtos=produtos; this.usuarios=usuarios;
    }
    public record AvaliacaoRequest(Long produtoId, Integer nota, String comentario) {}
    @GetMapping("/produto/{produtoId}") public List<Avaliacao> porProduto(@PathVariable Long produtoId) {
        return repo.findAll().stream().filter(a -> a.getProduto().getId().equals(produtoId)).toList();
    }
    @PostMapping public ResponseEntity<?> criar(@RequestBody AvaliacaoRequest r, Authentication auth) {
        if (r.nota() == null || r.nota() < 1 || r.nota() > 5)
            return ResponseEntity.badRequest().body("A nota deve estar entre 1 e 5.");
        Usuario u=usuarios.findByEmail(auth.getName()).orElseThrow();
        Produto p=produtos.findById(r.produtoId()).orElse(null);
        if (p == null) return ResponseEntity.badRequest().body("Produto não encontrado.");
        Avaliacao a=new Avaliacao(); a.setUsuario(u); a.setProduto(p);
        a.setNota(r.nota()); a.setComentario(r.comentario());
        return ResponseEntity.ok(repo.save(a));
    }
}
