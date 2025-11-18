import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2, Plus, Minus } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { pedidoService } from "@/services/pedidoService"; 

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

export default function Pagamento() {
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

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

  const totalPedido = carrinho.reduce(
    (total, item) => total + (item.produto.preco_venda || 0) * item.quantidade,
    0
  );

  const removerDoCarrinho = (produtoId: number) => {
    const novoCarrinho = carrinho
      .map((item) =>
        item.produto.id === produtoId
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      )
      .filter((item) => item.quantidade > 0);
    
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
  };

  const atualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
    } else {
      const novoCarrinho = carrinho.map((item) =>
        item.produto.id === produtoId
          ? { ...item, quantidade: novaQuantidade }
          : item
      );
      
      setCarrinho(novoCarrinho);
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    }
  };

  const removerItemCompletamente = (produtoId: number) => {
    const novoCarrinho = carrinho.filter((item) => item.produto.id !== produtoId);
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    toast.success("Item removido do carrinho");
  };

  const handleFinalizarPedido = async () => {
    if (!clienteId || !clienteNome) {
      toast.error("Por favor, faça login ou cadastro antes de finalizar o pedido");
      setLocation("/cadastro");
      return;
    }

    if (carrinho.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }

    try {
      setLoading(true);

      // Preparar dados para o pedidoService
      const itensPedido = carrinho.map((item) => ({
        produtoid: item.produto.id.toString(),
        nome: item.produto.nome,
        quantidade: item.quantidade,
        preco: item.produto.preco_venda
      }));

      console.log("📦 Criando pedido...");

      // Usar o serviço de pedidos
      const pedidoCriado = await pedidoService.criarPedido({
        cliente: clienteNome,
        clienteId: clienteId,
        telefone: "000000000", // Você pode adicionar campo de telefone depois
        email: "",
        endereco: "Endereço do cliente",
        itens: itensPedido,
        total: totalPedido,
        formaPagamento: "dinheiro"
      });

      console.log("✅ Pedido criado com sucesso:", pedidoCriado);
      
      // Limpar carrinho
      localStorage.removeItem("carrinho");
      setCarrinho([]);
      
      toast.success(`Pedido ${pedidoCriado.numero} criado com sucesso!`);

      // Redirecionar para confirmação
      setTimeout(() => {
        setLocation(`/confirmacao-pedido/${pedidoCriado.numero}`);
      }, 1000);
      
    } catch (err) {
      console.error("❌ Erro ao finalizar pedido:", err);
      toast.error("Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
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