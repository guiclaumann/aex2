package br.com.aex.service;

import br.com.aex.entity.Pedido;
import br.com.aex.repository.PedidoRepository;
import br.com.aex.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final PedidoRepository pedidoRepository;

    public Pedido getOrder(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public void deleteOrder(Long id) {
        Pedido order = getOrder(id);
        pedidoRepository.delete(order);
    }
}