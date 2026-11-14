import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

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
    description: "Controle de receitas, despesas, dízimos, ofertas, relatórios e patrimônio/inventário.",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    modules: [
      { name: "Painel Principal", path: "/" },
      { name: "Gestão Financeira", path: "/financeiro" },
      { name: "Dízimos e Ofertas", path: "/contribuicoes" },
      { name: "Análise Financeira", path: "/analise-financeira" },
      { name: "Inventário de Bens", path: "/inventario" },
      { name: "Relatórios de Membros", path: "/relatorio-membros" },
    ],
  },
  Líder: {
    role: "Líder",
    label: "Líder de Célula / Discipulado",
    description: "Gestão da célula, integração de membros e acompanhamento da agenda de eventos.",
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    modules: [
      { name: "Painel Principal", path: "/" },
      { name: "Células", path: "/celulas" },
      { name: "Membros", path: "/membros" },
      { name: "Agenda de Eventos", path: "/agenda-eventos" },
    ],
  },
};

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: "usr_admin",
    name: "Administrador Geral",
    email: "admin@eclesiapro.com",
    cpf: "000.000.000-00",
    role: "Administrador",
    cargo: "Administrador do Sistema",
    avatar: "AD",
    status: "Ativo",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "usr_pastor",
    name: "Pr. João Batista",
    email: "pastor@eclesiapro.com",
    cpf: "103.203.303-33",
    role: "Pastor",
    cargo: "Pastor Presidente",
    avatar: "PB",
    status: "Ativo",
    createdAt: "2026-01-05T09:00:00Z",
  },
  {
    id: "usr_secretaria",
    memberId: "m_ana",
    name: "Ana Beatriz Souza",
    email: "secretaria@eclesiapro.com",
    cpf: "102.202.302-22",
    role: "Secretaria",
    cargo: "Secretária Executiva",
    avatar: "AS",
    status: "Ativo",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "usr_financeiro",
    memberId: "m_carlos",
    name: "Carlos Eduardo Lima",
    email: "financeiro@eclesiapro.com",
    cpf: "101.201.301-11",
    role: "Tesoureiro",
    cargo: "Tesoureiro Geral",
    avatar: "CL",
    status: "Ativo",
    createdAt: "2026-01-12T14:30:00Z",
  },
  {
    id: "usr_lider",
    memberId: "m_lucas",
    name: "Lucas Barbosa",
    email: "lider@eclesiapro.com",
    cpf: "107.207.307-77",
    role: "Líder",
    cargo: "Líder de Célula",
    avatar: "LB",
    status: "Ativo",
    createdAt: "2026-01-15T16:00:00Z",
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
  login: (identifier: string, passwordInput: string, remember?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  addUser: (accountData: {
    memberId?: string;
    name: string;
    email: string;
    cpf: string;
    role: UserRole;
    cargo?: string;
    status?: "Ativo" | "Inativo";
  }) => { success: boolean; error?: string; user?: UserAccount };
  updateUser: (id: string, updates: Partial<UserAccount>) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
  toggleUserStatus: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "eclesiapro_auth_session";
const USERS_STORAGE_KEY = "eclesiapro_users_list_v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega lista de usuários e sessão salva
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante que todas as contas oficiais padrão continuem presentes e acessíveis
          const existingIds = new Set(parsed.map((p) => p.id));
          const missingDefaults = INITIAL_ACCOUNTS.filter((init) => !existingIds.has(init.id));
          const merged = [...parsed, ...missingDefaults];
          setUsers(merged);
        } else {
          setUsers(INITIAL_ACCOUNTS);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
        }
      } else {
        setUsers(INITIAL_ACCOUNTS);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      }

      // Restaura sessão ativa
      const storedSession = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession && (parsedSession.email || parsedSession.cpf)) {
          setUser(parsedSession);
        }
      }
    } catch (e) {
      console.error("Erro ao inicializar autenticação:", e);
      setUsers(INITIAL_ACCOUNTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistUsers = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
    } catch (e) {
      console.error("Erro ao salvar lista de usuários:", e);
    }
  };

  const login = (identifier: string, passwordInput: string, remember = true) => {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanIdDigits = cleanCPF(cleanId);
    const cleanPass = (passwordInput || "").trim();
    const cleanPassDigits = cleanCPF(cleanPass);

    if (!cleanId || !cleanPass) {
      return { success: false, error: "Informe seu e-mail (ou CPF) e a senha de acesso." };
    }

    // Busca nas contas cadastradas
    const match = users.find((acc) => {
      // Verifica se a conta está ativa
      if (acc.status === "Inativo") return false;

      // Correspondência do identificador (E-mail, alias institucional ou CPF)
      const emailMatches =
        acc.email.toLowerCase() === cleanId ||
        (acc.role === "Secretaria" && (cleanId === "secretaria@eclesiapro.com" || cleanId === "ana.souza@email.com")) ||
        (acc.role === "Tesoureiro" && (cleanId === "financeiro@eclesiapro.com" || cleanId === "carlos.lima@email.com")) ||
        (acc.role === "Pastor" && cleanId === "pastor@eclesiapro.com") ||
        (acc.role === "Líder" && (cleanId === "lider@eclesiapro.com" || cleanId === "lucas.barbosa@email.com")) ||
        (acc.role === "Administrador" && cleanId === "admin@eclesiapro.com");

      const cpfMatches = cleanIdDigits.length >= 10 && cleanCPF(acc.cpf) === cleanIdDigits;
      if (!emailMatches && !cpfMatches) return false;

      // Correspondência da senha:
      // 1. CPF do membro (com ou sem pontuação)
      // 2. Senhas padrão institucionais (admin123, pastor123, secretaria123, financeiro123, lider123)
      const passMatchesCpf = cleanPass === acc.cpf || (cleanPassDigits.length >= 10 && cleanCPF(acc.cpf) === cleanPassDigits);
      const passMatchesRoleDefault =
        (acc.role === "Administrador" && cleanPass === "admin123") ||
        (acc.role === "Pastor" && cleanPass === "pastor123") ||
        (acc.role === "Secretaria" && cleanPass === "secretaria123") ||
        (acc.role === "Tesoureiro" && cleanPass === "financeiro123") ||
        (acc.role === "Líder" && cleanPass === "lider123");

      return passMatchesCpf || passMatchesRoleDefault;
    });

    if (match) {
      const authPayload: AuthUser = {
        id: match.id,
        memberId: match.memberId,
        name: match.name,
        email: match.email,
        cpf: match.cpf,
        role: match.role,
        cargo: match.cargo || ROLE_DEFINITIONS[match.role]?.label || match.role,
        avatar: match.avatar || getInitials(match.name),
      };

      setUser(authPayload);
      const userPayloadStr = JSON.stringify(authPayload);
      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, userPayloadStr);
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, userPayloadStr);
      }
      toast.success(`Bem-vindo, ${match.name}!`);
      return { success: true };
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
      status: data.status || "Ativo",
      createdAt: new Date().toISOString(),
    };

    const updated = [newAccount, ...users];
    persistUsers(updated);
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
    persistUsers(updatedList);

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

    const updated = users.filter((u) => u.id !== id);
    persistUsers(updated);
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

    persistUsers(updated);
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
