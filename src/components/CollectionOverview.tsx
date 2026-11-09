import { Users, UserCheck, Church, HeartHandshake, Network, UserRound, HandCoins, Gift, Wallet, CalendarDays, CalendarCheck, MapPin, Boxes, Package, Landmark, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { brl, useStore, type Collection } from "@/lib/store";
import { MetricCard } from "@/components/MetricCard";

export const collectionIcons = {
  members: Users, congregations: Church, departments: Network, contributions: HandCoins,
  transactions: Wallet, events: CalendarDays, appointments: HeartHandshake, inventory: Boxes,
};

export function CollectionOverview({ collection }: { collection: Collection }) {
  const { db } = useStore();
  const rows = db[collection];
  const sum = (key: string) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const income = rows.filter((r) => r.tipo === "Receita").reduce((a, r) => a + Number(r.valor || 0), 0);
  const expenses = rows.filter((r) => r.tipo === "Despesa").reduce((a, r) => a + Number(r.valor || 0), 0);
  const metrics = {
    members: [
      { label: "Membros cadastrados", value: rows.length, icon: Users },
      { label: "Ativos", value: rows.filter((r) => r.situacao === "Ativo").length, icon: UserCheck },
      { label: "Congregados", value: rows.filter((r) => r.tipo === "Congregado").length, icon: UserRound },
      { label: "Casados", value: rows.filter((r) => r["estadoCivil"] === "Casado(a)").length, icon: HeartHandshake },
    ],
    congregations: [
      { label: "Congregações", value: rows.length, icon: Church },
      { label: "Ativas", value: rows.filter((r) => r.situacao === "Ativa").length, icon: UserCheck },
      { label: "Pastores responsáveis", value: new Set(rows.map((r) => r["pastor"]).filter(Boolean)).size, icon: Users },
    ],
    departments: [
      { label: "Departamentos", value: rows.length, icon: Network },
      { label: "Ministérios ativos", value: rows.filter((r) => r.situacao === "Ativo").length, icon: UserCheck },
      { label: "Integrantes informados", value: sum("integrantes"), icon: Users },
    ],
    contributions: [
      { label: "Total de contribuições", value: brl(sum("valor")), icon: HandCoins },
      { label: "Dízimos", value: brl(rows.filter((r) => r.tipo === "Dízimo").reduce((a, r) => a + Number(r.valor || 0), 0)), icon: Wallet },
      { label: "Ofertas e campanhas", value: brl(rows.filter((r) => r.tipo !== "Dízimo").reduce((a, r) => a + Number(r.valor || 0), 0)), icon: Gift },
    ],
    transactions: [
      { label: "Receitas", value: brl(income), icon: ArrowDownLeft },
      { label: "Despesas", value: brl(expenses), icon: ArrowUpRight },
      { label: "Saldo em caixa", value: brl(income - expenses), icon: Landmark },
    ],
    events: [
      { label: "Eventos cadastrados", value: rows.length, icon: CalendarDays },
      { label: "Próximos eventos", value: rows.filter((r) => String(r.data) >= today).length, icon: CalendarCheck },
      { label: "Locais de encontro", value: new Set(rows.map((r) => r.local).filter(Boolean)).size, icon: MapPin },
    ],
    inventory: [
      { label: "Itens cadastrados", value: rows.length, icon: Boxes },
      { label: "Unidades no total", value: sum("quantidade"), icon: Package },
      { label: "Valor do patrimônio", value: brl(rows.reduce((a, r) => a + Number(r.valor || 0) * Number(r["quantidade"] || 0), 0)), icon: Landmark },
    ],
    appointments: [],
  }[collection];
  const tones = ["blue", "green", "orange", "violet"] as const;
  if (!metrics.length) return null;
  return <div className={`grid gap-3 sm:grid-cols-2 ${metrics.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
    {metrics.map((metric, i) => <MetricCard key={metric.label} {...metric} tone={tones[i % tones.length]} />)}
  </div>;
}