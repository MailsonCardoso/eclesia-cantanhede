import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/agenda-eventos")({
  head: () => ({
    meta: [
      { title: "Agenda de Eventos — Ecclesia" },
      { name: "description", content: "Programação de cultos, conferências e atividades da igreja." },
      { property: "og:title", content: "Agenda de Eventos — Ecclesia" },
      { property: "og:description", content: "Programação de cultos, conferências e atividades da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaEventos,
});

function AgendaEventos() {
  const { db } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(
    () => [...db.events].filter((e) => String(e.data) >= today).sort((a, b) => String(a.data).localeCompare(String(b.data))).slice(0, 6),
    [db.events, today],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><CalendarDays className="size-4 text-gold" />Próximos eventos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => (
            <div key={e.id} className="rounded-xl border bg-background p-4">
              <div className="text-sm font-semibold text-gold">{fmtDate(e.data)}{e.hora ? ` · ${e.hora}` : ""}</div>
              <div className="mt-1 font-medium">{e.titulo}</div>
              <div className="text-sm text-muted-foreground">{e.tipo} · {e.local}</div>
            </div>
          ))}
          {!upcoming.length && <p className="text-sm text-muted-foreground">Nenhum evento futuro cadastrado.</p>}
        </div>
      </div>
      <CrudPage title="Agenda de Eventos" subtitle="Cultos, conferências, ensaios e demais atividades."
        collection="events" singular="Evento"
        searchKeys={["titulo", "local", "responsavel"]} filterKeys={["tipo"]}
        fields={[
          { key: "titulo", label: "Título", table: true, required: true },
          { key: "data", label: "Data", type: "date", table: true, required: true },
          { key: "hora", label: "Horário", table: true },
          { key: "tipo", label: "Tipo", type: "select", options: ["Culto", "Conferência", "Ensaio", "EBD", "Vigília", "Evangelismo", "Social", "Reunião", "Outro"], table: true },
          { key: "local", label: "Local", table: true },
          { key: "responsavel", label: "Responsável", table: true },
          { key: "descricao", label: "Descrição", type: "textarea" },
        ]}
      />
    </div>
  );
}
