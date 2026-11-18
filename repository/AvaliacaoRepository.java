package br.com.dsii.loja.repository;

import br.com.dsii.loja.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {
    
}
