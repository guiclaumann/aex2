// @/utils/pedidoUtils.ts

/**
 * Gera o próximo número de pedido sequencial e atualiza no localStorage
 */
export const gerarNumeroPedido = (): string => {
  try {
    const ultimoPedido = localStorage.getItem("ultimoNumeroPedido");
    let proximoNumero = 1;
    
    if (ultimoPedido) {
      proximoNumero = parseInt(ultimoPedido) + 1;
      if (proximoNumero > 9999) {
        proximoNumero = 1;
      }
    }
    
    localStorage.setItem("ultimoNumeroPedido", proximoNumero.toString());
    return `#${proximoNumero.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Erro ao gerar número do pedido:', error);
    return `#${Date.now().toString().slice(-4)}`;
  }
};

/**
 * Obtém o próximo número de pedido sem atualizar o contador
 */
export const getProximoNumero = (): string => {
  try {
    const ultimoNumero = localStorage.getItem("ultimoNumeroPedido");
    let proximo = 1;
    
    if (ultimoNumero) {
      proximo = parseInt(ultimoNumero) + 1;
      if (proximo > 9999) {
        proximo = 1;
      }
    }
    
    return `#${proximo.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Erro ao obter próximo número:', error);
    return "#0001";
  }
};

/**
 * Salva um pedido no localStorage, evitando duplicatas
 */
export const salvarPedidoNoLocalStorage = (pedido: any): boolean => {
  try {
    const pedidosExistentes = JSON.parse(localStorage.getItem('pedidos') || '[]');
    
    // Verificar se já existe pedido com mesmo ID ou número
    const pedidoExistenteById = pedidosExistentes.find((p: any) => p.id === pedido.id);
    const pedidoExistenteByNumero = pedidosExistentes.find((p: any) => p.numero === pedido.numero);
    
    if (pedidoExistenteById || pedidoExistenteByNumero) {
      console.warn('Pedido já existe, atualizando...', {
        id: pedido.id,
        numero: pedido.numero
      });
      
      // Atualizar pedido existente
      const pedidosAtualizados = pedidosExistentes.map((p: any) => 
        p.id === pedido.id || p.numero === pedido.numero ? pedido : p
      );
      
      localStorage.setItem('pedidos', JSON.stringify(pedidosAtualizados));
    } else {
      // ✅ ADICIONAR NOVO PEDIDO NO FINAL (mantém ordem crescente)
      const novosPedidos = [...pedidosExistentes, pedido];
      localStorage.setItem('pedidos', JSON.stringify(novosPedidos));
    }
    
    console.log('✅ Pedido salvo com sucesso:', pedido.numero);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar pedido:', error);
    return false;
  }
};

/**
 * Obtém todos os pedidos do localStorage ORDENADOS POR NÚMERO CRESCENTE
 */
export const obterPedidos = (): any[] => {
  try {
    const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    
    // ✅ SEMPRE ORDENAR POR NÚMERO CRESCENTE
    return pedidos.sort((a: any, b: any) => {
      const numA = parseInt(a.numero?.replace('#', '') || '0');
      const numB = parseInt(b.numero?.replace('#', '') || '0');
      return numA - numB;
    });
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    return [];
  }
};

/**
 * Atualiza o status de um pedido específico
 */
export const atualizarStatusPedido = (pedidoId: string, novoStatus: string): boolean => {
  try {
    const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
    
    if (pedidoIndex === -1) {
      console.error('Pedido não encontrado:', pedidoId);
      return false;
    }
    
    pedidos[pedidoIndex].status = novoStatus;
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    
    console.log('✅ Status atualizado:', pedidoId, novoStatus);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }
};

/**
 * Obtém estatísticas dos pedidos
 */
export const obterEstatisticasPedidos = () => {
  const pedidos = obterPedidos();
  
  return {
    total: pedidos.length,
    pendente: pedidos.filter(p => p.status === "pendente").length,
    preparando: pedidos.filter(p => p.status === "preparando").length,
    pronto: pedidos.filter(p => p.status === "pronto").length,
    entregue: pedidos.filter(p => p.status === "entregue").length,
    cancelado: pedidos.filter(p => p.status === "cancelado").length
  };
};