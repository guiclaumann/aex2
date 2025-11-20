import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import {
    ArrowLeft,
    Calendar,
    Edit,
    Phone,
    Plus,
    Save,
    Search,
    Trash2,
    Users,
    X
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  totalPedidos: number;
  totalGasto: number;
  primeiroPedido: string;
  ultimoPedido: string;
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

interface FormCliente {
  nome: string;
  telefone: string;
}

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<FormCliente>({
    nome: "",
    telefone: ""
  });

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      const pedidosSalvos = localStorage.getItem('pedidos');
      if (pedidosSalvos) {
        const pedidosParseados: Pedido[] = JSON.parse(pedidosSalvos);
        setPedidos(pedidosParseados);
        extrairClientes(pedidosParseados);
      } else {
        toast.error("Nenhum pedido encontrado");
        setClientes([]);
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const extrairClientes = (pedidos: Pedido[]) => {
    const clientesMap = new Map<string, Cliente>();

    pedidos.forEach(pedido => {
      const chaveCliente = `${pedido.cliente}-${pedido.telefone}`;
      
      if (!clientesMap.has(chaveCliente)) {
        clientesMap.set(chaveCliente, {
          id: chaveCliente,
          nome: pedido.cliente,
          telefone: pedido.telefone,
          totalPedidos: 0,
          totalGasto: 0,
          primeiroPedido: pedido.data,
          ultimoPedido: pedido.data
        });
      }

      const cliente = clientesMap.get(chaveCliente)!;
      
      cliente.totalPedidos += 1;
      cliente.totalGasto += pedido.total;
      
      const dataPedido = new Date(pedido.data);
      const primeiroPedido = new Date(cliente.primeiroPedido);
      const ultimoPedido = new Date(cliente.ultimoPedido);

      if (dataPedido < primeiroPedido) {
        cliente.primeiroPedido = pedido.data;
      }
      if (dataPedido > ultimoPedido) {
        cliente.ultimoPedido = pedido.data;
      }
    });

    const clientesArray = Array.from(clientesMap.values())
      .sort((a, b) => b.totalPedidos - a.totalPedidos);

    setClientes(clientesArray);
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  // Função para abrir modal de novo cliente
  const handleNovoCliente = () => {
    setClienteEditando(null);
    setFormData({
      nome: "",
      telefone: ""
    });
    setShowModal(true);
  };

  // Função para abrir modal de editar cliente
  const handleEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone
    });
    setShowModal(true);
  };

  // Função para excluir cliente
  const handleExcluirCliente = (cliente: Cliente) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
      // Remover cliente da lista
      const clientesAtualizados = clientes.filter(c => c.id !== cliente.id);
      setClientes(clientesAtualizados);
      
      // Atualizar pedidos para remover referências a este cliente
      const pedidosAtualizados = pedidos.map(pedido => {
        if (pedido.cliente === cliente.nome && pedido.telefone === cliente.telefone) {
          return {
            ...pedido,
            cliente: "Cliente Excluído",
            telefone: "00000000000"
          };
        }
        return pedido;
      });
      
      setPedidos(pedidosAtualizados);
      localStorage.setItem('pedidos', JSON.stringify(pedidosAtualizados));
      
      toast.success("Cliente excluído com sucesso");
    }
  };

  // Função para salvar cliente (novo ou edição)
  const handleSalvarCliente = () => {
    // Validações
    if (!formData.nome.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    if (!formData.telefone.trim()) {
      toast.error("Telefone do cliente é obrigatório");
      return;
    }

    // Validar formato do telefone (apenas números)
    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
      toast.error("Telefone deve ter pelo menos 10 dígitos");
      return;
    }

    if (clienteEditando) {
      // EDITAR CLIENTE EXISTENTE
      const clientesAtualizados = clientes.map(cliente => {
        if (cliente.id === clienteEditando.id) {
          return {
            ...cliente,
            nome: formData.nome,
            telefone: telefoneLimpo
          };
        }
        return cliente;
      });
      setClientes(clientesAtualizados);

      // Atualizar pedidos com novo nome/telefone
      const pedidosAtualizados = pedidos.map(pedido => {
        if (pedido.cliente === clienteEditando.nome && pedido.telefone === clienteEditando.telefone) {
          return {
            ...pedido,
            cliente: formData.nome,
            telefone: telefoneLimpo
          };
        }
        return pedido;
      });
      
      setPedidos(pedidosAtualizados);
      localStorage.setItem('pedidos', JSON.stringify(pedidosAtualizados));
      
      toast.success("Cliente atualizado com sucesso");
    } else {
      // NOVO CLIENTE
      const novoCliente: Cliente = {
        id: `cliente_${Date.now()}`,
        nome: formData.nome,
        telefone: telefoneLimpo,
        totalPedidos: 0,
        totalGasto: 0,
        primeiroPedido: new Date().toISOString(),
        ultimoPedido: new Date().toISOString()
      };

      setClientes([...clientes, novoCliente]);
      toast.success("Cliente cadastrado com sucesso");
    }
  };

  // Função para formatar telefone enquanto digita
  const formatarTelefone = (telefone: string) => {
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  };

  const handleTelefoneChange = (telefone: string) => {
    const formatted = formatarTelefone(telefone);
    setFormData(prev => ({ ...prev, telefone: formatted }));
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
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
                <div>
                  <h1 className="text-2xl font-bold text-orange-600">{APP_TITLE}</h1>
                  <p className="text-sm text-gray-600">Gerenciamento de Clientes</p>
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
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {clientes.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos no Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {pedidos.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {clientes.length > 0 
                    ? formatarMoeda(clientes.reduce((sum, cliente) => sum + cliente.totalGasto, 0) / clientes.length)
                    : formatarMoeda(0)
                  }
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatarMoeda(clientes.reduce((sum, cliente) => sum + cliente.totalGasto, 0))}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Pesquisa e Ações */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar cliente por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleNovoCliente}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={handleNovoCliente}
                  className="mt-4 flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Primeiro Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Gasto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Compra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            Desde {formatarData(cliente.primeiroPedido)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                            {cliente.telefone}
                        </div>
                        <div className="text-sm text-gray-500">telefone</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.totalPedidos}
                        </div>
                        <div className="text-sm text-gray-500">pedidos</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatarMoeda(cliente.totalGasto)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {cliente.totalPedidos > 0 ? formatarMoeda(cliente.totalGasto / cliente.totalPedidos) : formatarMoeda(0)}/pedido
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatarData(cliente.ultimoPedido)}
                        </div>
                        <div className="text-sm text-gray-500">Última compra</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleEditarCliente(cliente)}
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleExcluirCliente(cliente)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {clientesFiltrados.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{clientesFiltrados.length}</span> de{" "}
              <span className="font-medium">{clientes.length}</span> clientes
            </p>
          </div>
        )}
      </main>

      {/* Modal para Novo/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {clienteEditando ? "Editar Cliente" : "Novo Cliente"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Digite o nome do cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => handleTelefoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarCliente}
                className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {clienteEditando ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}