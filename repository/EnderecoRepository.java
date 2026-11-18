package br.com.dsii.loja.repository;

import br.com.dsii.loja.model.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EnderecoRepository extends JpaRepository<Endereco, Long> {
    
}
