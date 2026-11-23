package br.com.dsii.loja.service;

import br.com.dsii.loja.model.*;
import br.com.dsii.loja.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PedidoCancelamentoServiceTest {
    private PedidoRepository pedidos;
    private ItemPedidoRepository itens;
    private ProdutoRepository produtos;
    private PagamentoRepository pagamentos;
    private PedidoCancelamentoService service;
    private Pedido pedido;
    private Usuario usuario;

    @BeforeEach
    void preparar() {
        pedidos = mock(PedidoRepository.class);
        itens = mock(ItemPedidoRepository.class);
        produtos = mock(ProdutoRepository.class);
        pagamentos = mock(PagamentoRepository.class);
        service = new PedidoCancelamentoService(pedidos, itens, produtos, pagamentos);
        usuario = new Usuario();
        usuario.setEmail("cliente@exemplo.com");
        pedido = new Pedido();
        pedido.setUsuario(usuario);
    }

    @Test
    void naoCancelaPedidoPago() {
        pedido.setStatus(StatusPedido.PAGO);
        when(pedidos.buscarParaPagamento(1L)).thenReturn(Optional.of(pedido));
        var resultado = service.cancelar(1L, null);
        assertEquals(409, resultado.codigo());
        verify(produtos, never()).save(any());
        assertEquals(StatusPedido.PAGO, pedido.getStatus());
    }

    @Test
    void naoCancelaPedidoInexistente() {
        when(pedidos.buscarParaPagamento(99L)).thenReturn(Optional.empty());
        assertEquals(404, service.cancelar(99L, null).codigo());
    }

    @Test
    void cancelaPedidoPendenteEDevolveEstoque() {
        Produto produto = new Produto();
        produto.setEstoque(4);
        ItemPedido item = new ItemPedido();
        item.setProduto(produto);
        item.setQuantidade(2);
        when(pedidos.buscarParaPagamento(2L)).thenReturn(Optional.of(pedido));
        when(itens.findByPedidoId(2L)).thenReturn(List.of(item));
        // getId() é null nos objetos não persistidos; suficiente neste teste unitário.
        when(produtos.buscarParaCompra(null)).thenReturn(Optional.of(produto));
        var resultado = service.cancelar(2L, null);
        assertEquals(200, resultado.codigo());
        assertEquals(6, produto.getEstoque());
        assertEquals(StatusPedido.CANCELADO, pedido.getStatus());
        verify(pedidos).save(pedido);
    }
}
