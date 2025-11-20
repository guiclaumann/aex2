// src/components/Header.tsx
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Heart, ShoppingCart } from "lucide-react";
import { APP_TITLE } from "@/const";
import { useAuth } from '@/hooks/useAuth';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useLocation } from 'wouter';

interface HeaderProps {
  onAtualizarMenu?: () => void;
  refreshing?: boolean;
  showCarrinho?: boolean;
  carrinhoCount?: number;
}

export default function Header({ 
  onAtualizarMenu, 
  refreshing = false,
  showCarrinho = true,
  carrinhoCount = 0
}: HeaderProps) {
  const { cliente, logout } = useAuth();
  const { favoritos } = useFavoritos();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo/Título com link para Home */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold text-orange-600">{APP_TITLE}</h1>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {/* Botão para atualizar o menu (opcional) */}
          {onAtualizarMenu && (
            <Button 
              onClick={onAtualizarMenu}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar Menu
            </Button>
          )}

          {/* Nome do cliente e Botão Sair */}
          {cliente ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 font-medium">
                Olá, {cliente.nome}!
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => navigate("/cadastro")}
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              Fazer Login
            </Button>
          )}

          {/* Ícones de Favoritos e Carrinho */}
          {showCarrinho && (
            <Link href="/pagamento">
              <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
                {carrinhoCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {carrinhoCount}
                  </span>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}