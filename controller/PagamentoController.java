
package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.Pagamento;
import br.com.dsii.loja.model.Pedido;
import br.com.dsii.loja.model.StatusPedido;
import br.com.dsii.loja.model.Usuario;

import br.com.dsii.loja.repository.PagamentoRepository;
import br.com.dsii.loja.repository.PedidoRepository;
import br.com.dsii.loja.repository.UsuarioRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/pagamentos")
public class PagamentoController {

    private final PagamentoRepository pagamentos;
    private final PedidoRepository pedidos;
    private final UsuarioRepository usuarios;

    public PagamentoController(
            PagamentoRepository pagamentos,
            PedidoRepository pedidos,
            UsuarioRepository usuarios) {

        this.pagamentos = pagamentos;
        this.pedidos = pedidos;
        this.usuarios = usuarios;
    }

    public record PagamentoRequest(String metodo) {}

    public record PagamentoResponse(
            Long id,
            Long pedidoId,
            BigDecimal valor,
            String metodo,
            String status,
            String statusPedido) {}

    // Registra um pagamento simulado
    @PostMapping("/{pedidoId}")
    @Transactional
    public ResponseEntity<?> pagar(
            @PathVariable Long pedidoId,
            @RequestBody PagamentoRequest req,
            Authentication auth) {

        Usuario usuario = usuarios
                .findByEmail(auth.getName())
                .orElseThrow();

        Pedido pedido = pedidos
                .buscarParaPagamento(pedidoId)
                .orElse(null);

        // Verifica se o pedido pertence ao cliente
        if (pedido == null ||
                !pedido.getUsuario().getId()
                        .equals(usuario.getId())) {

            return ResponseEntity.notFound().build();
        }

        // Verifica a situação do pedido
        if (pedido.getStatus() !=
                StatusPedido.AGUARDANDO_PAGAMENTO) {

            return ResponseEntity.badRequest()
                    .body("Este pedido não está aguardando pagamento.");
        }

        // Impede pagamento duplicado
        if (pagamentos.existsByPedidoId(pedidoId)) {

            return ResponseEntity.badRequest()
                    .body("Este pedido já possui um pagamento.");
        }

        if (req == null || req.metodo() == null) {

            return ResponseEntity.badRequest()
                    .body("Selecione uma forma de pagamento.");
        }

        String metodo = req.metodo().trim().toUpperCase();

        // Valida o método de pagamento
        if (!metodo.equals("PIX") &&
                !metodo.equals("CARTAO") &&
                !metodo.equals("BOLETO")) {

            return ResponseEntity.badRequest()
                    .body("Forma de pagamento inválida.");
        }

        Pagamento pagamento = new Pagamento();

        pagamento.setPedido(pedido);
        pagamento.setValor(pedido.getTotal());
        pagamento.setMetodo(metodo);

        // Aprovação fictícia para o projeto acadêmico
        pagamento.setStatus("APROVADO");

        pagamentos.saveAndFlush(pagamento);

        // Atualiza o status do pedido
        pedido.setStatus(StatusPedido.PAGO);
        pedidos.save(pedido);

        return ResponseEntity.ok(
                new PagamentoResponse(
                        pagamento.getId(),
                        pedido.getId(),
                        pagamento.getValor(),
                        pagamento.getMetodo(),
                        pagamento.getStatus(),
                        pedido.getStatus().name()
                )
        );
    }
}
