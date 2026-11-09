import { MetricCard } from "@/components/MetricCard";
import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, UserPlus, UserRound, HandCoins, Gift, TrendingDown, Landmark, CalendarDays, Cake } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { brl, fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — EclesiaPro Gestão Eclesiástica" },
      { name: "description", content: "Indicadores de membros, finanças, eventos e aniversariantes da igreja." },
      { property: "og:title", content: "Painel — EclesiaPro" },
      { property: "og:description", content: "Indicadores de membros, finanças, eventos e aniversariantes da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function Stat({ icon, label, value, grad = 0 }: { icon: typeof Users; label: string; value: string | number; grad?: number }) {
  const tones = ["blue", "violet", "green", "orange"] as const;
  return <MetricCard icon={icon} label={label} value={value} tone={tones[grad % tones.length]} />;
}

function Dashboard() {
  const { db } = useStore();
  const now = new Date();
  const ym = now.toISOString().slice(0, 7);
  const inMonth = (s: unknown) => String(s).startsWith(ym);
  const m = db.members;
  const tx = db.transactions.filter((t) => inMonth(t.data));
  const sum = (arr: typeof tx, f: (t: (typeof tx)[0]) => boolean) => arr.filter(f).reduce((a, t) => a + Number(t.valor), 0);
  const contribMonth = db.contributions.filter((c) => inMonth(c.data));
  const dizimos = sum(tx, (t) => t.categoria === "Dízimos") + contribMonth.filter((c) => c.tipo === "Dízimo").reduce((a, c) => a + Number(c.valor), 0);
  const ofertas = sum(tx, (t) => t.tipo === "Receita" && t.categoria !== "Dízimos") + contribMonth.filter((c) => c.tipo !== "Dízimo").reduce((a, c) => a + Number(c.valor), 0);
  const despesas = sum(tx, (t) => t.tipo === "Despesa");
  const saldoTotal = db.transactions.reduce((a, t) => a + (t.tipo === "Receita" ? 1 : -1) * Number(t.valor), 0)
    + db.contributions.reduce((a, c) => a + Number(c.valor), 0);

  const series = Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = dt.toISOString().slice(0, 7);
    const t = db.transactions.filter((x) => String(x.data).startsWith(key));
    return {
      mes: MONTHS[dt.getMonth()],
      Entradas: t.filter((x) => x.tipo === "Receita").reduce((a, x) => a + Number(x.valor), 0),
      Saídas: t.filter((x) => x.tipo === "Despesa").reduce((a, x) => a + Number(x.valor), 0),
      Membros: m.filter((x) => String(x.recebimento) <= key + "-31").length,
    };
  });

  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const birthdays = m.filter((x) => String(x.nascimento).slice(5, 7) === mm);
  const upcoming = [...db.events].filter((e) => String(e.data) >= now.toISOString().slice(0, 10)).sort((a, b) => String(a.data).localeCompare(String(b.data))).slice(0, 4);
  const latest = [...m].sort((a, b) => String(b.recebimento).localeCompare(String(a.recebimento))).slice(0, 5);

  return (
    <div className="space-y-8 animate-rise">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
        <p className="text-sm font-medium text-primary">Painel administrativo</p>
        <h1 className="mt-2 text-3xl font-semibold">Visão geral da igreja</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · Saldo acumulado <span className="font-semibold text-gold">{brl(saldoTotal)}</span></p></div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" />{now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total cadastrados" value={m.length} grad={0} />
        <Stat icon={UserCheck} label="Membros ativos" value={m.filter((x) => x.situacao === "Ativo").length} grad={1} />
        <Stat icon={UserPlus} label="Novos no mês" value={m.filter((x) => inMonth(x.recebimento)).length} grad={2} />
        <Stat icon={UserRound} label="Congregados" value={m.filter((x) => x.tipo === "Congregado").length} grad={3} />
        <Stat icon={HandCoins} label="Dízimos no mês" value={brl(dizimos)} grad={1} />
        <Stat icon={Gift} label="Ofertas no mês" value={brl(ofertas)} grad={2} />
        <Stat icon={TrendingDown} label="Despesas do mês" value={brl(despesas)} grad={3} />
        <Stat icon={Landmark} label="Saldo do mês" value={brl(dizimos + ofertas - despesas)} grad={0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 border-t pt-5">
          <h2 className="mb-4 text-lg font-semibold">Entradas e saídas</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="Entradas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Saídas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0 border-t pt-5">
          <h2 className="mb-4 text-lg font-semibold">Crescimento de membros</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="Membros" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.25} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard title="Próximos eventos" icon={CalendarDays} items={upcoming.map((e) => [String(e.titulo), `${fmtDate(e.data)} · ${e.local}`])} />
        <ListCard title="Aniversariantes do mês" icon={Cake} items={birthdays.map((b) => [String(b.nome), `Dia ${String(b.nascimento).slice(8, 10)}`])} />
        <ListCard title="Últimos cadastrados" icon={UserPlus} items={latest.map((x) => [String(x.nome), `${x.congregacao} · ${fmtDate(x.recebimento)}`])} />
      </div>
    </div>
  );
}

function ListCard({ title, icon: Icon, items }: { title: string; icon: typeof Users; items: [string, string][] }) {
  return (
    <div className="min-w-0 border-t pt-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Icon className="size-4 text-gold" />{title}</h2>
      <ul className="space-y-3">
        {items.map(([a, b]) => (
          <li key={a + b} className="flex flex-col border-b pb-3 last:border-0 last:pb-0">
            <span className="font-medium">{a}</span>
            <span className="text-sm text-muted-foreground">{b}</span>
          </li>
        ))}
        {!items.length && <li className="text-sm text-muted-foreground">Nada por aqui.</li>}
      </ul>
    </div>
  );
}
