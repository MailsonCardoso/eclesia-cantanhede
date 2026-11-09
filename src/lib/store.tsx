import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Camada de dados local (demonstração). Cada coleção espelha um recurso REST
 * que será servido pela API Laravel (ex.: GET/POST/PUT/DELETE /api/members).
 * Para integrar, substitua as operações abaixo por chamadas em src/lib/api.ts.
 */

type V = string | number | undefined;
export type Row = {
  id: string; nome?: V; titulo?: V; descricao?: V; membro?: V; categoria?: V; congregacao?: V; data?: V; local?: V;
  nascimento?: V; pagamento?: V; recebimento?: V; situacao?: V; tipo?: V; valor?: V; [k: string]: V;
};
export type Collection = "members" | "congregations" | "departments" | "cells" | "transactions" | "contributions" | "events" | "appointments" | "inventory";
export type AuditEntry = { id: string; at: string; collection: Collection; action: "criação" | "edição" | "exclusão"; label: string };

type DB = Record<Collection, Row[]> & { audit: AuditEntry[] };

const uid = () => Math.random().toString(36).slice(2, 10);
const d = (offsetDays: number) => {
  const x = new Date();
  x.setDate(x.getDate() + offsetDays);
  return x.toISOString().slice(0, 10);
};
const monthDay = (m: number, day: number) => {
  const x = new Date();
  return `198${m % 10}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};
const ageYears = (years: number) => {
  const x = new Date();
  x.setFullYear(x.getFullYear() - years);
  return x.toISOString().slice(0, 10);
};

const congs = ["Sede Central", "Congregação Vila Nova", "Congregação Jardim Esperança"];
const names = [
  "Ana Beatriz Souza", "Carlos Eduardo Lima", "Débora Ferreira", "Elias Martins", "Fernanda Rocha",
  "Gabriel Almeida", "Helena Costa", "Isaque Pereira", "Júlia Ribeiro", "Lucas Barbosa",
  "Marta Oliveira", "Natanael Gomes", "Priscila Santos", "Rafael Carvalho", "Sara Mendes",
  "Tiago Nunes", "Raquel Dias", "Samuel Teixeira",
];

export function seed(): DB {
  const members: Row[] = names.map((n, i) => ({
    id: uid(),
    nome: n,
    cpf: `${100 + i}.${200 + i}.${300 + i}-${10 + i}`,
    nascimento: i % 4 === 0 ? monthDay(i, 3 + i) : `19${70 + i}-0${(i % 9) + 1}-1${i % 9}`,
    sexo: i % 2 ? "Masculino" : "Feminino",
    estadoCivil: ["Casado(a)", "Solteiro(a)", "Viúvo(a)"][i % 3],
    telefone: `(11) 9${8000 + i * 37}-${1000 + i * 13}`,
    email: (n.split(" ")[0] ?? "").toLowerCase() + "@email.com",
    endereco: `Rua das Oliveiras, ${100 + i * 7}`,
    batismo: `20${10 + (i % 14)}-04-12`,
    recebimento: d(-i * 40),
    situacao: i % 7 === 6 ? "Inativo" : i % 9 === 8 ? "Transferido" : "Ativo",
    tipo: i % 5 === 4 ? "Congregado" : "Membro",
    congregacao: congs[i % 3],
    departamento: ["Louvor", "Jovens", "Mulheres", "Homens", "Intercessão"][i % 5],
    cargo: ["Membro", "Diácono", "Presbítero", "Obreiro"][i % 4],
    conjuge: i % 3 === 0 ? names[(i + 1) % names.length] : "",
    pai: i % 2 === 0 ? names[(i + 5) % names.length] : "",
    mae: i % 2 === 0 ? names[(i + 6) % names.length] : "",
    filhos: i % 4 === 1 ? names[(i + 9) % names.length] : "",
    observacoes: "",
  }));
  const congregations: Row[] = congs.map((c, i) => ({
    id: uid(), nome: c, cnpj: i === 0 ? "12.345.678/0001-90" : "", endereco: `Av. Principal, ${500 + i * 120}`,
    telefone: `(11) 3${300 + i}-4${100 + i}`, pastor: ["Pr. João Silva", "Pr. Marcos Reis", "Pr. André Luz"][i],
    fundacao: `19${88 + i * 5}-03-15`, situacao: "Ativa",
  }));
  const deps = ["Louvor", "Jovens", "Crianças", "Adolescentes", "Mulheres", "Homens", "Intercessão", "Evangelismo", "Ação Social", "Escola Bíblica Dominical"];
  const departments: Row[] = deps.map((n, i) => ({
    id: uid(), nome: n, lider: names[i], integrantes: 6 + ((i * 7) % 20), descricao: `Ministério de ${n}`, situacao: "Ativo",
  }));
  const transactions: Row[] = [];
  for (let m = 0; m < 6; m++) {
    [["Receita", "Dízimos", 9800], ["Receita", "Ofertas", 3200], ["Receita", "Campanhas", 1500], ["Despesa", "Energia", 890], ["Despesa", "Aluguel", 3500], ["Despesa", "Ação social", 1200], ["Despesa", "Manutenção", 700]].forEach(([tipo, cat, v], j) => {
      transactions.push({
        id: uid(), tipo: tipo as string, categoria: cat as string, descricao: `${cat} do mês`,
        valor: Math.round((v as number) * (0.85 + ((m * 3 + j) % 7) / 20)), data: d(-m * 30 - j),
        pagamento: ["PIX", "Dinheiro", "Transferência"][j % 3], conta: "Conta principal", congregacao: congs[j % 3],
      });
    });
  }
  const contributions: Row[] = Array.from({ length: 14 }, (_, i) => ({
    id: uid(), membro: i % 5 === 0 ? "Anônimo" : names[i], tipo: i % 3 ? "Dízimo" : "Oferta",
    valor: 50 + ((i * 73) % 600), data: d(-i * 2), pagamento: ["PIX", "Dinheiro", "Cartão"][i % 3], congregacao: congs[i % 3],
  }));
  const events: Row[] = [
    { id: uid(), titulo: "Culto de Celebração", data: d(3), hora: "19:00", tipo: "Culto", local: "Sede Central", responsavel: "Pr. João Silva" },
    { id: uid(), titulo: "Conferência de Jovens", data: d(10), hora: "15:00", tipo: "Conferência", local: "Sede Central", responsavel: "Gabriel Almeida" },
    { id: uid(), titulo: "Ação Social no Bairro", data: d(17), hora: "09:00", tipo: "Social", local: "Vila Nova", responsavel: "Marta Oliveira" },
    { id: uid(), titulo: "Santa Ceia", data: d(24), hora: "19:30", tipo: "Culto", local: "Todas as congregações", responsavel: "Pr. João Silva" },
    { id: uid(), titulo: "Ensaio do Louvor", data: d(1), hora: "20:00", tipo: "Ensaio", local: "Sede Central", responsavel: "Lucas Barbosa" },
    { id: uid(), titulo: "Escola Bíblica Dominical", data: d(5), hora: "09:00", tipo: "EBD", local: "Todas as congregações", responsavel: "Débora Ferreira" },
    { id: uid(), titulo: "Vigília de Oração", data: d(12), hora: "22:00", tipo: "Vigília", local: "Sede Central", responsavel: "Pr. Marcos Reis" },
    { id: uid(), titulo: "Evangelismo na Praça", data: d(19), hora: "16:00", tipo: "Evangelismo", local: "Praça Central", responsavel: "Tiago Nunes" },
    { id: uid(), titulo: "Reunião de Obreiros", data: d(8), hora: "19:00", tipo: "Reunião", local: "Sede Central", responsavel: "Pr. André Luz" },
  ];
  const appointments: Row[] = [
    { id: uid(), membro: names[2], data: d(1), hora: "14:00", tipo: "Aconselhamento", motivo: "Aconselhamento familiar", status: "Agendado" },
    { id: uid(), membro: names[6], data: d(2), hora: "10:00", tipo: "Visita", motivo: "Visita pós-operatória", status: "Agendado" },
    { id: uid(), membro: names[9], data: d(4), hora: "16:30", tipo: "Aconselhamento", motivo: "Orientação vocacional", status: "Agendado" },
    { id: uid(), membro: names[12], data: d(-1), hora: "19:00", tipo: "Visita", motivo: "Visita a novo convertido", status: "Realizado" },
    { id: uid(), membro: names[15], data: d(6), hora: "09:30", tipo: "Aconselhamento", motivo: "Aconselhamento pré-casamento", status: "Agendado" },
    { id: uid(), membro: names[4], data: d(-3), hora: "15:00", tipo: "Visita", motivo: "Visita de aniversário", status: "Cancelado" },
  ];
  const inventory: Row[] = [
    { id: uid(), nome: "Cadeiras plásticas", categoria: "Mobiliário", quantidade: 220, estado: "Bom", local: "Sede Central", aquisicao: "2021-05-10", valor: 85 },
    { id: uid(), nome: "Mesa de som 16 canais", categoria: "Áudio", quantidade: 1, estado: "Bom", local: "Sede Central", aquisicao: "2019-11-02", valor: 4200 },
    { id: uid(), nome: "Microfones sem fio", categoria: "Áudio", quantidade: 6, estado: "Regular", local: "Sede Central", aquisicao: "2022-03-18", valor: 950 },
    { id: uid(), nome: "Projetor multimídia", categoria: "Audiovisual", quantidade: 2, estado: "Bom", local: "Sede Central", aquisicao: "2023-01-25", valor: 2800 },
    { id: uid(), nome: "Instrumentos musicais (bateria)", categoria: "Instrumentos", quantidade: 1, estado: "Bom", local: "Sede Central", aquisicao: "2020-08-14", valor: 5600 },
    { id: uid(), nome: "Bíblias para EBD", categoria: "Material didático", quantidade: 45, estado: "Regular", local: "Congregação Vila Nova", aquisicao: "2022-07-30", valor: 60 },
    { id: uid(), nome: "Ar-condicionado 24.000 BTU", categoria: "Climatização", quantidade: 4, estado: "Bom", local: "Sede Central", aquisicao: "2021-12-05", valor: 3900 },
    { id: uid(), nome: "Computador da secretaria", categoria: "Informática", quantidade: 2, estado: "Regular", local: "Sede Central", aquisicao: "2020-02-20", valor: 3200 },
    { id: uid(), nome: "Cadeiras de madeira", categoria: "Mobiliário", quantidade: 60, estado: "Regular", local: "Congregação Jardim Esperança", aquisicao: "2018-06-11", valor: 120 },
    { id: uid(), nome: "Caixas de som ativas", categoria: "Áudio", quantidade: 4, estado: "Bom", local: "Congregação Vila Nova", aquisicao: "2023-09-08", valor: 1800 },
  ];
  return { members, congregations, departments, transactions, contributions, events, appointments, inventory, audit: [] };
}

const KEY = "ecclesia-db-v2";

type Ctx = {
  db: DB;
  create: (c: Collection, row: Omit<Row, "id">) => void;
  update: (c: Collection, row: Row) => void;
  remove: (c: Collection, id: string) => void;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) try { setDb(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(db)); }, [db, ready]);

  const log = (c: Collection, action: AuditEntry["action"], row: Row): AuditEntry => ({
    id: uid(), at: new Date().toISOString(), collection: c, action,
    label: String(row.nome ?? row.titulo ?? row.descricao ?? row.membro ?? row.id),
  });

  const value: Ctx = {
    db,
    create: (c, row) => setDb((s) => { const r = { ...row, id: uid() } as Row; return { ...s, [c]: [r, ...s[c]], audit: [log(c, "criação", r), ...s.audit] }; }),
    update: (c, row) => setDb((s) => ({ ...s, [c]: s[c].map((r) => (r.id === row.id ? row : r)), audit: [log(c, "edição", row), ...s.audit] })),
    remove: (c, id) => setDb((s) => { const r = s[c].find((x) => x.id === id)!; return { ...s, [c]: s[c].filter((x) => x.id !== id), audit: [log(c, "exclusão", r), ...s.audit] }; }),
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider ausente");
  return c;
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (s?: string | number) => (s ? new Date(String(s) + "T12:00:00").toLocaleDateString("pt-BR") : "—");

export function exportCSV(filename: string, rows: Row[], cols: { key: string; label: string }[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "﻿" + [cols.map((c) => esc(c.label)).join(";"), ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(";"))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = filename + ".csv";
  a.click();
}
