import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportCSV, fmtDate, useStore, type Row } from "@/lib/store";

export const Route = createFileRoute("/relatorio-membros")({
  head: () => ({
    meta: [
      { title: "Relatório de Membros por Idade — Ecclesia" },
      { name: "description", content: "Distribuição dos membros por faixa etária e lista ordenada por idade." },
      { property: "og:title", content: "Relatório de Membros por Idade — Ecclesia" },
      { property: "og:description", content: "Distribuição dos membros por faixa etária e lista ordenada por idade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RelatorioMembros,
});

export const AGE_BUCKETS: [string, number, number][] = [
  ["0–12", 0, 12],
  ["13–17", 13, 17],
  ["18–25", 18, 25],
  ["26–35", 26, 35],
  ["36–45", 36, 45],
  ["46–59", 46, 59],
  ["60–69", 60, 69],
  ["70+", 70, 200],
];

export function ageOf(nascimento: unknown, ref = new Date()): number | null {
  const s = String(nascimento ?? "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const b = new Date(s.slice(0, 10) + "T12:00:00");
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--;
  return age >= 0 ? age : null;
}

export function bucketOf(age: number): string {
  return AGE_BUCKETS.find(([, lo, hi]) => age >= lo && age <= hi)?.[0] ?? "70+";
}

const COLORS = ["#C8A45D", "#243F60", "#8FA3BF", "#C8A45D", "#243F60", "#8FA3BF", "#C8A45D", "#243F60"];

function RelatorioMembros() {
  const { db } = useStore();

  const { chart, list } = useMemo(() => {
    const counts = new Map<string, number>(AGE_BUCKETS.map(([l]) => [l, 0]));
    const list = db.members
      .map((m) => ({ ...m, idade: ageOf(m.nascimento) }))
      .filter((m) => m.idade !== null)
      .sort((a, b) => (b.idade ?? 0) - (a.idade ?? 0));
    list.forEach((m) => counts.set(bucketOf(m.idade!), (counts.get(bucketOf(m.idade!)) ?? 0) + 1));
    const chart = AGE_BUCKETS.map(([l]) => ({ faixa: l, Membros: counts.get(l) ?? 0 }));
    return { chart, list };
  }, [db.members]);

  const cols = [
    { key: "nome", label: "Nome" },
    { key: "idade", label: "Idade" },
    { key: "nascimento", label: "Nascimento" },
    { key: "congregacao", label: "Congregação" },
    { key: "situacao", label: "Situação" },
  ];

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Relatório de Membros por Idade</h1>
          <p className="text-muted-foreground mt-1">Distribuição por faixa etária e lista ordenada do mais velho ao mais novo.</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={() => exportCSV("relatorio-membros-idade", list as unknown as Row[], cols)}><FileSpreadsheet className="size-4" />Excel</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />PDF</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-semibold">Membros por faixa etária</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="faixa" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Bar dataKey="Membros" radius={[6, 6, 0, 0]}>
              {chart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Faixa</TableHead>
              <TableHead>Nascimento</TableHead>
              <TableHead>Congregação</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell>{m.idade} anos</TableCell>
                <TableCell>{bucketOf(m.idade!)}</TableCell>
                <TableCell>{fmtDate(m.nascimento)}</TableCell>
                <TableCell>{m.congregacao}</TableCell>
                <TableCell>{m.situacao}</TableCell>
              </TableRow>
            ))}
            {!list.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum membro com data de nascimento cadastrada.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">{list.length} membro(s)</div>
      </div>
    </div>
  );
}
