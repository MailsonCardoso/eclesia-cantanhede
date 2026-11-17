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
    name: "Pastor Elias Martins",
    email: "pastor@eclesiapro.com",
    cpf: "103.203.303-33",
    role: "Pastor",
    cargo: "Pastor Presidente",
    avatar: "EM",
    status: "Ativo",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "usr_lider",
    name: "Carlos Eduardo Lima",
    email: "lider@eclesiapro.com",
    cpf: "101.201.301-11",
    role: "Líder",
    cargo: "Líder de Célula",
    cellName: "Monte Sião",
    avatar: "CL",
    status: "Ativo",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "usr_financeiro",
    name: "Marcos Vinícius Rocha",
    email: "tesoureiro@eclesiapro.com",
    cpf: "105.205.305-55",
    role: "Tesoureiro",
    cargo: "Primeiro Tesoureiro",
    avatar: "MR",
    status: "Ativo",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "usr_secretaria",
    name: "Débora Ferreira",
    email: "secretaria@eclesiapro.com",
    cpf: "104.204.304-44",
    role: "Secretaria",
    cargo: "Secretária Executiva",
    avatar: "DF",
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
const USERS_STORAGE_KEY = "eclesiapro_users_master_v1";

function getStoredSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      if (parsedSession && (parsedSession.email || parsedSession.cpf)) {
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

  // Carrega lista de usuários e sincroniza sessão salva
  useEffect(() => {
    try {
      // Remove listas antigas de demonstração para garantir somente o Administrador
      localStorage.removeItem("eclesiapro_users");
      localStorage.removeItem("eclesiapro_users_list_v2");

      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante que todas as contas mestre padrão sempre estejam presentes para acesso em qualquer dispositivo
          const existingIds = new Set(parsed.map((p) => p.id));
          const merged = [
            ...parsed,
            ...INITIAL_ACCOUNTS.filter((acc) => !existingIds.has(acc.id)),
          ];
          setUsers(merged);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
        } else {
          setUsers(INITIAL_ACCOUNTS);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
        }
      } else {
        setUsers(INITIAL_ACCOUNTS);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      }

      // Re-valida sessão ativa persistida
      const currentSession = getStoredSession();
      if (currentSession) {
        setUser(currentSession);
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

  const login = async (
    identifier: string,
    passwordInput: string,
    remember = true
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    const cleanId = (identifier || "").trim();
    const cleanIdLower = cleanId.toLowerCase();
    const cleanIdDigits = cleanCPF(cleanId);
    const cleanPass = (passwordInput || "").trim();
    const cleanPassDigits = cleanCPF(cleanPass);

    if (!cleanId || !cleanPass) {
      return { success: false, error: "Informe seu e-mail (ou CPF) e a senha de acesso." };
    }

    // 1. Tenta autenticar na API Laravel oficial em https://api.eclesiapro.com.br/api
    try {
      const apiEmail =
        cleanIdLower === "admin" || cleanIdLower === "admin@admin.com"
          ? "admin@eclesiapro.com"
          : cleanIdLower === "pastor"
          ? "pastor@eclesiapro.com"
          : cleanIdLower === "lider" || cleanIdLower === "líder"
          ? "lider@eclesiapro.com"
          : cleanIdLower === "tesoureiro" || cleanIdLower === "financeiro"
          ? "tesoureiro@eclesiapro.com"
          : cleanIdLower === "secretaria"
          ? "secretaria@eclesiapro.com"
          : cleanId;

      const apiPassword =
        (cleanIdLower === "admin" || cleanIdLower === "admin@eclesiapro.com") && cleanPass === "admin"
          ? "admin123"
          : cleanPass;

      const res = await api.auth.login({ email: apiEmail, password: apiPassword });
      const token = res?.token || (res as any)?.access_token;
      if (res && token && res.user) {
        localStorage.setItem("ecclesia_token", token);
        sessionStorage.setItem("ecclesia_token", token);

        const emailRole = res.user.email?.includes("pastor")
          ? "Pastor"
          : res.user.email?.includes("lider")
          ? "Líder"
          : res.user.email?.includes("tesour")
          ? "Tesoureiro"
          : res.user.email?.includes("secretaria")
          ? "Secretaria"
          : "Administrador";

        const role = (res.user.role || emailRole) as UserRole;
        const authPayload: AuthUser = {
          id: String(res.user.id),
          memberId: res.user.member_id ? String(res.user.member_id) : undefined,
          name: res.user.name || "Administrador",
          email: res.user.email || apiEmail,
          cpf: res.user.cpf || "000.000.000-00",
          role,
          cargo: res.user.cargo || ROLE_DEFINITIONS[role]?.label || role,
          avatar: getInitials(res.user.name || "AD"),
          cellId: res.user.cell_id ? String(res.user.cell_id) : undefined,
          cellName: res.user.cell_name,
        };

        setUser(authPayload);
        const userPayloadStr = JSON.stringify(authPayload);
        localStorage.setItem(AUTH_STORAGE_KEY, userPayloadStr);
        sessionStorage.setItem(AUTH_STORAGE_KEY, userPayloadStr);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ecclesia:auth_synced"));
        }
        toast.success(`Bem-vindo, ${authPayload.name}!`);
        return { success: true, user: authPayload };
      }
    } catch (e: any) {
      console.warn("Autenticação via API remota falhou, verificando fallback:", e?.message);
    }

    // 2. Busca nas contas cadastradas locais como fallback (modo offline)
    const match = users.find((acc) => {
      if (acc.status === "Inativo") return false;

      const emailMatches =
        acc.email.toLowerCase() === cleanIdLower ||
        (cleanIdLower === "admin" && acc.role === "Administrador") ||
        (cleanIdLower === "admin@admin.com" && acc.role === "Administrador") ||
        (cleanIdLower === "pastor" && acc.role === "Pastor") ||
        ((cleanIdLower === "lider" || cleanIdLower === "líder" || cleanIdLower === "celula") && acc.role === "Líder") ||
        ((cleanIdLower === "tesoureiro" || cleanIdLower === "financeiro") && acc.role === "Tesoureiro") ||
        (cleanIdLower === "secretaria" && acc.role === "Secretaria");

      const cpfMatches = cleanIdDigits.length >= 10 && cleanCPF(acc.cpf) === cleanIdDigits;
      if (!emailMatches && !cpfMatches) return false;

      const passMatchesCpf = cleanPass === acc.cpf || (cleanPassDigits.length >= 10 && cleanCPF(acc.cpf) === cleanPassDigits);

      const passMatchesRole =
        (acc.role === "Administrador" && ["admin123", "admin", "123456"].includes(cleanPass)) ||
        (acc.role === "Pastor" && ["pastor123", "pastor", "123456"].includes(cleanPass)) ||
        (acc.role === "Líder" && ["lider123", "lider", "líder", "123456"].includes(cleanPass)) ||
        (acc.role === "Tesoureiro" && ["tesouro123", "tesoureiro", "financeiro", "123456"].includes(cleanPass)) ||
        (acc.role === "Secretaria" && ["secretaria123", "secretaria", "123456"].includes(cleanPass));

      return passMatchesCpf || passMatchesRole;
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
        cellId: match.cellId,
        cellName: match.cellName,
      };

      setUser(authPayload);
      const userPayloadStr = JSON.stringify(authPayload);
      localStorage.setItem(AUTH_STORAGE_KEY, userPayloadStr);
      sessionStorage.setItem(AUTH_STORAGE_KEY, userPayloadStr);
      toast.success(`Bem-vindo, ${match.name}!`);
      return { success: true, user: authPayload };
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
