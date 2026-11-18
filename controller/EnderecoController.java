
package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.Endereco;
import br.com.dsii.loja.model.Usuario;
import br.com.dsii.loja.repository.EnderecoRepository;
import br.com.dsii.loja.repository.PedidoRepository;
import br.com.dsii.loja.repository.UsuarioRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enderecos")
public class EnderecoController {

    private final EnderecoRepository enderecos;
    private final UsuarioRepository usuarios;
    private final PedidoRepository pedidos;

    public EnderecoController(
            EnderecoRepository enderecos,
            UsuarioRepository usuarios,
            PedidoRepository pedidos) {

        this.enderecos = enderecos;
        this.usuarios = usuarios;
        this.pedidos = pedidos;
    }

    public record EnderecoRequest(
            String cep,
            String logradouro,
            String bairro,
            String cidade,
            String uf,
            String complemento,
            String numero) {}

    public record EnderecoResponse(
            Long id,
            String cep,
            String logradouro,
            String bairro,
            String cidade,
            String uf,
            String complemento,
            String numero,
            boolean utilizadoEmPedido) {}

    private EnderecoResponse converter(Endereco e) {
        return new EnderecoResponse(
                e.getId(),
                e.getCep(),
                e.getLogradouro(),
                e.getBairro(),
                e.getCidade(),
                e.getUf(),
                e.getComplemento(),
                e.getNumero(),
                pedidos.existsByEnderecoId(e.getId())
        );
    }

    private boolean dadosInvalidos(EnderecoRequest req) {
        return req == null
                || req.cep() == null
                || !req.cep().matches("\\d{8}")
                || req.logradouro() == null
                || req.logradouro().isBlank()
                || req.logradouro().length() > 150
                || req.bairro() == null
                || req.bairro().isBlank()
                || req.bairro().length() > 100
                || req.cidade() == null
                || req.cidade().isBlank()
                || req.cidade().length() > 100
                || req.uf() == null
                || !req.uf().matches("(?i)[a-z]{2}")
                || req.numero() == null
                || req.numero().isBlank()
                || req.complemento() != null
                && req.complemento().length() > 255;
    }

    private void preencher(Endereco e, EnderecoRequest req) {
        e.setCep(req.cep());
        e.setLogradouro(req.logradouro().trim());
        e.setBairro(req.bairro().trim());
        e.setCidade(req.cidade().trim());
        e.setUf(req.uf().toUpperCase());
        e.setNumero(req.numero().trim());
        e.setComplemento(req.complemento());
    }

    // Consultar endereços do cliente
    @GetMapping
    @Transactional(readOnly = true)
    public List<EnderecoResponse> meus(Authentication auth) {

        Usuario usuario = usuarios
                .findByEmail(auth.getName())
                .orElseThrow();

        return enderecos.findAll()
                .stream()
                .filter(e -> e.getUsuario().getId()
                        .equals(usuario.getId()))
                .map(this::converter)
                .toList();
    }

    // Cadastrar endereço
    @PostMapping
    @Transactional
    public ResponseEntity<?> cadastrar(
            @RequestBody EnderecoRequest req,
            Authentication auth) {

        if (dadosInvalidos(req)) {
            return ResponseEntity.badRequest()
                    .body("Dados do endereço inválidos.");
        }

        Usuario usuario = usuarios
                .findByEmail(auth.getName())
                .orElseThrow();

        Endereco endereco = new Endereco();
        endereco.setUsuario(usuario);

        preencher(endereco, req);

        Endereco salvo = enderecos.save(endereco);

        return ResponseEntity.ok(converter(salvo));
    }

    // Editar endereço
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> editar(
            @PathVariable Long id,
            @RequestBody EnderecoRequest req,
            Authentication auth) {

        Usuario usuario = usuarios
                .findByEmail(auth.getName())
                .orElseThrow();

        Endereco endereco = enderecos.findById(id).orElse(null);

        if (endereco == null ||
                !endereco.getUsuario().getId()
                        .equals(usuario.getId())) {

            return ResponseEntity.notFound().build();
        }

        if (pedidos.existsByEnderecoId(id)) {
            return ResponseEntity.status(409)
                    .body("Este endereço está associado a um pedido e não pode ser editado.");
        }

        if (dadosInvalidos(req)) {
            return ResponseEntity.badRequest()
                    .body("Dados do endereço inválidos.");
        }

        preencher(endereco, req);

        Endereco salvo = enderecos.save(endereco);

        return ResponseEntity.ok(converter(salvo));
    }

    // Excluir endereço
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> excluir(
            @PathVariable Long id,
            Authentication auth) {

        Usuario usuario = usuarios
                .findByEmail(auth.getName())
                .orElseThrow();

        Endereco endereco = enderecos.findById(id).orElse(null);

        if (endereco == null ||
                !endereco.getUsuario().getId()
                        .equals(usuario.getId())) {

            return ResponseEntity.notFound().build();
        }

        if (pedidos.existsByEnderecoId(id)) {
            return ResponseEntity.status(409)
                    .body("Este endereço está associado a um pedido e não pode ser excluído.");
        }

        enderecos.delete(endereco);
        enderecos.flush();

        return ResponseEntity.ok("Endereço excluído com sucesso.");
    }
}
