
package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.*;
import br.com.dsii.loja.repository.*;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoRepository pedidos;
    private final ItemPedidoRepository itens;
    private final ProdutoRepository produtos;
    private final EnderecoRepository enderecos;
    private final UsuarioRepository usuarios;

    public PedidoController(
            PedidoRepository pedidos,
            ItemPedidoRepository itens,
            ProdutoRepository produtos,
            EnderecoRepository enderecos,
            UsuarioRepository usuarios) {

        this.pedidos = pedidos;
        this.itens = itens;
        this.produtos = produtos;
        this.enderecos = enderecos;
        this.usuarios = usuarios;
    }

    public record ItemRequest(
            Long produtoId,
            Integer quantidade) {}

    public record PedidoRequest(
            Long enderecoId,
            List<ItemRequest> itens) {}

    public record ItemResponse(
            String produto,
            Integer quantidade,
            BigDecimal precoUnitario) {}

    public record PedidoResponse(
            Long id,
            BigDecimal total,
            String status,
            LocalDateTime criadoEm,
            String endereco,
            List<ItemResponse> itens) {}

    private PedidoResponse converter(Pedido pedido) {

        Endereco e = pedido.getEndereco();

        String enderecoEntrega =
                e.getLogradouro() + ", " + e.getNumero()
                + " - " + e.getCidade() + "/" + e.getUf();

        List<ItemResponse> produtosPedido =
                itens.findByPedidoId(pedido.getId())
                .stream()
                .map(item -> new ItemResponse(
                        item.getProduto().getNome(),
                        item.getQuantidade(),
                        item.getPrecoUnitario()
                ))
                .toList();

        return new PedidoResponse(
                pedido.getId(),
                pedido.getTotal(),
                pedido.getStatus().name(),
                pedido.getCriadoEm(),
                enderecoEntrega,
                produtosPedido
        );
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> criar(
            @RequestBody PedidoRequest req,
            Authentication auth) {

        Usuario usuario = usuarios.findByEmail(auth.getName())
                .orElseThrow();

        if (req == null || req.enderecoId() == null) {
            return ResponseEntity.badRequest()
                    .body("Selecione um endereço.");
        }

        Endereco endereco = enderecos
                .findById(req.enderecoId())
                .orElse(null);

        if (endereco == null ||
                !endereco.getUsuario().getId()
                        .equals(usuario.getId())) {

            return ResponseEntity.badRequest()
                    .body("Endereço inválido.");
        }

        if (req.itens() == null || req.itens().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("O carrinho está vazio.");
        }

        // Agrupa produtos repetidos e soma suas quantidades
        Map<Long, Integer> quantidades = new TreeMap<>();

        for (ItemRequest item : req.itens()) {

            if (item == null ||
                    item.produtoId() == null ||
                    item.quantidade() == null ||
                    item.quantidade() < 1) {

                return ResponseEntity.badRequest()
                        .body("Item inválido.");
            }

            try {
                quantidades.merge(
                        item.produtoId(),
                        item.quantidade(),
                        Math::addExact
                );
            } catch (ArithmeticException ex) {
                return ResponseEntity.badRequest()
                        .body("Quantidade inválida.");
            }
        }

        BigDecimal total = BigDecimal.ZERO;

        List<Produto> selecionados = new ArrayList<>();

        // Bloqueia e verifica o estoque de cada produto
        for (Map.Entry<Long, Integer> entrada :
                quantidades.entrySet()) {

            Produto produto = produtos
                    .buscarParaCompra(entrada.getKey())
                    .orElse(null);

            int quantidade = entrada.getValue();

            if (produto == null ||
                    !produto.isAtivo() ||
                    produto.getEstoque() < quantidade) {

                return ResponseEntity.badRequest()
                        .body("Produto indisponível ou estoque insuficiente.");
            }

            selecionados.add(produto);

            total = total.add(
                    produto.getPreco().multiply(
                            BigDecimal.valueOf(quantidade)
                    )
            );
        }

        Pedido pedido = new Pedido();

        pedido.setUsuario(usuario);
        pedido.setEndereco(endereco);
        pedido.setTotal(total);

        pedido = pedidos.save(pedido);

        // Registra os itens e atualiza o estoque
        for (Produto produto : selecionados) {

            int quantidade = quantidades.get(produto.getId());

            ItemPedido item = new ItemPedido();

            item.setPedido(pedido);
            item.setProduto(produto);
            item.setQuantidade(quantidade);
            item.setPrecoUnitario(produto.getPreco());

            itens.save(item);

            produto.setEstoque(
                    produto.getEstoque() - quantidade
            );

            produtos.save(produto);
        }

        return ResponseEntity.ok(converter(pedido));
    }

    @GetMapping("/meus")
    @Transactional(readOnly = true)
    public List<PedidoResponse> meus(Authentication auth) {

        Usuario usuario = usuarios
                .findByEmail(auth.getName())
                .orElseThrow();

        return pedidos.findAll()
                .stream()
                .filter(p -> p.getUsuario().getId()
                        .equals(usuario.getId()))
                .sorted(Comparator.comparing(
                        Pedido::getCriadoEm).reversed())
                .map(this::converter)
                .toList();
    }
}
