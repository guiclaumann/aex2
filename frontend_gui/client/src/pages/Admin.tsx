import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { 
  Plus, 
  Users, 
  Package, 
  BarChart3, 
  Settings,
  LogOut,
  ChefHat,
  Clock
} from "lucide-react";
import AdminPedidos from "./AdminPedidos";

interface AdminStats {
  totalPedidos: number;
  pedidosPendentes: number;
  totalProdutos: number;
  clientesCadastrados: number;
}

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  clienteId?: string;
  telefone: string;
  email?: string;
  itens: Array<{
    produtoid: string;
    nome: string;
    quantidade: number;
    preco: number;
  }>;
  total: number;
  status: "pendente" | "preparando" | "pronto" | "entregue" | "cancelado";
  data: string;
  endereco?: string;
  observacoes?: string;
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats>({
    totalPedidos: 0,
    pedidosPendentes: 0,
    totalProdutos: 0,
    clientesCadastrados: 0
  });
  const [pedidosRecentes, setPedidosRecentes] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [location] = useLocation();

  // Se estiver na rota /admin/pedidos, mostra a página de pedidos
  if (location === "/admin/pedidos") {
    return <AdminPedidos />;
  }

  useEffect(() => {
    carregarStats();
    carregarPedidosRecentes();
  }, []);

  const carregarStats = async () => {
    try {
      // Buscar pedidos do localStorage para calcular stats reais
      const pedidosLocal = localStorage.getItem('pedidos');
      if (pedidosLocal) {
        const pedidos: Pedido[] = JSON.parse(pedidosLocal);
        const totalPedidos = pedidos.length;
        const pedidosPendentes = pedidos.filter(p => p.status === "pendente").length;
        
        setStats({
          totalPedidos,
          pedidosPendentes,
          totalProdutos: 24, // Mock - você pode buscar da API
          clientesCadastrados: 89 // Mock - você pode buscar da API
        });
      } else {
        // Dados mockados caso não haja pedidos
        setStats({
          totalPedidos: 0,
          pedidosPendentes: 0,
          totalProdutos: 24,
          clientesCadastrados: 89
        });
      }
    } catch (err) {
      console.error("Erro ao carregar stats:", err);
      toast.error("Erro ao carregar dados do dashboard");
    }
  };

  const carregarPedidosRecentes = async () => {
    try {
      // Buscar pedidos do localStorage
      const pedidosLocal = localStorage.getItem('pedidos');
      if (pedidosLocal) {
        const pedidos: Pedido[] = JSON.parse(pedidosLocal);
        // Pegar apenas os 3 pedidos mais recentes
        const pedidosRecentes = pedidos
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
          .slice(0, 3);
        setPedidosRecentes(pedidosRecentes);
      } else {
        setPedidosRecentes([]);
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      toast.error("Erro ao carregar pedidos recentes");
    } finally {
      setLoading(false);
    }
  };

  const mudarStatusPedido = async (pedidoId: string, novoStatus: Pedido["status"]) => {
    try {
      // Atualizar no localStorage
      const pedidosLocal = localStorage.getItem('pedidos');
      if (pedidosLocal) {
        const pedidos: Pedido[] = JSON.parse(pedidosLocal);
        const pedidosAtualizados = pedidos.map(pedido =>
          pedido.id === pedidoId ? { ...pedido, status: novoStatus } : pedido
        );
        localStorage.setItem('pedidos', JSON.stringify(pedidosAtualizados));
        
        // Atualizar lista local
        setPedidosRecentes(prev => 
          prev.map(pedido => 
            pedido.id === pedidoId 
              ? { ...pedido, status: novoStatus }
              : pedido
          )
        );

        toast.success(`Status atualizado para ${getStatusText(novoStatus)}`);
        
        // Recarregar stats
        carregarStats();
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status do pedido");
    }
  };

  const getStatusColor = (status: Pedido["status"]) => {
    const colors = {
      pendente: "text-orange-600 bg-orange-50",
      preparando: "text-blue-600 bg-blue-50",
      pronto: "text-green-600 bg-green-50",
      entregue: "text-gray-600 bg-gray-50",
      cancelado: "text-red-600 bg-red-50"
    };
    return colors[status];
  };

  const getStatusText = (status: Pedido["status"]) => {
    const texts = {
      pendente: "Pendente",
      preparando: "Preparando",
      pronto: "Pronto",
      entregue: "Entregue",
      cancelado: "Cancelado"
    };
    return texts[status];
  };

  const getNextStatus = (currentStatus: Pedido["status"]): Pedido["status"] | null => {
    const flow: Record<Pedido["status"], Pedido["status"] | null> = {
      pendente: "preparando",
      preparando: "pronto",
      pronto: "entregue",
      entregue: null,
      cancelado: null
    };
    return flow[currentStatus];
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast.success("Logout realizado com sucesso");
    window.location.href = "/admin/login";
  };

  const cards = [
    {
      title: "Pedidos Hoje",
      value: stats.totalPedidos,
      icon: Package,
      color: "bg-blue-500",
      link: "/admin/pedidos"
    },
    {
      title: "Pendentes",
      value: stats.pedidosPendentes,
      icon: Clock,
      color: "bg-orange-500",
      link: "/admin/pedidos"
    },
    {
      title: "Produtos",
      value: stats.totalProdutos,
      icon: ChefHat,
      color: "bg-green-500",
      link: "/admin/produtos"
    },
    {
      title: "Clientes",
      value: stats.clientesCadastrados,
      icon: Users,
      color: "bg-purple-500",
      link: "/admin/clientes"
    }
  ];

  const quickActions = [
    {
      title: "Gerenciar Produtos",
      description: "Adicionar, editar ou remover produtos",
      icon: ChefHat,
      link: "/admin/produtos",
      color: "text-green-600 bg-green-50"
    },
    {
      title: "Ver Pedidos",
      description: "Acompanhar e atualizar pedidos",
      icon: Package,
      link: "/admin/pedidos",
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "Relatórios",
      description: "Visualizar métricas e relatórios",
      icon: BarChart3,
      link: "/admin/relatorios",
      color: "text-purple-600 bg-purple-50"
    },
    {
      title: "Configurações",
      description: "Configurações do sistema",
      icon: Settings,
      link: "/admin/configuracoes",
      color: "text-gray-600 bg-gray-50"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
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
              <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 rounded" />
              <div>
                <h1 className="text-2xl font-bold text-orange-600">{APP_TITLE}</h1>
                <p className="text-sm text-gray-600">Painel Administrativo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, Admin
              </span>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">
            Visão geral do seu restaurante
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link key={index} href={card.link}>
                <div className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    </div>
                    <div className={`${card.color} p-3 rounded-full`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.link}>
                <div className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{action.title}</h3>
                      <p className="text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pedidos Recentes com Controles de Status */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Pedidos Recentes</h3>
            <Link href="/admin/pedidos">
              <Button variant="outline" size="sm">
                Ver Todos os Pedidos
              </Button>
            </Link>
          </div>
          
          {pedidosRecentes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum pedido recente</p>
              <p className="text-sm text-gray-500 mt-2">
                Os pedidos criados aparecerão aqui automaticamente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidosRecentes.map((pedido) => {
                const nextStatus = getNextStatus(pedido.status);
                
                return (
                  <div key={pedido.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <p className="font-medium text-gray-900">{pedido.numero}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                          {getStatusText(pedido.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Cliente:</strong> {pedido.cliente}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Itens:</strong> {pedido.itens.map(item => `${item.quantidade}x ${item.nome}`).join(', ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Total:</strong> R$ {pedido.total.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {nextStatus && (
                        <Button
                          onClick={() => mudarStatusPedido(pedido.id, nextStatus)}
                          size="sm"
                        >
                          {nextStatus === "preparando" && "Preparar"}
                          {nextStatus === "pronto" && "Pronto"}
                          {nextStatus === "entregue" && "Entregar"}
                        </Button>
                      )}
                      
                      {pedido.status !== "cancelado" && pedido.status !== "entregue" && (
                        <Button
                          onClick={() => mudarStatusPedido(pedido.id, "cancelado")}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}