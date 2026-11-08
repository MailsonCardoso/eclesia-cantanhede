import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, FileSpreadsheet, Heart, Printer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportCSV, fmtDate, useStore, type Row } from "@/lib/store";

export const Route = createFileRoute("/relatorio-membros")({
  head: () => ({
    meta: [
      { title: "Relatório de Membros por Idade — EclesiaPro" },
      { name: "description", content: "Distribuição dos membros por faixa etária e lista ordenada por idade." },
      { property: "og:title", content: "Relatório de Membros por Idade — EclesiaPro" },
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

const COLORS = ["#3B82F6", "#8B5CF6", "#22C55E", "#F97316", "#6366F1", "#A855F7", "#10B981", "#FB923C"];

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

  const [open, setOpen] = useState<string | null>(null);

  const couples = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; marido: string; esposa: string; congregacao: string; anos: string }[] = [];
    for (const m of db.members) {
      const conj = String(m["conjuge"] ?? "").trim();
      if (m["estadoCivil"] !== "Casado(a)" || !conj) continue;
      const nome = String(m["nome"] ?? "");
      const key = [nome, conj].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const other = db.members.find((x) => x["nome"] === conj);
      const a1 = ageOf(m["nascimento"]);
      const a2 = other ? ageOf(other["nascimento"]) : null;
      out.push({
        id: key, marido: nome, esposa: conj,
        congregacao: String(m["congregacao"] ?? ""),
        anos: `${a1 ?? "—"} / ${a2 ?? "—"}`,
      });
    }
    return out;
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

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Membros por grupo</h2>
        {AGE_BUCKETS.map(([label], i) => {
          const membros = list.filter((m) => bucketOf(m.idade!) === label);
          const isOpen = open === label;
          return (
            <div key={label} className="rounded-2xl border bg-card shadow-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : label)}
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-accent/40 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex size-11 items-center justify-center rounded-xl text-primary-foreground" style={{ background: COLORS[i % COLORS.length] }}>
                  <Users className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{label} anos</div>
                  <div className="text-sm text-muted-foreground">{membros.length} membro(s)</div>
                </div>
                <ChevronDown className={`size-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Idade</TableHead>
                        <TableHead>Nascimento</TableHead>
                        <TableHead>Congregação</TableHead>
                        <TableHead>Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {membros.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.nome}</TableCell>
                          <TableCell>{m.idade} anos</TableCell>
                          <TableCell>{fmtDate(m.nascimento)}</TableCell>
                          <TableCell>{m.congregacao}</TableCell>
                          <TableCell>{m.situacao}</TableCell>
                        </TableRow>
                      ))}
                      {!membros.length && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Nenhum membro nesta faixa.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground"><Heart className="size-5" /></div>
            <div>
              <h2 className="text-lg font-semibold">Grupo de Casais</h2>
              <p className="text-sm text-muted-foreground">{couples.length} casal(is) cadastrados</p>
            </div>
          </div>
          <Button variant="outline" className="no-print" onClick={() => exportCSV("grupo-de-casais", couples as unknown as Row[], [
            { key: "marido", label: "Cônjuge 1" }, { key: "esposa", label: "Cônjuge 2" }, { key: "congregacao", label: "Congregação" }, { key: "anos", label: "Idades" },
          ])}><FileSpreadsheet className="size-4" />Excel</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Casal</TableHead>
              <TableHead>Idades</TableHead>
              <TableHead>Congregação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {couples.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.marido} <Heart className="inline size-3 mx-1 text-primary" /> {c.esposa}</TableCell>
                <TableCell>{c.anos}</TableCell>
                <TableCell>{c.congregacao}</TableCell>
              </TableRow>
            ))}
            {!couples.length && <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Nenhum casal cadastrado. Marque o membro como Casado(a) e informe o cônjuge.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
