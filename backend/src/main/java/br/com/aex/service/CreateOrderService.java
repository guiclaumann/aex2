package br.com.aex.service;

import br.com.aex.api.dto.complete_order.CompleteOrderDtoV1;
import br.com.aex.entity.Cliente;
import br.com.aex.entity.ItemPedido;
import br.com.aex.entity.Pedido;
import br.com.aex.entity.Produto;
import br.com.aex.repository.ClienteRepository;
import br.com.aex.repository.PedidoRepository;
import br.com.aex.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CreateOrderService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final ProdutoRepository produtoRepository;

    public CompleteOrderDtoV1 createOrder(CompleteOrderDtoV1 completeOrderDto) {
        try {
            System.out.println("✅ Iniciando criação do pedido...");

            // 1. Buscar cliente
            Cliente cliente = clienteRepository.findById(completeOrderDto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado com ID: " + completeOrderDto.getClienteId()));

            // 2. Criar pedido
            Pedido pedido = new Pedido();
            pedido.setCliente(cliente);
            pedido.setValor(completeOrderDto.getTotal());
            pedido.setStatus("PENDENTE");
            pedido.setDataCriacao(LocalDateTime.now());

            // 3. Criar itens do pedido
            List<ItemPedido> itensPedido = new ArrayList<>();
            
            for (CompleteOrderDtoV1.OrderItemDto itemDto : completeOrderDto.getItens()) {
                // Buscar produto
                Produto produto = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado com ID: " + itemDto.getProdutoId()));

                // Criar item do pedido
                ItemPedido itemPedido = new ItemPedido();
                itemPedido.setPedido(pedido);
                itemPedido.setProduto(produto);
                itemPedido.setQuantidade(itemDto.getQuantidade());
                itemPedido.setPrecoUnitario(produto.getPrecoVenda());

                itensPedido.add(itemPedido);
            }

            pedido.setItens(itensPedido);

            // 4. Salvar pedido
            Pedido pedidoSalvo = pedidoRepository.save(pedido);
            System.out.println("✅ Pedido criado com ID: " + pedidoSalvo.getId());

            // 5. Retornar resposta
            return completeOrderDto;

        } catch (Exception e) {
            System.err.println("❌ Erro no CreateOrderService: " + e.getMessage());
            throw new RuntimeException("Falha ao criar pedido: " + e.getMessage(), e);
        }
    }
}