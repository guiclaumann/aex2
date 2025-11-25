import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

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
    if (!formData.nome.trim()) {
      return { valido: false, erro: "Nome é obrigatório" };
    }

    if (formData.nome.trim().length < 2) {
      return { valido: false, erro: "Nome deve ter pelo menos 2 caracteres" };
    }

    if (!formData.telefone.trim()) {
      return { valido: false, erro: "Telefone é obrigatório" };
    }

    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    
    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
      return { valido: false, erro: "Telefone deve ter 10 ou 11 dígitos" };
    }

    return { valido: true };
  };

  const buscarClientePorTelefone = async (telefone: string): Promise<Cliente | null> => {
    const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
    const telefoneLimpo = telefone.replace(/\D/g, '');
    
    console.log("🔍 BUSCA: Procurando cliente com telefone:", telefoneLimpo);
    console.log("🔍 BUSCA: URL completa:", `${apiUrl}/v1/client?telephone=${telefoneLimpo}`);
    
    try {
      const response = await fetch(
        `${apiUrl}/v1/client?telephone=${telefoneLimpo}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🔍 BUSCA: Resposta - Status:", response.status, "OK:", response.ok);

      if (response.status === 404) {
        console.log("🔍 BUSCA: Cliente não encontrado (404)");
        return null;
      }

      if (!response.ok) {
        console.error("🔍 BUSCA: Erro na resposta:", response.status, response.statusText);
        // Se der erro diferente de 404, vamos tentar criar o cliente mesmo assim
        console.log("🔍 BUSCA: Vamos tentar criar o cliente...");
        return null;
      }

      const cliente = await response.json();
      console.log("🔍 BUSCA: Cliente encontrado:", cliente);
      return cliente;
    } catch (error) {
      console.error("🔍 BUSCA: Erro na requisição:", error);
      // Em caso de erro de rede, vamos tentar criar o cliente
      console.log("🔍 BUSCA: Erro de rede, tentando criar cliente...");
      return null;
    }
  };

  const criarNovoCliente = async (): Promise<Cliente> => {
    const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:8080";
    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    
    const dadosCliente = {
      nome: formData.nome.trim(),
      telefone: telefoneLimpo,
    };
    
    console.log("🆕 CRIAÇÃO: Criando novo cliente...", dadosCliente);
    console.log("🆕 CRIAÇÃO: URL:", `${apiUrl}/v1/client`);
    
    const response = await fetch(
      `${apiUrl}/v1/client`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosCliente),
      }
    );

    console.log("🆕 CRIAÇÃO: Resposta - Status:", response.status, "OK:", response.ok);

    if (!response.ok) {
      let errorMessage = "Erro ao criar conta";
      
      try {
        const errorData = await response.text();
        console.error("🆕 CRIAÇÃO: Resposta de erro:", errorData);
        
        if (errorData.includes("já existe") || errorData.includes("already exists")) {
          errorMessage = "Este telefone já está cadastrado. Tente fazer login.";
        } else {
          errorMessage = `Erro ${response.status}: ${errorData || response.statusText}`;
        }
      } catch {
        errorMessage = `Erro ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    try {
      const novoCliente = await response.json();
      console.log("🆕 CRIAÇÃO: Novo cliente criado com sucesso:", novoCliente);
      return novoCliente;
    } catch (parseError) {
      console.error("🆕 CRIAÇÃO: Erro ao parsear resposta:", parseError);
      // Se não conseguir parsear JSON, mas a resposta foi OK, cria um cliente local
      const clienteLocal: Cliente = {
        id: Date.now(), // ID temporário
        nome: formData.nome.trim(),
        telefone: telefoneLimpo,
      };
      console.log("🆕 CRIAÇÃO: Usando cliente local:", clienteLocal);
      return clienteLocal;
    }
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
    
    console.log("💾 Dados salvos no localStorage:", loginData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔄 INÍCIO: Processo de login/cadastro", formData);

    const validacao = validarFormulario();
    if (!validacao.valido) {
      toast.error(validacao.erro!);
      return;
    }

    try {
      setLoading(true);

      // Primeiro busca o cliente pelo telefone
      const telefoneLimpo = formData.telefone.replace(/\D/g, '');
      console.log("📞 Telefone limpo para busca:", telefoneLimpo);
      
      const clienteExistente = await buscarClientePorTelefone(telefoneLimpo);

      let cliente: Cliente;

      if (clienteExistente) {
        // Cliente existe - faz login
        console.log("✅ LOGIN: Cliente encontrado", clienteExistente);
        cliente = clienteExistente;
        toast.success(`Bem-vindo de volta, ${cliente.nome}!`);
      } else {
        // Cliente não existe - cria novo
        console.log("🆕 CADASTRO: Criando novo cliente...");
        cliente = await criarNovoCliente();
        toast.success(`Conta criada com sucesso! Bem-vindo, ${cliente.nome}!`);
      }
      
      // Salvar dados no localStorage
      salvarDadosCliente(cliente);
      console.log("🎯 REDIRECIONANDO para /menu");

      // Redirecionar para o menu
      setTimeout(() => {
        navigate("/menu");
      }, 1000);

    } catch (err) {
      console.error("❌ ERRO FINAL:", err);
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

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">
                📱 Formato: (DDD) 91234-5678 para celular
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Se não tiver conta, criaremos uma automaticamente
              </p>
            </div>

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