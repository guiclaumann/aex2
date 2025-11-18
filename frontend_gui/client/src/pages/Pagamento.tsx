import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2, Plus, Minus } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco_venda: number;
  nome_categoria: string;
}

interface CarrinhoItem {
  produto: Produto;
  quantidade: number;
}

interface ItemPedido {
  produtoId: number;
  quantidade: number;
}

interface PedidoRequest {
  clienteId: number;
  itens: ItemPedido[];
  total: number;
}

export default function Pagamento() {
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [location, setLocation] = useLocation();

  // Recuperar carrinho e cliente do localStorage
  useEffect(() => {
    const carrinhoSalvo = localStorage.getItem("carrinho");
    if (carrinhoSalvo) {
      try {
        setCarrinho(JSON.parse(carrinhoSalvo));
      } catch (err) {
        console.error("Erro ao recuperar carrinho:", err);
        toast.error("Erro ao carregar carrinho");
      }
    }

    const clienteIdSalvo = localStorage.getItem("clienteId");
    const clienteNomeSalvo = localStorage.getItem("clienteNome");
    setClienteId(clienteIdSalvo);
    setClienteNome(clienteNomeSalvo);
  }, []);

  // Atualizar localStorage quando carrinho mudar
  useEffect(() => {
    if (carrinho.length > 0) {
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
    }
  }, [carrinho]);

  const totalPedido = carrinho.reduce(
    (total, item) => total + (item.produto.preco_venda || 0) * item.quantidade,
    0
  );

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

  const atualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
    } else {
      setCarrinho((prev) =>
        prev.map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: novaQuantidade }
            : item
        )
      );
    }
  };

  const validarDadosPedido = (): { valido: boolean; erro?: string } => {
    if (!clienteId) {
      return { valido: false, erro: "Cliente não identificado" };
    }

    const clienteIdNum = parseInt(clienteId);
    if (isNaN(clienteIdNum) || clienteIdNum <= 0) {
      return { valido: false, erro: "ID do cliente inválido" };
    }

    if (carrinho.length === 0) {
      return { valido: false, erro: "Carrinho vazio" };
    }

    // Validar cada item do carrinho
    for (const item of carrinho) {
      if (!item.produto.id || item.produto.id <= 0) {
        return { valido: false, erro: "ID de produto inválido" };
      }
      if (item.quantidade <= 0) {
        return { valido: false, erro: "Quantidade inválida para um produto" };
      }
      if (!item.produto.preco_venda || item.produto.preco_venda < 0) {
        return { valido: false, erro: "Preço de produto inválido" };
      }
    }

    if (totalPedido <= 0) {
      return { valido: false, erro: "Total do pedido inválido" };
    }

    return { valido: true };
  };

  const handleFinalizarPedido = async () => {
    // Validação inicial
    if (!clienteId) {
      toast.error("Por favor, faça login ou cadastro antes de finalizar o pedido");
      window.location.href = "/cadastro";
      return;
    }

    if (carrinho.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }

    // Validação detalhada
    const validacao = validarDadosPedido();
    if (!validacao.valido) {
      toast.error(validacao.erro || "Dados do pedido inválidos");
      return;
    }

    try {
      setLoading(true);

      // Preparar dados do pedido com validação
      const itens: ItemPedido[] = carrinho.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
      }));

      const pedidoRequest: PedidoRequest = {
        clienteId: parseInt(clienteId),
        itens: itens,
        total: parseFloat(totalPedido.toFixed(2)), // Garantir 2 casas decimais
      };

      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
      
      console.log("Enviando para API:", pedidoRequest);

      const response = await fetch(
        `${apiUrl}/v1/order/create_order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pedidoRequest),
        }
      );

      console.log("Status da resposta:", response.status);

      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: `;
        
        try {
          const errorData = await response.json();
          console.error("Erro detalhado da API:", errorData);
          
          // Tentar extrair mensagem de erro mais específica
          if (errorData.message) {
            errorMessage += errorData.message;
          } else if (errorData.error) {
            errorMessage += errorData.error;
          } else {
            errorMessage += "Falha ao criar pedido";
          }
        } catch (parseError) {
          // Se não conseguir parsear como JSON, usar text
          const errorText = await response.text();
          errorMessage += errorText || response.statusText;
        }
        
        throw new Error(errorMessage);
      }

      const pedido = await response.json();
      console.log("Pedido criado com sucesso:", pedido);
      
      // Limpar carrinho e redirecionar
      localStorage.removeItem("carrinho");
      setCarrinho([]);
      toast.success("Pedido criado com sucesso!");

      // Redireciona para a página de acompanhamento
      window.location.href = `/acompanhar/${pedido.id}`;
      
    } catch (err) {
      console.error("Erro completo ao finalizar pedido:", err);
      
      // Mensagens de erro mais específicas
      if (err instanceof Error) {
        if (err.message.includes("500")) {
          toast.error("Erro interno do servidor. Tente novamente em alguns instantes.");
        } else if (err.message.includes("Network Error")) {
          toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Erro inesperado ao finalizar pedido. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const removerItemCompletamente = (produtoId: number) => {
    setCarrinho((prev) => prev.filter((item) => item.produto.id !== produtoId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 rounded" />
              <h1 className="text-2xl font-bold text-orange-600">{APP_TITLE}</h1>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Resumo do Pedido</h2>

        {carrinho.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg mb-6">Seu carrinho está vazio</p>
            <Link href="/menu">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Voltar ao Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Carrinho */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Itens do Pedido ({carrinho.length})
                </h3>
                <div className="space-y-4">
                  {carrinho.map((item) => (
                    <div
                      key={item.produto.id}
                      className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {item.produto.nome}
                        </h4>
                        <p className="text-sm text-gray-600">
                          R$ {(item.produto.preco_venda || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.produto.nome_categoria}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto.id,
                              item.quantidade - 1
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          disabled={loading}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto.id,
                              item.quantidade + 1
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          disabled={loading}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right min-w-20">
                        <p className="font-semibold text-gray-900">
                          R$ {((item.produto.preco_venda || 0) * item.quantidade).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removerItemCompletamente(item.produto.id)}
                        className="p-2 hover:bg-red-50 rounded text-red-600 transition-colors"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Resumo
                </h3>

                {clienteNome && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-semibold text-gray-900">{clienteNome}</p>
                    <p className="text-xs text-gray-500">ID: {clienteId}</p>
                  </div>
                )}

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R$ {totalPedido.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxa de entrega</span>
                    <span>R$ 0,00</span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-orange-600">
                    R$ {totalPedido.toFixed(2)}
                  </span>
                </div>

                {!clienteId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      Você precisa estar logado para finalizar o pedido.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleFinalizarPedido}
                  disabled={loading || carrinho.length === 0 || !clienteId}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processando...
                    </span>
                  ) : (
                    "Finalizar Pedido"
                  )}
                </Button>

                <Link href="/menu">
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    disabled={loading}
                  >
                    Continuar Comprando
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}