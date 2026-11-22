package br.com.dsii.loja.repository;

import br.com.dsii.loja.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    boolean existsByPedidoId(Long pedidoId);
    Optional<Pagamento> findByPedidoId(Long pedidoId);
}
