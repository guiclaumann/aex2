import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  ChefHat,
  LogOut,
  ArrowLeft
} from "lucide-react";

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco_venda: number;
  nome_categoria: string;
  disponivel: boolean;
  imagem_url?: string;
}

interface Categoria {
  id: number;
  nome: string;
}

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco_venda: "",
    categoria_id: "",
    disponivel: true
  });

  useEffect(() => {
    carregarProdutos();
    carregarCategorias();
  }, []);

  const carregarProdutos = async () => {
    try {
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/v1/product`);
      
      if (response.ok) {
        const data = await response.json();
        setProdutos(data);
      } else {
        throw new Error("Erro ao carregar produtos");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao carregar produtos");
      // Mock data para desenvolvimento
      setProdutos([
        {
          id: 1,
          nome: "Hambúrguer Clássico",
          descricao: "Pão, carne, queijo e alface",
          preco_venda: 25.90,
          nome_categoria: "Lanches",
          disponivel: true
        },
        {
          id: 2,
          nome: "Batata Frita",
          descricao: "Porção de batata frita crocante",
          preco_venda: 12.90,
          nome_categoria: "Acompanhamentos",
          disponivel: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      // Mock de categorias
      setCategorias([
        { id: 1, nome: "Lanches" },
        { id: 2, nome: "Acompanhamentos" },
        { id: 3, nome: "Bebidas" },
        { id: 4, nome: "Sobremesas" }
      ]);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
      const method = editingProduto ? "PUT" : "POST";
      const url = editingProduto 
        ? `${apiUrl}/v1/product/${editingProduto.id}`
        : `${apiUrl}/v1/product`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          descricao: formData.descricao,
          preco_venda: parseFloat(formData.preco_venda),
          categoria_id: parseInt(formData.categoria_id),
          disponivel: formData.disponivel
        }),
      });

      if (response.ok) {
        toast.success(editingProduto ? "Produto atualizado!" : "Produto criado!");
        setShowModal(false);
        resetForm();
        carregarProdutos();
      } else {
        throw new Error("Erro ao salvar produto");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao salvar produto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/v1/product/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Produto excluído!");
        carregarProdutos();
      } else {
        throw new Error("Erro ao excluir produto");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Erro ao excluir produto");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      preco_venda: "",
      categoria_id: "",
      disponivel: true
    });
    setEditingProduto(null);
  };

  const openEditModal = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao,
      preco_venda: produto.preco_venda.toString(),
      categoria_id: categorias.find(c => c.nome === produto.nome_categoria)?.id.toString() || "",
      disponivel: produto.disponivel
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.descricao.toLowerCase().includes(searchTerm.toLowerCase())
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
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
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
                  <p className="text-sm text-gray-600">Gerenciar Produtos</p>
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
            <h2 className="text-3xl font-bold text-gray-900">Produtos</h2>
            <p className="text-gray-600 mt-2">
              Gerencie o cardápio do seu restaurante
            </p>
          </div>
          
          <Button
            onClick={openCreateModal}
            className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProdutos.map((produto) => (
            <div key={produto.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{produto.nome}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                      {produto.nome_categoria}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    produto.disponivel 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {produto.disponivel ? 'Disponível' : 'Indisponível'}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{produto.descricao}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-600">
                    R$ {produto.preco_venda.toFixed(2)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => openEditModal(produto)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(produto.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProdutos.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum produto encontrado</p>
          </div>
        )}
      </main>

      {/* Modal de Criar/Editar Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Venda *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_venda}
                    onChange={(e) => setFormData(prev => ({ ...prev, preco_venda: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="disponivel"
                    checked={formData.disponivel}
                    onChange={(e) => setFormData(prev => ({ ...prev, disponivel: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="disponivel" className="text-sm text-gray-700">
                    Produto disponível para venda
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {editingProduto ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}