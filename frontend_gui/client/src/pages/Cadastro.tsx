import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { User, Phone } from "lucide-react";
import Header from "@/components/Header"; // ✅ Importar o Header

interface FormData {
  nome: string;
  telefone: string;
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
}

export default function Cadastro() {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    telefone: "",
  });
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [, navigate] = useLocation();

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    const clienteId = localStorage.getItem("clienteId");
    if (clienteId) {
      // Se já estiver logado, redireciona direto para o menu
      navigate("/menu");
    }
  }, [navigate]);

  const formatarTelefone = (telefone: string) => {
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return telefone;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "telefone") {
      setFormData((prev) => ({
        ...prev,
        [name]: formatarTelefone(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validarFormulario = (): { valido: boolean; erro?: string } => {
    if (!formData.nome.trim()) {
      return { valido: false, erro: "Nome é obrigatório" };
    }

    if (!formData.telefone.trim()) {
      return { valido: false, erro: "Telefone é obrigatório" };
    }

    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
      return { valido: false, erro: "Telefone deve ter 10 ou 11 dígitos" };
    }

    if (formData.nome.trim().length < 2) {
      return { valido: false, erro: "Nome deve ter pelo menos 2 caracteres" };
    }

    return { valido: true };
  };

  const handleLogin = async (telefone: string): Promise<Cliente> => {
    const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
    const telefoneLimpo = telefone.replace(/\D/g, '');
    
    const response = await fetch(
      `${apiUrl}/v1/client?telephone=${telefoneLimpo}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Cliente não encontrado. Verifique o telefone ou crie uma conta.");
      }
      throw new Error(`Erro ${response.status}: Falha ao buscar cliente`);
    }

    return await response.json();
  };

  const handleCadastro = async (dados: FormData): Promise<Cliente> => {
    const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
    const telefoneLimpo = dados.telefone.replace(/\D/g, '');
    
    const response = await fetch(
      `${apiUrl}/v1/client`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: dados.nome.trim(),
          telefone: telefoneLimpo,
        }),
      }
    );

    if (!response.ok) {
      let errorMessage = "Erro ao criar conta";
      
      try {
        const errorData = await response.json();
        if (errorData.message?.includes("já existe")) {
          errorMessage = "Este telefone já está cadastrado. Faça login.";
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Se não conseguir parsear o JSON, usa mensagem padrão
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  const salvarDadosCliente = (cliente: Cliente) => {
    // Salvar dados no localStorage com timestamp para controle de expiração
    const loginData = {
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      timestamp: new Date().getTime()
    };
    
    localStorage.setItem("clienteData", JSON.stringify(loginData));
    localStorage.setItem("clienteId", cliente.id.toString());
    localStorage.setItem("clienteNome", cliente.nome);
    localStorage.setItem("clienteTelefone", cliente.telefone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validacao = validarFormulario();
    if (!validacao.valido) {
      toast.error(validacao.erro!);
      return;
    }

    try {
      setLoading(true);

      let cliente: Cliente;

      if (isLogin) {
        // Fazer login
        cliente = await handleLogin(formData.telefone);
        
        // Verificar se o nome corresponde (opcional, para segurança)
        if (cliente.nome.toLowerCase() !== formData.nome.trim().toLowerCase()) {
          toast.warning("Nome não corresponde ao cadastro. Verifique seus dados.");
          return;
        }
        
        toast.success(`Bem-vindo de volta, ${cliente.nome}!`);
      } else {
        // Criar nova conta
        cliente = await handleCadastro(formData);
        toast.success("Conta criada com sucesso!");
      }

      // Salvar dados no localStorage
      salvarDadosCliente(cliente);

      // Redirecionar para o menu usando navigate do wouter
      setTimeout(() => {
        navigate("/menu");
      }, 1000);

    } catch (err) {
      console.error("Erro:", err);
      toast.error(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setFormData({
      nome: "",
      telefone: "",
    });
  };

  const toggleModo = () => {
    setIsLogin(!isLogin);
    limparFormulario();
  };

  const continuarSemCadastro = () => {
    toast.info("Você pode fazer pedidos, mas alguns recursos serão limitados");
    setTimeout(() => {
      navigate("/menu");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* ✅ Header Reutilizável */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Cabeçalho do Formulário */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
              </h2>
              <p className="text-gray-600">
                {isLogin
                  ? "Entre com seus dados para continuar"
                  : "Cadastre-se para fazer pedidos"}
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Telefone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                    maxLength={15}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Digite apenas números com DDD
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isLogin ? "Entrando..." : "Criando conta..."}
                  </div>
                ) : isLogin ? (
                  "Entrar na Conta"
                ) : (
                  "Criar Minha Conta"
                )}
              </Button>
            </form>

            {/* Alternar entre Login/Cadastro */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
                <button
                  onClick={toggleModo}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 transition-colors"
                >
                  {isLogin ? "Cadastre-se aqui" : "Faça login aqui"}
                </button>
              </p>
            </div>

            {/* Continuar sem cadastro */}
            <div className="mt-4 text-center">
              <button
                onClick={continuarSemCadastro}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50 transition-colors"
              >
                Continuar sem cadastro
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}