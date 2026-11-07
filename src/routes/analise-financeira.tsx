import { createFileRoute } from "@tanstack/react-router";
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
  const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 };

  return (
    <div className="space-y-8 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Análise financeira</h1>
          <p className="text-sm text-muted-foreground">Compare receitas, despesas e saldo mês a mês.</p>
        </div>
        <div className="w-48">
          <label className="mb-1 block text-xs text-muted-foreground">Meses para comparar</label>
          <Select value={String(n)} onValueChange={(v) => setN(Number(v))}>
            <SelectTrigger aria-label="Meses para comparar"><SelectValue /></SelectTrigger>
            <SelectContent>{OPTIONS.map((o) => <SelectItem key={o} value={String(o)}>Últimos {o} meses</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {([["Receitas no período", tot.r], ["Despesas no período", tot.d], ["Saldo no período", tot.r - tot.d], ["Média mensal de saldo", (tot.r - tot.d) / n]] as const).map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-card p-5 shadow-card card-hover">
            <div className="text-sm text-muted-foreground">{l}</div>
            <div className="mt-1 text-2xl font-bold tracking-tight">{brl(v)}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-card">
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
        <table className="w-full text-sm">
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
    </div>
  );
}
