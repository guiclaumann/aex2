import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { 
  BarChart3,
  LogOut,
  ArrowLeft,
  Calendar,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Download,
  Filter
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

interface Relatorio {
  periodo: string;
  totalVendas: number;
  totalPedidos: number;
  ticketMedio: number;
  pedidosConcluidos: number;
  pedidosCancelados: number;
  produtosMaisVendidos: Array<{nome: string, quantidade: number, total: number}>;
  horariosPico: Array<{hora: string, pedidos: number}>;
}

interface DadosExportacao {
  periodo: string;
  dataExportacao: string;
  totalVendas: number;
  totalPedidos: number;
  ticketMedio: number;
  pedidosConcluidos: number;
  pedidosCancelados: number;
  produtosMaisVendidos: Array<{nome: string, quantidade: number, total: number}>;
  horariosPico: Array<{hora: string, pedidos: number}>;
}

export default function AdminRelatorios() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<"hoje" | "semana" | "mes" | "ano">("hoje");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);

  useEffect(() => {
    carregarPedidos();
  }, []);

  useEffect(() => {
    if (pedidos.length > 0) {
      gerarRelatorio();
    }
  }, [pedidos, periodoSelecionado]);

  const carregarPedidos = async () => {
    try {
      const pedidosSalvos = localStorage.getItem('pedidos');
      if (pedidosSalvos) {
        const pedidosParseados: Pedido[] = JSON.parse(pedidosSalvos);
        setPedidos(pedidosParseados);
      } else {
        const mockPedidos = gerarPedidosMock();
        setPedidos(mockPedidos);
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorio = () => {
    const pedidosFiltrados = filtrarPedidosPorPeriodo(pedidos, periodoSelecionado);
    const relatorioGerado = calcularRelatorio(pedidosFiltrados, periodoSelecionado);
    setRelatorio(relatorioGerado);
  };

  const filtrarPedidosPorPeriodo = (pedidos: Pedido[], periodo: string): Pedido[] => {
    const agora = new Date();
    let dataInicio: Date;

    switch (periodo) {
      case "hoje":
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        break;
      case "semana":
        dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "mes":
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        break;
      case "ano":
        dataInicio = new Date(agora.getFullYear(), 0, 1);
        break;
      default:
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    }

    return pedidos.filter(pedido => 
      new Date(pedido.data) >= dataInicio && new Date(pedido.data) <= agora
    );
  };

  const calcularRelatorio = (pedidos: Pedido[], periodo: string): Relatorio => {
    const pedidosConcluidos = pedidos.filter(p => p.status === "entregue" || p.status === "pronto");
    const pedidosCancelados = pedidos.filter(p => p.status === "cancelado");
    const totalVendas = pedidosConcluidos.reduce((sum, pedido) => sum + pedido.total, 0);
    const totalPedidos = pedidosConcluidos.length;
    const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

    const produtosMap = new Map();
    pedidosConcluidos.forEach(pedido => {
      pedido.itens.forEach(item => {
        const existente = produtosMap.get(item.nome);
        if (existente) {
          produtosMap.set(item.nome, {
            quantidade: existente.quantidade + item.quantidade,
            total: existente.total + (item.preco * item.quantidade)
          });
        } else {
          produtosMap.set(item.nome, {
            quantidade: item.quantidade,
            total: item.preco * item.quantidade
          });
        }
      });
    });

    const produtosMaisVendidos = Array.from(produtosMap.entries())
      .map(([nome, dados]) => ({
        nome,
        quantidade: dados.quantidade,
        total: dados.total
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    const horariosMap = new Map();
    pedidosConcluidos.forEach(pedido => {
      const hora = new Date(pedido.data).getHours();
      const horaFormatada = `${hora.toString().padStart(2, '0')}:00`;
      horariosMap.set(horaFormatada, (horariosMap.get(horaFormatada) || 0) + 1);
    });

    const horariosPico = Array.from(horariosMap.entries())
      .map(([hora, pedidos]) => ({ hora, pedidos }))
      .sort((a, b) => b.pedidos - a.pedidos)
      .slice(0, 6);

    return {
      periodo,
      totalVendas,
      totalPedidos,
      ticketMedio,
      pedidosConcluidos: pedidosConcluidos.length,
      pedidosCancelados: pedidosCancelados.length,
      produtosMaisVendidos,
      horariosPico
    };
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(valor);
  };

  const getTituloPeriodo = () => {
    const agora = new Date();
    switch (periodoSelecionado) {
      case "hoje":
        return `Hoje - ${agora.toLocaleDateString('pt-BR')}`;
      case "semana":
        return "Últimos 7 Dias";
      case "mes":
        return `Mês de ${agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
      case "ano":
        return `Ano de ${agora.getFullYear()}`;
      default:
        return "Relatório";
    }
  };

  const handleExportarRelatorio = () => {
    if (!relatorio) return;

    const dados: DadosExportacao = {
      periodo: getTituloPeriodo(),
      dataExportacao: new Date().toLocaleString('pt-BR'),
      totalVendas: relatorio.totalVendas,
      totalPedidos: relatorio.totalPedidos,
      ticketMedio: relatorio.ticketMedio,
      pedidosConcluidos: relatorio.pedidosConcluidos,
      pedidosCancelados: relatorio.pedidosCancelados,
      produtosMaisVendidos: relatorio.produtosMaisVendidos,
      horariosPico: relatorio.horariosPico
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${periodoSelecionado}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Relatório exportado com sucesso!");
  };

  const gerarPedidosMock = (): Pedido[] => {
    const pedidos: Pedido[] = [];
    const produtos = [
      { nome: "Hambúrguer Clássico", preco: 25.90 },
      { nome: "Hambúrguer Bacon", preco: 29.90 },
      { nome: "Batata Frita", preco: 12.90 },
      { nome: "Batata com Cheddar", preco: 18.90 },
      { nome: "Refrigerante Lata", preco: 6.90 },
      { nome: "Suco Natural", preco: 8.90 }
    ];

    for (let i = 0; i < 50; i++) {
      const data = new Date();
      data.setDate(data.getDate() - Math.floor(Math.random() * 30));
      data.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

      const numItens = 1 + Math.floor(Math.random() * 3);
      const itens = [];
      let total = 0;

      for (let j = 0; j < numItens; j++) {
        const produto = produtos[Math.floor(Math.random() * produtos.length)];
        const quantidade = 1 + Math.floor(Math.random() * 2);
        itens.push({
          nome: produto.nome,
          quantidade,
          preco: produto.preco
        });
        total += produto.preco * quantidade;
      }

      const statuses: Pedido["status"][] = ["entregue", "entregue", "entregue", "pronto", "cancelado"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      pedidos.push({
        id: `ped_${Date.now()}_${i}`,
        numero: `#${1000 + i}`,
        cliente: `Cliente ${i + 1}`,
        telefone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        total,
        status,
        data: data.toISOString(),
        itens,
        tipo: Math.random() > 0.5 ? "online" : "balcao"
      });
    }

    return pedidos;
  };

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
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
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
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-orange-600">{APP_TITLE}</h1>
                  <p className="text-sm text-gray-600">Relatórios e Analytics</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={handleExportarRelatorio}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!relatorio}
              >
                <Download className="h-4 w-4" />
                Exportar
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{getTituloPeriodo()}</h2>
            <p className="text-gray-600 mt-2">
              Análise completa da performance do seu food truck
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { value: "hoje", label: "Hoje" },
              { value: "semana", label: "Semana" },
              { value: "mes", label: "Mês" },
              { value: "ano", label: "Ano" }
            ].map((periodo) => (
              <Button
                key={periodo.value}
                variant={periodoSelecionado === periodo.value ? "default" : "outline"}
                onClick={() => setPeriodoSelecionado(periodo.value as any)}
                className={`flex items-center gap-2 ${
                  periodoSelecionado === periodo.value 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : ''
                }`}
              >
                <Filter className="h-4 w-4" />
                {periodo.label}
              </Button>
            ))}
          </div>
        </div>

        {!relatorio ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum dado disponível para o período selecionado</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatarMoeda(relatorio.totalVendas)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      +{relatorio.pedidosConcluidos} pedidos
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pedidos Concluídos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatarNumero(relatorio.pedidosConcluidos)}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {((relatorio.pedidosConcluidos / relatorio.totalPedidos) * 100).toFixed(1)}% taxa
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatarMoeda(relatorio.ticketMedio)}
                    </p>
                    <p className="text-sm text-purple-600 mt-1">
                      por pedido
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cancelamentos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatarNumero(relatorio.pedidosCancelados)}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      {relatorio.totalPedidos > 0 
                        ? `${((relatorio.pedidosCancelados / relatorio.totalPedidos) * 100).toFixed(1)}% taxa`
                        : '0% taxa'
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos Mais Vendidos
                </h3>
                <div className="space-y-3">
                  {relatorio.produtosMaisVendidos.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum produto vendido no período</p>
                  ) : (
                    relatorio.produtosMaisVendidos.map((produto, index) => (
                      <div key={produto.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{produto.nome}</p>
                            <p className="text-sm text-gray-600">{produto.quantidade} unidades</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatarMoeda(produto.total)}</p>
                          <p className="text-sm text-gray-600">{formatarMoeda(produto.total / produto.quantidade)}/un</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Horários de Pico
                </h3>
                <div className="space-y-3">
                  {relatorio.horariosPico.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Sem dados de horários</p>
                  ) : (
                    relatorio.horariosPico.map((horario, index) => (
                      <div key={horario.hora} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{horario.hora}</p>
                            <p className="text-sm text-gray-600">Horário</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{horario.pedidos} pedidos</p>
                          <p className="text-sm text-gray-600">
                            {((horario.pedidos / relatorio.pedidosConcluidos) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Detalhadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{relatorio.totalPedidos}</p>
                  <p className="text-sm text-gray-600">Total de Pedidos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {relatorio.pedidosConcluidos > 0 
                      ? ((relatorio.pedidosConcluidos / relatorio.totalPedidos) * 100).toFixed(1)
                      : '0'
                    }%
                  </p>
                  <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {relatorio.pedidosCancelados}
                  </p>
                  <p className="text-sm text-gray-600">Pedidos Cancelados</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}