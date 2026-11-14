import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fmtDate, useStore, type Row } from "@/lib/store";

export const Route = createFileRoute("/pastor/series")({
  head: () => ({
    meta: [
      { title: "Séries de Mensagens — EclesiaPro" },
      { name: "description", content: "Campanhas temáticas, progresso de mensagens pregadas e planejamento pastoral." },
    ],
  }),
  component: PastorSeriesPage,
});

const COLOR_OPTIONS = [
  { label: "Azul", color: "bg-blue-500", cover: "from-blue-600/30 via-indigo-600/15 to-transparent" },
  { label: "Verde", color: "bg-emerald-500", cover: "from-emerald-600/30 via-teal-600/15 to-transparent" },
  { label: "Âmbar", color: "bg-amber-500", cover: "from-amber-600/30 via-orange-600/15 to-transparent" },
  { label: "Púrpura", color: "bg-purple-500", cover: "from-purple-600/30 via-pink-600/15 to-transparent" },
  { label: "Índigo", color: "bg-indigo-500", cover: "from-indigo-600/30 via-blue-600/15 to-transparent" },
];

function PastorSeriesPage() {
  const { db, create, update, remove } = useStore();
  const seriesList = (db.pastor_series || []) as Row[];
  const sermonsList = (db.pastor_sermons || []) as Row[];

  // Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState(4);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]!);

  // Contagem dinâmica de sermões por série
  const seriesWithStats = useMemo(() => {
    return seriesList.map((s) => {
      const sId = String(s.id);
      const sTitle = String(s.title ?? s.titulo ?? "");

      const linkedSermons = sermonsList.filter(
        (sm) => String(sm.series_id) === sId || String(sm.series) === sTitle
      );

      const preachedCount = linkedSermons.filter((sm) => sm.status === "Pregado").length;
      const plannedCount = linkedSermons.filter((sm) => sm.status === "Planejado").length;

      const targetTotal = Number(s.total) || linkedSermons.length || 1;
      const progress = Math.min(100, Math.round((preachedCount / targetTotal) * 100));

      return {
        ...s,
        preachedCount,
        plannedCount,
        targetTotal,
        progress,
        linkedSermons,
      };
    });
  }, [seriesList, sermonsList]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setTotal(4);
    setStartDate(new Date().toISOString().slice(0, 10));
    setSelectedColor(COLOR_OPTIONS[0]!);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Row) => {
    setEditingId(s.id);
    setTitle(String(s.title ?? s.titulo ?? ""));
    setDescription(String(s.description ?? s.descricao ?? ""));
    setTotal(Number(s.total) || 4);
    setStartDate(String(s.start_date ?? s.data ?? new Date().toISOString().slice(0, 10)));

    const matchColor = COLOR_OPTIONS.find((c) => c.color === s.color) || COLOR_OPTIONS[0]!;
    setSelectedColor(matchColor);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const payload: Omit<Row, "id"> = {
      title,
      titulo: title,
      description,
      descricao: description,
      total,
      completed: 0,
      color: selectedColor.color,
      cover_color: selectedColor.cover,
      start_date: startDate,
      data: startDate,
    };

    if (editingId) {
      update("pastor_series", { ...payload, id: editingId });
    } else {
      create("pastor_series", payload);
    }

    setModalOpen(false);
  };

  // Se o formulário estiver aberto, renderiza na própria página integrada (sem modal flutuante/fundo cinza)
  if (modalOpen) {
    return (
      <div className="space-y-6 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="group gap-2.5 rounded-xl border border-border/80 bg-background/95 px-3.5 py-2 font-semibold text-foreground shadow-sm hover:border-primary/40 hover:bg-accent hover:shadow transition-all"
            >
              <div className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              </div>
              <span className="text-xs sm:text-sm">Voltar para Séries</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Layers className="size-6 text-primary" />
                {editingId ? "Editar Série Temática" : "Nova Série de Mensagens"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Planejamento e metas de pregação em campanhas temáticas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="px-6">
              Salvar Série
            </Button>
          </div>
        </div>

        <div className="max-w-4xl rounded-3xl border bg-card p-6 md:p-8 shadow-card space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 text-sm">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Título da Série *</label>
              <input
                type="text"
                required
                placeholder="Ex: Famílias Fortes no Altar"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none cursor-pointer shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Descrição / Propósito Teológico</label>
              <textarea
                rows={3}
                placeholder="Descreva o objetivo espiritual e temas abordados na campanha..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary resize-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Meta de Mensagens (Total)</label>
              <input
                type="number"
                min="1"
                max="52"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-foreground">Cor de Identificação</label>
              <div className="flex gap-3">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`size-8 rounded-full ${c.color} transition-transform ${
                      selectedColor.color === c.color ? "ring-2 ring-foreground scale-110 shadow-md" : "opacity-75 hover:opacity-100"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="px-8">
              Salvar Série
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/pastor" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="size-3" /> Altar Pastoral
            </Link>
            <span>/</span>
            <span>Séries</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            <Layers className="size-8 text-primary" />
            Séries de Mensagens
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Campanhas temáticas de pregação, metas e progresso em tempo real.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="size-4" />
          Nova Série Temática
        </Button>
      </div>

      {/* Grid de Séries */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {seriesWithStats.length ? (
          seriesWithStats.map((s) => {
            const coverGradient = String(s.cover_color || "from-blue-600/30 via-indigo-600/15 to-transparent");

            return (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-card card-hover relative overflow-hidden"
              >
                {/* Gradiente de Capa Superior */}
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${coverGradient} pointer-events-none`} />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" /> Início: {fmtDate(s.start_date ?? s.data)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold text-xs ${
                        s.progress >= 100
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {s.progress}% Concluída
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-foreground leading-snug">{String(s.title ?? s.titulo)}</h3>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {String(s.description ?? s.descricao)}
                      </p>
                    )}
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mensagens ministradas</span>
                      <span className="font-mono font-bold text-foreground">
                        {s.preachedCount} / {s.targetTotal}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        style={{ width: `${s.progress}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${String(s.color ?? "bg-primary")}`}
                      />
                    </div>
                  </div>

                  {/* Sermões vinculados */}
                  {s.linkedSermons.length > 0 && (
                    <div className="border-t pt-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Sermões da Série
                      </div>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {s.linkedSermons.map((sm) => (
                          <div
                            key={sm.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-secondary/50 text-foreground"
                          >
                            <span className="truncate max-w-[190px]">{String(sm.title ?? sm.titulo)}</span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                                sm.status === "Pregado"
                                  ? "text-emerald-500"
                                  : sm.status === "Planejado"
                                  ? "text-blue-500"
                                  : "text-amber-500"
                              }`}
                            >
                              {String(sm.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-5 pt-4 border-t flex items-center justify-between gap-2 relative z-10">
                  <Link to="/pastor" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                      <BookOpen className="size-3.5" />
                      Ver no Altar
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(s as unknown as Row)}
                      className="size-8 text-muted-foreground hover:text-foreground"
                      title="Editar série"
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove("pastor_series", s.id)}
                      className="size-8 text-muted-foreground hover:text-destructive"
                      title="Excluir série"
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
            <Layers className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium">Nenhuma série temática cadastrada.</p>
            <p className="text-xs mt-1">Organize suas mensagens em campanhas de várias semanas.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-4 gap-2">
              <Plus className="size-3.5" />
              Criar Primeira Série
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

