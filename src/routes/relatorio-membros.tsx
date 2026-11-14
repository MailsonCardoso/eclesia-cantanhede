import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Baby,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Heart,
  Printer,
  Sparkles,
  UserCheck,
  Users,
  Users2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportCSV, fmtDate, useStore, type Row } from "@/lib/store";

export const Route = createFileRoute("/relatorio-membros")({
  head: () => ({
    meta: [
      { title: "Relatórios Inteligentes de Membresia — EclesiaPro" },
      { name: "description", content: "Segmentação etária, pareamento de casais, ministérios e turmas de EBD." },
      { property: "og:title", content: "Relatórios Inteligentes de Membresia — EclesiaPro" },
      { property: "og:description", content: "Segmentação etária, pareamento de casais, ministérios e turmas de EBD." },
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

type ActiveTab = "geral" | "casais" | "homens" | "mulheres" | "criancas" | "jovens";

function exportPDF({
  title,
  subtitle,
  headers,
  data,
  filename,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  data: (string | number)[][];
  filename: string;
}) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text("EcclesiaPro — Gestão Eclesiástica", 14, 18);

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(title, 14, 26);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 32);
  }

  const dateStr = `Emissão: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(dateStr, doc.internal.pageSize.getWidth() - 14, 18, { align: "right" });

  autoTable(doc, {
    startY: subtitle ? 36 : 30,
    head: [headers],
    body: data,
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: 50,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (d) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${d.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

function RelatorioMembros() {
  const { db } = useStore();
  const [tab, setTab] = useState<ActiveTab>("geral");
  const [congFilter, setCongFilter] = useState<string>("todas");

  // Congregações disponíveis
  const congsList = useMemo(() => {
    const set = new Set<string>();
    db.members.forEach((m) => {
      const c = String(m.congregacao ?? "").trim();
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [db.members]);

  // Membros filtrados por congregação
  const filteredMembers = useMemo(() => {
    return db.members.filter((m) => {
      if (congFilter !== "todas" && m.congregacao !== congFilter) return false;
      return true;
    });
  }, [db.members, congFilter]);

  // Lista com idades calculadas
  const membersWithAge = useMemo(() => {
    return filteredMembers.map((m) => ({
      ...m,
      calculatedAge: ageOf(m.nascimento ?? m.birth_date),
    }));
  }, [filteredMembers]);

  // 1. Gráfico de Faixas Etárias
  const { chart, list } = useMemo(() => {
    const counts = new Map<string, number>(AGE_BUCKETS.map(([l]) => [l, 0]));
    const list = membersWithAge
      .filter((m) => m.calculatedAge !== null)
      .sort((a, b) => (b.calculatedAge ?? 0) - (a.calculatedAge ?? 0));
    list.forEach((m) => counts.set(bucketOf(m.calculatedAge!), (counts.get(bucketOf(m.calculatedAge!)) ?? 0) + 1));
    const chart = AGE_BUCKETS.map(([l]) => ({ faixa: l, Membros: counts.get(l) ?? 0 }));
    return { chart, list };
  }, [membersWithAge]);

  // 2. Algoritmo de Pareamento Bidirecional de Casais (Deduplicação de Cônjuges)
  const casaisList = useMemo(() => {
    const processedIds = new Set<string>();
    const out: {
      id: string;
      nomeCasal: string;
      marido?: Row;
      esposa?: Row;
      temConjugeCadastrado: boolean;
      telefoneContato: string;
      congregacao: string;
    }[] = [];

    const marriedMembers = filteredMembers.filter((m) => {
      const st = String(m.marital_status ?? m.estadoCivil ?? m.estado_civil ?? "").toLowerCase();
      return st.includes("casad");
    });

    for (const membro of marriedMembers) {
      const mId = String(membro.id);
      if (processedIds.has(mId)) continue;

      const spouseId = membro.spouse_id ? String(membro.spouse_id) : null;
      let spouse = spouseId ? db.members.find((m) => String(m.id) === spouseId) : null;

      // Fallback por nome caso spouse_id não esteja preenchido
      if (!spouse && (membro.spouse_name || membro.conjuge)) {
        const spouseName = String(membro.spouse_name || membro.conjuge).trim().toLowerCase();
        spouse = db.members.find((m) => String(m.nome || m.name).trim().toLowerCase() === spouseName) || null;
      }

      if (spouse) {
        processedIds.add(String(spouse.id));
      }
      processedIds.add(mId);

      const isMembroMasc = String(membro.sex ?? membro.sexo ?? "").toLowerCase().startsWith("m");
      const marido = isMembroMasc ? membro : spouse;
      const esposa = !isMembroMasc ? membro : spouse;

      const nomeMarido = marido ? String(marido.nome ?? marido.name) : "";
      const nomeEsposa = esposa ? String(esposa.nome ?? esposa.name) : "";
      const spouseNome = String(membro.spouse_name || membro.conjuge || "Não cadastrado no sistema");

      const nomeCasal =
        marido && esposa
          ? `${nomeMarido} & ${nomeEsposa}`
          : `${membro.nome || membro.name} (Cônjuge: ${spouseNome})`;

      const tel = String(
        marido?.phone || marido?.telefone || esposa?.phone || esposa?.telefone || membro.phone || membro.telefone || "—"
      );

      out.push({
        id: `${mId}-${spouse ? spouse.id : "avulso"}`,
        nomeCasal,
        marido: marido || undefined,
        esposa: esposa || undefined,
        temConjugeCadastrado: !!spouse,
        telefoneContato: tel,
        congregacao: String(membro.congregacao || "Sede Central"),
      });
    }

    return out;
  }, [filteredMembers, db.members]);

  // 3. Segmentação Homens (sexo = 'Masculino' e idade >= 18 ou sem idade)
  const homensList = useMemo(() => {
    return membersWithAge.filter((m) => {
      const sx = String(m.sex ?? m.sexo ?? "").toLowerCase();
      if (!sx.startsWith("m")) return false;
      return m.calculatedAge === null || m.calculatedAge >= 18;
    });
  }, [membersWithAge]);

  // 4. Segmentação Mulheres (sexo = 'Feminino' e idade >= 18 ou sem idade)
  const mulheresList = useMemo(() => {
    return membersWithAge.filter((m) => {
      const sx = String(m.sex ?? m.sexo ?? "").toLowerCase();
      if (!sx.startsWith("f")) return false;
      return m.calculatedAge === null || m.calculatedAge >= 18;
    });
  }, [membersWithAge]);

  // 5. Crianças (EBD Infantil: idade <= 12, ordenadas crescente por idade)
  const criancasList = useMemo(() => {
    return membersWithAge
      .filter((m) => m.calculatedAge !== null && m.calculatedAge <= 12)
      .sort((a, b) => (a.calculatedAge ?? 0) - (b.calculatedAge ?? 0));
  }, [membersWithAge]);

  // 6. Adolescentes & Jovens (13 <= idade <= 17)
  const jovensList = useMemo(() => {
    return membersWithAge.filter((m) => m.calculatedAge !== null && m.calculatedAge >= 13 && m.calculatedAge <= 17);
  }, [membersWithAge]);

  // Handlers de Exportação
  const handleExportCSV = () => {
    const filename = `relatorio-membros-${tab}-${new Date().toISOString().slice(0, 10)}`;

    if (tab === "casais") {
      exportCSV(
        filename,
        casaisList.map((c) => ({
          id: c.id,
          nomeCasal: c.nomeCasal,
          temConjuge: c.temConjugeCadastrado ? "Sim" : "Não",
          telefone: c.telefoneContato,
          congregacao: c.congregacao,
        })),
        [
          { key: "nomeCasal", label: "Casal" },
          { key: "temConjuge", label: "Cônjuge Cadastrado" },
          { key: "telefone", label: "Telefone de Contato" },
          { key: "congregacao", label: "Congregação" },
        ]
      );
      return;
    }

    if (tab === "criancas") {
      exportCSV(
        filename,
        criancasList.map((c) => ({
          id: c.id,
          nome: c.nome ?? c.name,
          idade: c.calculatedAge ?? "",
          nascimento: fmtDate(c.nascimento ?? c.birth_date),
          pai: c.father_name ?? c.pai ?? "—",
          mae: c.mother_name ?? c.mae ?? "—",
          telefone: c.telefone ?? c.phone ?? "—",
          congregacao: c.congregacao ?? "",
        })),
        [
          { key: "nome", label: "Nome da Criança" },
          { key: "idade", label: "Idade" },
          { key: "nascimento", label: "Data de Nascimento" },
          { key: "pai", label: "Nome do Pai" },
          { key: "mae", label: "Nome da Mãe" },
          { key: "telefone", label: "Telefone Responsável" },
          { key: "congregacao", label: "Congregação" },
        ]
      );
      return;
    }

    const currentList =
      tab === "homens"
        ? homensList
        : tab === "mulheres"
        ? mulheresList
        : tab === "jovens"
        ? jovensList
        : list;

    exportCSV(
      filename,
      currentList.map((m) => ({
        id: m.id,
        nome: m.nome ?? m.name,
        idade: m.calculatedAge ?? "—",
        nascimento: fmtDate(m.nascimento ?? m.birth_date),
        sexo: m.sexo ?? m.sex ?? "",
        cargo: m.cargo ?? m.role ?? "",
        telefone: m.telefone ?? m.phone ?? "",
        congregacao: m.congregacao ?? "",
      })),
      [
        { key: "nome", label: "Nome Completo" },
        { key: "idade", label: "Idade" },
        { key: "nascimento", label: "Nascimento" },
        { key: "sexo", label: "Sexo" },
        { key: "cargo", label: "Cargo / Função" },
        { key: "telefone", label: "Telefone" },
        { key: "congregacao", label: "Congregação" },
      ]
    );
  };

  const handleExportPDF = () => {
    const filename = `relatorio-membros-${tab}-${new Date().toISOString().slice(0, 10)}`;

    if (tab === "casais") {
      exportPDF({
        title: "Relatório do Ministério de Casais (Deduplicado)",
        subtitle: `Total de casais listados: ${casaisList.length} | Filtro: ${congFilter === "todas" ? "Todas as Congregações" : congFilter}`,
        headers: ["Casal", "Vínculo de Cônjuge", "Telefone de Contato", "Congregação"],
        data: casaisList.map((c) => [
          c.nomeCasal,
          c.temConjugeCadastrado ? "Cadastrado" : "Pendente/Avulso",
          c.telefoneContato,
          c.congregacao,
        ]),
        filename,
      });
      return;
    }

    if (tab === "criancas") {
      exportPDF({
        title: "Relatório de Crianças & Turmas da EBD",
        subtitle: `Total de crianças: ${criancasList.length} | Ordenadas por idade crescente`,
        headers: ["Nome da Criança", "Idade", "Nascimento", "Pai", "Mãe", "Telefone Pais", "Congregação"],
        data: criancasList.map((c) => [
          String(c.nome ?? c.name),
          `${c.calculatedAge} anos`,
          fmtDate(c.nascimento ?? c.birth_date),
          String(c.father_name ?? c.pai ?? "—"),
          String(c.mother_name ?? c.mae ?? "—"),
          String(c.telefone ?? c.phone ?? "—"),
          String(c.congregacao ?? ""),
        ]),
        filename,
      });
      return;
    }

    const currentList =
      tab === "homens"
        ? homensList
        : tab === "mulheres"
        ? mulheresList
        : tab === "jovens"
        ? jovensList
        : list;

    const tabTitle =
      tab === "homens"
        ? "Relatório do Ministério de Homens (>= 18 anos)"
        : tab === "mulheres"
        ? "Relatório do Ministério de Mulheres (>= 18 anos)"
        : tab === "jovens"
        ? "Relatório de Adolescentes e Jovens (13 a 17 anos)"
        : "Relatório Geral de Membros por Idade";

    exportPDF({
      title: tabTitle,
      subtitle: `Total: ${currentList.length} membros | Congregação: ${congFilter === "todas" ? "Todas" : congFilter}`,
      headers: ["Nome Completo", "Idade", "Nascimento", "Sexo", "Cargo", "Telefone", "Congregação"],
      data: currentList.map((m) => [
        String(m.nome ?? m.name),
        m.calculatedAge !== null ? `${m.calculatedAge} anos` : "—",
        fmtDate(m.nascimento ?? m.birth_date),
        String(m.sexo ?? m.sex ?? "—"),
        String(m.cargo ?? m.role ?? "Membro"),
        String(m.telefone ?? m.phone ?? "—"),
        String(m.congregacao ?? "Sede"),
      ]),
      filename,
    });
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">Relatórios Inteligentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Segmentação dinâmica por ministérios, deduplicação de casais e formação de turmas da EBD.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de congregação */}
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm">
            <Filter className="size-3.5" />
            <select
              value={congFilter}
              onChange={(e) => setCongFilter(e.target.value)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
            >
              <option value="todas">Todas as congregações</option>
              {congsList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <FileSpreadsheet className="size-4 text-emerald-500" />
            Excel / CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
            <FileText className="size-4 text-red-500" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 no-print">
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Resumo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <button
          onClick={() => setTab("geral")}
          className={`text-left rounded-xl border p-4 transition-all card-hover ${
            tab === "geral" ? "border-primary bg-primary/10 shadow-sm" : "bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Total Membros <Users className="size-4 text-primary" />
          </div>
          <div className="mt-1 text-2xl font-bold">{filteredMembers.length}</div>
          <div className="text-[11px] text-muted-foreground">Visão demográfica</div>
        </button>

        <button
          onClick={() => setTab("casais")}
          className={`text-left rounded-xl border p-4 transition-all card-hover ${
            tab === "casais" ? "border-primary bg-primary/10 shadow-sm" : "bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Casais <Heart className="size-4 text-rose-500" />
          </div>
          <div className="mt-1 text-2xl font-bold">{casaisList.length}</div>
          <div className="text-[11px] text-muted-foreground">Pareamento sem duplicar</div>
        </button>

        <button
          onClick={() => setTab("homens")}
          className={`text-left rounded-xl border p-4 transition-all card-hover ${
            tab === "homens" ? "border-primary bg-primary/10 shadow-sm" : "bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Homens (≥ 18) <UserCheck className="size-4 text-blue-500" />
          </div>
          <div className="mt-1 text-2xl font-bold">{homensList.length}</div>
          <div className="text-[11px] text-muted-foreground">Ministério Masculino</div>
        </button>

        <button
          onClick={() => setTab("mulheres")}
          className={`text-left rounded-xl border p-4 transition-all card-hover ${
            tab === "mulheres" ? "border-primary bg-primary/10 shadow-sm" : "bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Mulheres (≥ 18) <Users2 className="size-4 text-purple-500" />
          </div>
          <div className="mt-1 text-2xl font-bold">{mulheresList.length}</div>
          <div className="text-[11px] text-muted-foreground">Ministério Feminino</div>
        </button>

        <button
          onClick={() => setTab("criancas")}
          className={`text-left rounded-xl border p-4 transition-all card-hover ${
            tab === "criancas" ? "border-primary bg-primary/10 shadow-sm" : "bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Crianças (≤ 12) <Baby className="size-4 text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-bold">{criancasList.length}</div>
          <div className="text-[11px] text-muted-foreground">Turmas de EBD</div>
        </button>

        <button
          onClick={() => setTab("jovens")}
          className={`text-left rounded-xl border p-4 transition-all card-hover ${
            tab === "jovens" ? "border-primary bg-primary/10 shadow-sm" : "bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Jovens (13–17) <Sparkles className="size-4 text-emerald-500" />
          </div>
          <div className="mt-1 text-2xl font-bold">{jovensList.length}</div>
          <div className="text-[11px] text-muted-foreground">Adolescentes</div>
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}

      {/* 1. ABA GERAL: Gráfico Recharts + Tabela */}
      {tab === "geral" && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground">Distribuição Geral por Faixa Etária</h3>
              <p className="text-xs text-muted-foreground">Membros com data de nascimento cadastrada</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="faixa" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card, #1e293b)",
                      borderColor: "var(--color-border, #334155)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="Membros" radius={[6, 6, 0, 0]}>
                    {chart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
            <div className="border-b px-5 py-3 font-semibold text-sm">
              Listagem Completa Ordenada por Idade ({list.length} membros)
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Faixa</TableHead>
                  <TableHead>Nascimento</TableHead>
                  <TableHead>Congregação</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length ? (
                  list.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nome ?? m.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {m.calculatedAge} anos
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{bucketOf(m.calculatedAge!)}</TableCell>
                      <TableCell>{fmtDate(m.nascimento ?? m.birth_date)}</TableCell>
                      <TableCell>{m.congregacao ?? "Sede Central"}</TableCell>
                      <TableCell>{m.cargo ?? m.role ?? "Membro"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {m.situacao ?? m.status ?? "Ativo"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum membro cadastrado nesta congregação.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 2. ABA CASAIS: Algoritmo de Pareamento Bidirecional */}
      {tab === "casais" && (
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="border-b px-5 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Ministério de Casais (Deduplicação Bidirecional)</h3>
              <p className="text-xs text-muted-foreground">
                Casais agrupados automaticamente. Cônjuges cadastrados aparecem em uma única linha.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{casaisList.length} casais registrados</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Casal</TableHead>
                <TableHead>Marido</TableHead>
                <TableHead>Esposa</TableHead>
                <TableHead>Vínculo no Sistema</TableHead>
                <TableHead>Telefone de Contato</TableHead>
                <TableHead>Congregação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casaisList.length ? (
                casaisList.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-foreground flex items-center gap-2">
                      <Heart className="size-3.5 text-rose-500 fill-rose-500/20 shrink-0" />
                      <span>{c.nomeCasal}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.marido ? (
                        <div>
                          <div className="font-medium">{c.marido.nome ?? c.marido.name}</div>
                          <div className="text-xs text-muted-foreground">{c.marido.phone || c.marido.telefone || ""}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não cadastrado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.esposa ? (
                        <div>
                          <div className="font-medium">{c.esposa.nome ?? c.esposa.name}</div>
                          <div className="text-xs text-muted-foreground">{c.esposa.phone || c.esposa.telefone || ""}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não cadastrado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.temConjugeCadastrado ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Ambos Cadastrados
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          Cônjuge Pendente
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.telefoneContato}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.congregacao}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum membro casado registrado nesta congregação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 3. ABA HOMENS: Ministério Masculino (>= 18 anos) */}
      {tab === "homens" && (
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="border-b px-5 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Ministério de Homens (≥ 18 anos)</h3>
              <p className="text-xs text-muted-foreground">Homens aptos para grupos e ministérios de liderança masculina.</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{homensList.length} membros</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Estado Civil</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Célula</TableHead>
                <TableHead>Congregação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homensList.length ? (
                homensList.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome ?? m.name}</TableCell>
                    <TableCell>
                      {m.calculatedAge !== null ? (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {m.calculatedAge} anos
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{m.estadoCivil ?? m.marital_status ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{m.telefone ?? m.phone ?? "—"}</TableCell>
                    <TableCell>{m.cargo ?? m.role ?? "Membro"}</TableCell>
                    <TableCell>{m.celula ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.congregacao}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum membro do ministério masculino cadastrado nesta congregação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 4. ABA MULHERES: Ministério Feminino (>= 18 anos) */}
      {tab === "mulheres" && (
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="border-b px-5 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Ministério de Mulheres (≥ 18 anos)</h3>
              <p className="text-xs text-muted-foreground">Mulheres aptas para grupos de intercessão e ministério feminino.</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{mulheresList.length} membros</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Estado Civil</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Célula</TableHead>
                <TableHead>Congregação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mulheresList.length ? (
                mulheresList.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome ?? m.name}</TableCell>
                    <TableCell>
                      {m.calculatedAge !== null ? (
                        <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                          {m.calculatedAge} anos
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{m.estadoCivil ?? m.marital_status ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{m.telefone ?? m.phone ?? "—"}</TableCell>
                    <TableCell>{m.cargo ?? m.role ?? "Membro"}</TableCell>
                    <TableCell>{m.celula ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.congregacao}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum membro do ministério feminino cadastrado nesta congregação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 5. ABA CRIANÇAS: Turmas da EBD Infantil (ordenada crescente por idade com pais) */}
      {tab === "criancas" && (
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="border-b px-5 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Turmas de Crianças da Escola Bíblica Dominical (EBD)</h3>
              <p className="text-xs text-muted-foreground">
                Ordenado por idade crescente para formação de turmas (Maternal, Primários, Juniores) com contato dos pais.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{criancasList.length} crianças</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criança</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Turma Sugerida</TableHead>
                <TableHead>Pai</TableHead>
                <TableHead>Mãe</TableHead>
                <TableHead>Telefone Responsável</TableHead>
                <TableHead>Congregação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criancasList.length ? (
                criancasList.map((c) => {
                  const age = c.calculatedAge ?? 0;
                  const turma =
                    age <= 3 ? "Berçário / Maternal" : age <= 6 ? "Jardim da Infância" : age <= 9 ? "Primários" : "Juniores";

                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold text-foreground flex items-center gap-2">
                        <Baby className="size-4 text-amber-500 shrink-0" />
                        <span>{c.nome ?? c.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          {age} {age === 1 ? "ano" : "anos"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                          {turma}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{c.father_name ?? c.pai ?? "—"}</TableCell>
                      <TableCell className="text-sm">{c.mother_name ?? c.mae ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{c.telefone ?? c.phone ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.congregacao}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma criança cadastrada nesta congregação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 6. ABA JOVENS / ADOLESCENTES (13 a 17 anos) */}
      {tab === "jovens" && (
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="border-b px-5 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Adolescentes & Jovens (13 a 17 anos)</h3>
              <p className="text-xs text-muted-foreground">Jovens em transição para o ministério jovem e liderança futura.</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{jovensList.length} jovens</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Pai / Mãe</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Célula</TableHead>
                <TableHead>Congregação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jovensList.length ? (
                jovensList.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.nome ?? j.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {j.calculatedAge} anos
                      </span>
                    </TableCell>
                    <TableCell>{j.sexo ?? j.sex ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {j.father_name || j.pai || j.mother_name || j.mae || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{j.telefone ?? j.phone ?? "—"}</TableCell>
                    <TableCell>{j.celula ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{j.congregacao}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum adolescente cadastrado nesta congregação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
