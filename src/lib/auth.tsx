import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

export type UserRole = "Administrador" | "Pastor" | "Secretaria" | "Tesoureiro" | "Líder";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cargo: string;
  avatar: string;
}

export interface UserAccount {
  user: AuthUser;
  password: string;
}

// Perfis oficiais do sistema para ambiente de produção
export const PRODUCTION_ACCOUNTS: UserAccount[] = [
  {
    password: "admin123",
    user: {
      id: "usr_admin",
      name: "Administrador Geral",
      email: "admin@eclesiapro.com",
      role: "Administrador",
      cargo: "Administrador do Sistema",
      avatar: "AD",
    },
  },
  {
    password: "pastor123",
    user: {
      id: "usr_pastor",
      name: "Pr. João Batista",
      email: "pastor@eclesiapro.com",
      role: "Pastor",
      cargo: "Pastor Presidente",
      avatar: "PB",
    },
  },
  {
    password: "secretaria123",
    user: {
      id: "usr_secretaria",
      name: "Mariana Silva",
      email: "secretaria@eclesiapro.com",
      role: "Secretaria",
      cargo: "Secretária Executiva",
      avatar: "MS",
    },
  },
  {
    password: "financeiro123",
    user: {
      id: "usr_financeiro",
      name: "Carlos Eduardo",
      email: "financeiro@eclesiapro.com",
      role: "Tesoureiro",
      cargo: "Tesoureiro Geral",
      avatar: "CE",
    },
  },
  {
    password: "lider123",
    user: {
      id: "usr_lider",
      name: "Lucas Oliveira",
      email: "lider@eclesiapro.com",
      role: "Líder",
      cargo: "Líder de Célula",
      avatar: "LO",
    },
  },
];

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "eclesiapro_auth_session";
const USERS_STORAGE_KEY = "eclesiapro_users";

function getAccounts(): UserAccount[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar usuários cadastrados:", e);
  }
  // Se não existir, persiste os perfis oficiais iniciais
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(PRODUCTION_ACCOUNTS));
  } catch {
    // ignore
  }
  return PRODUCTION_ACCOUNTS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega a sessão salva ao inicializar a aplicação
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error("Erro ao restaurar sessão:", e);
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

    const accounts = getAccounts();
    const match = accounts.find(
      (acc) => acc.user.email.toLowerCase() === cleanEmail && acc.password === cleanPassword
    );

    if (match) {
      setUser(match.user);
      const userPayload = JSON.stringify(match.user);
      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, userPayload);
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, userPayload);
      }
      toast.success(`Bem-vindo, ${match.user.name}!`);
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

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;
    if (user.role === "Administrador") return true; // Administrador tem acesso total
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
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
