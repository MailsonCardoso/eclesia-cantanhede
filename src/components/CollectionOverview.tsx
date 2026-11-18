import { Users, UserCheck, Church, HeartHandshake, Network, UserRound, HandCoins, Gift, Wallet, CalendarDays, CalendarCheck, MapPin, Boxes, Package, Landmark, ArrowDownLeft, ArrowUpRight, Home, Clock, BookOpen, Mic, Lightbulb, ClipboardList, type LucideIcon } from "lucide-react";
import { brl, useStore, type Collection } from "@/lib/store";
import { MetricCard } from "@/components/MetricCard";

export const collectionIcons: Record<Collection, LucideIcon> = {
  members: Users, congregations: Church, departments: Network, cells: Home, contributions: HandCoins,
  transactions: Wallet, events: CalendarDays, appointments: HeartHandshake, inventory: Boxes,
  pastor_series: BookOpen, pastor_sermons: Mic, pastor_insights: Lightbulb, pastoral_requests: ClipboardList,
};

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function CollectionOverview({
  collection,
  filterYear,
  filterMonth,
}: {
  collection: Collection;
  filterYear?: number;
  filterMonth?: number | "all";
}) {
  const { db } = useStore();
  const rows = db[collection];
  const sum = (key: string) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);
  const today = new Date().toISOString().slice(0, 10);

  // Filtro de período para coleções financeiras (transactions e contributions)
  const isPeriodFiltered = Boolean(filterYear);
  const periodFilteredRows = (() => {
    if (!filterYear) return rows;
    if (filterMonth && filterMonth !== "all") {
      const prefix = `${filterYear}-${String(filterMonth).padStart(2, "0")}`;
      return rows.filter((r) => String(r.data || "").startsWith(prefix));
    }
    return rows.filter((r) => String(r.data || "").startsWith(`${filterYear}-`));
  })();

  const periodLabel = (() => {
    if (!filterYear) return "";
    if (filterMonth && filterMonth !== "all") {
      const mName = MONTHS_FULL[filterMonth - 1] || "";
      return `em ${mName} de ${filterYear}`;
    }
    return `no ano de ${filterYear}`;
  })();

  // 1. Saldo Anterior e Acumulado (antes do período selecionado)
  const isMonthFiltered = Boolean(filterYear && filterMonth && filterMonth !== "all");
  const periodStartDate = isMonthFiltered
    ? `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`
    : filterYear
    ? `${filterYear}-01-01`
    : "";

  const prevTxIncome = periodStartDate
    ? db.transactions
        .filter((r) => r.tipo === "Receita" && String(r.data || "") < periodStartDate)
        .reduce((a, r) => a + Number(r.valor || 0), 0)
    : 0;
  const prevCtIncome = periodStartDate
    ? db.contributions
        .filter((c) => String(c.data || "") < periodStartDate)
        .reduce((a, c) => a + Number(c.valor || 0), 0)
    : 0;
  const prevTxExpenses = periodStartDate
    ? db.transactions
        .filter((r) => r.tipo === "Despesa" && String(r.data || "") < periodStartDate)
        .reduce((a, r) => a + Number(r.valor || 0), 0)
    : 0;
  const prevBalance = (prevTxIncome + prevCtIncome) - prevTxExpenses;

  // 2. Entradas do Período (Movimentações de Receita + Dízimos e Ofertas)
  const currentTxIncome = periodFilteredRows
    .filter((r) => r.tipo === "Receita")
    .reduce((a, r) => a + Number(r.valor || 0), 0);
  const currentCtIncome = (() => {
    if (!filterYear) {
      return db.contributions.reduce((a, c) => a + Number(c.valor || 0), 0);
    }
    const prefix = filterMonth && filterMonth !== "all"
      ? `${filterYear}-${String(filterMonth).padStart(2, "0")}`
      : `${filterYear}-`;
    return db.contributions
      .filter((c) => String(c.data || "").startsWith(prefix))
      .reduce((a, c) => a + Number(c.valor || 0), 0);
  })();
  const totalPeriodIncome = currentTxIncome + currentCtIncome;

  // 3. Despesas do Período
  const totalPeriodExpenses = periodFilteredRows
    .filter((r) => r.tipo === "Despesa")
    .reduce((a, r) => a + Number(r.valor || 0), 0);

  // 4. Saldo Atual em Caixa (Saldo Anterior + Entradas − Saídas)
  const currentClosingBalance = isPeriodFiltered
    ? prevBalance + totalPeriodIncome - totalPeriodExpenses
    : (db.transactions.filter((r) => r.tipo === "Receita").reduce((a, r) => a + Number(r.valor || 0), 0)
        + db.contributions.reduce((a, c) => a + Number(c.valor || 0), 0))
      - db.transactions.filter((r) => r.tipo === "Despesa").reduce((a, r) => a + Number(r.valor || 0), 0);

  // Métricas de Contribuições (Dízimos e Ofertas)
  const contribTotal = periodFilteredRows.reduce((a, r) => a + Number(r.valor || 0), 0);
  const contribDizimos = periodFilteredRows
    .filter((r) => r.tipo === "Dízimo")
    .reduce((a, r) => a + Number(r.valor || 0), 0);
  const contribOfertas = periodFilteredRows
    .filter((r) => r.tipo !== "Dízimo")
    .reduce((a, r) => a + Number(r.valor || 0), 0);

  const metrics = ({
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
      {
        label: "Integrantes vinculados",
        value: db.members.filter((m) => {
          const d = String(m.departamento || "").trim();
          return d && d !== "Nenhum / Geral" && d !== "__none";
        }).length,
        icon: Users,
      },
    ],
    cells: [
      { label: "Células cadastradas", value: rows.length, icon: Home },
      { label: "Células ativas", value: rows.filter((r) => r.situacao === "Ativa").length, icon: UserCheck },
      { label: "Participantes informados", value: sum("participantes"), icon: Users },
      { label: "Dias de reunião", value: new Set(rows.map((r) => r["dia"]).filter(Boolean)).size, icon: Clock },
    ],
    contributions: [
      {
        label: "Total de contribuições",
        value: brl(contribTotal),
        icon: HandCoins,
        detail: isPeriodFiltered ? `Arrecadação ${periodLabel}` : undefined,
      },
      {
        label: "Dízimos",
        value: brl(contribDizimos),
        icon: Wallet,
        detail: isPeriodFiltered ? `Dízimos ${periodLabel}` : undefined,
      },
      {
        label: "Ofertas e campanhas",
        value: brl(contribOfertas),
        icon: Gift,
        detail: isPeriodFiltered ? `Ofertas ${periodLabel}` : undefined,
      },
    ],
    transactions: [
      {
        label: "Saldo anterior",
        value: brl(prevBalance),
        icon: Landmark,
        detail: isPeriodFiltered ? "Acumulado até o mês anterior" : "Saldo inicial",
      },
      {
        label: "Receitas do período",
        value: brl(totalPeriodIncome),
        icon: ArrowDownLeft,
        detail: isPeriodFiltered ? `Dízimos, ofertas e receitas ${periodLabel}` : "Total de entradas acumuladas",
      },
      {
        label: "Despesas do período",
        value: brl(totalPeriodExpenses),
        icon: ArrowUpRight,
        detail: isPeriodFiltered ? `Saídas e pagamentos ${periodLabel}` : "Total de saídas acumuladas",
      },
      {
        label: "Saldo atual em caixa",
        value: brl(currentClosingBalance),
        icon: Wallet,
        detail: isPeriodFiltered
          ? "Saldo anterior + Receitas − Despesas"
          : "Disponível em caixa e banco",
      },
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
  } as Partial<Record<Collection, { label: string; value: string | number; icon: LucideIcon; detail?: string }[]>>)[collection];
  const tones = ["blue", "green", "orange", "violet"] as const;
  if (!metrics?.length) return null;
  return <div className={`grid gap-3 sm:grid-cols-2 ${metrics.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
    {metrics.map((metric, i) => <MetricCard key={metric.label} {...metric} tone={tones[i % tones.length]} />)}
  </div>;
}