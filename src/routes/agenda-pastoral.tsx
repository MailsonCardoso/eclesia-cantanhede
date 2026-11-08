import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { CalendarClock, CheckCircle2, XCircle, CalendarDays, Clock, User } from "lucide-react";
import { fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/agenda-pastoral")({
  head: () => ({
    meta: [
      { title: "Agenda Pastoral — EclesiaPro" },
      { name: "description", content: "Agendamentos de visitas e aconselhamentos pastorais com os membros." },
      { property: "og:title", content: "Agenda Pastoral — EclesiaPro" },
      { property: "og:description", content: "Agendamentos de visitas e aconselhamentos pastorais com os membros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaPastoral,
});

function AgendaPastoral() {
  const { db } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const ap = db.appointments;
  const proximos = ap.filter((a) => a["status"] === "Agendado" && String(a["data"]) >= today)
    .sort((a, b) => `${a["data"]}${a["hora"] ?? ""}`.localeCompare(`${b["data"]}${b["hora"] ?? ""}`)).slice(0, 6);
  const stats = [
    { l: "Agendados", v: ap.filter((a) => a["status"] === "Agendado").length, i: CalendarClock, c: "from-chart-1/25" },
    { l: "Realizados", v: ap.filter((a) => a["status"] === "Realizado").length, i: CheckCircle2, c: "from-chart-3/25" },
    { l: "Cancelados", v: ap.filter((a) => a["status"] === "Cancelado").length, i: XCircle, c: "from-destructive/25" },
    { l: "Total de atendimentos", v: ap.length, i: CalendarDays, c: "from-chart-2/25" },
  ];
  return (
    <div className="space-y-8 animate-rise">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className={`rounded-2xl border bg-gradient-to-br ${s.c} to-card p-5 shadow-card card-hover`}>
            <div className="flex items-center justify-between text-sm text-muted-foreground">{s.l}<s.i className="size-5 text-primary" /></div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{s.v}</div>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Próximos atendimentos</h2>
        {proximos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proximos.map((a) => (
              <div key={a.id} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-card card-hover">
                <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <span className="text-xl font-bold leading-none">{String(a["data"]).slice(8, 10)}</span>
                  <span className="text-[10px] uppercase">{new Date(String(a["data"]) + "T12:00").toLocaleDateString("pt-BR", { month: "short" })}</span>
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold"><User className="size-4 text-muted-foreground" /><span className="truncate">{a["membro"]}</span></div>
                  <div className="text-sm text-muted-foreground truncate">{a["tipo"]} · {a["motivo"] || "Sem motivo informado"}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" />{fmtDate(a["data"])} {a["hora"] ? `às ${a["hora"]}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">Nenhum atendimento futuro agendado.</div>}
      </section>
    <CrudPage title="Agenda Pastoral" subtitle="Visitas, aconselhamentos e atendimentos agendados com os membros."
      collection="appointments" singular="Agendamento"
      searchKeys={["membro", "motivo"]} filterKeys={["tipo", "status"]}
      fields={[
        { key: "membro", label: "Membro", type: "member", table: true, required: true },
        { key: "data", label: "Data", type: "date", table: true, required: true },
        { key: "hora", label: "Horário", table: true },
        { key: "tipo", label: "Tipo", type: "select", options: ["Visita", "Aconselhamento", "Oração", "Outro"], table: true },
        { key: "motivo", label: "Motivo", table: true },
        { key: "status", label: "Status", type: "select", options: ["Agendado", "Realizado", "Cancelado"], table: true },
        { key: "observacoes", label: "Observações", type: "textarea" },
      ]}
    />
    </div>
  );
}
