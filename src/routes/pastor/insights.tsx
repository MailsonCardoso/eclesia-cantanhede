import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Edit2,
  Filter,
  Lightbulb,
  Plus,
  Quote,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore, type Row } from "@/lib/store";

export const Route = createFileRoute("/pastor/insights")({
  head: () => ({
    meta: [
      { title: "Banco de Insights Teológicos — EclesiaPro" },
      { name: "description", content: "Anotações bíblicas, citações, ilustrações e ideias para sermões com tags dinâmicas." },
    ],
  }),
  component: PastorInsightsPage,
});

const TYPE_CONFIG = {
  note: { label: "Anotação", icon: Sparkles, color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  verse: { label: "Versículo", icon: BookOpen, color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  quote: { label: "Citação", icon: Quote, color: "bg-purple-500/15 text-purple-500 border-purple-500/30" },
  illustration: { label: "Ilustração", icon: Lightbulb, color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
};

function PastorInsightsPage() {
  const { db, create, update, remove } = useStore();
  const insights = (db.pastor_insights || []) as Row[];
  const sermonsList = (db.pastor_sermons || []) as Row[];

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<"note" | "verse" | "quote" | "illustration">("note");
  const [title, setTitle] = useState("");
  const [reference, setReference] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [sermonId, setSermonId] = useState<string>("");

  // Nuvem de Tags Únicas
  const allTags = useMemo(() => {
    const set = new Set<string>();
    insights.forEach((i) => {
      const arr = Array.isArray(i.tags) ? (i.tags as string[]) : [];
      arr.forEach((t) => set.add(t.toLowerCase().trim()));
    });
    return Array.from(set).sort();
  }, [insights]);

  // Filtragem
  const filteredInsights = useMemo(() => {
    return insights.filter((i) => {
      const matchSearch =
        String(i.title ?? i.titulo ?? "").toLowerCase().includes(search.toLowerCase()) ||
        String(i.content ?? "").toLowerCase().includes(search.toLowerCase()) ||
        String(i.reference ?? "").toLowerCase().includes(search.toLowerCase());

      const matchType = selectedType === "todos" || i.type === selectedType || i.tipo === selectedType;

      const itemTags = Array.isArray(i.tags) ? (i.tags as string[]).map((t) => t.toLowerCase()) : [];
      const matchTag = !activeTag || itemTags.includes(activeTag.toLowerCase());

      return matchSearch && matchType && matchTag;
    });
  }, [insights, search, selectedType, activeTag]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setType("note");
    setTitle("");
    setReference("");
    setContent("");
    setTagInput("");
    setTags(["fé", "graça"]);
    setSermonId("");
    setModalOpen(true);
  };

  const handleOpenEdit = (i: Row) => {
    setEditingId(i.id);
    setType((i.type as "note" | "verse" | "quote" | "illustration") || "note");
    setTitle(String(i.title ?? i.titulo ?? ""));
    setReference(String(i.reference ?? ""));
    setContent(String(i.content ?? ""));
    setTagInput("");
    setTags(Array.isArray(i.tags) ? (i.tags as string[]) : []);
    setSermonId(String(i.sermon_id ?? ""));
    setModalOpen(true);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!content.trim()) return;

    const payload: Omit<Row, "id"> = {
      type,
      tipo: type,
      title: title.trim(),
      titulo: title.trim(),
      reference: reference.trim(),
      content: content.trim(),
      tags,
      sermon_id: sermonId || undefined,
    };

    if (editingId) {
      update("pastor_insights", { ...payload, id: editingId });
    } else {
      create("pastor_insights", payload);
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/pastor" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="size-3" /> Altar Pastoral
            </Link>
            <span>/</span>
            <span>Insights</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            <Sparkles className="size-8 text-amber-500" />
            Banco de Insights Teológicos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Captura rápida de ideias, versículos, citações e ilustrações para acoplar aos seus sermões.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="size-4" />
          Novo Insight
        </Button>
      </div>

      {/* Nuvem de Tags Dinâmicas */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap rounded-2xl border bg-card p-3.5 shadow-card text-xs">
          <span className="font-semibold text-muted-foreground flex items-center gap-1.5 mr-1">
            <Tag className="size-3.5 text-primary" />
            Tags:
          </span>

          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-2.5 py-1 font-medium transition-all ${
              activeTag === null
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
            }`}
          >
            Todas ({insights.length})
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`rounded-full px-2.5 py-1 font-medium transition-all ${
                activeTag === tag
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por ideia, autor, referência ou conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border bg-background px-3 py-2 text-xs font-medium outline-none cursor-pointer"
          >
            <option value="todos">Todos os tipos</option>
            <option value="note">Anotação</option>
            <option value="verse">Versículo</option>
            <option value="quote">Citação</option>
            <option value="illustration">Ilustração</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards de Insights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredInsights.length ? (
          filteredInsights.map((ins) => {
            const t = (ins.type as keyof typeof TYPE_CONFIG) || "note";
            const cfg = TYPE_CONFIG[t] || TYPE_CONFIG.note;
            const Icon = cfg.icon;

            const linkedSermon = sermonsList.find((s) => String(s.id) === String(ins.sermon_id));

            return (
              <div
                key={ins.id}
                className="flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-card card-hover space-y-4"
              >
                <div className="space-y-3">
                  {/* Tipo & Referência */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-semibold text-[11px] ${cfg.color}`}
                    >
                      <Icon className="size-3" />
                      {cfg.label}
                    </span>

                    {ins.reference && (
                      <span className="font-mono text-xs text-muted-foreground font-medium">
                        {String(ins.reference)}
                      </span>
                    )}
                  </div>

                  {/* Título opcional */}
                  {ins.title && (
                    <h3 className="font-bold text-base text-foreground leading-snug">
                      {String(ins.title ?? ins.titulo)}
                    </h3>
                  )}

                  {/* Conteúdo textual */}
                  <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                    {String(ins.content)}
                  </p>

                  {/* Tags */}
                  {Array.isArray(ins.tags) && ins.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ins.tags.map((tag: string) => (
                        <button
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                          className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rodapé: Vínculo com Sermão & Ações */}
                <div className="border-t pt-3 flex items-center justify-between gap-2 text-xs">
                  <div className="truncate text-muted-foreground max-w-[190px]">
                    {linkedSermon ? (
                      <span className="text-primary font-medium flex items-center gap-1 truncate" title={String(linkedSermon.title)}>
                        <BookOpen className="size-3 shrink-0" />
                        {String(linkedSermon.title)}
                      </span>
                    ) : (
                      <span className="text-[11px]">Avulso</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(ins)}
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove("pastor_insights", ins.id)}
                      className="size-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            <Sparkles className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium">Nenhum insight teológico encontrado.</p>
            <p className="text-xs mt-1">Capture pensamentos, versículos marcantes e citações de autores.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-4 gap-2">
              <Plus className="size-3.5" />
              Adicionar Primeiro Insight
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Editar Insight Teológico" : "Novo Insight Pastoral"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">Tipo de Conteúdo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none cursor-pointer"
                  >
                    <option value="note">Anotação / Ideia</option>
                    <option value="verse">Versículo Bíblico</option>
                    <option value="quote">Citação de Autor</option>
                    <option value="illustration">Ilustração / Metáfora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    {type === "verse" ? "Referência Bíblica" : "Fonte / Livro / Autor"}
                  </label>
                  <input
                    type="text"
                    placeholder={type === "verse" ? "Ex: Hb 11:1" : "Ex: C.S. Lewis, O Peso da Glória"}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">Título / Tema Resumo</label>
                <input
                  type="text"
                  placeholder="Ex: A certeza inabalável da fé"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">Conteúdo / Anotação *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Digite o texto do versículo, a citação ou o esboço do pensamento..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">Tags para Busca</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Ex: oração, graça, fé..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                    Adicionar
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Vínculo opcional com sermão */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">
                  Vincular a um Sermão Específico (Aparecerá no Púlpito)
                </label>
                <select
                  value={sermonId}
                  onChange={(e) => setSermonId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none cursor-pointer"
                >
                  <option value="">Nenhum (Insight avulso)</option>
                  {sermonsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {String(s.title ?? s.titulo)} ({fmtDate(s.date ?? s.data)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar Insight</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
