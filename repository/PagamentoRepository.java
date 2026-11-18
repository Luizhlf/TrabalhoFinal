
package br.com.dsii.loja.repository;

import br.com.dsii.loja.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    boolean existsByPedidoId(Long pedidoId);

}
