import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Network,
  Users,
  UserCheck,
  UserRound,
  ShieldCheck,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Pencil,
  Trash2,
  ArrowLeft,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  CheckCircle2,
  TrendingUp,
  Percent,
  X,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { MetricCard } from "@/components/MetricCard";
import { useStore, exportCSV, type Row } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/departamentos")({
  head: () => ({
    meta: [
      { title: "Departamentos e Ministérios — EclesiaPro" },
      { name: "description", content: "Departamentos, ministérios da igreja, liderança e integrantes calculados do cadastro." },
      { property: "og:title", content: "Departamentos e Ministérios — EclesiaPro" },
      { property: "og:description", content: "Departamentos, ministérios da igreja, liderança e integrantes calculados do cadastro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Departamentos,
});

const CARD_TONES = [
  { border: "hover:border-primary/50", iconBg: "bg-primary/10 text-primary", badgeBg: "bg-primary/10 text-primary" },
  { border: "hover:border-chart-2/50", iconBg: "bg-chart-2/10 text-chart-2", badgeBg: "bg-chart-2/10 text-chart-2" },
  { border: "hover:border-emerald-500/50", iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { border: "hover:border-purple-500/50", iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400", badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { border: "hover:border-amber-500/50", iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
];

function Departamentos() {
  const { db, create, update, remove } = useStore();

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [q, setQ] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("__all");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const [viewMembersDep, setViewMembersDep] = useState<Row | null>(null);

  // Formulário 100% limpo ao criar novo
  const [form, setForm] = useState({
    nome: "",
    lider: "",
    situacao: "Ativo",
    descricao: "",
  });

  const membersList = useMemo(() => {
    return db.members.map((m) => ({
      id: String(m.id),
      nome: String(m.nome),
      cargo: String(m.cargo || ""),
      telefone: String(m.telefone || ""),
      departamento: String(m.departamento || ""),
      congregacao: String(m.congregacao || ""),
    }));
  }, [db.members]);

  const leaderCandidates = useMemo(() => {
    return membersList
      .filter((m) => {
        const c = m.cargo.toLowerCase();
        return c.includes("líder") || c.includes("lider") || c.includes("pastor") || c.includes("obreiro") || c.includes("diácono");
      })
      .map((m) => m.nome)
      .sort((a, b) => a.localeCompare(b));
  }, [membersList]);

  // Departamentos enriquecidos com integrantes calculados automaticamente de db.members
  const departmentsWithStats = useMemo(() => {
    const totalMembrosIgreja = db.members.length || 1;

    return (db.departments || []).map((dep) => {
      const depNameLower = String(dep.nome || "").trim().toLowerCase();
      // Membros que possuem este departamento no cadastro
      const vinculados = db.members.filter(
        (m) => String(m.departamento || "").trim().toLowerCase() === depNameLower
      );

      const qtdIntegrantes = vinculados.length;
      const percentIgreja = ((qtdIntegrantes / totalMembrosIgreja) * 100).toFixed(1);

      return {
        ...dep,
        membrosVinculados: vinculados,
        qtdIntegrantes,
        percentIgreja,
      };
    });
  }, [db.departments, db.members]);

  // Métricas do Topo
  const metrics = useMemo(() => {
    const total = (db.departments || []).length;
    const totalSafe = db.members.length || 1;
    const ativos = (db.departments || []).filter((d) => d.situacao === "Ativo").length;

    const membrosEmDeptos = db.members.filter((m) => {
      const d = String(m.departamento || "").trim().toLowerCase();
      return d && d !== "nenhum / geral" && d !== "__none" && d !== "";
    }).length;

    const percentEngajamento = Math.round((membrosEmDeptos / totalSafe) * 100);
    const mediaPorDepto = ativos > 0 ? (membrosEmDeptos / ativos).toFixed(1) : "0";

    return {
      total,
      ativos,
      membrosEmDeptos,
      percentEngajamento,
      mediaPorDepto,
    };
  }, [db.departments, db.members]);

  // Filtros aplicados
  const filteredDepartments = useMemo(() => {
    const query = q.toLowerCase().trim();
    return departmentsWithStats.filter((d) => {
      const matchQuery =
        !query ||
        String(d.nome || "").toLowerCase().includes(query) ||
        String(d.lider || "").toLowerCase().includes(query) ||
        String(d.descricao || "").toLowerCase().includes(query);

      const matchSit = filtroSituacao === "__all" || d.situacao === filtroSituacao;
      return matchQuery && matchSit;
    });
  }, [departmentsWithStats, q, filtroSituacao]);

  // Abertura do Formulário Novo (100% limpo)
  const handleOpenNew = () => {
    setEditing(null);
    setForm({
      nome: "",
      lider: "",
      situacao: "Ativo",
      descricao: "",
    });
    setOpenForm(true);
  };

  // Abertura do Formulário Edição
  const handleOpenEdit = (dep: Row) => {
    setEditing(dep);
    setForm({
      nome: String(dep.nome || ""),
      lider: String(dep.lider || ""),
      situacao: String(dep.situacao || "Ativo"),
      descricao: String(dep.descricao || ""),
    });
    setOpenForm(true);
  };

  // Salvar Departamento
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome do departamento.");
      return;
    }

    // Calcula os integrantes automaticamente da base de membros
    const depNameLower = form.nome.trim().toLowerCase();
    const integrantesCalculados = db.members.filter(
      (m) => String(m.departamento || "").trim().toLowerCase() === depNameLower
    ).length;

    const payload = {
      ...form,
      integrantes: integrantesCalculados,
    };

    if (editing?.id) {
      update("departments", { ...editing, ...payload });
      toast.success("Departamento atualizado com sucesso!");
    } else {
      create("departments", payload);
      toast.success("Departamento cadastrado com sucesso!");
    }

    setOpenForm(false);
  };

  // Exportar Excel
  const handleExportCSV = () => {
    const dataToExport = filteredDepartments.map((d) => ({
      Nome: d.nome,
      Líder: d.lider || "Não definido",
      "Integrantes Cadastrados": d.qtdIntegrantes,
      "Part. da Igreja (%)": `${d.percentIgreja}%`,
      Situação: d.situacao,
      Descrição: d.descricao || "",
    }));

    exportCSV("departments", dataToExport, [
      { key: "Nome", label: "Nome" },
      { key: "Líder", label: "Líder" },
      { key: "Integrantes Cadastrados", label: "Integrantes Cadastrados" },
      { key: "Part. da Igreja (%)", label: "Part. da Igreja (%)" },
      { key: "Situação", label: "Situação" },
      { key: "Descrição", label: "Descrição" },
    ]);
  };

  // Se o formulário estiver aberto
  if (openForm) {
    // Busca integrantes atuais se estiver editando
    const integrantesAtuais = editing
      ? db.members.filter(
          (m) => String(m.departamento || "").trim().toLowerCase() === String(editing.nome || "").trim().toLowerCase()
        ).length
      : 0;

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
              <ArrowLeft className="size-4" /> Voltar para Departamentos
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Network className="size-6 text-primary" />
                {editing ? "Editar Departamento" : "Novo Departamento"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Configure os dados do ministério e liderança responsável.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button variant="premium" type="submit" form="depto-form" className="px-6">
              Salvar Departamento
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-card gradient-top">
          <form id="depto-form" onSubmit={handleSave} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome" className="text-xs font-semibold">
                Nome do Departamento / Ministério *
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Ministério de Louvor, Jovens, Mulheres, Ação Social..."
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
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lider" className="text-xs font-semibold">
                Líder Responsável
              </Label>
              <Select
                value={form.lider || "__none"}
                onValueChange={(v) => setForm((s) => ({ ...s, lider: v === "__none" ? "" : v }))}
              >
                <SelectTrigger id="lider" className="rounded-xl">
                  <SelectValue placeholder="Selecione o líder responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Não definido</SelectItem>
                  {leaderCandidates.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n} (Líder / Ministro)
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

            {/* Bloco de Integrantes: Sem opção de mudar manualmente */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Users className="size-3.5 text-primary" /> Nº de Integrantes
              </Label>
              <div className="rounded-xl border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
                <span className="font-semibold text-foreground text-sm">
                  {editing ? `${integrantesAtuais} integrante(s)` : "Calculado automaticamente"}
                </span>
                <Badge variant="outline" className="text-[10px] bg-background">
                  Automático
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                <Info className="size-3 text-primary shrink-0" />
                Calculado em tempo real pelo cadastro de membros.
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="descricao" className="text-xs font-semibold">
                Descrição e Objetivos do Ministério
              </Label>
              <Textarea
                id="descricao"
                placeholder="Propósito do departamento, atividades regulares, horários de ensaio ou reuniões..."
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
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
            <Network className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Departamentos e Ministérios</h1>
            <p className="text-sm text-muted-foreground">
              Liderança, integrantes integrados ao cadastro e acompanhamento ministerial.
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
            <Plus className="size-4" /> Novo Departamento
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Departamentos cadastrados"
          value={metrics.total}
          icon={Network}
          tone="blue"
        />
        <MetricCard
          label="Ministérios ativos"
          value={metrics.ativos}
          icon={CheckCircle2}
          tone="green"
        />
        <MetricCard
          label="Membros em departamentos"
          value={`${metrics.membrosEmDeptos} (${metrics.percentEngajamento}%)`}
          icon={Users}
          tone="orange"
        />
        <MetricCard
          label="Média de integrantes / depto"
          value={metrics.mediaPorDepto}
          icon={TrendingUp}
          tone="violet"
        />
      </div>

      {/* Barra de Filtros, Busca e Alternador de Modo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm no-print">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Pesquisar por nome do departamento, líder..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 rounded-xl text-xs shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Situação */}
          <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
            <SelectTrigger className="w-36 rounded-xl text-xs">
              <SelectValue placeholder="Situação: todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as Situações</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>

          {(q || filtroSituacao !== "__all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setFiltroSituacao("__all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </Button>
          )}

          {/* Alternador de Visualização Cards / Tabela */}
          <div className="flex items-center rounded-xl border bg-muted/40 p-0.5 ml-1">
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 px-2.5 rounded-lg text-xs gap-1.5"
              title="Visualização em Cards"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-2.5 rounded-lg text-xs gap-1.5"
              title="Visualização em Tabela"
            >
              <TableIcon className="size-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Visualização 1: Grade de Cards */}
      {viewMode === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dep, idx) => {
            const tone = CARD_TONES[idx % CARD_TONES.length];
            const isAtivo = dep.situacao === "Ativo";

            return (
              <div
                key={dep.id}
                className={`rounded-3xl border bg-card p-5 shadow-card transition-all card-hover flex flex-col justify-between space-y-4 ${tone.border}`}
              >
                {/* Topo do Card */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`grid size-11 place-items-center rounded-2xl ${tone.iconBg} shrink-0`}>
                        <Network className="size-5.5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-base text-foreground truncate">{dep.nome}</h2>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate pt-0.5">
                          <ShieldCheck className="size-3 text-primary shrink-0" />
                          <span className="truncate">{dep.lider || "Líder não definido"}</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant={isAtivo ? "default" : "secondary"} className="shrink-0 text-[11px] font-semibold">
                      {dep.situacao}
                    </Badge>
                  </div>

                  {dep.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      "{dep.descricao}"
                    </p>
                  )}

                  {/* Bloco de Integrantes Calculados Automaticamente */}
                  <div className="rounded-2xl border bg-card p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Users className="size-3.5 text-primary" /> Integrantes no Cadastro
                      </span>
                      <span className="font-bold text-primary text-sm">
                        {dep.qtdIntegrantes}
                        <span className="text-[11px] font-normal text-muted-foreground ml-1">
                          membros
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Percent className="size-3 text-emerald-500" />
                        {dep.percentIgreja}% da membresia
                      </span>
                      <span className="text-[10.5px] italic text-muted-foreground">
                        calculado automaticamente
                      </span>
                    </div>

                    {/* Chips dos Primeiros Integrantes */}
                    {dep.qtdIntegrantes > 0 ? (
                      <div className="pt-2 border-t flex flex-wrap gap-1 items-center">
                        {dep.membrosVinculados.slice(0, 3).map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-[10.5px] font-medium text-foreground truncate max-w-28"
                            title={String(m.nome)}
                          >
                            <UserCheck className="size-2.5 text-primary shrink-0" />
                            <span className="truncate">{String(m.nome).split(" ")[0]}</span>
                          </span>
                        ))}
                        {dep.qtdIntegrantes > 3 && (
                          <button
                            type="button"
                            onClick={() => setViewMembersDep(dep)}
                            className="text-[10px] text-primary font-semibold hover:underline px-1"
                          >
                            +{dep.qtdIntegrantes - 3} mais
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="pt-1.5 text-[10.5px] text-muted-foreground italic">
                        Nenhum membro associado a este departamento ainda.
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card: Ações */}
                <div className="pt-3 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMembersDep(dep)}
                    className="h-8 gap-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <Eye className="size-3.5" />
                    Ver Integrantes ({dep.qtdIntegrantes})
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(dep)}
                      className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Editar Departamento"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDel(dep)}
                      className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                      title="Excluir Departamento"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDepartments.length === 0 && (
            <div className="col-span-full rounded-3xl border bg-card p-12 text-center text-muted-foreground">
              <Network className="mx-auto mb-3 size-10 text-muted-foreground/50" />
              <p className="text-base font-semibold text-foreground">Nenhum departamento encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar os filtros ou adicione um novo departamento no botão superior.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Visualização 2: Tabela */
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departamento</TableHead>
                <TableHead>Líder Responsável</TableHead>
                <TableHead>Nº de Integrantes (Cadastro)</TableHead>
                <TableHead>Representatividade (%)</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-28 text-right no-print">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                        <Network className="size-4" />
                      </div>
                      <span className="truncate">{String(dep.nome)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {dep.lider ? (
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3 text-primary shrink-0" />
                        {dep.lider}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Não definido</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-primary">
                    {dep.qtdIntegrantes} membro(s)
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10.5px]">
                      {dep.percentIgreja}% da igreja
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dep.situacao === "Ativo" ? "default" : "secondary"} className="text-[10px]">
                      {dep.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right no-print whitespace-nowrap">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setViewMembersDep(dep)}
                      title="Ver Integrantes"
                      className="size-8"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenEdit(dep)}
                      title="Editar"
                      className="size-8"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDel(dep)}
                      title="Excluir"
                      className="size-8 text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDepartments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Nenhum departamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>{filteredDepartments.length} departamento(s) exibido(s)</span>
            <span>Total da igreja: {(db.departments || []).length}</span>
          </div>
        </div>
      )}

      {/* Modal: Ver Integrantes do Departamento */}
      <Dialog open={!!viewMembersDep} onOpenChange={(o) => !o && setViewMembersDep(null)}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="size-5 text-primary" />
              Integrantes de {viewMembersDep?.nome}
            </DialogTitle>
            <DialogDescription>
              Membros cadastrados vinculados a este ministério ({viewMembersDep?.qtdIntegrantes || 0} integrantes).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {viewMembersDep && viewMembersDep.membrosVinculados && viewMembersDep.membrosVinculados.length > 0 ? (
              viewMembersDep.membrosVinculados.map((m: Row) => {
                const rawPhone = String(m.telefone || "").replace(/\D/g, "");
                const waUrl =
                  rawPhone.length >= 10
                    ? `https://wa.me/55${rawPhone}?text=Olá,%20${encodeURIComponent(
                        String(m.nome).split(" ")[0]
                      )}!%20A%20paz%20do%20Senhor.`
                    : null;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-2xl border bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-foreground truncate">{String(m.nome)}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {m.cargo && m.cargo !== "Sem função / cargo" ? m.cargo : m.tipo || "Membro"}{" "}
                        {m.congregacao ? `· ${m.congregacao}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {m.telefone && (
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">
                          {m.telefone}
                        </span>
                      )}
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg hover:underline"
                        >
                          <Phone className="size-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground italic border rounded-2xl">
                Nenhum membro cadastrado vinculado a este departamento no momento.
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={() => setViewMembersDep(null)} className="rounded-xl w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Exclusão */}
      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle>Excluir Departamento?</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir o departamento{" "}
              <strong className="text-foreground">{confirmDel?.nome}</strong>? Esta ação ficará registrada na auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setConfirmDel(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmDel) return;
                remove("departments", confirmDel.id);
                setConfirmDel(null);
                toast.success("Departamento excluído com sucesso.");
              }}
              className="rounded-xl"
            >
              Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
