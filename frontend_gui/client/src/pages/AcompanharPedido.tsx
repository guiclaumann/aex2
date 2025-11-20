import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { AlertCircle, CheckCircle, Clock, Utensils, Truck, ArrowLeft } from "lucide-react";
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
  nome?: string;
}

interface Pedido {
  id: number | string;
  clienteId: number;
  status: string;
  total: number;
  dataCriacao: string;
  itens: ItemPedido[];
  createdAt?: string;
  items?: ItemPedido[];
  orderStatus?: string;
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

  // ✅ CORREÇÃO: Codificar o ID do pedido para URL
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
        
        // ✅ CORREÇÃO: Codificar o ID para URL
        const pedidoIdCodificado = encodeURIComponent(pedidoId);
        const url = `${apiUrl}/v1/order/${pedidoIdCodificado}`;
        
        console.log("🔍 Buscando pedido:", url);
        console.log("📝 ID original:", pedidoId);
        console.log("🔐 ID codificado:", pedidoIdCodificado);
        
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("📊 Status da resposta:", response.status);
        
        if (!response.ok) {
          // Tentar obter mais detalhes do erro
          let errorDetails = "";
          try {
            const errorData = await response.json();
            errorDetails = errorData.message || JSON.stringify(errorData);
          } catch {
            errorDetails = await response.text();
          }
          
          console.error("❌ Detalhes do erro:", errorDetails);
          
          if (response.status === 400) {
            throw new Error(`ID do pedido inválido: ${pedidoId}. Detalhes: ${errorDetails}`);
          }
          if (response.status === 404) {
            throw new Error("Pedido não encontrado");
          }
          throw new Error(`Erro ${response.status}: ${errorDetails || "Falha ao carregar pedido"}`);
        }

        const data = await response.json();
        console.log("📦 Dados do pedido recebidos:", data);
        
        // ✅ Normalizar os dados
        const pedidoNormalizado: Pedido = {
          id: data.id || data.orderId || pedidoId,
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

  // ✅ CORREÇÃO ALTERNATIVA: Se ainda der erro, tentar buscar por query parameter
  const buscarPedidoAlternativo = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
      
      // Tentar buscar por query parameter
      const url = `${apiUrl}/v1/order?id=${encodeURIComponent(pedidoId!)}`;
      
      console.log("🔄 Tentando busca alternativa:", url);
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Dados do pedido (busca alternativa):", data);
        
        const pedidoNormalizado: Pedido = {
          id: data.id || data.orderId || pedidoId,
          clienteId: data.clienteId || data.clientId || 0,
          status: data.status || data.orderStatus || "PENDENTE",
          total: data.total || data.amount || 0,
          dataCriacao: data.dataCriacao || data.createdAt || data.orderDate || new Date().toISOString(),
          itens: data.itens || data.items || data.orderItems || [],
          clienteNome: data.clienteNome || data.clientName || data.nomeCliente || "Cliente"
        };

        setPedido(pedidoNormalizado);
        setError(null);
        toast.success("Pedido carregado com sucesso!");
      } else {
        throw new Error("Busca alternativa também falhou");
      }
    } catch (err) {
      console.error("❌ Busca alternativa falhou:", err);
      toast.error("Não foi possível carregar o pedido");
    } finally {
      setLoading(false);
    }
  };

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

  const getProdutoNome = (item: ItemPedido) => {
    return item.produtoNome || item.nome || `Produto #${item.produtoId}`;
  };

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

  const getClienteNome = () => {
    if (!pedido) return "";
    return pedido.clienteNome || pedido.clientName || pedido.nomeCliente || "Cliente";
  };

  const getItensPedido = () => {
    if (!pedido) return [];
    return pedido.itens || pedido.items || [];
  };

  const getPedidoDisplayId = () => {
    if (!pedido) return pedidoId || "";
    
    if (typeof pedido.id === 'string' && pedido.id.includes('_')) {
      const parts = pedido.id.split('_');
      return parts[parts.length - 1];
    }
    
    return pedido.id.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <button className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors font-medium">
                <ArrowLeft className="h-5 w-5" />
                Voltar para Home
              </button>
            </Link>
          </div>
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
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <button className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors font-medium">
                <ArrowLeft className="h-5 w-5" />
                Voltar para Home
              </button>
            </Link>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao Carregar Pedido</h2>
              <p className="text-gray-600 mb-2">Pedido: #{pedidoId}</p>
              <p className="text-gray-600 mb-4">{error || "Pedido não disponível"}</p>
              
              {/* ✅ Botão para tentar busca alternativa */}
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 mb-2">
                  Problema com o formato do ID do pedido?
                </p>
                <Button 
                  onClick={buscarPedidoAlternativo}
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                >
                  Tentar Busca Alternativa
                </Button>
              </div>

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
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors font-medium">
              <ArrowLeft className="h-5 w-5" />
              Voltar para Home
            </button>
          </Link>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Acompanhar Pedido</h2>

        {/* Resto do componente permanece igual */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ... resto do código do componente ... */}
        </div>
      </main>
    </div>
  );
}