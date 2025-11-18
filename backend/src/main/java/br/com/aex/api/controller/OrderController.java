package br.com.aex.api.controller;

import br.com.aex.api.dto.complete_order.CompleteOrderDtoV1;
import br.com.aex.api.dto.order.OrderDtoV1;
import br.com.aex.entity.Cliente;
import br.com.aex.entity.Pedido;
import br.com.aex.service.CreateOrderService;
import br.com.aex.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static br.com.aex.api.Endpoints.V1_ORDER;

@RestController
@RequestMapping(V1_ORDER)
@Tag(name = "Order Management", description = "Operations related to Orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CreateOrderService createOrderService;

    @GetMapping(path = "/{id}")
    @Operation(summary = "Get Order by ID")
    @Parameter(name = "id", in = ParameterIn.PATH, description = "Order ID")
    public ResponseEntity<OrderDtoV1> getOrder(@PathVariable final Long id) {
        final Pedido order = orderService.getOrder(id);
        final OrderDtoV1 response = OrderDtoV1.from(order);
        return ResponseEntity.ok(response);
    }

    @PostMapping(path = "/create_order")
    @Operation(summary = "Create Order with Products list")
    public ResponseEntity<?> createOrder(@RequestBody @Valid CompleteOrderDtoV1 completeOrderDto) {
        try {
            System.out.println("📦 Recebendo pedido - Cliente ID: " + completeOrderDto.getClienteId());
            System.out.println("📦 Total de itens: " + (completeOrderDto.getItens() != null ? completeOrderDto.getItens().size() : 0));
            System.out.println("📦 Total do pedido: " + completeOrderDto.getTotal());
            
            if (completeOrderDto.getItens() != null) {
                completeOrderDto.getItens().forEach(item -> 
                    System.out.println("📦 Item - Produto ID: " + item.getProdutoId() + ", Quantidade: " + item.getQuantidade())
                );
            }

            final CompleteOrderDtoV1 response = createOrderService.createOrder(completeOrderDto);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erro ao criar pedido: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body("Erro interno ao criar pedido: " + e.getMessage());
        }
    }

    @DeleteMapping(path = "/{id}")
    @Operation(summary = "Delete Order by ID")
    @Parameter(name = "id", in = ParameterIn.PATH, description = "Order ID")
    public ResponseEntity<Cliente> deleteOrder(@PathVariable final Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}