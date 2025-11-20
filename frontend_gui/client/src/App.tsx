// src/App.tsx
import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";

// Pages
import Home from "@/pages/Home";
import Menu from "@/pages/Menu";
import Cadastro from "@/pages/Cadastro";
import Pagamento from "@/pages/Pagamento";
import ConfirmacaoPedido from "@/pages/ConfirmacaoPedido";
import AcompanharPedido from "@/pages/AcompanharPedido";
import PainelPedidos from '@/pages/PainelPedidos';

// Admin Pages
import Admin from "@/pages/Admin";
import AdminPedidos from "@/pages/AdminPedidos";
import AdminLogin from "@/pages/AdminLogin";
import AdminProdutos from "./pages/AdminProdutos";
import AdminClientes from "@/pages/AdminClientes";
import AdminRelatorios from "@/pages/AdminRelatorios";


// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        {/* Rotas públicas */}
        <Route path="/" component={Home} />
        <Route path="/menu" component={Menu} />
        <Route path="/cadastro" component={Cadastro} />
        <Route path="/pagamento" component={Pagamento} />
        <Route path="/confirmacao-pedido/:numero" component={ConfirmacaoPedido} />
        <Route path="/acompanhar-pedido/:pedidoId" component={AcompanharPedido} />
        <Route path="/painel-pedidos" component={PainelPedidos} />

        
        {/* Rotas administrativas */}
        <Route path="/admin" component={Admin} />
        <Route path="/admin/pedidos" component={AdminPedidos} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/produtos" component={AdminProdutos} />
        <Route path="/admin/clientes" component={AdminClientes} />
        <Route path="/admin/relatorios" component={AdminRelatorios} />
        
        {/* 404 */}
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Página não encontrada</p>
              <a href="/" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
                Voltar para Home
              </a>
            </div>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

export default App;