// src/services/pedidoService.ts
export interface ItemPedido {
  produtoid: string;
  nome: string;
  quantidade: number;
  preco: number;
}

export interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  clienteId?: string;
  telefone: string;
  email?: string;
  itens: ItemPedido[];
  total: number;
  status: "pendente" | "preparando" | "pronto" | "entregue" | "cancelado";
  data: string;
  endereco?: string;
  observacoes?: string;
  formaPagamento?: string;
}

class PedidoService {
  private apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";

  async criarPedido(pedidoData: Omit<Pedido, 'id' | 'numero' | 'status' | 'data'>): Promise<Pedido> {
    try {
      // Gerar ID e número do pedido
      const novoPedido: Pedido = {
        ...pedidoData,
        id: `ped_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        numero: `#${Math.floor(1000 + Math.random() * 9000)}`,
        status: "pendente",
        data: new Date().toISOString()
      };

      console.log('Criando pedido:', novoPedido);

      // Salvar no localStorage
      this.salvarPedidoLocalStorage(novoPedido);
      
      return novoPedido;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  private salvarPedidoLocalStorage(pedido: Pedido) {
    try {
      const pedidosExistentes = this.getPedidosLocalStorage();
      const novosPedidos = [pedido, ...pedidosExistentes];
      localStorage.setItem('pedidos', JSON.stringify(novosPedidos));
      console.log('Pedido salvo no localStorage');
    } catch (error) {
      console.error('Erro ao salvar pedido no localStorage:', error);
    }
  }

  private getPedidosLocalStorage(): Pedido[] {
    try {
      const pedidos = localStorage.getItem('pedidos');
      return pedidos ? JSON.parse(pedidos) : [];
    } catch (error) {
      console.error('Erro ao ler pedidos do localStorage:', error);
      return [];
    }
  }

  async getPedidos(): Promise<Pedido[]> {
    try {
      return this.getPedidosLocalStorage();
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return [];
    }
  }

  async atualizarStatus(pedidoId: string, novoStatus: Pedido["status"]): Promise<void> {
    try {
      const pedidos = this.getPedidosLocalStorage();
      const pedidosAtualizados = pedidos.map(pedido =>
        pedido.id === pedidoId ? { ...pedido, status: novoStatus } : pedido
      );
      localStorage.setItem('pedidos', JSON.stringify(pedidosAtualizados));
      console.log(`Status do pedido ${pedidoId} atualizado para: ${novoStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }
}

export const pedidoService = new PedidoService();