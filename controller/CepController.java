package br.com.dsii.loja.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.Map;

@RestController
@RequestMapping("/api/cep")
public class CepController {
    private final WebClient client = WebClient.builder().baseUrl("https://viacep.com.br").build();

    @GetMapping("/{cep}")
    public Map consultar(@PathVariable String cep) {
        String limpo = cep.replaceAll("\\D", "");
        if (!limpo.matches("\\d{8}")) throw new IllegalArgumentException("CEP deve conter 8 números.");
        return client.get().uri("/ws/{cep}/json/", limpo).retrieve()
                .bodyToMono(Map.class).block();
    }
}
