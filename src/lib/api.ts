import type { Collection, Row } from "./store";

const API_BASE = import.meta.env["VITE_API_URL"] || "http://localhost:8000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("ecclesia_token");
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
    throw new Error(errorData.message || `Erro na requisição HTTP: ${response.status}`);
  }

  return response.json();
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
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<Row[]>(`/${collection}${qs}`);
    },
    get: (collection: Collection, id: string | number) =>
      request<Row>(`/${collection}/${id}`),
    create: (collection: Collection, data: Omit<Row, "id">) =>
      request<Row>(`/${collection}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (collection: Collection, id: string | number, data: Partial<Row>) =>
      request<Row>(`/${collection}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (collection: Collection, id: string | number) =>
      request<{ message: string }>(`/${collection}/${id}`, {
        method: "DELETE",
      }),
  },

  // Painel & Relatórios
  dashboard: () => request<any>("/dashboard"),
  reports: {
    membersByAge: () => request<{ chart: any[]; list: any[] }>("/reports/members-by-age"),
  },
  auditLogs: () => request<any[]>("/audit-logs"),
  dbState: () => request<any>("/db-state"),
};

