// src/pages/ConfirmacaoPedido.tsx
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Clock, Home } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function ConfirmacaoPedido() {
  const [match, params] = useRoute("/confirmacao-pedido/:numero");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pedido Confirmado!
        </h1>
        <p className="text-gray-600 mb-4">
          Seu pedido <strong>{params?.numero}</strong> foi recebido com sucesso.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="text-orange-800 font-medium">
            Tempo estimado: 30-40 min
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Acompanhe o status do seu pedido pelo WhatsApp ou aguarde nosso contato.
        </p>
        <Link href="/">
          <Button className="w-full bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
            <Home className="h-4 w-4" />
            Voltar para o Início
          </Button>
        </Link>
      </div>
    </div>
  );
}