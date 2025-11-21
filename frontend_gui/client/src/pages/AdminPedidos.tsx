import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";
import { 
  Package, 
  Search,
  LogOut,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ChefHat,
  Truck
} from "lucide-react";
import { getProximoNumero, obterPedidos, atualizarStatusPedido } from "@/utils/pedidoUtils";

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

type StatusFilter = "todos" | "pendente" | "preparando" | "pronto" | "entregue" | "cancelado";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  useEffect(() => {
    carregarPedidos();
    
    const interval = setInterval(carregarPedidos, 5000);
    return () => clearInterval(interval);
  }, []);

  const carregarPedidos = () => {
    try {
      setLoading(true);
      // ✅ USA A MESMA FUNÇÃO DO PEDIDOUTILS - GARANTE COMPATIBILIDADE
      const pedidosCarregados = obterPedidos();
      setPedidos(pedidosCarregados);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CONTADORES DE STATUS
  const contadoresStatus = {
    todos: pedidos.length,
    pendente: pedidos.filter(p => p.status === "pendente").length,
    preparando: pedidos.filter(p => p.status === "preparando").length,
    pronto: pedidos.filter(p => p.status === "pronto").length,
    entregue: pedidos.filter(p => p.status === "entregue").length,
    cancelado: pedidos.filter(p => p.status === "cancelado").length
  };

  const handleAtualizarStatus = (pedidoId: string, novoStatus: Pedido["status"]) => {
    try {
      // ✅ USA A MESMA FUNÇÃO DO PEDIDOUTILS
      const sucesso = atualizarStatusPedido(pedidoId, novoStatus);
      
      if (sucesso) {
        // Atualizar estado local
        const pedidosAtualizados = pedidos.map(pedido =>
          pedido.id === pedidoId ? { ...pedido, status: novoStatus } : pedido
        );
        
        setPedidos(pedidosAtualizados);
        toast.success(`Status atualizado para ${novoStatus}!`);
        
        // Recarregar para garantir sincronização
        setTimeout(() => {
          carregarPedidos();
        }, 100);
      } else {
        toast.error("Erro ao atualizar status");
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status");
    }
  };

  // ✅ FUNÇÕES ESPECÍFICAS PARA CADA AÇÃO
  const iniciarPreparo = (pedidoId: string) => {
    handleAtualizarStatus(pedidoId, "preparando");
  };

  const marcarComoPronto = (pedidoId: string) => {
    handleAtualizarStatus(pedidoId, "pronto");
  };

  const marcarComoEntregue = (pedidoId: string) => {
    handleAtualizarStatus(pedidoId, "entregue");
  };

  const cancelarPedido = (pedidoId: string) => {
    if (window.confirm("Tem certeza que deseja cancelar este pedido?")) {
      handleAtualizarStatus(pedidoId, "cancelado");
    }
  };

  const getStatusColor = (status: Pedido["status"]) => {
    switch (status) {
      case "pendente": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparando": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pronto": return "bg-green-100 text-green-800 border-green-200";
      case "entregue": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelado": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Pedido["status"]) => {
    switch (status) {
      case "pendente": return <Clock className="h-4 w-4" />;
      case "preparando": return <ChefHat className="h-4 w-4" />;
      case "pronto": return <CheckCircle className="h-4 w-4" />;
      case "entregue": return <Truck className="h-4 w-4" />;
      case "cancelado": return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getProximoStatus = (status: Pedido["status"]): Pedido["status"] | null => {
    const fluxo: Pedido["status"][] = ["pendente", "preparando", "pronto", "entregue"];
    const index = fluxo.indexOf(status);
    return index < fluxo.length - 1 ? fluxo[index + 1] : null;
  };

  // ✅ FILTRAGEM 100% RIGOROSA
  const filteredPedidos = pedidos.filter(pedido => {
    if (!pedido || !pedido.status) return false;
    
    // ✅ FILTRO RIGOROSO POR STATUS
    if (statusFilter !== "todos") {
      if (pedido.status !== statusFilter) {
        return false;
      }
    }
    
    // ✅ FILTRO POR BUSCA
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      const matchBusca = (
        pedido.cliente?.toLowerCase().includes(term) ||
        pedido.numero?.toLowerCase().includes(term) ||
        pedido.id?.toLowerCase().includes(term)
      );
      if (!matchBusca) return false;
    }
    
    return true;
  });

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
              <div>
                <h1 className="text-2xl font-bold text-orange-600">{APP_TITLE}</h1>
                <p className="text-sm text-gray-600">
                  Gerenciar Pedidos • Próximo: {getProximoNumero()}
                </p>
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

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Pedidos</h2>
            <p className="text-gray-600 mt-2">
              {statusFilter === "todos" 
                ? `Todos os pedidos - ${filteredPedidos.length} de ${pedidos.length}`
                : `Pedidos ${statusFilter} - ${filteredPedidos.length}`
              }
            </p>
          </div>
        </div>

        {/* ✅ BOTÕES DE FILTRO */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { key: "todos" as StatusFilter, label: "Todos", icon: Package, count: contadoresStatus.todos },
            { key: "pendente" as StatusFilter, label: "Pendentes", icon: Clock, count: contadoresStatus.pendente },
            { key: "preparando" as StatusFilter, label: "Preparando", icon: ChefHat, count: contadoresStatus.preparando },
            { key: "pronto" as StatusFilter, label: "Prontos", icon: CheckCircle, count: contadoresStatus.pronto },
            { key: "entregue" as StatusFilter, label: "Entregues", icon: Truck, count: contadoresStatus.entregue },
            { key: "cancelado" as StatusFilter, label: "Cancelados", icon: XCircle, count: contadoresStatus.cancelado },
          ].map(({ key, label, icon: Icon, count }) => (
            <Button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex flex-col items-center justify-center p-4 h-auto ${
                statusFilter === key 
                  ? "bg-orange-600 hover:bg-orange-700 text-white" 
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs opacity-75">{count}</span>
            </Button>
          ))}
        </div>

        {/* ✅ BARRA DE BUSCA */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, número do pedido (ex: #0001) ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* ✅ LISTA DE PEDIDOS FILTRADOS */}
        <div className="space-y-4">
          {filteredPedidos.map((pedido) => {
            const proximoStatus = getProximoStatus(pedido.status);
            
            return (
              <div key={pedido.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {pedido.numero}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(pedido.status)}`}>
                          {getStatusIcon(pedido.status)}
                          {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        <strong>Cliente:</strong> {pedido.cliente}
                      </p>
                      <p className="text-gray-500 text-sm">
                        <strong>Data:</strong> {new Date(pedido.data).toLocaleString('pt-BR')}
                      </p>
                      {pedido.telefone && (
                        <p className="text-gray-500 text-sm">
                          <strong>Tel:</strong> {pedido.telefone}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        R$ {pedido.total.toFixed(2)}
                      </p>
                      {proximoStatus && (
                        <Button
                          onClick={() => handleAtualizarStatus(pedido.id, proximoStatus)}
                          size="sm"
                          className="mt-2 bg-orange-600 hover:bg-orange-700"
                        >
                          Avançar para {proximoStatus}
                        </Button>
                      )}
                    </div>
                  </div>

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

                  {pedido.status !== "entregue" && pedido.status !== "cancelado" && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => iniciarPreparo(pedido.id)}
                          variant="outline"
                          size="sm"
                          disabled={pedido.status !== "pendente"}
                        >
                          Iniciar Preparo
                        </Button>
                        <Button
                          onClick={() => marcarComoPronto(pedido.id)}
                          variant="outline"
                          size="sm"
                          disabled={pedido.status !== "preparando"}
                        >
                          Marcar como Pronto
                        </Button>
                        <Button
                          onClick={() => marcarComoEntregue(pedido.id)}
                          variant="outline"
                          size="sm"
                          disabled={pedido.status !== "pronto"}
                        >
                          Marcar como Entregue
                        </Button>
                        <Button
                          onClick={() => cancelarPedido(pedido.id)}
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
              {pedidos.length === 0 
                ? "Nenhum pedido encontrado" 
                : statusFilter !== "todos"
                ? `Nenhum pedido com status "${statusFilter}" encontrado`
                : "Nenhum pedido corresponde à busca"
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}