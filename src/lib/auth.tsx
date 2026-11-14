import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "Administrador" | "Pastor" | "Secretaria" | "Líder";
  cargo: string;
  avatar: string;
}

export const ADMIN_CREDENTIALS = {
  email: "admin@eclesiapro.com",
  password: "admin123",
  user: {
    id: "admin_master_1",
    name: "Administrador Geral",
    email: "admin@eclesiapro.com",
    role: "Administrador" as const,
    cargo: "Administrador do Sistema",
    avatar: "AD",
  },
};

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "eclesiapro_auth_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega a sessão salva ao iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar sessão do usuário:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (emailInput: string, passwordInput: string, remember = true) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: "Informe o e-mail e a senha de acesso." };
    }

    if (cleanEmail === ADMIN_CREDENTIALS.email && cleanPassword === ADMIN_CREDENTIALS.password) {
      const loggedUser = ADMIN_CREDENTIALS.user;
      setUser(loggedUser);
      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
      }
      toast.success(`Bem-vindo, ${loggedUser.name}!`);
      return { success: true };
    }

    return {
      success: false,
      error: "Credenciais inválidas. Verifique o e-mail e a senha informados.",
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    toast.info("Sessão encerrada com sucesso.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return ctx;
}
