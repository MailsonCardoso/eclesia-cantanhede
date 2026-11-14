import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Home,
  Users,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  ArrowLeft,
  UserRound,
  TrendingUp,
  Percent,
  CheckCircle2,
  X,
  Phone,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MetricCard } from "@/components/MetricCard";
import { exportCSV, useStore, type Row } from "@/lib/store";
import { maskTime } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/celulas")({
  head: () => ({
    meta: [
      { title: "Células — EclesiaPro" },
      { name: "description", content: "Grupos de comunhão nos lares, estatísticas e acompanhamento de membros." },
      { property: "og:title", content: "Células — EclesiaPro" },
      { property: "og:description", content: "Grupos de comunhão nos lares, estatísticas e acompanhamento de membros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Celulas,
});

const DIAS_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const CARD_TONES = [
  { border: "hover:border-primary/50", iconBg: "bg-primary/10 text-primary", bar: "bg-primary" },
  { border: "hover:border-chart-2/50", iconBg: "bg-chart-2/10 text-chart-2", bar: "bg-chart-2" },
  { border: "hover:border-emerald-500/50", iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  { border: "hover:border-amber-500/50", iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
];

function Celulas() {
  const { db, create, update, remove } = useStore();
  const [q, setQ] = useState("");
  const [filtroCongregacao, setFiltroCongregacao] = useState("__all");
  const [filtroSituacao, setFiltroSituacao] = useState("__all");
  const [filtroDia, setFiltroDia] = useState("__all");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const [viewMembersCell, setViewMembersCell] = useState<Row | null>(null);

  // Formulário
  const [form, setForm] = useState({
    nome: "",
    lider: "",
    anfitriao: "",
    endereco: "",
    dia: "Quarta-feira",
    hora: "19:30",
    congregacao: "",
    participantes: "15",
    situacao: "Ativa",
    observacoes: "",
  });

  const congregations = useMemo(() => {
    return (db.congregations || []).map((c) => String(c.nome)).sort((a, b) => a.localeCompare(b));
  }, [db.congregations]);

  const membersList = useMemo(() => {
    return db.members.map((m) => ({
      id: String(m.id),
      nome: String(m.nome),
      cargo: String(m.cargo || ""),
      telefone: String(m.telefone || ""),
      celula: String(m.celula || ""),
    }));
  }, [db.members]);

  const leaderCandidates = useMemo(() => {
    return membersList
      .filter((m) => {
        const c = m.cargo.toLowerCase();
        return c === "líder" || c === "lider" || c.includes("líder") || c.includes("lider");
      })
      .map((m) => m.nome)
      .sort((a, b) => a.localeCompare(b));
  }, [membersList]);

  // Células enriquecidas com os membros reais associados
  const cellsWithStats = useMemo(() => {
    const totalMembrosIgreja = db.members.length || 1;

    return db.cells.map((cell) => {
      const cellNameLower = String(cell.nome || "").trim().toLowerCase();
      // Membros que têm esta célula no seu cadastro
      const vinculados = db.members.filter(
        (m) => String(m.celula || "").trim().toLowerCase() === cellNameLower
      );

      const capacidadeMeta = Number(cell.participantes || 0);
      const qtdVinculados = vinculados.length;

      // % em relação à meta/capacidade informada
      const taxaMeta = capacidadeMeta > 0 ? Math.round((qtdVinculados / capacidadeMeta) * 100) : 0;

      // % de representatividade em relação à igreja toda
      const percentIgreja = ((qtdVinculados / totalMembrosIgreja) * 100).toFixed(1);

      return {
        ...cell,
        membrosVinculados: vinculados,
        qtdMembros: qtdVinculados,
        capacidadeMeta,
        taxaMeta,
        percentIgreja,
      };
    });
  }, [db.cells, db.members]);

  // Métricas Consolidadas do Topo
  const metrics = useMemo(() => {
    const totalCelulas = db.cells.length;
    const celulasAtivas = db.cells.filter((c) => c.situacao === "Ativa").length;

    // Membros que participam de alguma célula
    const membrosEmCelulas = db.members.filter((m) => {
      const c = String(m.celula || "").trim().toLowerCase();
      return c && c !== "não participa de célula" && c !== "__none" && c !== "";
    }).length;

    const percentEngajamento =
      db.members.length > 0 ? Math.round((membrosEmCelulas / db.members.length) * 100) : 0;

    const mediaPorCelula =
      celulasAtivas > 0 ? (membrosEmCelulas / celulasAtivas).toFixed(1) : "0";

    return {
      totalCelulas,
      celulasAtivas,
      membrosEmCelulas,
      percentEngajamento,
      mediaPorCelula,
    };
  }, [db.cells, db.members]);

  // Filtros aplicados
  const filteredCells = useMemo(() => {
    const query = q.toLowerCase().trim();
    return cellsWithStats.filter((c) => {
      const matchQuery =
        !query ||
        String(c.nome || "").toLowerCase().includes(query) ||
        String(c.lider || "").toLowerCase().includes(query) ||
        String(c.anfitriao || "").toLowerCase().includes(query) ||
        String(c.endereco || "").toLowerCase().includes(query) ||
        String(c.congregacao || "").toLowerCase().includes(query);

      const matchCong = filtroCongregacao === "__all" || c.congregacao === filtroCongregacao;
      const matchSit = filtroSituacao === "__all" || c.situacao === filtroSituacao;
      const matchDia = filtroDia === "__all" || c.dia === filtroDia;

      return matchQuery && matchCong && matchSit && matchDia;
    });
  }, [cellsWithStats, q, filtroCongregacao, filtroSituacao, filtroDia]);

  const handleOpenNew = () => {
    setEditing(null);
    setForm({
      nome: "",
      lider: leaderCandidates[0] || (membersList[0]?.nome ?? ""),
      anfitriao: "",
      endereco: "",
      dia: "Quarta-feira",
      hora: "19:30",
      congregacao: congregations[0] || "",
      participantes: "15",
      situacao: "Ativa",
      observacoes: "",
    });
    setOpenForm(true);
  };

  const handleOpenEdit = (cell: Row) => {
    setEditing(cell);
    setForm({
      nome: String(cell.nome || ""),
      lider: String(cell.lider || ""),
      anfitriao: String(cell.anfitriao || ""),
      endereco: String(cell.endereco || ""),
      dia: String(cell.dia || "Quarta-feira"),
      hora: String(cell.hora || "19:30"),
      congregacao: String(cell.congregacao || ""),
      participantes: String(cell.participantes || "15"),
      situacao: String(cell.situacao || "Ativa"),
      observacoes: String(cell.observacoes || ""),
    });
    setOpenForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome da célula.");
      return;
    }

    const payload = {
      ...form,
      participantes: Number(form.participantes || 0),
    };

    if (editing?.id) {
      update("cells", { ...editing, ...payload });
      toast.success("Célula atualizada com sucesso!");
    } else {
      create("cells", payload);
      toast.success("Célula cadastrada com sucesso!");
    }

    setOpenForm(false);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredCells.map((c) => ({
      Nome: c.nome,
      Líder: c.lider,
      Anfitrião: c.anfitriao,
      "Dia de Encontro": c.dia,
      Horário: c.hora,
      Congregação: c.congregacao,
      "Capacidade / Meta": c.capacidadeMeta,
      "Membros Vinculados": c.qtdMembros,
      "Taxa de Meta (%)": `${c.taxaMeta}%`,
      "Part. da Igreja (%)": `${c.percentIgreja}%`,
      Situação: c.situacao,
      Endereço: c.endereco,
    }));
    exportCSV("cells", dataToExport, [
      { key: "Nome", label: "Nome" },
      { key: "Líder", label: "Líder" },
      { key: "Anfitrião", label: "Anfitrião" },
      { key: "Dia de Encontro", label: "Dia de Encontro" },
      { key: "Horário", label: "Horário" },
      { key: "Congregação", label: "Congregação" },
      { key: "Capacidade / Meta", label: "Capacidade / Meta" },
      { key: "Membros Vinculados", label: "Membros Vinculados" },
      { key: "Taxa de Meta (%)", label: "Taxa de Meta (%)" },
      { key: "Part. da Igreja (%)", label: "Part. da Igreja (%)" },
      { key: "Situação", label: "Situação" },
      { key: "Endereço", label: "Endereço" },
    ]);
  };

  // Se o formulário estiver aberto
  if (openForm) {
    return (
      <div className="space-y-6 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenForm(false)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Voltar para Células
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Home className="size-6 text-primary" />
                {editing ? "Editar Célula" : "Nova Célula"}
              </h1>
              <p className="text-xs text-muted-foreground">Preencha os dados e a liderança do grupo nos lares.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button variant="premium" type="submit" form="celula-form" className="px-6">
              Salvar Célula
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-card gradient-top">
          <form id="celula-form" onSubmit={handleSave} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome" className="text-xs font-semibold">
                Nome da Célula *
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Célula Betel, Célula Koinonia..."
                value={form.nome}
                onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                required
                className="rounded-xl shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="situacao" className="text-xs font-semibold">
                Situação
              </Label>
              <Select value={form.situacao} onValueChange={(v) => setForm((s) => ({ ...s, situacao: v }))}>
                <SelectTrigger id="situacao" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lider" className="text-xs font-semibold">
                Líder Responsável
              </Label>
              <Select value={form.lider} onValueChange={(v) => setForm((s) => ({ ...s, lider: v }))}>
                <SelectTrigger id="lider" className="rounded-xl">
                  <SelectValue placeholder="Selecione o líder" />
                </SelectTrigger>
                <SelectContent>
                  {leaderCandidates.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n} (Líder)
                    </SelectItem>
                  ))}
                  {membersList
                    .filter((m) => !leaderCandidates.includes(m.nome))
                    .map((m) => (
                      <SelectItem key={m.nome} value={m.nome}>
                        {m.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anfitriao" className="text-xs font-semibold">
                Anfitrião (Lar de Encontro)
              </Label>
              <Select value={form.anfitriao || "__none"} onValueChange={(v) => setForm((s) => ({ ...s, anfitriao: v === "__none" ? "" : v }))}>
                <SelectTrigger id="anfitriao" className="rounded-xl">
                  <SelectValue placeholder="Selecione o anfitrião" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Não especificado / Rotativo</SelectItem>
                  {membersList.map((m) => (
                    <SelectItem key={m.nome} value={m.nome}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="congregacao" className="text-xs font-semibold">
                Congregação Vinculada
              </Label>
              <Select value={form.congregacao || "__none"} onValueChange={(v) => setForm((s) => ({ ...s, congregacao: v === "__none" ? "" : v }))}>
                <SelectTrigger id="congregacao" className="rounded-xl">
                  <SelectValue placeholder="Selecione a congregação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sede / Geral</SelectItem>
                  {congregations.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dia" className="text-xs font-semibold">
                Dia da Reunião
              </Label>
              <Select value={form.dia} onValueChange={(v) => setForm((s) => ({ ...s, dia: v }))}>
                <SelectTrigger id="dia" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hora" className="text-xs font-semibold">
                Horário de Início
              </Label>
              <Input
                id="hora"
                placeholder="00:00"
                maxLength={5}
                value={form.hora}
                onChange={(e) => setForm((s) => ({ ...s, hora: maskTime(e.target.value) }))}
                className="rounded-xl shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="participantes" className="text-xs font-semibold">
                Meta / Capacidade de Membros
              </Label>
              <Input
                id="participantes"
                type="number"
                min={1}
                placeholder="Ex: 15"
                value={form.participantes}
                onChange={(e) => setForm((s) => ({ ...s, participantes: e.target.value }))}
                className="rounded-xl shadow-sm"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="endereco" className="text-xs font-semibold">
                Endereço de Encontro
              </Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro..."
                value={form.endereco}
                onChange={(e) => setForm((s) => ({ ...s, endereco: e.target.value }))}
                className="rounded-xl shadow-sm"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="observacoes" className="text-xs font-semibold">
                Observações Pastorais / Notas
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre o grupo, objetivos ou data de multiplicação..."
                rows={3}
                value={form.observacoes}
                onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))}
                className="rounded-xl shadow-sm"
              />
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-rise">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Home className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Células e Grupos nos Lares</h1>
            <p className="text-sm text-muted-foreground">
              Comunhão, liderança, presença de membros e acompanhamento estatístico.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 rounded-xl text-xs">
            <FileSpreadsheet className="size-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2 rounded-xl text-xs">
            <Printer className="size-4" /> Imprimir
          </Button>
          <Button variant="premium" onClick={handleOpenNew} className="gap-2 rounded-xl text-xs">
            <Plus className="size-4" /> Nova Célula
          </Button>
        </div>
      </div>

      {/* Cards de Métricas e Estatísticas Consolidadas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Células cadastradas"
          value={metrics.totalCelulas}
          icon={Home}
          tone="blue"
        />
        <MetricCard
          label="Células ativas"
          value={metrics.celulasAtivas}
          icon={CheckCircle2}
          tone="green"
        />
        <MetricCard
          label="Membros em células"
          value={`${metrics.membrosEmCelulas} (${metrics.percentEngajamento}%)`}
          icon={Users}
          tone="orange"
        />
        <MetricCard
          label="Média de membros / célula"
          value={metrics.mediaPorCelula}
          icon={TrendingUp}
          tone="violet"
        />
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm no-print">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Pesquisar por nome da célula, líder, endereço..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 rounded-xl text-xs shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Congregação */}
          <Select value={filtroCongregacao} onValueChange={setFiltroCongregacao}>
            <SelectTrigger className="w-44 rounded-xl text-xs">
              <SelectValue placeholder="Congregação: todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as Congregações</SelectItem>
              {congregations.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Dia */}
          <Select value={filtroDia} onValueChange={setFiltroDia}>
            <SelectTrigger className="w-36 rounded-xl text-xs">
              <SelectValue placeholder="Dia: todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os Dias</SelectItem>
              {DIAS_SEMANA.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Situação */}
          <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
            <SelectTrigger className="w-32 rounded-xl text-xs">
              <SelectValue placeholder="Situação: todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas</SelectItem>
              <SelectItem value="Ativa">Ativas</SelectItem>
              <SelectItem value="Inativa">Inativas</SelectItem>
            </SelectContent>
          </Select>

          {(q || filtroCongregacao !== "__all" || filtroSituacao !== "__all" || filtroDia !== "__all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setFiltroCongregacao("__all");
                setFiltroSituacao("__all");
                setFiltroDia("__all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Grid de Cards de Células */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCells.map((cell, idx) => {
          const tone = CARD_TONES[idx % CARD_TONES.length];
          const isAtiva = cell.situacao === "Ativa";

          return (
            <div
              key={cell.id}
              className={`rounded-3xl border bg-card p-5 shadow-card transition-all card-hover flex flex-col justify-between space-y-4 ${tone.border}`}
            >
              {/* Topo do Card */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`grid size-11 place-items-center rounded-2xl ${tone.iconBg} shrink-0`}>
                      <Home className="size-5.5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-base text-foreground truncate">{cell.nome}</h2>
                      <p className="text-xs text-muted-foreground truncate">{cell.congregacao || "Sede Central"}</p>
                    </div>
                  </div>

                  <Badge variant={isAtiva ? "default" : "secondary"} className="shrink-0 text-[11px] font-semibold">
                    {cell.situacao}
                  </Badge>
                </div>

                {/* Detalhes de Liderança e Encontro */}
                <div className="rounded-2xl border bg-muted/20 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium truncate">
                    <UserRound className="size-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground font-normal">Líder:</span>
                    <span className="truncate">{cell.lider || "Não definido"}</span>
                  </div>

                  {cell.anfitriao && (
                    <div className="flex items-center gap-2 text-foreground font-medium truncate">
                      <Home className="size-3.5 text-chart-2 shrink-0" />
                      <span className="text-muted-foreground font-normal">Anfitrião:</span>
                      <span className="truncate">{cell.anfitriao}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Calendar className="size-3.5 text-amber-500 shrink-0" />
                    <span>{cell.dia}</span>
                    <span className="text-muted-foreground">·</span>
                    <Clock className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{cell.hora || "19:30"}</span>
                  </div>

                  {cell.endereco && (
                    <div className="flex items-center gap-2 text-muted-foreground truncate pt-0.5 border-t border-border/50">
                      <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{cell.endereco}</span>
                    </div>
                  )}
                </div>

                {/* Bloco de Estatística e Associação de Membros */}
                <div className="rounded-2xl border bg-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" /> Membros na Célula
                    </span>
                    <span className="font-bold text-primary text-sm">
                      {cell.qtdMembros}
                      <span className="text-[11px] font-normal text-muted-foreground ml-1">
                        / {cell.capacidadeMeta > 0 ? `${cell.capacidadeMeta} meta` : "sem meta"}
                      </span>
                    </span>
                  </div>

                  {/* Barra de Progresso da Meta */}
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cell.taxaMeta >= 100
                          ? "bg-emerald-500"
                          : cell.taxaMeta >= 60
                          ? "bg-primary"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(cell.taxaMeta, 100)}%` }}
                    />
                  </div>

                  {/* Estatísticas e Percentuais */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Percent className="size-3 text-emerald-500" />
                      {cell.percentIgreja}% da igreja
                    </span>
                    {cell.capacidadeMeta > 0 && (
                      <span className="font-medium text-foreground">
                        {cell.taxaMeta}% da meta
                      </span>
                    )}
                  </div>

                  {/* Pré-visualização dos Membros */}
                  {cell.qtdMembros > 0 ? (
                    <div className="pt-2 border-t flex flex-wrap gap-1 items-center">
                      {cell.membrosVinculados.slice(0, 3).map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-[10.5px] font-medium text-foreground truncate max-w-28"
                          title={String(m.nome)}
                        >
                          <UserCheck className="size-2.5 text-primary shrink-0" />
                          <span className="truncate">{String(m.nome).split(" ")[0]}</span>
                        </span>
                      ))}
                      {cell.qtdMembros > 3 && (
                        <button
                          type="button"
                          onClick={() => setViewMembersCell(cell)}
                          className="text-[10px] text-primary font-semibold hover:underline px-1"
                        >
                          +{cell.qtdMembros - 3} mais
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="pt-1.5 text-[10.5px] text-muted-foreground italic">
                      Nenhum membro associado ainda no cadastro.
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé de Ações do Card */}
              <div className="pt-3 border-t flex items-center justify-between gap-2 no-print">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMembersCell(cell)}
                  className="gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-xl px-2.5 h-8"
                >
                  <Eye className="size-3.5" /> Ver Membros ({cell.qtdMembros})
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpenEdit(cell)}
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                    title="Editar Célula"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConfirmDel(cell)}
                    className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                    title="Excluir Célula"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCells.length === 0 && (
        <div className="rounded-3xl border bg-card p-12 text-center text-muted-foreground shadow-card">
          <Home className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-base">Nenhuma célula encontrada</h3>
          <p className="text-xs text-muted-foreground mt-1">Tente ajustar a busca ou limpe os filtros aplicados.</p>
        </div>
      )}

      {/* Modal: Membros da Célula */}
      <Dialog open={!!viewMembersCell} onOpenChange={(o) => !o && setViewMembersCell(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border shadow-2xl">
          <DialogHeader className="p-5 pb-3 bg-muted/30 border-b">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {viewMembersCell?.nome}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {viewMembersCell?.qtdMembros} membro(s) vinculados · {viewMembersCell?.percentIgreja}% da membresia
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 max-h-80 overflow-y-auto space-y-2 text-xs">
            {viewMembersCell?.membrosVinculados?.length ? (
              viewMembersCell.membrosVinculados.map((m: Row) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{m.nome}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {m.cargo && m.cargo !== "Sem função / cargo" ? m.cargo : "Membro"} · {m.congregacao || "Sede"}
                    </div>
                  </div>

                  {m.telefone && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=55${String(m.telefone).replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors text-[11px] font-medium"
                      title="Chamar no WhatsApp"
                    >
                      <Phone className="size-3" /> {m.telefone}
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground italic">
                Nenhum membro vinculado a esta célula no cadastro de membros.
              </div>
            )}
          </div>

          <DialogFooter className="p-3 bg-muted/20 border-t">
            <Button variant="outline" size="sm" onClick={() => setViewMembersCell(null)} className="w-full rounded-xl">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Exclusão */}
      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir Célula?</DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir <strong>{confirmDel?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDel(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!confirmDel) return;
                remove("cells", confirmDel.id);
                setConfirmDel(null);
                toast.success("Célula excluída com sucesso!");
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
