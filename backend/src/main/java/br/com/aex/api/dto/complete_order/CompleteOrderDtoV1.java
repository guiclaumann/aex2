package br.com.aex.api.dto.complete_order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CompleteOrderDtoV1 {
    
    @NotNull(message = "Cliente ID é obrigatório")
    @Positive(message = "Cliente ID deve ser positivo")
    private Long clienteId;
    
    @Valid
    @NotNull(message = "Itens são obrigatórios")
    private List<OrderItemDto> itens;
    
    @NotNull(message = "Total é obrigatório")
    @Positive(message = "Total deve ser positivo")
    private BigDecimal total;
    
    @Data
    public static class OrderItemDto {
        @NotNull(message = "Produto ID é obrigatório")
        @Positive(message = "Produto ID deve ser positivo")
        private Long produtoId;
        
        @NotNull(message = "Quantidade é obrigatória")
        @Positive(message = "Quantidade deve ser positiva")
        private Integer quantidade;
    }
}