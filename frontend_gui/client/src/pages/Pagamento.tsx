import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2, Plus, Minus, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { pedidoService } from "@/services/pedidoService"; 
import Header from "@/components/Header";

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

interface ClienteInfo {
  id: string;
  nome: string;
  telefone?: string;
}

export default function Pagamento() {
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [validando, setValidando] = useState(false);

  // Recuperar carrinho e cliente do localStorage
  useEffect(() => {
    const carrinhoSalvo = localStorage.getItem("carrinho");
    if (carrinhoSalvo) {
      try {
        const carrinhoParseado = JSON.parse(carrinhoSalvo);
        
        // ✅ Validar estrutura do carrinho
        if (Array.isArray(carrinhoParseado) && carrinhoParseado.every(item => 
          item.produto && 
          item.produto.id && 
          item.produto.nome && 
          item.produto.preco_venda !== undefined &&
          item.quantidade > 0
        )) {
          setCarrinho(carrinhoParseado);
        } else {
          console.error("Estrutura inválida do carrinho");
          localStorage.removeItem("carrinho");
          toast.error("Carrinho inválido, por favor adicione os itens novamente");
        }
      } catch (err) {
        console.error("Erro ao recuperar carrinho:", err);
        toast.error("Erro ao carregar carrinho");
        localStorage.removeItem("carrinho");
      }
    }

    // ✅ Recuperar informações completas do cliente
    const clienteIdSalvo = localStorage.getItem("clienteId");
    const clienteNomeSalvo = localStorage.getItem("clienteNome");
    const clienteTelefoneSalvo = localStorage.getItem("clienteTelefone");

    if (clienteIdSalvo && clienteNomeSalvo) {
      setClienteInfo({
        id: clienteIdSalvo,
        nome: clienteNomeSalvo,
        telefone: clienteTelefoneSalvo || "Não informado",
      });
    }
  }, []);

  // ✅ Validar carrinho antes de calcular totais
  const carrinhoValido = carrinho.length > 0 && carrinho.every(item => 
    item.produto && 
    item.produto.preco_venda > 0 && 
    item.quantidade > 0
  );

  const totalPedido = carrinhoValido 
    ? carrinho.reduce(
        (total, item) => total + (item.produto.preco_venda || 0) * item.quantidade,
        0
      )
    : 0;

  // ✅ Validar quantidade (máximo 99 por item)
  const validarQuantidade = (quantidade: number): boolean => {
    return quantidade > 0 && quantidade <= 99;
  };

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
    toast.info("Quantidade atualizada");
  };

  const atualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (!validarQuantidade(novaQuantidade)) {
      toast.error("Quantidade deve ser entre 1 e 99");
      return;
    }

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

  // ✅ Validar dados antes de finalizar pedido
  const validarPedido = (): boolean => {
    setValidando(true);

    if (!clienteInfo) {
      toast.error("Por favor, faça login ou cadastro antes de finalizar o pedido");
      setLocation("/cadastro");
      return false;
    }

    if (!carrinhoValido) {
      toast.error("Seu carrinho está vazio ou contém itens inválidos");
      return false;
    }

    if (totalPedido <= 0) {
      toast.error("Valor total do pedido inválido");
      return false;
    }

    // Validar se todos os itens têm preços válidos
    const itensInvalidos = carrinho.filter(item => 
      !item.produto.preco_venda || item.produto.preco_venda <= 0
    );

    if (itensInvalidos.length > 0) {
      toast.error("Alguns itens possuem preços inválidos");
      return false;
    }

    setValidando(false);
    return true;
  };

  const handleFinalizarPedido = async () => {
    if (!validarPedido()) {
      return;
    }

    try {
      setLoading(true);

      // ✅ Preparar dados validados para o pedidoService
      const itensPedido = carrinho.map((item) => ({
        produtoid: item.produto.id.toString(),
        nome: item.produto.nome,
        quantidade: item.quantidade,
        preco: item.produto.preco_venda
      }));

      console.log("📦 Criando pedido...", {
        cliente: clienteInfo,
        itens: itensPedido,
        total: totalPedido
      });

      // ✅ Usar o serviço de pedidos com dados validados
      const pedidoCriado = await pedidoService.criarPedido({
        cliente: clienteInfo.nome,
        clienteId: clienteInfo.id,
        telefone: clienteInfo.telefone || "000000000",
        itens: itensPedido,
        total: totalPedido,
        formaPagamento: "dinheiro"
      });

      console.log("✅ Pedido criado com sucesso:", pedidoCriado);
      
      // ✅ EXTRAIR O ID CORRETAMENTE para o redirecionamento
      let pedidoIdParaAcompanhar = pedidoCriado.id || pedidoCriado.numero || pedidoCriado.orderId;

      // ✅ Log detalhado para debug
      console.log("🔍 Estrutura completa do pedido criado:", {
        pedidoCompleto: pedidoCriado,
        id: pedidoCriado.id,
        numero: pedidoCriado.numero,
        orderId: pedidoCriado.orderId,
        idParaAcompanhar: pedidoIdParaAcompanhar
      });

      // ✅ Se for um objeto complexo, extrair o ID real
      if (typeof pedidoIdParaAcompanhar === 'object' && pedidoIdParaAcompanhar !== null) {
        pedidoIdParaAcompanhar = pedidoIdParaAcompanhar.id || pedidoIdParaAcompanhar.numero;
      }

      // ✅ Limpar carrinho apenas se o pedido foi criado com sucesso
      localStorage.removeItem("carrinho");
      setCarrinho([]);
      
      // ✅ Mensagem de sucesso com o ID correto
      toast.success(`Pedido criado com sucesso!`);

      // ✅ REDIRECIONAMENTO CORRIGIDO
      setTimeout(() => {
        if (pedidoIdParaAcompanhar) {
          console.log("🔄 Redirecionando para acompanhar pedido:", pedidoIdParaAcompanhar);
          setLocation(`/acompanhar-pedido/${pedidoIdParaAcompanhar}`);
        } else {
          console.warn("⚠️ ID do pedido não encontrado, redirecionando para lista de pedidos");
          setLocation("/pedidos");
          toast.info("Pedido criado! Acompanhe na lista de pedidos.");
        }
      }, 1500);
      
    } catch (err: any) {
      console.error("❌ Erro ao finalizar pedido:", err);
      
      // ✅ Mensagens de erro mais específicas
      const mensagemErro = err?.message?.includes("network") 
        ? "Erro de conexão. Verifique sua internet."
        : err?.message?.includes("cliente")
        ? "Erro nos dados do cliente. Verifique seu cadastro."
        : "Erro ao finalizar pedido. Tente novamente.";
      
      toast.error(mensagemErro);
    } finally {
      setLoading(false);
      setValidando(false);
    }
  };

  // ✅ Calcular totais com segurança
  const subtotal = carrinhoValido ? totalPedido : 0;
  const taxaEntrega = 0; // Gratuita
  const total = subtotal + taxaEntrega;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showCarrinho={false} />

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Resumo do Pedido</h2>

        {carrinho.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">Seu carrinho está vazio</p>
            <p className="text-gray-500 text-sm mb-6">
              Adicione alguns itens deliciosos do nosso menu
            </p>
            <Link href="/menu">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Explorar Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Carrinho */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Itens do Pedido ({carrinho.length})
                  </h3>
                  {!carrinhoValido && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Itens inválidos detectados
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {carrinho.map((item) => (
                    <div
                      key={item.produto.id}
                      className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {item.produto.nome}
                        </h4>
                        <p className="text-sm text-gray-600">
                          R$ {(item.produto.preco_venda || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.produto.nome_categoria}
                        </p>
                        
                        {/* ✅ Alertas de validação por item */}
                        {item.produto.preco_venda <= 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            Preço inválido
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto.id,
                              item.quantidade - 1
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          disabled={loading || item.quantidade <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto.id,
                              item.quantidade + 1
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          disabled={loading || item.quantidade >= 99}
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
                        className="p-2 hover:bg-red-50 rounded text-red-600 transition-colors disabled:opacity-50"
                        disabled={loading}
                        title="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* ✅ Alertas gerais do carrinho */}
                {!carrinhoValido && carrinho.length > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      ⚠️ Existem problemas com alguns itens do seu carrinho. 
                      Verifique os preços e quantidades.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumo */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Resumo do Pedido
                </h3>

                {clienteInfo && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-600">Cliente</p>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{clienteInfo.nome}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {clienteInfo.telefone}
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxa de entrega</span>
                    <span>Grátis</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-orange-600">
                    R$ {total.toFixed(2)}
                  </span>
                </div>

                <Button
                  onClick={handleFinalizarPedido}
                  disabled={loading || validando || !carrinhoValido || !clienteInfo}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed h-12"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processando...
                    </span>
                  ) : validando ? (
                    "Validando..."
                  ) : (
                    "Finalizar Pedido"
                  )}
                </Button>

                <Link href="/menu">
                  <Button 
                    variant="outline" 
                    className="w-full mt-3 h-11"
                    disabled={loading}
                  >
                    Adicionar Mais Itens
                  </Button>
                </Link>

                {!clienteInfo && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 text-center">
                      ⚠️ Faça login para finalizar o pedido
                    </p>
                  </div>
                )}

                {carrinhoValido && !clienteInfo && (
                  <div className="mt-3 text-center">
                    <Link href="/cadastro">
                      <Button variant="outline" className="w-full h-10 text-sm">
                        Fazer Cadastro/Login
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}