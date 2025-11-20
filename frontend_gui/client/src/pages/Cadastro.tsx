import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { User, Phone } from "lucide-react";
import Header from "@/components/Header";

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
  const [, navigate] = useLocation();

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    const clienteId = localStorage.getItem("clienteId");
    if (clienteId) {
      navigate("/menu");
    }
  }, [navigate]);

  const formatarTelefone = (telefone: string) => {
    const numbers = telefone.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    }
    if (numbers.length <= 6) {
      return numbers.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    }
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
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
    // Validar nome
    if (!formData.nome.trim()) {
      return { valido: false, erro: "Nome é obrigatório" };
    }

    if (formData.nome.trim().length < 2) {
      return { valido: false, erro: "Nome deve ter pelo menos 2 caracteres" };
    }

    // Validar telefone
    if (!formData.telefone.trim()) {
      return { valido: false, erro: "Telefone é obrigatório" };
    }

    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    
    // Validar DDD (deve começar com números válidos)
    const ddd = telefoneLimpo.substring(0, 2);
    const dddsValidos = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
    
    if (!dddsValidos.includes(ddd)) {
      return { valido: false, erro: "DDD inválido. Digite um DDD válido do Brasil." };
    }

    // Validar número completo
    if (telefoneLimpo.length !== 11) {
      return { valido: false, erro: "Telefone deve ter 11 dígitos (DDD + 9 dígitos)" };
    }

    // Validar se o número começa com 9 (celular)
    const primeiroDigitoNumero = telefoneLimpo.charAt(2);
    if (primeiroDigitoNumero !== '9') {
      return { valido: false, erro: "Número de celular deve começar com 9" };
    }

    return { valido: true };
  };

  const handleLogin = async (telefone: string): Promise<Cliente> => {
    const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
    const telefoneLimpo = telefone.replace(/\D/g, '');
    
    console.log("🔍 Buscando cliente com telefone:", telefoneLimpo);
    
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
        // Cliente não encontrado, vamos criar um novo
        console.log("📝 Cliente não encontrado, criando novo...");
        return await criarNovoCliente(telefoneLimpo);
      }
      throw new Error(`Erro ${response.status}: Falha ao buscar cliente`);
    }

    return await response.json();
  };

  const criarNovoCliente = async (telefone: string): Promise<Cliente> => {
    const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
    
    console.log("🆕 Criando novo cliente...");
    
    const response = await fetch(
      `${apiUrl}/v1/client`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          telefone: telefone,
        }),
      }
    );

    if (!response.ok) {
      let errorMessage = "Erro ao criar conta";
      
      try {
        const errorData = await response.json();
        if (errorData.message?.includes("já existe")) {
          errorMessage = "Este telefone já está cadastrado. Tente fazer login novamente.";
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Se não conseguir parsear o JSON, usa mensagem padrão
      }
      
      throw new Error(errorMessage);
    }

    const novoCliente = await response.json();
    console.log("✅ Novo cliente criado:", novoCliente);
    return novoCliente;
  };

  const salvarDadosCliente = (cliente: Cliente) => {
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
    
    console.log("💾 Dados do cliente salvos no localStorage");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔄 Iniciando processo de login/cadastro...");

    const validacao = validarFormulario();
    if (!validacao.valido) {
      toast.error(validacao.erro!);
      return;
    }

    try {
      setLoading(true);

      // Primeiro tenta fazer login, se não existir, cria novo cliente
      const cliente = await handleLogin(formData.telefone);
      
      // Salvar dados no localStorage
      salvarDadosCliente(cliente);
      toast.success(`Bem-vindo, ${cliente.nome}!`);

      console.log("✅ Login realizado com sucesso, redirecionando...");

      // Redirecionar para o menu
      setTimeout(() => {
        navigate("/menu");
      }, 1000);

    } catch (err) {
      console.error("❌ Erro no processo:", err);
      toast.error(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const continuarSemCadastro = () => {
    toast.info("Você pode ver o menu, mas precisa fazer login para pedir");
    setTimeout(() => {
      navigate("/menu");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Header />

      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Cabeçalho do Formulário */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Fazer Login
              </h2>
              <p className="text-gray-600">
                Entre com seus dados para continuar
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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Telefone com DDD *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(11) 91234-5678"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                    maxLength={15}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Digite seu celular com DDD (ex: 11 91234-5678)
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
                    Processando...
                  </div>
                ) : (
                  "Entrar na Conta"
                )}
              </Button>
            </form>

            {/* Informações de validação */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">
                📱 Formato obrigatório: (DDD) 98765-4321
              </p>
              
              
              
            </div>

            {/* Continuar sem cadastro */}
            <div className="mt-6 text-center">
              <button
                onClick={continuarSemCadastro}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50 transition-colors"
              >
                Continuar sem login (apenas visualização)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}