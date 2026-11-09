import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Landmark, ChartNoAxesCombined, LineChart } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl, useStore } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/analise-financeira")({
  head: () => ({
    meta: [
      { title: "Análise Financeira — EclesiaPro" },
      { name: "description", content: "Compare receitas, despesas e saldo entre os meses escolhidos." },
      { property: "og:title", content: "Análise Financeira — EclesiaPro" },
      { property: "og:description", content: "Compare receitas, despesas e saldo entre os meses escolhidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analise,
});

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const OPTIONS = [2, 3, 6, 9, 12, 18, 24];

function Analise() {
  const { db } = useStore();
  const [n, setN] = useState(6);
  const now = new Date();
  const rows = Array.from({ length: n }, (_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (n - 1) + i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const tx = db.transactions.filter((t) => String(t.data).startsWith(key));
    const ct = db.contributions.filter((c) => String(c.data).startsWith(key));
    const receitas = tx.filter((t) => t.tipo === "Receita").reduce((a, t) => a + Number(t.valor), 0) + ct.reduce((a, c) => a + Number(c.valor), 0);
    const despesas = tx.filter((t) => t.tipo === "Despesa").reduce((a, t) => a + Number(t.valor), 0);
    return { mes: `${MONTHS[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`, Receitas: receitas, Despesas: despesas, Saldo: receitas - despesas };
  });
  const tot = rows.reduce((a, r) => ({ r: a.r + r.Receitas, d: a.d + r.Despesas }), { r: 0, d: 0 });
  const start = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1).toISOString().slice(0, 10);
  const txP = db.transactions.filter((t) => String(t.data) >= start);
  const ctP = db.contributions.filter((c) => String(c.data) >= start);
  const sumBy = (list: typeof txP, key: string) => {
    const m = new Map<string, number>();
    list.forEach((r) => m.set(String(r[key] || "—"), (m.get(String(r[key] || "—")) ?? 0) + Number(r["valor"])));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const recCt = sumBy(ctP, "tipo");
  const recTx = sumBy(txP.filter((t) => t.tipo === "Receita"), "categoria");
  const despTx = sumBy(txP.filter((t) => t.tipo === "Despesa"), "categoria");
  const totRec = [...recCt, ...recTx].reduce((a, [, v]) => a + v, 0);
  const totDesp = despTx.reduce((a, [, v]) => a + v, 0);
  const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 };

  return (
    <div className="space-y-8 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><LineChart className="size-6" /></div><div>
          <h1 className="text-2xl font-semibold">Análise financeira</h1>
          <p className="text-sm text-muted-foreground">Compare receitas, despesas e saldo mês a mês.</p>
        </div></div>
        <div className="w-48">
          <label className="mb-1 block text-xs text-muted-foreground">Meses para comparar</label>
          <Select value={String(n)} onValueChange={(v) => setN(Number(v))}>
            <SelectTrigger aria-label="Meses para comparar"><SelectValue /></SelectTrigger>
            <SelectContent>{OPTIONS.map((o) => <SelectItem key={o} value={String(o)}>Últimos {o} meses</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Receitas no período" value={brl(tot.r)} icon={ArrowDownLeft} tone="green" />
        <MetricCard label="Despesas no período" value={brl(tot.d)} icon={ArrowUpRight} tone="orange" />
        <MetricCard label="Saldo no período" value={brl(tot.r - tot.d)} icon={Landmark} tone="blue" />
        <MetricCard label="Média mensal de saldo" value={brl((tot.r - tot.d) / n)} icon={ChartNoAxesCombined} tone="violet" />
      </div>
      <div className="min-w-0 border-t pt-6">
        <h2 className="mb-4 text-lg font-semibold">Comparativo mensal</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(v: number) => brl(v)} contentStyle={tip} />
            <Legend />
            <Bar dataKey="Receitas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Despesas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Saldo" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
        <table className="w-full min-w-96 text-sm">
          <thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Mês</th><th className="p-3 text-right">Receitas</th><th className="p-3 text-right">Despesas</th><th className="p-3 text-right">Saldo</th><th className="p-3 text-right">Variação do saldo</th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const prev = rows[i - 1]?.Saldo;
              const varr = prev === undefined ? "—" : prev === 0 ? "—" : `${(((r.Saldo - prev) / Math.abs(prev)) * 100).toFixed(1)}%`;
              return (
                <tr key={r.mes} className="border-b last:border-0">
                  <td className="p-3 font-medium">{r.mes}</td>
                  <td className="p-3 text-right">{brl(r.Receitas)}</td>
                  <td className="p-3 text-right">{brl(r.Despesas)}</td>
                  <td className={`p-3 text-right font-semibold ${r.Saldo < 0 ? "text-destructive" : ""}`}>{brl(r.Saldo)}</td>
                  <td className="p-3 text-right text-muted-foreground">{varr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 border-t pt-6">
          <h2 className="text-lg font-semibold">DRE — Demonstração do Resultado</h2>
          <p className="mb-4 text-xs text-muted-foreground">Últimos {n} meses</p>
          <div className="overflow-x-auto"><table className="w-full min-w-96 text-sm"><tbody>
            <tr className="border-b"><td className="py-2 font-semibold">(+) Receita bruta</td><td className="py-2 text-right font-semibold">{brl(totRec)}</td></tr>
            <tr><td className="py-1 pl-4 text-muted-foreground">Dízimos e ofertas</td><td className="py-1 text-right">{brl(recCt.reduce((a, [, v]) => a + v, 0))}</td></tr>
            <tr className="border-b"><td className="py-1 pl-4 text-muted-foreground">Outras receitas lançadas</td><td className="py-1 text-right">{brl(recTx.reduce((a, [, v]) => a + v, 0))}</td></tr>
            <tr className="border-b"><td className="py-2 font-semibold">(−) Despesas operacionais</td><td className="py-2 text-right font-semibold text-destructive">{brl(totDesp)}</td></tr>
            {despTx.map(([k, v]) => <tr key={k}><td className="py-1 pl-4 text-muted-foreground">{k}</td><td className="py-1 text-right">{brl(v)}</td></tr>)}
            <tr className="border-t-2"><td className="py-3 font-bold">(=) Resultado do período</td><td className={`py-3 text-right font-bold ${totRec - totDesp < 0 ? "text-destructive" : "text-primary"}`}>{brl(totRec - totDesp)}</td></tr>
          </tbody></table></div>
        </section>
        <section className="min-w-0 border-t pt-6">
          <h2 className="text-lg font-semibold">Balancete</h2>
          <p className="mb-4 text-xs text-muted-foreground">Receitas e despesas por conta — últimos {n} meses</p>
          <div className="overflow-x-auto"><table className="w-full min-w-96 text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Conta</th><th className="py-2 text-right">Receita</th><th className="py-2 text-right">Despesa</th></tr></thead>
            <tbody>
              <tr><td colSpan={3} className="pt-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">Dízimos e ofertas — por tipo</td></tr>
              {recCt.map(([k, v]) => <tr key={"t" + k}><td className="py-1 pl-3">{k}</td><td className="py-1 text-right">{brl(v)}</td><td className="py-1 text-right text-muted-foreground">—</td></tr>)}
              <tr><td colSpan={3} className="pt-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">Dízimos e ofertas — por forma de pagamento</td></tr>
              {sumBy(ctP, "pagamento").map(([k, v]) => <tr key={"p" + k}><td className="py-1 pl-3">{k}</td><td className="py-1 text-right">{brl(v)}</td><td className="py-1 text-right text-muted-foreground">—</td></tr>)}
              <tr><td colSpan={3} className="pt-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">Dízimos e ofertas — por congregação</td></tr>
              {sumBy(ctP, "congregacao").map(([k, v]) => <tr key={"c" + k}><td className="py-1 pl-3">{k}</td><td className="py-1 text-right">{brl(v)}</td><td className="py-1 text-right text-muted-foreground">—</td></tr>)}
              <tr><td colSpan={3} className="pt-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">Movimentações</td></tr>
              {recTx.map(([k, v]) => <tr key={"r" + k}><td className="py-1 pl-3">{k}</td><td className="py-1 text-right">{brl(v)}</td><td className="py-1 text-right text-muted-foreground">—</td></tr>)}
              {despTx.map(([k, v]) => <tr key={"d" + k}><td className="py-1 pl-3">{k}</td><td className="py-1 text-right text-muted-foreground">—</td><td className="py-1 text-right text-destructive">{brl(v)}</td></tr>)}
              <tr className="border-t-2 font-bold"><td className="py-2">Totais</td><td className="py-2 text-right">{brl(totRec)}</td><td className="py-2 text-right text-destructive">{brl(totDesp)}</td></tr>
            </tbody>
          </table></div>
          <p className="mt-2 text-xs text-muted-foreground">Os blocos por forma de pagamento e congregação detalham o mesmo total de dízimos e ofertas.</p>
        </section>
      </div>
    </div>
  );
}
