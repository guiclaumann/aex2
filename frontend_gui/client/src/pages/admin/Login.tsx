import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    usuario: "",
    senha: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuario || !formData.senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      // Em uma implementação real, você faria a autenticação com o backend
      // Por enquanto, vamos usar credenciais fixas para desenvolvimento
      if (formData.usuario === "admin" && formData.senha === "admin123") {
        localStorage.setItem("adminToken", "mock-token");
        localStorage.setItem("adminUser", formData.usuario);
        toast.success("Login realizado com sucesso!");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1000);
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (err) {
      console.error("Erro:", err);
      toast.error("Usuário ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12 rounded" />
              <h1 className="text-2xl font-bold text-orange-600">{APP_TITLE}</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Painel Admin</h2>
            <p className="text-gray-600">
              Acesse o painel administrativo
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
                  placeholder="Digite seu usuário"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                  placeholder="Digite sua senha"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Entrando...
                </div>
              ) : (
                "Entrar no Painel"
              )}
            </Button>
          </form>

          {/* Credenciais de Desenvolvimento */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-600 text-center">
              <strong>Desenvolvimento:</strong><br />
              Usuário: admin<br />
              Senha: admin123
            </p>
          </div>

          {/* Link para voltar ao site */}
          <div className="mt-6 text-center">
            <Link href="/">
              <button className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
                ← Voltar para o site
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}