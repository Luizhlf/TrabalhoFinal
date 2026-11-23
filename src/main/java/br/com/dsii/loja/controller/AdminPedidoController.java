package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.*;
import br.com.dsii.loja.repository.*;
import br.com.dsii.loja.service.PedidoCancelamentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/pedidos")
public class AdminPedidoController {
    private final PedidoRepository pedidos;
    private final ItemPedidoRepository itens;
    private final PagamentoRepository pagamentos;
    private final PedidoCancelamentoService cancelamentos;

    public AdminPedidoController(PedidoRepository pedidos, ItemPedidoRepository itens,
                                 PagamentoRepository pagamentos, PedidoCancelamentoService cancelamentos) {
        this.pedidos = pedidos;
        this.itens = itens;
        this.pagamentos = pagamentos;
        this.cancelamentos = cancelamentos;
    }

    public record AlterarStatusRequest(String status) {}
    public record ItemResponse(Long produtoId, String nome, Integer quantidade,
                               BigDecimal precoUnitario, BigDecimal subtotal) {}
    public record PedidoAdminResponse(Long id, String cliente, String email,
                                      BigDecimal total, String status, LocalDateTime criadoEm,
                                      String endereco, String cep, String bairro,
                                      String cidade, String uf, String complemento,
                                      String pagamentoMetodo, String pagamentoStatus,
                                      List<ItemResponse> itens) {}

    private PedidoAdminResponse converter(Pedido pedido) {
        Endereco e = pedido.getEndereco();
        String endereco = e.getLogradouro() + ", " + e.getNumero();
        List<ItemResponse> detalhes = itens.findByPedidoId(pedido.getId()).stream()
                .map(item -> new ItemResponse(item.getProduto().getId(), item.getProduto().getNome(),
                        item.getQuantidade(), item.getPrecoUnitario(),
                        item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade()))))
                .toList();
        Pagamento pagamento = pagamentos.findByPedidoId(pedido.getId()).orElse(null);
        return new PedidoAdminResponse(pedido.getId(), pedido.getUsuario().getNome(),
                pedido.getUsuario().getEmail(), pedido.getTotal(), pedido.getStatus().name(),
                pedido.getCriadoEm(), endereco, e.getCep(), e.getBairro(),
                e.getCidade(), e.getUf(), e.getComplemento(),
                pagamento == null ? null : pagamento.getMetodo(),
                pagamento == null ? null : pagamento.getStatus(), detalhes);
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PedidoAdminResponse> listar() {
        return pedidos.findAll().stream()
                .sorted(Comparator.comparing(Pedido::getId).reversed())
                .map(this::converter).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PedidoAdminResponse> detalhes(@PathVariable Long id) {
        return pedidos.findById(id).map(p -> ResponseEntity.ok(converter(p)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> alterarStatus(@PathVariable Long id,
                                           @RequestBody AlterarStatusRequest req) {
        if (req == null || req.status() == null || req.status().isBlank()) {
            return ResponseEntity.badRequest().body("Informe o novo status.");
        }
        StatusPedido proximo;
        try {
            proximo = StatusPedido.valueOf(req.status().trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Status inválido.");
        }
        if (proximo == StatusPedido.CANCELADO) {
            PedidoCancelamentoService.Resultado resultado = cancelamentos.cancelar(id, null);
            return ResponseEntity.status(resultado.codigo()).body(resultado.mensagem());
        }
        Pedido pedido = pedidos.buscarParaPagamento(id).orElse(null);
        if (pedido == null) return ResponseEntity.notFound().build();
        StatusPedido atual = pedido.getStatus();
        boolean permitido = (atual == StatusPedido.PAGO && proximo == StatusPedido.ENVIADO)
                || (atual == StatusPedido.ENVIADO && proximo == StatusPedido.ENTREGUE);
        if (!permitido) return ResponseEntity.status(409).body("Transição de status não permitida.");
        pedido.setStatus(proximo);
        pedidos.save(pedido);
        return ResponseEntity.ok(Map.of("id", pedido.getId(), "status", proximo.name(),
                "mensagem", "Status atualizado com sucesso!"));
    }
}
