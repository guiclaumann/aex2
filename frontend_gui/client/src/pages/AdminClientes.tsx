import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { 
  Search,
  Users,
  LogOut,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  ShoppingCart,
  Plus
} from "lucide-react";

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  data_cadastro: string;
}

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

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [carrinho, setCarrinho] = useState<Array<{nome: string, quantidade: number, preco: number}>>([]);

  const [formData, setFormData] = useState({
    nome: "",
    telefone: ""
  });

  useEffect(() => {
    carregarClientes();
    carregarPedidos();
  }, []);

  const carregarClientes = async () => {
    try {
      // Buscar clientes do localStorage
      const clientesSalvos = localStorage.getItem('clientesCadastrados');
      
      if (clientesSalvos) {
        const clientesParseados: Cliente[] = JSON.parse(clientesSalvos);
        setClientes(clientesParseados);
      } else {
        // Buscar de clientes salvos no localStorage do login
        const clienteId = localStorage.getItem('clienteId');
        const clienteNome = localStorage.getItem('clienteNome');
        
        if (clienteId && clienteNome) {
          const clienteManual: Cliente = {
            id: parseInt(clienteId),
            nome: clienteNome,
            telefone: "Não informado",
            data_cadastro: new Date().toISOString()
          };
          setClientes([clienteManual]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const carregarPedidos = async () => {
    try {
      const pedidosSalvos = localStorage.getItem('pedidos');
      if (pedidosSalvos) {
        const pedidosParseados: Pedido[] = JSON.parse(pedidosSalvos);
        setPedidos(pedidosParseados);
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
    }
  };

  const getEstatisticasCliente = (clienteId: number) => {
    const cliente = clientes.find(c => c.id === clienteId);
    const pedidosCliente = pedidos.filter(pedido => 
      pedido.cliente === cliente?.nome
    );

    const totalPedidos = pedidosCliente.length;
    const ultimoPedido = pedidosCliente.length > 0 
      ? pedidosCliente.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]
      : null;

    const totalGasto = pedidosCliente.reduce((total, pedido) => total + pedido.total, 0);

    return {
      totalPedidos,
      ultimoPedido: ultimoPedido?.data,
      totalGasto
    };
  };

  const abrirModalPedido = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setCarrinho([]);
    setShowPedidoModal(true);
  };

  const abrirModalCliente = () => {
    setFormData({
      nome: "",
      telefone: ""
    });
    setShowClienteModal(true);
  };

  const handleCriarCliente = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }

    const novoCliente: Cliente = {
      id: Date.now(),
      nome: formData.nome,
      telefone: formData.telefone,
      data_cadastro: new Date().toISOString()
    };

    // Salvar no localStorage
    const clientesAtuais = [...clientes, novoCliente];
    localStorage.setItem('clientesCadastrados', JSON.stringify(clientesAtuais));
    setClientes(clientesAtuais);

    toast.success(`Cliente ${formData.nome} criado com sucesso!`);
    setShowClienteModal(false);
    setFormData({
      nome: "",
      telefone: ""
    });
  };

  const adicionarItemAoPedido = (item: {nome: string, preco: number}) => {
    const itemExistente = carrinho.find(i => i.nome === item.nome);
    
    if (itemExistente) {
      setCarrinho(carrinho.map(i => 
        i.nome === item.nome 
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      ));
    } else {
      setCarrinho([...carrinho, { ...item, quantidade: 1 }]);
    }
    
    toast.success(`${item.nome} adicionado ao pedido`);
  };

  const removerItemDoPedido = (nome: string) => {
    setCarrinho(carrinho.filter(item => item.nome !== nome));
    toast.success("Item removido do pedido");
  };

  const atualizarQuantidade = (nome: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItemDoPedido(nome);
    } else {
      setCarrinho(carrinho.map(item =>
        item.nome === nome
          ? { ...item, quantidade: novaQuantidade }
          : item
      ));
    }
  };

  const finalizarPedidoBalcao = () => {
    if (!clienteSelecionado) return;
    if (carrinho.length === 0) {
      toast.error("Adicione itens ao pedido");
      return;
    }

    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    
    const novoPedido: Pedido = {
      id: `balcao_${Date.now()}`,
      numero: `#${Math.floor(1000 + Math.random() * 9000)}`,
      cliente: clienteSelecionado.nome,
      telefone: clienteSelecionado.telefone,
      total: total,
      status: "pendente",
      data: new Date().toISOString(),
      itens: carrinho,
      tipo: "balcao"
    };

    // Salvar pedido no localStorage
    const pedidosExistentes = [...pedidos, novoPedido];
    localStorage.setItem('pedidos', JSON.stringify(pedidosExistentes));
    setPedidos(pedidosExistentes);

    toast.success(`Pedido ${novoPedido.numero} criado para ${clienteSelecionado.nome}!`);
    setShowPedidoModal(false);
    setCarrinho([]);
  };

  const produtosDisponiveis = [
    { nome: "Hambúrguer Clássico", preco: 25.90 },
    { nome: "Hambúrguer Bacon", preco: 29.90 },
    { nome: "Batata Frita", preco: 12.90 },
    { nome: "Batata com Cheddar", preco: 18.90 },
    { nome: "Refrigerante Lata", preco: 6.90 },
    { nome: "Suco Natural", preco: 8.90 },
    { nome: "Água Mineral", preco: 4.90 },
    { nome: "Sorvete", preco: 9.90 }
  ];

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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
          <p className="mt-4 text-gray-600">Carregando clientes...</p>
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
                  <p className="text-sm text-gray-600">Gerenciar Clientes</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
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
            <h2 className="text-3xl font-bold text-gray-900">Clientes Cadastrados</h2>
            <p className="text-gray-600 mt-2">
              Visualize os clientes do seu restaurante - {clientes.length} cliente(s)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 bg-orange-50 px-3 py-1 rounded-full">
              {pedidos.length} pedidos no sistema
            </div>
            <Button
              onClick={abrirModalCliente}
              className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Clientes List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => {
            const estatisticas = getEstatisticasCliente(cliente.id);
            
            return (
              <div key={cliente.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header do Cliente */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{cliente.nome}

                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{cliente.telefone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Cadastro: {formatarData(cliente.data_cadastro)}
                      </div>
                      
                      {estatisticas.totalPedidos > 0 && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {estatisticas.totalPedidos} pedido(s)
                        </div>
                      )}
                    </div>

                    {/* Botão de Fazer Pedido */}
                    <Button
                      onClick={() => abrirModalPedido(cliente)}
                      className="w-full bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Fazer Pedido no Balcão
                    </Button>

                    {estatisticas.totalPedidos > 0 && (
                      <div className="mt-3 space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Total gasto:</span>
                          <span className="font-semibold text-green-600">
                            {formatarMoeda(estatisticas.totalGasto)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredClientes.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {clientes.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente corresponde à busca"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Clique em "Novo Cliente" para adicionar o primeiro cliente
            </p>
          </div>
        )}

        {/* Modal de Criar Cliente */}
        {showClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Cadastrar Novo Cliente
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClienteModal(false)}
                  >
                    ✕
                  </Button>
                </div>
                
                <form onSubmit={handleCriarCliente} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                      placeholder="Digite o nome do cliente"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                                    
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowClienteModal(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Cliente
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Pedido no Balcão */}
        {showPedidoModal && clienteSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Pedido para {clienteSelecionado.nome}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPedidoModal(false)}
                  >
                    ✕
                  </Button>
                </div>

                {/* Produtos Disponíveis */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Adicionar Itens:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {produtosDisponiveis.map((produto, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => adicionarItemAoPedido(produto)}
                      >
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{produto.nome}</div>
                          <div className="text-sm text-orange-600">{formatarMoeda(produto.preco)}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Carrinho */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Itens do Pedido:</h4>
                  
                  {carrinho.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum item adicionado</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {carrinho.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{item.nome}</div>
                            <div className="text-sm text-gray-600">{formatarMoeda(item.preco)} cada</div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => atualizarQuantidade(item.nome, item.quantidade - 1)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantidade}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => atualizarQuantidade(item.nome, item.quantidade + 1)}
                              >
                                +
                              </Button>
                            </div>
                            
                            <div className="text-right min-w-20">
                              <div className="font-semibold text-gray-900">
                                {formatarMoeda(item.preco * item.quantidade)}
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerItemDoPedido(item.nome)}
                              className="text-red-600 hover:text-red-700"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  {carrinho.length > 0 && (
                    <div className="border-t pt-4 mb-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-orange-600">
                          {formatarMoeda(carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Botão Finalizar */}
                  <Button
                    onClick={finalizarPedidoBalcao}
                    disabled={carrinho.length === 0}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Finalizar Pedido no Balcão
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}