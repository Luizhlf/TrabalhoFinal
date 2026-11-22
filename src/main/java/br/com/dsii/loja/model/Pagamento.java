package br.com.dsii.loja.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagamentos")
public class Pagamento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(optional = false)
    @JoinColumn(name = "pedido_id", unique = true)
    private Pedido pedido;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;
    @Column(nullable = false, length = 30)
    private String metodo;
    @Column(nullable = false, length = 30)
    private String status = "PENDENTE";
    private LocalDateTime criadoEm = LocalDateTime.now();

    public Long getId() { return id; }
    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
