package br.com.aex.repository;

import br.com.aex.entity.ItemPedido;
import br.com.aex.repository.ItemPedidoRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {
}