import type { Collection, Row } from "./store";

export const API_BASE =
  import.meta.env["VITE_API_URL"] || "https://api.eclesiapro.com.br/api";

const COLLECTION_ENDPOINTS: Partial<Record<Collection, string>> = {
  members: "/members",
  congregations: "/congregations",
  departments: "/departments",
  transactions: "/transactions",
  contributions: "/contributions",
  events: "/events",
  appointments: "/appointments",
  inventory: "/inventory",
  pastor_series: "/pastoral/series",
  pastor_sermons: "/pastoral/sermons",
  pastor_insights: "/pastoral/insights",
  pastoral_requests: "/pastoral/requests",
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    localStorage.getItem("ecclesia_token") ||
    localStorage.getItem("eclesiapro_token") ||
    sessionStorage.getItem("ecclesia_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        (errorData.errors ? Object.values(errorData.errors).flat().join(" ") : "") ||
        `Erro na requisição HTTP: ${response.status}`
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text || !text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {} as T;
  }
}

export const api = {
  // Autenticação
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ user: any; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (data: { name: string; email: string; password: string }) =>
      request<{ user: any; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () => request<any>("/auth/me"),
    logout: () =>
      request<{ message: string }>("/auth/logout", {
        method: "POST",
      }),
  },

  // Recursos Genéricos (CRUD)
  collection: {
    list: (collection: Collection, params?: Record<string, string>) => {
      const endpoint = COLLECTION_ENDPOINTS[collection] || `/${collection}`;
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<Row[]>(`${endpoint}${qs}`);
    },
    get: (collection: Collection, id: string | number) => {
      const endpoint = COLLECTION_ENDPOINTS[collection] || `/${collection}`;
      return request<Row>(`${endpoint}/${id}`);
    },
    create: (collection: Collection, data: Omit<Row, "id">) => {
      const endpoint = COLLECTION_ENDPOINTS[collection] || `/${collection}`;
      return request<Row>(`${endpoint}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: (collection: Collection, id: string | number, data: Partial<Row>) => {
      const endpoint = COLLECTION_ENDPOINTS[collection] || `/${collection}`;
      return request<Row>(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    delete: (collection: Collection, id: string | number) => {
      const endpoint = COLLECTION_ENDPOINTS[collection] || `/${collection}`;
      return request<{ message: string }>(`${endpoint}/${id}`, {
        method: "DELETE",
      });
    },
  },

  // Painel & Relatórios
  dashboard: () => request<any>("/dashboard"),
  reports: {
    membersByAge: () => request<{ chart: any[]; list: any[] }>("/reports/members-by-age"),
  },
  auditLogs: () => request<any[]>("/audit-logs"),
  dbState: () => request<any>("/db-state"),
};

