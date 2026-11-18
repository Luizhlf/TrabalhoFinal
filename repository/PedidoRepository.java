
package br.com.dsii.loja.repository;

import br.com.dsii.loja.model.Pedido;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    // Verifica se um endereço está vinculado a algum pedido
    boolean existsByEnderecoId(Long enderecoId);

    // Bloqueia o pedido durante o processamento do pagamento
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Pedido p WHERE p.id = :id")
    Optional<Pedido> buscarParaPagamento(@Param("id") Long id);

}
