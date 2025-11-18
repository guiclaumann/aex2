import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AcompanharPedido from "./pages/AcompanharPedido";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/admin/Login";
import AdminPedidos from "./pages/admin/Pedidos";
import AdminProdutos from "./pages/admin/Produtos";
import Cadastro from "./pages/Cadastro";
import Favoritos from "./pages/Favoritos";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Pagamento from "./pages/Pagamento";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/menu"} component={Menu} />
      <Route path={"/cadastro"} component={Cadastro} />
      <Route path={"/pagamento"} component={Pagamento} />
      <Route path={"/acompanhar/:pedidoId"} component={AcompanharPedido} />
      <Route path={"/favoritos"} component={Favoritos} />
      
      {/* 🔧 ROTAS DO ADMIN - MOVER PARA CIMA */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminRoute>
          <Route path="/" component={Admin} />
          <Route path="/produtos" component={AdminProdutos} />
          <Route path="/pedidos" component={AdminPedidos} />
        </AdminRoute>
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route - DEVE SER SEMPRE A ÚLTIMA */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;