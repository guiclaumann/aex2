// hooks/useAuth.ts
import { useEffect, useState } from 'react';

interface ClienteData {
  id: number;
  nome: string;
  telefone: string;
  timestamp: number;
}

export const useAuth = () => {
  const [cliente, setCliente] = useState<ClienteData | null>(null);

  useEffect(() => {
    const verificarLogin = () => {
      const clienteData = localStorage.getItem("clienteData");
      if (clienteData) {
        const data: ClienteData = JSON.parse(clienteData);
        // Opcional: verificar se a sessão expirou (ex: 30 dias)
        const trintaDias = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp < trintaDias) {
          setCliente(data);
        } else {
          logout();
        }
      }
    };

    verificarLogin();
  }, []);

  const logout = () => {
    localStorage.removeItem("clienteData");
    localStorage.removeItem("clienteId");
    localStorage.removeItem("clienteNome");
    localStorage.removeItem("clienteTelefone");
    setCliente(null);
  };

  return { cliente, logout };
};