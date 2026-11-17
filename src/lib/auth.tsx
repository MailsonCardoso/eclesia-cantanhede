import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "./api";

export type UserRole = "Administrador" | "Pastor" | "Secretaria" | "Tesoureiro" | "Líder";

export interface UserAccount {
  id: string;
  memberId?: string;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  cargo: string;
  avatar: string;
  cellId?: string;
  cellName?: string;
  status: "Ativo" | "Inativo";
  createdAt: string;
}

export interface AuthUser {
  id: string;
  memberId?: string;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  cargo: string;
  avatar: string;
  cellId?: string;
  cellName?: string;
}

export interface RolePermissionInfo {
  role: UserRole;
  label: string;
  description: string;
  badgeClass: string;
  modules: { name: string; path: string }[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissionInfo> = {
  Administrador: {
    role: "Administrador",
    label: "Administrador Geral",
    description: "Acesso irrestrito a todos os módulos, usuários, relatórios e configurações do sistema.",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    modules: [
      { name: "Painel Principal", path: "/" },
      { name: "Gabinete Pastoral", path: "/pastor" },
      { name: "Agenda Pastoral", path: "/agenda-pastoral" },
      { name: "Membros", path: "/membros" },
      { name: "Usuários & Acessos", path: "/usuarios" },
      { name: "Congregações", path: "/congregacoes" },
      { name: "Departamentos", path: "/departamentos" },
      { name: "Células", path: "/celulas" },
      { name: "Inventário de Bens", path: "/inventario" },
      { name: "Gestão Financeira", path: "/financeiro" },
      { name: "Dízimos e Ofertas", path: "/contribuicoes" },
      { name: "Análise Financeira", path: "/analise-financeira" },
      { name: "Relatórios de Membros", path: "/relatorio-membros" },
      { name: "Agenda de Eventos", path: "/agenda-eventos" },
      { name: "Área de Estudos", path: "/area-estudos" },
    ],
  },
  Pastor: {
    role: "Pastor",
    label: "Pastor Presidente / Pastoral",
    description: "Acesso ao gabinete pastoral, altar, séries, congregações, membros e acompanhamento geral.",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    modules: [
      { name: "Painel Principal", path: "/" },
      { name: "Gabinete Pastoral", path: "/pastor" },
      { name: "Agenda Pastoral", path: "/agenda-pastoral" },
      { name: "Membros", path: "/membros" },
      { name: "Congregações", path: "/congregacoes" },
      { name: "Departamentos", path: "/departamentos" },
      { name: "Células", path: "/celulas" },
      { name: "Dízimos e Ofertas", path: "/contribuicoes" },
      { name: "Relatórios de Membros", path: "/relatorio-membros" },
      { name: "Agenda de Eventos", path: "/agenda-eventos" },
      { name: "Área de Estudos", path: "/area-estudos" },
    ],
  },
  Secretaria: {
    role: "Secretaria",
    label: "Secretária Executiva",
    description: "Gestão completa de membros, congregações, departamentos, células, inventário e agenda.",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    modules: [
      { name: "Painel Principal", path: "/" },
      { name: "Membros", path: "/membros" },
      { name: "Congregações", path: "/congregacoes" },
      { name: "Departamentos", path: "/departamentos" },
      { name: "Células", path: "/celulas" },
      { name: "Inventário de Bens", path: "/inventario" },
      { name: "Relatórios de Membros", path: "/relatorio-membros" },
      { name: "Agenda de Eventos", path: "/agenda-eventos" },
    ],
  },
  Tesoureiro: {
    role: "Tesoureiro",
    label: "Tesouraria / Financeiro",
    description: "Controle de receitas, despesas, dízimos, ofertas, inventário de bens e análise financeira.",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    modules: [
      { name: "Análise Financeira (Tela Inicial)", path: "/analise-financeira" },
      { name: "Gestão Financeira", path: "/financeiro" },
      { name: "Dízimos e Ofertas", path: "/contribuicoes" },
      { name: "Inventário de Bens", path: "/inventario" },
    ],
  },
  Líder: {
    role: "Líder",
    label: "Líder de Célula",
    description: "Acesso exclusivo à Área de Estudos Bíblicos da sua célula para preparação, organização e acompanhamento dos estudos.",
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    modules: [
      { name: "Área de Estudos", path: "/area-estudos" },
    ],
  },
};

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: "2",
    name: "Administrador Geral",
    email: "admin@eclesiapro.com",
    cpf: "000.000.000-00",
    role: "Administrador",
    cargo: "Administrador do Sistema",
    avatar: "AD",
    status: "Ativo",
    createdAt: "2026-01-01T08:00:00Z",
  },
];

export function cleanCPF(cpf: string): string {
  return (cpf || "").replace(/\D/g, "");
}

export function formatCPF(digits: string): string {
  const d = cleanCPF(digits).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AuthContextType {
  user: AuthUser | null;
  users: UserAccount[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, passwordInput: string, remember?: boolean) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  addUser: (accountData: {
    memberId?: string;
    name: string;
    email: string;
    cpf: string;
    role: UserRole;
    cargo?: string;
    cellId?: string;
    cellName?: string;
    status?: "Ativo" | "Inativo";
  }) => { success: boolean; error?: string; user?: UserAccount };
  updateUser: (id: string, updates: Partial<UserAccount>) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
  toggleUserStatus: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "eclesiapro_auth_session";
const USERS_STORAGE_KEY = "eclesiapro_users_master_v3";

const FICTITIOUS_NAMES = [
  "carlos eduardo lima",
  "pastor elias martins",
  "elias martins",
  "marcos vinícius rocha",
  "marcos vinicius rocha",
  "débora ferreira",
  "debora ferreira",
];

const FICTITIOUS_EMAILS = [
  "pastor@eclesiapro.com",
  "lider@eclesiapro.com",
  "tesoureiro@eclesiapro.com",
  "secretaria@eclesiapro.com",
];

const FICTITIOUS_IDS = new Set(["usr_pastor", "usr_lider", "usr_financeiro", "usr_secretaria"]);

function getStoredSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      if (parsedSession && (parsedSession.email || parsedSession.cpf)) {
        // Se a sessão salva for de algum usuário fictício antigo, descarta
        const nameLower = (parsedSession.name || "").trim().toLowerCase();
        const emailLower = (parsedSession.email || "").trim().toLowerCase();
        if (FICTITIOUS_NAMES.includes(nameLower) || FICTITIOUS_EMAILS.includes(emailLower)) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
          return null;
        }
        return parsedSession;
      }
    }
  } catch (e) {
    console.error("Erro ao ler sessão salva:", e);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredSession);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_ACCOUNTS);
  const [isLoading, setIsLoading] = useState(() => (typeof window === "undefined" ? true : false));

  const syncUsersFromApi = () => {
    fetch("https://api.eclesiapro.com.br/api/users")
      .then((res) => res.json())
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const mapped: UserAccount[] = list.map((u: any) => ({
            id: String(u.id),
            name: u.name,
            email: u.email,
            cpf: u.cpf || "000.000.000-00",
            role: (u.role || (u.email === "admin@eclesiapro.com" ? "Administrador" : "Líder")) as UserRole,
            cargo: u.cargo || (u.role ? ROLE_DEFINITIONS[u.role as UserRole]?.label : "Membro"),
            avatar: getInitials(u.name),
            cellName: u.cell_name || undefined,
            status: "Ativo",
            createdAt: u.created_at || new Date().toISOString(),
          }));
          setUsers(mapped);
        }
      })
      .catch((err) => console.warn("Aviso ao buscar usuários do banco:", err?.message));
  };

  useEffect(() => {
    try {
      // Limpa dados legados de demonstração do localStorage
      localStorage.removeItem("eclesiapro_users");
      localStorage.removeItem("eclesiapro_users_list_v2");
      localStorage.removeItem("eclesiapro_users_master_v1");
      localStorage.removeItem("eclesiapro_users_master_v2");
      localStorage.removeItem(USERS_STORAGE_KEY);

      const currentSession = getStoredSession();
      if (currentSession) {
        setUser(currentSession);
      }
    } catch (e) {
      console.error("Erro ao inicializar autenticação:", e);
    } finally {
      setIsLoading(false);
    }

    syncUsersFromApi();
  }, []);

  const login = async (
    identifier: string,
    passwordInput: string,
    remember = true
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    const cleanId = (identifier || "").trim();
    const cleanIdLower = cleanId.toLowerCase();
    const cleanIdDigits = cleanCPF(cleanId);
    const cleanPass = (passwordInput || "").trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: "Informe seu e-mail (ou CPF) e a senha de acesso." };
    }

    let apiEmail = cleanId;
    if (cleanIdLower === "admin" || cleanIdLower === "admin@admin.com") {
      apiEmail = "admin@eclesiapro.com";
    } else {
      const userByCpf = users.find((u) => cleanCPF(u.cpf) === cleanIdDigits);
      if (userByCpf) {
        apiEmail = userByCpf.email;
      }
    }

    let apiPassword = cleanPass;

    try {
      const res = await api.auth.login({ email: apiEmail, password: apiPassword });
      const token = res?.token || (res as any)?.access_token;
      if (res && token && res.user) {
        localStorage.setItem("ecclesia_token", token);
        sessionStorage.setItem("ecclesia_token", token);

        const authRole = (res.user.role || (res.user.email === "admin@eclesiapro.com" ? "Administrador" : "Líder")) as UserRole;
        const authPayload: AuthUser = {
          id: String(res.user.id),
          name: res.user.name || "Administrador",
          email: res.user.email || apiEmail,
          cpf: res.user.cpf || "000.000.000-00",
          role: authRole,
          cargo: res.user.cargo || (authRole ? ROLE_DEFINITIONS[authRole]?.label : "Membro"),
          avatar: getInitials(res.user.name || "AD"),
          cellName: res.user.cell_name || undefined,
        };

        setUser(authPayload);
        const userPayloadStr = JSON.stringify(authPayload);
        localStorage.setItem(AUTH_STORAGE_KEY, userPayloadStr);
        sessionStorage.setItem(AUTH_STORAGE_KEY, userPayloadStr);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ecclesia:auth_synced"));
        }
        syncUsersFromApi();
        toast.success(`Bem-vindo, ${authPayload.name}!`);
        return { success: true, user: authPayload };
      }
    } catch (e: any) {
      console.warn("Autenticação via API:", e?.message);
      return {
        success: false,
        error: e?.message || "Credenciais inválidas. Verifique seu e-mail/CPF e sua senha de acesso.",
      };
    }

    return {
      success: false,
      error: "Credenciais inválidas. Verifique seu e-mail/CPF e sua senha de acesso.",
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("ecclesia_token");
    localStorage.removeItem("eclesiapro_token");
    sessionStorage.removeItem("ecclesia_token");
    toast.info("Sessão encerrada com sucesso.");
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;
    if (user.role === "Administrador") return true;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const addUser = (data: {
    memberId?: string;
    name: string;
    email: string;
    cpf: string;
    role: UserRole;
    cargo?: string;
    cellId?: string;
    cellName?: string;
    status?: "Ativo" | "Inativo";
  }) => {
    const cleanEmail = (data.email || "").trim().toLowerCase();
    const cleanDigits = cleanCPF(data.cpf);

    if (!cleanEmail) {
      return { success: false, error: "Informe o e-mail de acesso do usuário." };
    }
    if (!cleanDigits || cleanDigits.length < 11) {
      return { success: false, error: "Informe um CPF válido com 11 dígitos para o acesso." };
    }

    // Verifica se já existe e-mail ou CPF cadastrado
    const emailExists = users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return { success: false, error: "Já existe um usuário com este e-mail cadastrado." };
    }

    const cpfExists = users.some((u) => cleanCPF(u.cpf) === cleanDigits);
    if (cpfExists) {
      return { success: false, error: "Já existe um usuário com este CPF cadastrado." };
    }

    const newAccount: UserAccount = {
      id: "usr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      memberId: data.memberId,
      name: data.name.trim(),
      email: cleanEmail,
      cpf: formatCPF(cleanDigits),
      role: data.role,
      cargo: data.cargo?.trim() || ROLE_DEFINITIONS[data.role]?.label || data.role,
      avatar: getInitials(data.name),
      cellId: data.cellId,
      cellName: data.cellName,
      status: data.status || "Ativo",
      createdAt: new Date().toISOString(),
    };

    const updated = [newAccount, ...users];
    setUsers(updated);

    // Registra na API remota para persistir no banco de dados MySQL
    api.auth
      .register({
        name: data.name.trim(),
        email: cleanEmail,
        password: cleanDigits || "123456",
        role: data.role,
        cargo: data.cargo?.trim() || ROLE_DEFINITIONS[data.role]?.label || data.role,
        cpf: formatCPF(cleanDigits),
        cell_name: data.cellName,
      })
      .then((res: any) => {
        if (res?.user?.id) {
          const remoteId = String(res.user.id);
          setUsers((prev) => prev.map((u) => (u.id === newAccount.id ? { ...u, id: remoteId } : u)));
        }
      })
      .catch((err) => {
        console.warn("Aviso ao registrar usuário na API remota:", err?.message);
      });

    toast.success(`Usuário ${newAccount.name} criado com sucesso!`);
    return { success: true, user: newAccount };
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, error: "Usuário não encontrado." };
    }

    const current = users[index];

    // Se estiver atualizando e-mail, verificar duplicidade
    if (updates.email && updates.email.toLowerCase() !== current.email.toLowerCase()) {
      const emailExists = users.some((u) => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase());
      if (emailExists) {
        return { success: false, error: "Já existe outro usuário com este e-mail cadastrado." };
      }
    }

    // Se estiver atualizando CPF, verificar duplicidade
    if (updates.cpf && cleanCPF(updates.cpf) !== cleanCPF(current.cpf)) {
      const cleanDigits = cleanCPF(updates.cpf);
      const cpfExists = users.some((u) => u.id !== id && cleanCPF(u.cpf) === cleanDigits);
      if (cpfExists) {
        return { success: false, error: "Já existe outro usuário com este CPF cadastrado." };
      }
    }

    const updatedAccount: UserAccount = {
      ...current,
      ...updates,
      name: updates.name ? updates.name.trim() : current.name,
      email: updates.email ? updates.email.trim().toLowerCase() : current.email,
      cpf: updates.cpf ? formatCPF(updates.cpf) : current.cpf,
      avatar: updates.name ? getInitials(updates.name) : current.avatar,
    };

    const updatedList = [...users];
    updatedList[index] = updatedAccount;
    setUsers(updatedList);

    // Persiste atualização no banco de dados MySQL via API REST
    const token = localStorage.getItem("ecclesia_token") || sessionStorage.getItem("ecclesia_token");
    if (token) {
      const cleanId = id.replace(/^usr_/, "");
      fetch(`https://api.eclesiapro.com.br/api/users/${cleanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedAccount.name,
          email: updatedAccount.email,
          role: updatedAccount.role,
          cargo: updatedAccount.cargo,
          cpf: updatedAccount.cpf,
          cell_name: updatedAccount.cellName,
        }),
      }).catch((err) => console.warn("Aviso ao sincronizar usuário na API:", err?.message));
    }

    // Se o usuário atualizou os próprios dados, sincroniza a sessão ativa
    if (user && user.id === id) {
      const refreshedAuth: AuthUser = {
        ...user,
        name: updatedAccount.name,
        email: updatedAccount.email,
        cpf: updatedAccount.cpf,
        role: updatedAccount.role,
        cargo: updatedAccount.cargo,
        avatar: updatedAccount.avatar,
      };
      setUser(refreshedAuth);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshedAuth));
    }

    toast.success("Usuário atualizado com sucesso!");
    return { success: true };
  };

  const deleteUser = (id: string) => {
    // Não permitir deletar o próprio usuário logado
    if (user && user.id === id) {
      return { success: false, error: "Não é permitido excluir o usuário conectado no momento." };
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));

    const token = localStorage.getItem("ecclesia_token") || sessionStorage.getItem("ecclesia_token");
    if (token) {
      const cleanId = id.replace(/^usr_/, "");
      fetch(`https://api.eclesiapro.com.br/api/users/${cleanId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch((err) => console.warn("Aviso ao excluir usuário na API:", err?.message));
    }

    toast.success("Usuário removido com sucesso.");
    return { success: true };
  };

  const toggleUserStatus = (id: string) => {
    if (user && user.id === id) {
      toast.error("Não é possível desativar sua própria conta conectada.");
      return;
    }

    const updated = users.map((u) => {
      if (u.id === id) {
        const nextStatus: "Ativo" | "Inativo" = u.status === "Ativo" ? "Inativo" : "Ativo";
        toast.info(`Usuário ${u.name} agora está ${nextStatus}.`);
        return { ...u, status: nextStatus };
      }
      return u;
    });

    setUsers(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
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
