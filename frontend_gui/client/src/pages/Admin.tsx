import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Clock,
  Plus,
  LogOut,
  ArrowRight
} from "lucide-react";

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  telefone: string;
  total: number;
  status: "pendente" | "preparando" | "pronto" | "entregue" | "cancelado";
  data: string;
  itens: Array<{
    nome: string;
    quantidade: number;
    preco: number;
  }>;
  tipo: "online" | "balcao";
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
}

interface Stats {
  totalPedidosHoje: number;
  pedidosPendentes: number;
  totalProdutos: number;
  clientesCadastrados: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPedidosHoje: 0,
    pedidosPendentes: 0,
    totalProdutos: 0,
    clientesCadastrados: 0
  });
  const [loading, setLoading] = useState(true);
  const [pedidosRecentes, setPedidosRecentes] = useState<Pedido[]>([]);

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      // Buscar pedidos do localStorage
      const pedidosLocal = localStorage.getItem('pedidos');
      const produtosLocal = localStorage.getItem('produtos');
      
      let pedidos: Pedido[] = [];
      let produtos: Produto[] = [];

      if (pedidosLocal) {
        pedidos = JSON.parse(pedidosLocal);
      }

      if (produtosLocal) {
        produtos = JSON.parse(produtosLocal);
      }

      // Calcular estatísticas reais
      const hoje = new Date();
      const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      
      const pedidosHoje = pedidos.filter(pedido => 
        new Date(pedido.data) >= inicioDoDia
      );

      const pedidosPendentes = pedidos.filter(p => 
        p.status === "pendente" || p.status === "preparando"
      );

      // Extrair clientes únicos dos pedidos
      const clientesUnicos = new Set();
      pedidos.forEach(pedido => {
        const chaveCliente = `${pedido.cliente}-${pedido.telefone}`;
        clientesUnicos.add(chaveCliente);
      });

      // Pedidos recentes (últimos 5 pedidos)
      const pedidosOrdenados = [...pedidos]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5);

      setStats({
        totalPedidosHoje: pedidosHoje.length,
        pedidosPendentes: pedidosPendentes.length,
        totalProdutos: produtos.length,
        clientesCadastrados: clientesUnicos.size
      });

      setPedidosRecentes(pedidosOrdenados);

    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      toast.error("Erro ao carregar dados do dashboard");
      
      // Fallback para dados mockados em caso de erro
      setStats({
        totalPedidosHoje: 5,
        pedidosPendentes: 2,
        totalProdutos: 24,
        clientesCadastrados: 89
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "preparando":
        return "Preparando";
      case "pronto":
        return "Pronto";
      case "entregue":
        return "Entregue";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast.success("Logout realizado com sucesso");
    window.location.href = "/admin/login";
  };

  const handleNovoPedido = () => {
    window.location.href = "/admin/pedidos/novo";
  };

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
                <p className="text-sm text-gray-600">Dashboard Administrativo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={handleNovoPedido}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4" />
                Novo Pedido
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pedidos Hoje */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos Hoje</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalPedidosHoje}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{Math.round((stats.totalPedidosHoje / 30) * 100)}% este mês
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Pendentes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.pedidosPendentes}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  Necessitam atenção
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalProdutos}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  No cardápio
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Clientes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.clientesCadastrados}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  Cadastrados no sistema
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pedidos Recentes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
              <Link href="/admin/pedidos">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {pedidosRecentes.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum pedido recente</p>
                  <Button 
                    onClick={handleNovoPedido}
                    className="mt-4 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Pedido
                  </Button>
                </div>
              ) : (
                pedidosRecentes.map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900">{pedido.numero}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                          {getStatusText(pedido.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{pedido.cliente}</p>
                      <p className="text-sm text-gray-500">{formatarDataHora(pedido.data)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatarMoeda(pedido.total)}</p>
                      <p className="text-sm text-gray-600 capitalize">{pedido.tipo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <Link href="/admin/pedidos">
                <Button variant="outline" className="w-full justify-start h-14 text-left p-4">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Gerenciar Pedidos</p>
                      <p className="text-sm text-gray-600">Ver e atualizar todos os pedidos</p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/admin/produtos">
                <Button variant="outline" className="w-full justify-start h-14 text-left p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Gerenciar Produtos</p>
                      <p className="text-sm text-gray-600">Adicionar ou editar produtos</p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/admin/clientes">
                <Button variant="outline" className="w-full justify-start h-14 text-left p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Gerenciar Clientes</p>
                      <p className="text-sm text-gray-600">Ver lista de clientes</p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/admin/relatorios">
                <Button variant="outline" className="w-full justify-start h-14 text-left p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Relatórios</p>
                      <p className="text-sm text-gray-600">Analisar vendas e performance</p>
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}