
package br.com.dsii.loja.config;

import br.com.dsii.loja.model.Papel;
import br.com.dsii.loja.model.Usuario;
import br.com.dsii.loja.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner criarAdmin(
            UsuarioRepository repo,
            PasswordEncoder encoder,
            @Value("${app.admin.email}") String email,
            @Value("${app.admin.password}") String senha) {

        return args -> {
            if (repo.findByEmail(email).isEmpty()) {

                Usuario admin = new Usuario();

                admin.setNome("Administrador");
                admin.setEmail(email);
                admin.setSenha(encoder.encode(senha));
                admin.setPapel(Papel.ADMIN);

                repo.save(admin);
            }
        };
    }
}
