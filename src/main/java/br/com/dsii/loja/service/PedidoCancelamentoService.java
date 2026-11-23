package br.com.dsii.loja.service;

import br.com.dsii.loja.model.*;
import br.com.dsii.loja.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Comparator;

/** Cancela apenas pedidos ainda não pagos, devolvendo o estoque na mesma transação. */
@Service
public class PedidoCancelamentoService {
    private final PedidoRepository pedidos;
    private final ItemPedidoRepository itens;
    private final ProdutoRepository produtos;
    private final PagamentoRepository pagamentos;

    public PedidoCancelamentoService(PedidoRepository pedidos, ItemPedidoRepository itens,
                                    ProdutoRepository produtos, PagamentoRepository pagamentos) {
        this.pedidos = pedidos;
        this.itens = itens;
        this.produtos = produtos;
        this.pagamentos = pagamentos;
    }

    @Transactional
    public Resultado cancelar(Long id, Long usuarioId) {
        // Trava o pedido, serializando alterações com o processo de pagamento.
        Pedido pedido = pedidos.buscarParaPagamento(id).orElse(null);
        if (pedido == null || (usuarioId != null && !pedido.getUsuario().getId().equals(usuarioId))) {
            return new Resultado(404, "Pedido não encontrado.");
        }
        if (pedido.getStatus() != StatusPedido.AGUARDANDO_PAGAMENTO || pagamentos.existsByPedidoId(id)) {
            return new Resultado(409, "Somente pedidos não pagos podem ser cancelados.");
        }
        // Ordem determinística de travas dos produtos.
        var lista = itens.findByPedidoId(id).stream()
                .sorted(Comparator.comparing(item -> item.getProduto().getId())).toList();
        for (ItemPedido item : lista) {
            Produto produto = produtos.buscarParaCompra(item.getProduto().getId()).orElseThrow();
            produto.setEstoque(Math.addExact(produto.getEstoque(), item.getQuantidade()));
        }
        pedido.setStatus(StatusPedido.CANCELADO);
        pedidos.save(pedido);
        return new Resultado(200, "Pedido cancelado e estoque devolvido.");
    }

    public record Resultado(int codigo, String mensagem) {}
}
