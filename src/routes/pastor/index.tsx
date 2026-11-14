import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Layers,
  Mic2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fmtDate, useStore, type Row, type V } from "@/lib/store";

export const Route = createFileRoute("/pastor/")({
  head: () => ({
    meta: [
      { title: "Altar Pastoral — Sermões e Esboços — EclesiaPro" },
      { name: "description", content: "Gestão de sermões, esboços temáticos, séries e modo púlpito ao vivo." },
    ],
  }),
  component: PastorAltar,
});

const STATUS_COLORS: Record<string, string> = {
  Pregado: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Planejado: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Rascunho: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
};

const COLOR_OPTIONS = [
  { label: "Azul", value: "bg-blue-500" },
  { label: "Verde", value: "bg-emerald-500" },
  { label: "Âmbar", value: "bg-amber-500" },
  { label: "Índigo", value: "bg-indigo-500" },
  { label: "Púrpura", value: "bg-purple-500" },
  { label: "Rosa", value: "bg-rose-500" },
];

function PastorAltar() {
  const { db, create, update, remove } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [seriesFilter, setSeriesFilter] = useState("todas");

  // Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [verse, setVerse] = useState("");
  const [series, setSeries] = useState("Avulso");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("Planejado");
  const [color, setColor] = useState("bg-blue-500");
  const [intro, setIntro] = useState("");
  const [topics, setTopics] = useState<string[]>([""]);
  const [conclusion, setConclusion] = useState("");

  const sermons = (db.pastor_sermons || []) as Row[];
  const seriesList = (db.pastor_series || []) as Row[];

  // Filtros
  const filteredSermons = useMemo(() => {
    return sermons.filter((s) => {
      const matchSearch =
        String(s.title ?? s.titulo ?? "").toLowerCase().includes(search.toLowerCase()) ||
        String(s.verse ?? "").toLowerCase().includes(search.toLowerCase()) ||
        String(s.series ?? "").toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "todos" || s.status === statusFilter;
      const matchSeries = seriesFilter === "todas" || s.series === seriesFilter;

      return matchSearch && matchStatus && matchSeries;
    });
  }, [sermons, search, statusFilter, seriesFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: sermons.length,
      pregados: sermons.filter((s) => s.status === "Pregado").length,
      planejados: sermons.filter((s) => s.status === "Planejado").length,
      series: seriesList.length,
    };
  }, [sermons, seriesList]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setVerse("");
    setSeries(seriesList[0]?.title ? String(seriesList[0].title) : "Avulso");
    setDate(new Date().toISOString().slice(0, 10));
    setStatus("Planejado");
    setColor("bg-blue-500");
    setIntro("");
    setTopics(["1. Introdução bíblica e contexto", "2. Aplicação na vida da igreja"]);
    setConclusion("");
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Row) => {
    setEditingId(s.id);
    setTitle(String(s.title ?? s.titulo ?? ""));
    setVerse(String(s.verse ?? ""));
    setSeries(String(s.series ?? "Avulso"));
    setDate(String(s.date ?? s.data ?? new Date().toISOString().slice(0, 10)));
    setStatus(String(s.status ?? "Planejado"));
    setColor(String(s.color ?? "bg-blue-500"));

    const content = s.content as { intro?: string; topics?: string[]; conclusion?: string } | undefined;
    setIntro(content?.intro ?? "");
    setTopics(content?.topics && content.topics.length ? content.topics : [""]);
    setConclusion(content?.conclusion ?? "");
    setModalOpen(true);
  };

  const handleAddTopic = () => {
    setTopics((prev) => [...prev, ""]);
  };

  const handleUpdateTopic = (index: number, val: string) => {
    setTopics((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveTopic = (index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const contentObj = {
      intro: intro.trim(),
      topics: topics.map((t) => t.trim()).filter(Boolean),
      conclusion: conclusion.trim(),
    };

    const targetSeries = seriesList.find((x) => x.title === series || x.titulo === series);

    const payload: Omit<Row, "id"> = {
      title,
      titulo: title,
      verse,
      series,
      series_id: targetSeries ? targetSeries.id : "",
      date,
      data: date,
      status,
      color,
      content: contentObj as unknown as V,
    };

    if (editingId) {
      update("pastor_sermons", { ...payload, id: editingId });
    } else {
      create("pastor_sermons", payload);
    }

    setModalOpen(false);
  };

  const handleDuplicate = (s: Row) => {
    const copy = { ...s };
    delete (copy as { id?: string }).id;
    copy.title = `${copy.title ?? copy.titulo} (Cópia)`;
    copy.titulo = copy.title;
    copy.status = "Rascunho";
    copy.date = new Date().toISOString().slice(0, 10);
    create("pastor_sermons", copy);
  };

  // Se o formulário de criação/edição estiver aberto, renderiza diretamente na página sem nenhum fundo cinza/overlay
  if (modalOpen) {
    return (
      <div className="space-y-6 animate-rise">
        {/* Barra superior de navegação e ações */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Voltar ao Altar
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <BookOpen className="size-6 text-primary" />
                {editingId ? "Editar Sermão / Esboço" : "Novo Sermão Pastoral"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Estruture os pontos, versículo e introdução para pregação ao vivo no Púlpito.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gap-2 px-6">
              Salvar Sermão
            </Button>
          </div>
        </div>

        {/* Formulário amplo integrado à página */}
        <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-card">
          <div className="grid gap-8 lg:grid-cols-12 text-sm">
            {/* Coluna Esquerda: Informações Gerais, Introdução e Conclusão */}
            <div className="lg:col-span-7 space-y-5">
              {/* Título e Versículo */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Título da Mensagem *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: A Graça que Transforma"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Versículo-Chave / Referência</label>
                  <input
                    type="text"
                    placeholder="Ex: Romanos 5:1-5"
                    value={verse}
                    onChange={(e) => setVerse(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              {/* Série, Data e Status */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Série Temática</label>
                  <select
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none cursor-pointer shadow-sm"
                  >
                    <option value="Avulso">Avulso / Sem série</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={String(s.title ?? s.titulo)}>
                        {String(s.title ?? s.titulo)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Data da Pregação</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none cursor-pointer shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none cursor-pointer shadow-sm"
                  >
                    <option value="Planejado">Planejado</option>
                    <option value="Pregado">Pregado</option>
                    <option value="Rascunho">Rascunho</option>
                  </select>
                </div>
              </div>

              {/* Cor de Identificação */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-foreground">Cor de Destaque no Altar</label>
                <div className="flex gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`size-8 rounded-full ${c.value} transition-transform ${
                        color === c.value ? "ring-2 ring-foreground scale-110 shadow-md" : "opacity-75 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Introdução */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground">
                  Introdução (Gancho inicial e contextualização bíblica)
                </label>
                <textarea
                  rows={3}
                  placeholder="Apresente o problema, o gancho inicial e o contexto bíblico..."
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary resize-none shadow-sm"
                />
              </div>

              {/* Conclusão */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground">
                  Conclusão e Apelo / Aplicação Prática
                </label>
                <textarea
                  rows={3}
                  placeholder="Chamado prático, oração de encerramento e envio..."
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary resize-none shadow-sm"
                />
              </div>
            </div>

            {/* Coluna Direita: Tópicos Dinâmicos do Esboço */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-4 flex flex-col h-full shadow-inner">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Tópicos do Esboço</h3>
                    <p className="text-[11px] text-muted-foreground">Pontos pregados no altar</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTopic} className="h-8 text-xs gap-1.5 shadow-sm font-medium">
                    <Plus className="size-3.5" />
                    Adicionar Tópico
                  </Button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {topics.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <span className="size-7 shrink-0 grid place-items-center rounded-lg bg-secondary text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`Tópico ${idx + 1}...`}
                        value={t}
                        onChange={(e) => handleUpdateTopic(idx, e.target.value)}
                        className="flex-1 rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary shadow-sm"
                      />
                      {topics.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTopic(idx)}
                          className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-auto p-4 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-center gap-3">
                  <BookOpen className="size-5 text-primary shrink-0" />
                  <span>Estes tópicos aparecem automaticamente estruturados na tela ao vivo do Modo Púlpito.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-5 mt-6">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gap-2 px-8">
              Salvar Sermão
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            <BookOpen className="size-8 text-primary" />
            Altar Pastoral
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão de sermões, séries expositivas e ambiente imersivo para o púlpito.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/pastor/series">
            <Button variant="outline" className="gap-2">
              <Layers className="size-4 text-primary" />
              Séries
            </Button>
          </Link>
          <Link to="/pastor/insights">
            <Button variant="outline" className="gap-2">
              <Sparkles className="size-4 text-amber-500" />
              Insights
            </Button>
          </Link>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="size-4" />
            Novo Sermão
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-card card-hover">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            Total de Sermões <BookOpen className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</div>
          <div className="text-xs text-muted-foreground mt-1">Acervo do ministério</div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-card card-hover">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            Mensagens Pregadas <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{stats.pregados}</div>
          <div className="text-xs text-muted-foreground mt-1">Ministradas no altar</div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-card card-hover">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            Sermões Planejados <Clock className="size-4 text-blue-500" />
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{stats.planejados}</div>
          <div className="text-xs text-muted-foreground mt-1">Próximos cultos</div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-card card-hover">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            Séries Ativas <Layers className="size-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{stats.series}</div>
          <div className="text-xs text-muted-foreground mt-1">Campanhas temáticas</div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título, versículo ou série..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border bg-background px-3 py-2 text-xs font-medium outline-none cursor-pointer"
          >
            <option value="todos">Todos os status</option>
            <option value="Planejado">Planejado</option>
            <option value="Pregado">Pregado</option>
            <option value="Rascunho">Rascunho</option>
          </select>

          <select
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value)}
            className="rounded-xl border bg-background px-3 py-2 text-xs font-medium outline-none cursor-pointer"
          >
            <option value="todas">Todas as séries</option>
            <option value="Avulso">Avulso</option>
            {seriesList.map((s) => (
              <option key={s.id} value={String(s.title ?? s.titulo)}>
                {String(s.title ?? s.titulo)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Sermões */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSermons.length ? (
          filteredSermons.map((s) => {
            const content = s.content as { intro?: string; topics?: string[]; conclusion?: string } | undefined;
            const topicsCount = content?.topics?.length ?? 0;
            const cardColor = String(s.color ?? "bg-blue-500");

            return (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-card card-hover relative overflow-hidden group"
              >
                {/* Linha colorida do topo */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${cardColor}`} />

                <div className="space-y-3">
                  {/* Status, Série e Data */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${
                        STATUS_COLORS[String(s.status)] ?? STATUS_COLORS["Planejado"]
                      }`}
                    >
                      {String(s.status ?? "Planejado")}
                    </span>

                    <span className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="size-3" />
                      {fmtDate(s.date ?? s.data)}
                    </span>
                  </div>

                  {/* Título e Versículo */}
                  <div>
                    <h3 className="font-semibold text-lg text-foreground leading-snug line-clamp-2">
                      {String(s.title ?? s.titulo)}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-mono font-medium text-foreground">
                        {String(s.verse ?? "Sem referência")}
                      </span>
                      {s.series && s.series !== "Avulso" && (
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                          · {String(s.series)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Introdução / Resumo */}
                  {content?.intro && (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {content.intro}
                    </p>
                  )}

                  {/* Quantidade de tópicos */}
                  {topicsCount > 0 && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span>{topicsCount} tópicos estruturados</span>
                    </div>
                  )}
                </div>

                {/* Rodapé com Ações */}
                <div className="mt-5 pt-4 border-t flex items-center justify-between gap-2">
                  <Link to="/pastor/pulpito/$id" params={{ id: s.id }} className="flex-1">
                    <Button
                      size="sm"
                      className="w-full gap-2 bg-gradient-primary hover:opacity-90 shadow-sm text-xs font-semibold"
                    >
                      <Mic2 className="size-3.5" />
                      Entrar no Púlpito
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(s)}
                      className="size-8 text-muted-foreground hover:text-foreground"
                      title="Editar sermão"
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(s)}
                      className="size-8 text-muted-foreground hover:text-foreground"
                      title="Duplicar esboço"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove("pastor_sermons", s.id)}
                      className="size-8 text-muted-foreground hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            <BookOpen className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium">Nenhum sermão encontrado com os filtros selecionados.</p>
            <p className="text-xs mt-1">Crie um novo sermão ou limpe os filtros de busca.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-4 gap-2">
              <Plus className="size-3.5" />
              Criar Primeiro Sermão
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

