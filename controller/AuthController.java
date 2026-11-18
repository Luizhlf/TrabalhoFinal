
package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.Papel;
import br.com.dsii.loja.model.Usuario;
import br.com.dsii.loja.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;

    public AuthController(
            UsuarioRepository usuarios,
            PasswordEncoder encoder,
            AuthenticationManager authManager) {

        this.usuarios = usuarios;
        this.encoder = encoder;
        this.authManager = authManager;
    }

    public record CadastroRequest(
            @NotBlank String nome,
            @Email String email,
            @NotBlank String senha) {}

    public record LoginRequest(
            @Email String email,
            @NotBlank String senha) {}

    public record UsuarioResponse(
            Long id,
            String nome,
            String email,
            String papel) {}

    // Cadastro de cliente
    @PostMapping("/cadastro")
    public ResponseEntity<?> cadastrar(
            @RequestBody CadastroRequest req) {

        if (usuarios.findByEmail(req.email()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body("E-mail já cadastrado.");
        }

        Usuario usuario = new Usuario();

        usuario.setNome(req.nome());
        usuario.setEmail(req.email());
        usuario.setSenha(encoder.encode(req.senha()));
        usuario.setPapel(Papel.CLIENTE);

        usuarios.save(usuario);

        return ResponseEntity.ok(
                new UsuarioResponse(
                        usuario.getId(),
                        usuario.getNome(),
                        usuario.getEmail(),
                        usuario.getPapel().name()
                )
        );
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest req,
            HttpServletRequest request) {

        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.email(),
                        req.senha()
                )
        );

        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(auth);

        SecurityContextHolder.setContext(context);

        HttpSession session = request.getSession(true);

        request.changeSessionId();

        session.setAttribute(
                HttpSessionSecurityContextRepository
                        .SPRING_SECURITY_CONTEXT_KEY,
                context
        );

        Usuario usuario = usuarios.findByEmail(req.email())
                .orElseThrow();

        return ResponseEntity.ok(
                new UsuarioResponse(
                        usuario.getId(),
                        usuario.getNome(),
                        usuario.getEmail(),
                        usuario.getPapel().name()
                )
        );
    }

    // Identifica o usuário autenticado
    @GetMapping("/me")
    public ResponseEntity<?> usuarioAtual(Authentication auth) {

        if (auth == null ||
                !auth.isAuthenticated() ||
                auth instanceof AnonymousAuthenticationToken) {

            return ResponseEntity.ok(
                    Map.of("autenticado", false)
            );
        }

        Usuario usuario = usuarios
                .findByEmail(auth.getName())
                .orElse(null);

        if (usuario == null) {
            return ResponseEntity.ok(
                    Map.of("autenticado", false)
            );
        }

        return ResponseEntity.ok(
                Map.of(
                        "autenticado", true,
                        "nome", usuario.getNome(),
                        "papel", usuario.getPapel().name()
                )
        );
    }

    // Logout
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request) {

        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok("Logout realizado.");
    }
}
