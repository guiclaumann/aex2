package br.com.aex.service;

import br.com.aex.entity.ItemPedido;
import br.com.aex.repository.ItemPedidoRepository;
import br.com.aex.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemOrderService {

    private final ItemPedidoRepository itemPedidoRepository;

    public List<ItemPedido> getItemOrders() {
        return itemPedidoRepository.findAll();
    }

    public ItemPedido getItemOrder(Long id) {
        return itemPedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ItemOrder not found with id: " + id));
    }

    public ItemPedido saveItemOrder(ItemPedido itemOrder) {
        return itemPedidoRepository.save(itemOrder);
    }

    public ItemPedido updateItemOrder(Long id, ItemPedido itemOrderDetails) {
        ItemPedido itemOrder = getItemOrder(id);
        itemOrder.setQuantidade(itemOrderDetails.getQuantidade());
        itemOrder.setPrecoUnitario(itemOrderDetails.getPrecoUnitario());
        itemOrder.setPedido(itemOrderDetails.getPedido());
        itemOrder.setProduto(itemOrderDetails.getProduto());
        return itemPedidoRepository.save(itemOrder);
    }

    public void deleteItemOrder(Long id) {
        ItemPedido itemOrder = getItemOrder(id);
        itemPedidoRepository.delete(itemOrder);
    }
}