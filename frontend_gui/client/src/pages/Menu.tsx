// src/pages/Menu.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingCart, Heart, Plus, Minus, Trash2, RefreshCw, LogOut } from "lucide-react";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";
import { useFavoritos } from "@/hooks/useFavoritos";
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import Header from "@/components/Header";

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco_venda: number;
  nome_categoria: string;
  disponivel: boolean;
  imagem_url?: string;
}

interface CarrinhoItem {
  produto: Produto;
  quantidade: number;
}

interface ControleQuantidade {
  [produtoId: number]: number;
}

export default function Menu() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [quantidades, setQuantidades] = useState<ControleQuantidade>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toggleFavorito, isFavorito, favoritos } = useFavoritos();
  const { cliente, logout } = useAuth();
  const [, navigate] = useLocation();

  // ✅ Verificar autenticação - MAS SEM REDIRECIONAR AUTOMÁTICO
  // Deixa o usuário ver o menu mesmo sem estar logado
  useEffect(() => {
    console.log("Cliente no Menu:", cliente);
  }, [cliente]);

  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  // ✅ FUNÇÃO CORRIGIDA: Carregar produtos APENAS os DISPONÍVEIS
  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
      
      let produtosCarregados: Produto[] = [];

      // Tentar carregar da API primeiro
      try {
        const response = await fetch(`${apiUrl}/v1/product`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("📦 Todos os produtos da API:", data);
          produtosCarregados = data;
          
          // Salvar no localStorage para backup
          localStorage.setItem('produtos', JSON.stringify(data));
        } else {
          throw new Error("API não respondeu OK");
        }
      } catch (apiError) {
        console.log("🌐 API não disponível, usando dados locais...");
        
        // ✅ FALLBACK: BUSCAR DO LOCALSTORAGE
        const produtosLocal = localStorage.getItem('produtos');
        if (produtosLocal) {
          const produtosParseados: Produto[] = JSON.parse(produtosLocal);
          console.log("📦 Todos os produtos do localStorage:", produtosParseados);
          produtosCarregados = produtosParseados;
        } else {
          produtosCarregados = [];
        }
      }

      // ✅ FILTRAR APENAS PRODUTOS COM disponivel === true
      const produtosDisponiveis = produtosCarregados.filter(produto => {
        if (produto.disponivel === undefined) {
          console.log(`⚠️ Produto ${produto.nome} sem 'disponivel', considerando como disponível`);
          return true;
        }
        
        // ✅ SÓ MOSTRA SE disponivel FOR TRUE
        const estaDisponivel = produto.disponivel === true;
        console.log(`🔍 Produto ${produto.nome}: disponivel = ${produto.disponivel} → ${estaDisponivel ? 'VISÍVEL' : 'INVISÍVEL'}`);
        return estaDisponivel;
      });
      
      console.log("✅ Produtos disponíveis no menu:", produtosDisponiveis);
      setProdutos(produtosDisponiveis);

      // Inicializar quantidades apenas para produtos disponíveis
      const quantidadesIniciais: ControleQuantidade = {};
      produtosDisponiveis.forEach((produto: Produto) => {
        quantidadesIniciais[produto.id] = 1;
      });
      setQuantidades(quantidadesIniciais);
      
      setError(null);
    } catch (err) {
      console.error("❌ Erro ao carregar produtos:", err);
      setError("Não foi possível carregar os produtos. Tente novamente.");
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Recuperar carrinho do localStorage
  useEffect(() => {
    const carrinhoSalvo = localStorage.getItem("carrinho");
    if (carrinhoSalvo) {
      try {
        const carrinhoParseado: CarrinhoItem[] = JSON.parse(carrinhoSalvo);
        
        // ✅ FILTRAR CARRINHO: remover produtos que estão indisponíveis
        const carrinhoFiltrado = carrinhoParseado.filter(item => {
          const produtoNoMenu = produtos.find(p => p.id === item.produto.id);
          return produtoNoMenu !== undefined;
        });
        
        setCarrinho(carrinhoFiltrado);
      } catch (err) {
        console.error("Erro ao recuperar carrinho:", err);
      }
    }
  }, [produtos]);

  // Salvar carrinho no localStorage
  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }, [carrinho]);

  // ✅ FUNÇÃO PARA ATUALIZAR MANUALMENTE
  const handleAtualizarMenu = async () => {
    setRefreshing(true);
    await carregarProdutos();
    toast.success("Menu atualizado!");
  };

  const aumentarQuantidade = (produtoId: number) => {
    setQuantidades(prev => ({
      ...prev,
      [produtoId]: (prev[produtoId] || 1) + 1
    }));
  };

  const diminuirQuantidade = (produtoId: number) => {
    setQuantidades(prev => ({
      ...prev,
      [produtoId]: Math.max(1, (prev[produtoId] || 1) - 1)
    }));
  };

  const adicionarAoCarrinho = (produto: Produto) => {
    // ✅ Verificar se está logado antes de adicionar ao carrinho
    if (!cliente) {
      toast.error("Faça login para adicionar itens ao carrinho");
      navigate("/cadastro");
      return;
    }

    const quantidade = quantidades[produto.id] || 1;
    
    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => item.produto.id === produto.id);
      if (itemExistente) {
        const novoCarrinho = prev.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
        return novoCarrinho;
      }
      
      return [...prev, { produto, quantidade }];
    });
    
    // Resetar quantidade para 1 após adicionar
    setQuantidades(prev => ({
      ...prev,
      [produto.id]: 1
    }));

    toast.success(`${produto.nome} adicionado ao carrinho!`);
  };

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho((prev) =>
      prev
        .map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    toast.success("Carrinho limpo!");
  };

  const getQuantidadeNoCarrinho = (produtoId: number) => {
    const item = carrinho.find(item => item.produto.id === produtoId);
    return item ? item.quantidade : 0;
  };

  const agruparPorCategoria = () => {
    const agrupado: { [key: string]: Produto[] } = {};
    produtos.forEach((produto) => {
      const categoria = produto.nome_categoria || 'Sem Categoria';
      if (!agrupado[categoria]) {
        agrupado[categoria] = [];
      }
      agrupado[categoria].push(produto);
    });
    return agrupado;
  };

   return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Usar o Header component */}
      <Header 
        onAtualizarMenu={handleAtualizarMenu}
        refreshing={refreshing}
        carrinhoCount={carrinho.reduce((total, item) => total + item.quantidade, 0)}
      />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 mb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Cardápio</h2>
            {cliente && (
              <p className="text-gray-600">
                Bem-vindo, <span className="font-semibold">{cliente.nome}</span>
              </p>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {produtos.length} produto(s) disponível(eis)
          </div>
        </div>

        {/* Aviso se não estiver logado */}
        {!cliente && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Faça login</strong> para adicionar itens ao carrinho e finalizar pedidos.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="ml-4 text-gray-600">Carregando produtos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            <p className="font-semibold">Erro ao carregar produtos</p>
            <p className="text-sm">{error}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                Recarregar Página
              </Button>
              <Button 
                onClick={handleAtualizarMenu}
                variant="outline" 
                size="sm"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && produtos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">Nenhum produto disponível no momento.</p>
            <p className="text-sm text-gray-500 mb-4">
              Todos os produtos estão temporariamente indisponíveis.
              <br />
              Volte mais tarde ou verifique a disponibilidade.
            </p>
            <Button 
              onClick={handleAtualizarMenu}
              variant="outline" 
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Verificar Disponibilidade
            </Button>
          </div>
        )}

        {!loading && !error && produtos.length > 0 && (
          <div className="space-y-8">
            {Object.entries(agruparPorCategoria()).map(([categoria, prods]) => (
              <div key={categoria}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 capitalize">
                  {categoria}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {prods.map((produto) => {
                    const quantidadeNoCarrinho = getQuantidadeNoCarrinho(produto.id);
                    const quantidadeSelecionada = quantidades[produto.id] || 1;
                    
                    return (                   
                      <div
                        key={produto.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                      >
                        <div className="p-4 flex flex-col h-full">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-lg font-semibold text-gray-900 flex-1">
                                {produto.nome}
                              </h4>
                            </div>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {produto.descricao}
                            </p>
                          </div>

                          {/* Preço e Controles */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-orange-600">
                                R$ {(produto.preco_venda || 0).toFixed(2)}
                              </span>
                      
                              {/* Controle de Quantidade */}
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                                <button
                                  onClick={() => diminuirQuantidade(produto.id)}
                                  className="text-gray-600 hover:text-orange-600 transition-colors disabled:opacity-30"
                                  disabled={quantidadeSelecionada <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="font-bold text-gray-900 min-w-6 text-center text-sm">
                                  {quantidadeSelecionada}
                                </span>
                                <button
                                  onClick={() => aumentarQuantidade(produto.id)}
                                  className="text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Botão Adicionar */}
                            <Button
                              onClick={() => adicionarAoCarrinho(produto)}
                              className="w-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2 py-2 text-sm font-semibold"
                              disabled={!cliente} // Desabilita se não estiver logado
                            >
                              <Plus className="h-4 w-4" />
                              {cliente ? `Adicionar R$ ${(produto.preco_venda * quantidadeSelecionada).toFixed(2)}` : "Faça Login"}
                            </Button>
                          </div>
                        </div>
                      </div>   
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Carrinho Flutuante - SÓ MOSTRA SE ESTIVER LOGADO */}
      {cliente && carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Seu Carrinho</h4>
                  <p className="text-sm text-gray-600">
                    {carrinho.reduce((total, item) => total + item.quantidade, 0)} itens
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-orange-600">
                    R$ {carrinho.reduce((total, item) => 
                      total + (item.produto.preco_venda * item.quantidade), 0
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={limparCarrinho}
                  variant="outline"
                  className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </Button>
                <Link href="/pagamento">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Finalizar Pedido
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}