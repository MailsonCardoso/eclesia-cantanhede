import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Maximize,
  Minimize,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Type,
  X,
  Quote,
  Lightbulb,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore, type Row } from "@/lib/store";

export const Route = createFileRoute("/pastor/pulpito/$id")({
  head: () => ({
    meta: [
      { title: "Modo Púlpito — EclesiaPro" },
      { name: "description", content: "Experiência de pregação ao vivo no altar sem distrações." },
    ],
  }),
  component: ModoPulpito,
});

function ModoPulpito() {
  const { id } = useParams({ from: "/pastor/pulpito/$id" });
  const { db, update } = useStore();

  const sermon = useMemo(() => {
    return (db.pastor_sermons || []).find((s) => String(s.id) === String(id));
  }, [db.pastor_sermons, id]);

  const insights = useMemo(() => {
    return (db.pastor_insights || []).filter((i) => String(i.sermon_id) === String(id));
  }, [db.pastor_insights, id]);

  // 1. Cronômetro de Pregação
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 2. Tipografia Dinâmica (20px a 40px)
  const [fontSize, setFontSize] = useState(26);

  // 3. High-Contrast Dark Mode para púlpito
  const [highContrast, setHighContrast] = useState(true);

  // 4. Tela Cheia (Fullscreen API)
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 5. Drawer de Insights Acoplados
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 6. Finalização com Status Pregado
  const handleConclude = () => {
    if (!sermon) return;
    update("pastor_sermons", {
      ...sermon,
      status: "Pregado",
    });
    setIsRunning(false);
    alert("Pregação concluída com sucesso! Status do sermão atualizado para 'Pregado'.");
  };

  if (!sermon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-black text-white">
        <h1 className="text-2xl font-bold mb-2">Sermão não encontrado</h1>
        <p className="text-sm text-neutral-400 mb-6">O esboço solicitado pode ter sido excluído ou não existe.</p>
        <Link to="/pastor">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            Voltar ao Altar
          </Button>
        </Link>
      </div>
    );
  }

  const content = sermon.content as { intro?: string; topics?: string[]; conclusion?: string } | undefined;
  const topics = content?.topics || [];

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 select-none ${
        highContrast
          ? "bg-[#0a0a0c] text-[#f1f5f9]"
          : "bg-background text-foreground"
      }`}
    >
      {/* Barra de Controle Superior do Púlpito */}
      <header
        className={`sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b backdrop-blur-md ${
          highContrast ? "bg-[#111116]/90 border-neutral-800" : "bg-card/90 border-border"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link to="/pastor">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Sair do Púlpito
            </Button>
          </Link>

          <div className="h-5 w-px bg-neutral-700 hidden sm:block" />

          {/* Destaque do Cronômetro */}
          <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-xl shadow-inner">
            <Clock className={`size-4 ${isRunning ? "text-emerald-400 animate-pulse" : "text-neutral-400"}`} />
            <span
              className={`font-mono text-2xl font-black tracking-wider ${
                seconds > 3000 ? "text-amber-400" : isRunning ? "text-emerald-400" : "text-neutral-200"
              }`}
            >
              {formatTimer(seconds)}
            </span>

            <div className="flex items-center gap-1 ml-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRunning(!isRunning)}
                className="size-7 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800"
                title={isRunning ? "Pausar cronômetro" : "Iniciar pregação"}
              >
                {isRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsRunning(false);
                  setSeconds(0);
                }}
                className="size-7 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                title="Zerar cronômetro"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Controles de Visor, Fonte e Finalização */}
        <div className="flex items-center gap-2">
          {/* Slider de Tamanho de Fonte */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300">
            <Type className="size-3.5 text-neutral-400" />
            <span>{fontSize}px</span>
            <input
              type="range"
              min="20"
              max="42"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 accent-primary cursor-pointer"
            />
          </div>

          {/* Alternar High-Contrast */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHighContrast(!highContrast)}
            className="size-9 rounded-xl text-neutral-300 hover:text-white"
            title="Alternar Contraste Alto"
          >
            {highContrast ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="size-9 rounded-xl text-neutral-300 hover:text-white"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </Button>

          {/* Botão de Gaveta de Insights */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="gap-1.5 text-xs font-semibold relative border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
          >
            <Sparkles className="size-3.5" />
            Insights ({insights.length})
          </Button>

          {/* Concluir Pregação */}
          <Button
            size="sm"
            onClick={handleConclude}
            className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
          >
            <CheckCircle2 className="size-3.5" />
            Concluir
          </Button>
        </div>
      </header>

      {/* Corpo Central do Sermão (Leitura no Púlpito) */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 space-y-10">
        {/* Cabeçalho do Sermão */}
        <section className="space-y-3 border-b pb-6 border-neutral-800">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-md bg-primary/20 text-primary-foreground font-mono font-bold px-2.5 py-1">
              {String(sermon.verse ?? "Sem referência")}
            </span>
            {sermon.series && sermon.series !== "Avulso" && (
              <span className="text-neutral-400">· Série: {String(sermon.series)}</span>
            )}
            <span className="text-neutral-500">· Status atual: {String(sermon.status)}</span>
          </div>

          <h1
            style={{ fontSize: `${Math.round(fontSize * 1.35)}px` }}
            className="font-bold tracking-tight text-white leading-tight"
          >
            {String(sermon.title ?? sermon.titulo)}
          </h1>
        </section>

        {/* 1. Introdução */}
        {content?.intro && (
          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-primary/80">
              Introdução
            </h2>
            <div
              style={{ fontSize: `${fontSize}px`, lineHeight: "1.6" }}
              className={`rounded-2xl p-6 border ${
                highContrast
                  ? "bg-[#14141a] border-neutral-800 text-neutral-100"
                  : "bg-card border-border text-foreground"
              }`}
            >
              {content.intro}
            </div>
          </section>
        )}

        {/* 2. Tópicos do Esboço */}
        {topics.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-emerald-400">
              Tópicos Principais ({topics.length})
            </h2>

            <div className="space-y-4">
              {topics.map((t, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-6 border transition-all ${
                    highContrast
                      ? "bg-[#14141a] border-neutral-800 text-white shadow-lg"
                      : "bg-card border-border text-foreground shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="size-8 rounded-xl bg-primary/20 text-primary grid place-items-center font-mono font-bold text-base shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div
                      style={{ fontSize: `${fontSize}px`, lineHeight: "1.55" }}
                      className="font-medium flex-1"
                    >
                      {t}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Conclusão e Apelo */}
        {content?.conclusion && (
          <section className="space-y-3 pt-4 border-t border-neutral-800">
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-amber-400">
              Conclusão & Apelo
            </h2>
            <div
              style={{ fontSize: `${fontSize}px`, lineHeight: "1.6" }}
              className={`rounded-2xl p-6 border ${
                highContrast
                  ? "bg-amber-950/20 border-amber-900/40 text-amber-100"
                  : "bg-amber-500/10 border-amber-500/20 text-foreground"
              }`}
            >
              {content.conclusion}
            </div>
          </section>
        )}
      </main>

      {/* Drawer / Sheet Lateral de Insights Acoplados */}
      {drawerOpen && (
        <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-neutral-950 border-l border-neutral-800 p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles className="size-5" />
                <h3 className="font-bold text-lg text-white">Insights Vinculados</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
              {insights.length ? (
                insights.map((ins) => (
                  <div
                    key={ins.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-2 text-sm"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold uppercase">
                        {ins.type === "verse" && <BookOpen className="size-3" />}
                        {ins.type === "quote" && <Quote className="size-3" />}
                        {ins.type === "illustration" && <Lightbulb className="size-3" />}
                        {String(ins.type)}
                      </span>
                      {ins.reference && (
                        <span className="font-mono text-neutral-400 text-[11px]">{String(ins.reference)}</span>
                      )}
                    </div>

                    {ins.title && <div className="font-bold text-white text-base">{String(ins.title)}</div>}

                    <p className="text-neutral-300 text-sm leading-relaxed">{String(ins.content)}</p>

                    {Array.isArray(ins.tags) && ins.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ins.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-neutral-500 space-y-2">
                  <Sparkles className="size-8 mx-auto text-neutral-700" />
                  <p className="text-sm">Nenhum insight vinculado diretamente a este sermão.</p>
                  <p className="text-xs">
                    Você pode associar versículos, ilustrações e citações no menu <strong>Insights</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setDrawerOpen(false)}
            className="w-full mt-4 border-neutral-800 text-neutral-300 hover:text-white"
          >
            Fechar Gaveta
          </Button>
        </aside>
      )}
    </div>
  );
}

