
package br.com.dsii.loja.controller;

import br.com.dsii.loja.model.Papel;
import br.com.dsii.loja.model.Usuario;
import br.com.dsii.loja.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.ResponseEntity;

import org.springframework.security.authentication.AuthenticationManager;
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

    // Dados necessários para cadastrar
    public record CadastroRequest(
            @NotBlank String nome,
            @NotBlank @Email String email,
            @NotBlank String senha) {}

    // Dados necessários para entrar
    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String senha) {}

    // Dados retornados pela API
    public record UsuarioResponse(
            Long id,
            String nome,
            String email,
            String papel) {}

    // =========================================
    // CADASTRO DE CLIENTES
    // =========================================

    @PostMapping("/cadastro")
    public ResponseEntity<?> cadastrar(
            @Valid @RequestBody CadastroRequest req) {

        String email = req.email().trim();

        if (usuarios.findByEmail(email).isPresent()) {

            return ResponseEntity.badRequest()
                    .body("E-mail já cadastrado.");
        }

        Usuario usuario = new Usuario();

        usuario.setNome(req.nome().trim());
        usuario.setEmail(email);
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

    // =========================================
    // LOGIN DE CLIENTES E ADMINISTRADORES
    // =========================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest request,
            HttpServletResponse response) {

        // Verifica o e-mail e a senha
        Authentication autenticacao =
                authManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                req.email().trim(),
                                req.senha()
                        )
                );

        // Cria o contexto de segurança
        SecurityContext contexto =
                SecurityContextHolder.createEmptyContext();

        contexto.setAuthentication(autenticacao);

        SecurityContextHolder.setContext(contexto);

        // Obtém uma sessão HTTP para o usuário
        HttpSession sessao = request.getSession(true);

        // Renova o identificador da sessão após o login
        if (!request.isRequestedSessionIdValid()) {
            // A sessão recém-criada já possui um ID novo.
        } else {
            request.changeSessionId();
        }

        // Salva a autenticação na sessão
        HttpSessionSecurityContextRepository repository =
                new HttpSessionSecurityContextRepository();

        repository.saveContext(
                contexto,
                request,
                response
        );

        // Busca os dados do usuário autenticado
        Usuario usuario = usuarios
                .findByEmail(autenticacao.getName())
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

    // =========================================
    // CONSULTAR USUÁRIO LOGADO
    // =========================================

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication autenticacao) {

        // Visitante: ninguém está autenticado
        if (autenticacao == null ||
                !autenticacao.isAuthenticated() ||
                "anonymousUser".equals(
                        autenticacao.getPrincipal())) {

            return ResponseEntity.ok(
                    Map.of(
                            "autenticado", false
                    )
            );
        }

        // Busca o usuário na base de dados
        Usuario usuario = usuarios
                .findByEmail(autenticacao.getName())
                .orElse(null);

        if (usuario == null) {

            return ResponseEntity.ok(
                    Map.of(
                            "autenticado", false
                    )
            );
        }

        // Retorna o perfil para o nav.js
        return ResponseEntity.ok(
                Map.of(
                        "autenticado", true,
                        "id", usuario.getId(),
                        "nome", usuario.getNome(),
                        "email", usuario.getEmail(),
                        "papel", usuario.getPapel().name()
                )
        );
    }

    // =========================================
    // LOGOUT
    // =========================================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request) {

        // Limpa a autenticação atual
        SecurityContextHolder.clearContext();

        // Encerra a sessão no servidor
        HttpSession sessao = request.getSession(false);

        if (sessao != null) {
            sessao.invalidate();
        }

        return ResponseEntity.ok(
                Map.of(
                        "mensagem",
                        "Logout realizado com sucesso."
                )
        );
    }
}
