import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { AlertCircle, CheckCircle, Clock, Utensils, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import Header from "@/components/Header";

// ✅ Interface corrigida baseada no que a API realmente retorna
interface ItemPedido {
  id: number;
  produtoId: number;
  quantidade: number;
  preco: number;
  produtoNome?: string;
  nome?: string; // Campo alternativo que a API pode retornar
}

interface Pedido {
  id: number | string; // ✅ Aceitar tanto número quanto string
  clienteId: number;
  status: string;
  total: number;
  dataCriacao: string;
  itens: ItemPedido[];
  // Campos alternativos que a API pode retornar
  createdAt?: string;
  items?: ItemPedido[];
  orderStatus?: string;
  // Campos para informações do cliente
  clienteNome?: string;
  clientName?: string;
  nomeCliente?: string;
}

const statusConfig: { [key: string]: { label: string; color: string; icon: React.ReactNode; description: string } } = {
  PENDENTE: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Clock className="h-5 w-5" />,
    description: "Seu pedido foi recebido e está na fila"
  },
  PREPARANDO: {
    label: "Preparando",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Utensils className="h-5 w-5" />,
    description: "Estamos preparando seu pedido"
  },
  PRONTO: {
    label: "Pronto para Retirada",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="h-5 w-5" />,
    description: "Seu pedido está pronto para retirada"
  },
  ENTREGUE: {
    label: "Entregue",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <Truck className="h-5 w-5" />,
    description: "Seu pedido foi entregue"
  },
  CANCELADO: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <AlertCircle className="h-5 w-5" />,
    description: "Seu pedido foi cancelado"
  },
};

export default function AcompanharPedido() {
  const { pedidoId } = useParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ ACEITAR QUALQUER FORMATO DE ID (numérico ou string complexa)
  useEffect(() => {
    const fetchPedido = async () => {
      if (!pedidoId) {
        setError("ID do pedido não fornecido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
        
        // ✅ USAR O ID EXATAMENTE COMO VEIO NA URL
        const url = `${apiUrl}/v1/order/${pedidoId}`;
        
        console.log("🔍 Buscando pedido:", url);
        console.log("📝 ID usado na busca:", pedidoId);
        
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("📊 Status da resposta:", response.status);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Pedido não encontrado");
          }
          throw new Error(`Erro ${response.status} ao carregar pedido`);
        }

        const data = await response.json();
        console.log("📦 Dados do pedido recebidos:", data);
        
        // ✅ Normalizar os dados para o formato esperado pelo componente
        const pedidoNormalizado: Pedido = {
          id: data.id || data.orderId || pedidoId, // ✅ Usar o pedidoId original se necessário
          clienteId: data.clienteId || data.clientId || 0,
          status: data.status || data.orderStatus || "PENDENTE",
          total: data.total || data.amount || 0,
          dataCriacao: data.dataCriacao || data.createdAt || data.orderDate || new Date().toISOString(),
          itens: data.itens || data.items || data.orderItems || [],
          clienteNome: data.clienteNome || data.clientName || data.nomeCliente || "Cliente"
        };

        console.log("✅ Pedido normalizado:", pedidoNormalizado);
        setPedido(pedidoNormalizado);
        setError(null);
      } catch (err) {
        console.error("❌ Erro ao carregar pedido:", err);
        setError(err instanceof Error ? err.message : "Não foi possível carregar os dados do pedido.");
        toast.error("Erro ao carregar pedido");
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchPedido, 10000);
    return () => clearInterval(interval);
  }, [pedidoId]);

  const getStatusSteps = () => {
    const steps = ["PENDENTE", "PREPARANDO", "PRONTO", "ENTREGUE"];
    const currentIndex = pedido ? steps.indexOf(pedido.status) : -1;
    return steps.map((step, index) => ({
      step,
      completed: index <= currentIndex,
      active: index === currentIndex,
      ...statusConfig[step]
    }));
  };

  const statusSteps = getStatusSteps();

  // ✅ Função para obter o nome do produto
  const getProdutoNome = (item: ItemPedido) => {
    return item.produtoNome || item.nome || `Produto #${item.produtoId}`;
  };

  // ✅ Função para obter a data formatada
  const getDataFormatada = () => {
    if (!pedido) return "";
    
    const data = pedido.dataCriacao || pedido.createdAt;
    return new Date(data).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ Função para obter o nome do cliente
  const getClienteNome = () => {
    if (!pedido) return "";
    return pedido.clienteNome || pedido.clientName || pedido.nomeCliente || "Cliente";
  };

  // ✅ Função para obter os itens do pedido
  const getItensPedido = () => {
    if (!pedido) return [];
    return pedido.itens || pedido.items || [];
  };

  // ✅ Função para formatar o ID do pedido para exibição
  const getPedidoDisplayId = () => {
    if (!pedido) return pedidoId || "";
    
    // Se o ID for uma string complexa como "ped_timestamp_random", mostrar apenas o timestamp ou último segmento
    if (typeof pedido.id === 'string' && pedido.id.includes('_')) {
      const parts = pedido.id.split('_');
      return parts[parts.length - 1]; // Pega o último segmento
    }
    
    return pedido.id.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64 flex-col">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-600">Carregando pedido #{pedidoId}...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedido Não Encontrado</h2>
              <p className="text-gray-600 mb-2">Pedido: #{pedidoId}</p>
              <p className="text-gray-600 mb-6">{error || "Pedido não disponível"}</p>
              <div className="space-y-3">
                <Link href="/menu">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Fazer Novo Pedido
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">
                    Voltar ao Início
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const itens = getItensPedido();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Acompanhar Pedido</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Pedido Info */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Pedido #{getPedidoDisplayId()}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Cliente: {getClienteNome()}
                    </p>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 border ${
                      statusConfig[pedido.status]?.color || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusConfig[pedido.status]?.icon}
                    {statusConfig[pedido.status]?.label || pedido.status}
                  </div>
                </div>
                <p className="text-gray-600">
                  Criado em: {getDataFormatada()}
                </p>
              </div>

              {/* Status Timeline */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-6 text-lg">
                  Progresso do Pedido
                </h4>
                <div className="space-y-6">
                  {statusSteps.map((item, index) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 ${
                            item.completed
                              ? "bg-green-500 text-white border-green-600"
                              : item.active
                                ? "bg-orange-500 text-white border-orange-600"
                                : "bg-gray-100 text-gray-400 border-gray-300"
                          }`}
                        >
                          {item.completed ? "✓" : index + 1}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`w-1 h-16 ${
                              item.completed ? "bg-green-500" : "bg-gray-300"
                            }`}
                          ></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p
                          className={`font-semibold text-lg ${
                            item.active
                              ? "text-orange-600"
                              : item.completed
                                ? "text-green-600"
                                : "text-gray-500"
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-gray-600 mt-1">
                          {item.description}
                        </p>
                        {item.active && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-600 h-2 rounded-full animate-pulse" 
                                style={{ width: '50%' }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                  Itens do Pedido ({itens.length})
                </h4>
                <div className="space-y-4">
                  {itens.length > 0 ? (
                    itens.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {getProdutoNome(item)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {item.quantidade}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          R$ {((item.preco || 0) * item.quantidade).toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-4">Nenhum item no pedido</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Resumo do Pedido
              </h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    R$ {(pedido.total || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span className="font-semibold text-gray-900">R$ 0,00</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-orange-600">
                  R$ {(pedido.total || 0).toFixed(2)}
                </span>
              </div>

              <div className="space-y-3">
                <Link href="/menu">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Fazer Novo Pedido
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Voltar ao Início
                  </Button>
                </Link>
              </div>

              {pedido.status === "PRONTO" && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-semibold">
                    ✓ Seu pedido está pronto!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Venha retirar seu pedido no balcão.
                  </p>
                </div>
              )}

              {pedido.status === "PREPARANDO" && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-semibold">
                    ⏱️ Seu pedido está sendo preparado
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Tempo estimado: 15-20 minutos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}