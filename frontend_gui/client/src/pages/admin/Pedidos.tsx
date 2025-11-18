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

interface Pedido {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  total: number;
  status: string;
  data_criacao: string;
  itens: PedidoItem[];
}

interface PedidoItem {
  id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/v1/order`);
      
      if (response.ok) {
        const data = await response.json();
        setPedidos(data);
      } else {
        throw new Error("Erro ao carregar pedidos");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao carregar pedidos");
      // Mock data para desenvolvimento
      setPedidos([
        {
          id: 154,
          cliente_id: 1,
          cliente_nome: "João Silva",
          total: 64.70,
          status: "pendente",
          data_criacao: "2024-01-20T15:30:00",
          itens: [
            { id: 1, produto_nome: "Hambúrguer Clássico", quantidade: 2, preco_unitario: 25.90 },
            { id: 2, produto_nome: "Batata Frita", quantidade: 1, preco_unitario: 12.90 }
          ]
        },
        {
          id: 153,
          cliente_id: 2,
          cliente_nome: "Maria Santos",
          total: 38.80,
          status: "finalizado",
          data_criacao: "2024-01-20T14:15:00",
          itens: [
            { id: 3, produto_nome: "Pizza Margherita", quantidade: 1, preco_unitario: 38.80 }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusPedido = async (pedidoId: number, novoStatus: string) => {
    try {
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/v1/order/${pedidoId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        toast.success("Status atualizado!");
        carregarPedidos();
      } else {
        throw new Error("Erro ao atualizar status");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
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

  const getProximoStatus = (status: string): string | null => {
    const fluxo = ["pendente", "preparando", "pronto", "entregue"];
    const index = fluxo.indexOf(status);
    return index < fluxo.length - 1 ? fluxo[index + 1] : null;
  };

  const filteredPedidos = pedidos.filter(pedido =>
    pedido.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.id.toString().includes(searchTerm)
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
                <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 rounded" />
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
              Acompanhe e atualize os pedidos
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente ou número do pedido..."
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
                          Pedido #{pedido.id}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                          {getStatusIcon(pedido.status)}
                          {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        Cliente: {pedido.cliente_nome}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(pedido.data_criacao).toLocaleString('pt-BR')}
                      </p>
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
                      {pedido.itens.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">
                              {item.quantidade}x
                            </span>
                            <span className="text-gray-700">{item.produto_nome}</span>
                          </div>
                          <span className="text-gray-600">
                            R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
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
            <p className="text-gray-600">Nenhum pedido encontrado</p>
          </div>
        )}
      </main>
    </div>
  );
}