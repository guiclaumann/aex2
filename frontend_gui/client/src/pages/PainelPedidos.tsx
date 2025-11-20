import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Clock, Utensils, Truck, Package } from "lucide-react";

interface PedidoItem {
  produtoid: string;
  nome: string;
  quantidade: number;
  preco: number;
}

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  clienteId?: string;
  telefone: string;
  email?: string;
  itens: PedidoItem[];
  total: number;
  status: "preparando" | "pronto" | "entregue" | "cancelado";
  data: string;
  endereco?: string;
  observacoes?: string;
  formaPagamento?: string;
}

const statusConfig: { [key: string]: { label: string; color: string; icon: React.ReactNode; bgColor: string } } = {
  
  
  
  
  
  
  preparando: {
    label: "Preparando",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: <Utensils className="h-6 w-6" />,
  },
  pronto: {
    label: "Pronto",
    color: "text-green-700",
    bgColor: "bg-green-50",
    icon: <CheckCircle className="h-6 w-6" />,
  },
  entregue: {
    label: "Entregue",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: <Truck className="h-6 w-6" />,
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-700",
    bgColor: "bg-red-50",
    icon: <AlertCircle className="h-6 w-6" />,
  },
};

export default function PainelPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar pedidos do localStorage (apenas leitura)
  useEffect(() => {
    const carregarPedidos = () => {
      try {
        setLoading(true);
        
        // Buscar do localStorage (apenas leitura)
        const pedidosLocal = localStorage.getItem('pedidos');
        
        if (pedidosLocal) {
          const pedidosParseados: Pedido[] = JSON.parse(pedidosLocal);
          
          // Ordenar por data (mais recentes primeiro)
          const pedidosOrdenados = pedidosParseados.sort((a, b) => 
            new Date(b.data).getTime() - new Date(a.data).getTime()
          );
          setPedidos(pedidosOrdenados);
        } else {
          setPedidos([]);
        }
      } catch (err) {
        console.error("❌ Erro ao carregar pedidos:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarPedidos();

    // Atualizar a cada 3 segundos (apenas para visualização)
    const interval = setInterval(carregarPedidos, 3000);
    return () => clearInterval(interval);
  }, []);

  // Função para obter a data formatada
  const getDataFormatada = (pedido: Pedido) => {
    return new Date(pedido.data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Agrupar pedidos por status (apenas os status ativos)
  const pedidosAtivos = pedidos.filter(pedido => 
    pedido.status === "preparando" || 
    pedido.status === "pronto"
  );

  const pedidosPorStatus = {
    preparando: pedidosAtivos.filter(pedido => pedido.status === "preparando"),
    pronto: pedidosAtivos.filter(pedido => pedido.status === "pronto"),
    pendente: pedidosAtivos.filter(pedido => pedido.status === "pendente"),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do Painel */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-orange-600">PAINEL DE PEDIDOS</h1>
              <p className="text-gray-600">Acompanhamento em tempo real</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {new Date().toLocaleTimeString("pt-BR")}
              </div>
              <div className="text-gray-600">
                {new Date().toLocaleDateString("pt-BR", { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">

        {/* Grid de Pedidos */}
        <div className="grid grid-cols-2 gap-8">
          {/* Coluna PREPARANDO */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-8 bg-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-blue-600">PREPARANDO</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-200">
                {pedidosPorStatus.preparando.length}
              </span>
            </div>
            
            <div className="space-y-1">
              {pedidosPorStatus.preparando.length > 0 ? (
                pedidosPorStatus.preparando.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500 border"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <p className="text-3xl font-semibold text-gray-900">
                            {pedido.cliente}
                        </p>
                        <div className="flex items-center gap-2 mb-1">
                            
                          <span className="text-4xl font-bold text-blue-600">
                            {pedido.numero}
                          </span>
                          <span className="text-sm text-gray-500">
                            {getDataFormatada(pedido)}
                          </span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${statusConfig[pedido.status]?.bgColor} ${statusConfig[pedido.status]?.color} border`}>
                        {statusConfig[pedido.status]?.icon}

                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Utensils className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-600">Nenhum pedido em preparo</p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna PRONTO */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-8 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-green-600">PRONTO</h2>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-200">
                {pedidosPorStatus.pronto.length}
              </span>
            </div>
            
            <div className="space-y-4">
              {pedidosPorStatus.pronto.length > 0 ? (
                pedidosPorStatus.pronto.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500 border animate-pulse"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-3xl font-semibold text-gray-900">
                            {pedido.cliente}
                        </p>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-4xl font-bold text-green-600">
                            {pedido.numero}
                          </span>
                          <span className="text-sm text-gray-500">
                            {getDataFormatada(pedido)}
                          </span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${statusConfig[pedido.status]?.bgColor} ${statusConfig[pedido.status]?.color} border`}>
                        {statusConfig[pedido.status]?.icon}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-green-600 font-semibold animate-bounce">
                        ⚠️ RETIRAR
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-600">Nenhum pedido pronto</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pedidos Pendentes */}
        {pedidosPorStatus.pendente.length > 0 && (
          <div className="mt-8 b g-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-8 bg-yellow-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-yellow-600">PENDENTES</h2>
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200">
                {pedidosPorStatus.pendente.length}
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {pedidosPorStatus.pendente.map((pedido) => (
                <div
                  key={pedido.id}
                  className="bg-gray-50 rounded-lg p-4 border-l-4 border-yellow-500 border"
                >
                  <div className="text-center">
                    <span className="text-xl font-bold text-yellow-600 block">
                      #{pedido.numero}
                    </span>
                    <p className="text-sm text-gray-700 truncate">
                      {pedido.cliente}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getDataFormatada(pedido)}
                    </p>
                    <div className="mt-2 text-yellow-600 font-semibold">
                      R$ {pedido.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há pedidos */}
        {pedidosAtivos.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhum pedido ativo no momento</p>
            <p className="text-gray-500 text-sm mt-2">
              Os pedidos aparecerão aqui automaticamente quando forem criados
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="container mx-auto px-6 py-4 text-center text-gray-600">
          <p>Painel de Visualização - Atualizado automaticamente a cada 3 segundos</p>
          <p className="text-sm mt-1">Apenas leitura - Para editar pedidos, acesse o painel administrativo</p>
        </div>
      </footer>
    </div>
  );
}