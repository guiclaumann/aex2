import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { 
  Package, 
  Search,
  LogOut,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

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
  status: "pendente" | "preparando" | "pronto" | "entregue" | "cancelado";
  data: string;
  endereco?: string;
  observacoes?: string;
  formaPagamento?: string;
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    carregarPedidos();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(carregarPedidos, 10000);
    return () => clearInterval(interval);
  }, []);

  const carregarPedidos = async () => {
    try {
      // Buscar do localStorage (onde o pedidoService salva)
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
      console.error("Erro ao carregar pedidos:", err);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusPedido = async (pedidoId: string, novoStatus: Pedido["status"]) => {
    try {
      // Atualizar no localStorage
      const pedidosLocal = localStorage.getItem('pedidos');
      if (pedidosLocal) {
        const pedidos: Pedido[] = JSON.parse(pedidosLocal);
        const pedidosAtualizados = pedidos.map(pedido =>
          pedido.id === pedidoId ? { ...pedido, status: novoStatus } : pedido
        );
        localStorage.setItem('pedidos', JSON.stringify(pedidosAtualizados));
        setPedidos(pedidosAtualizados);
        toast.success("Status atualizado!");
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusColor = (status: Pedido["status"]) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "preparando":
        return "bg-blue-100 text-blue-800";
      case "pronto":
        return "bg-green-100 text-green-800";
      case "entregue":
        return "bg-gray-100 text-gray-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: Pedido["status"]) => {
    switch (status) {
      case "pendente":
        return <Clock className="h-4 w-4" />;
      case "preparando":
        return <RefreshCw className="h-4 w-4" />;
      case "pronto":
        return <CheckCircle className="h-4 w-4" />;
      case "entregue":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelado":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getProximoStatus = (status: Pedido["status"]): Pedido["status"] | null => {
    const fluxo: Pedido["status"][] = ["pendente", "preparando", "pronto", "entregue"];
    const index = fluxo.indexOf(status);
    return index < fluxo.length - 1 ? fluxo[index + 1] : null;
  };

  const filteredPedidos = pedidos.filter(pedido =>
    pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast.success("Logout realizado com sucesso");
    window.location.href = "/admin/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-orange-600">{APP_TITLE}</h1>
                  <p className="text-sm text-gray-600">Gerenciar Pedidos</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={carregarPedidos}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Pedidos</h2>
            <p className="text-gray-600 mt-2">
              Acompanhe e atualize os pedidos - {pedidos.length} pedido(s) encontrado(s)
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, número do pedido ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Pedidos List */}
        <div className="space-y-4">
          {filteredPedidos.map((pedido) => {
            const proximoStatus = getProximoStatus(pedido.status);
            
            return (
              <div key={pedido.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  {/* Header do Pedido */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {pedido.numero}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                          {getStatusIcon(pedido.status)}
                          {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        Cliente: {pedido.cliente}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(pedido.data).toLocaleString('pt-BR')}
                      </p>
                      {pedido.telefone && (
                        <p className="text-gray-500 text-xs">
                          Tel: {pedido.telefone}
                        </p>
                      )}
                      {pedido.endereco && (
                        <p className="text-gray-500 text-xs">
                          Entrega: {pedido.endereco}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        R$ {pedido.total.toFixed(2)}
                      </p>
                      {proximoStatus && (
                        <Button
                          onClick={() => atualizarStatusPedido(pedido.id, proximoStatus)}
                          size="sm"
                          className="mt-2 bg-orange-600 hover:bg-orange-700"
                        >
                          Avançar para {proximoStatus}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Itens do Pedido:</h4>
                    <div className="space-y-2">
                      {pedido.itens.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">
                              {item.quantidade}x
                            </span>
                            <span className="text-gray-700">{item.nome}</span>
                          </div>
                          <span className="text-gray-600">
                            R$ {(item.preco * item.quantidade).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações do Pedido */}
                  {pedido.status !== "entregue" && pedido.status !== "cancelado" && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => atualizarStatusPedido(pedido.id, "preparando")}
                          variant="outline"
                          size="sm"
                          disabled={pedido.status !== "pendente"}
                        >
                          Iniciar Preparo
                        </Button>
                        <Button
                          onClick={() => atualizarStatusPedido(pedido.id, "pronto")}
                          variant="outline"
                          size="sm"
                          disabled={pedido.status !== "preparando"}
                        >
                          Marcar como Pronto
                        </Button>
                        <Button
                          onClick={() => atualizarStatusPedido(pedido.id, "entregue")}
                          variant="outline"
                          size="sm"
                          disabled={pedido.status !== "pronto"}
                        >
                          Marcar como Entregue
                        </Button>
                        <Button
                          onClick={() => atualizarStatusPedido(pedido.id, "cancelado")}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancelar Pedido
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPedidos.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {pedidos.length === 0 ? "Nenhum pedido encontrado" : "Nenhum pedido corresponde à busca"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Os pedidos criados na página de pagamento aparecerão aqui automaticamente
            </p>
          </div>
        )}
      </main>
    </div>
  );
}