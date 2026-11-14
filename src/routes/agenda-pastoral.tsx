import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock,
  User,
  Inbox,
  Plus,
  ArrowRight,
  X,
  Phone,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate, useStore, type Row } from "@/lib/store";
import { maskTime } from "@/lib/masks";

export const Route = createFileRoute("/agenda-pastoral")({
  head: () => ({
    meta: [
      { title: "Agenda Pastoral & Gabinete — EclesiaPro" },
      { name: "description", content: "Agendamentos de visitas, aconselhamentos e solicitações de atendimento pastoral." },
      { property: "og:title", content: "Agenda Pastoral & Gabinete — EclesiaPro" },
      { property: "og:description", content: "Agendamentos de visitas, aconselhamentos e solicitações de atendimento pastoral." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaPastoral,
});

function AgendaPastoral() {
  const { db, create, update, remove } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const ap = db.appointments || [];
  const requests = (db.pastoral_requests || []) as Row[];

  const proximos = ap
    .filter((a) => a["status"] === "Agendado" && String(a["data"]) >= today)
    .sort((a, b) => `${a["data"]}${a["hora"] ?? ""}`.localeCompare(`${b["data"]}${b["hora"] ?? ""}`))
    .slice(0, 6);

  const stats = [
    { l: "Agendados", v: ap.filter((a) => a["status"] === "Agendado").length, i: CalendarClock, c: "from-chart-1/25" },
    { l: "Solicitações Pendentes", v: requests.filter((r) => r.status === "Pendente").length, i: Inbox, c: "from-amber-500/25" },
    { l: "Realizados", v: ap.filter((a) => a["status"] === "Realizado").length, i: CheckCircle2, c: "from-chart-3/25" },
    { l: "Total Atendimentos", v: ap.length, i: CalendarDays, c: "from-chart-2/25" },
  ];

  // Modal para criar solicitação
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqPerson, setReqPerson] = useState("");
  const [reqType, setReqType] = useState<"Gabinete" | "Visita">("Gabinete");
  const [reqReason, setReqReason] = useState("");
  const [reqNotes, setReqNotes] = useState("");

  // Modal para converter solicitação em agendamento
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Row | null>(null);
  const [schedDate, setSchedDate] = useState(new Date().toISOString().slice(0, 10));
  const [schedTime, setSchedTime] = useState("14:00");
  const [schedLocation, setSchedLocation] = useState("Gabinete Pastoral");

  const handleCreateRequest = () => {
    if (!reqPerson.trim() || !reqReason.trim()) return;

    create("pastoral_requests", {
      person: reqPerson.trim(),
      membro: reqPerson.trim(),
      type: reqType,
      tipo: reqType,
      reason: reqReason.trim(),
      motivo: reqReason.trim(),
      notes: reqNotes.trim(),
      requested_at: new Date().toISOString(),
      status: "Pendente",
      situacao: "Pendente",
    });

    setReqPerson("");
    setReqReason("");
    setReqNotes("");
    setReqModalOpen(false);
  };

  const handleOpenSchedule = (req: Row) => {
    setSelectedReq(req);
    setSchedDate(new Date().toISOString().slice(0, 10));
    setSchedTime("14:00");
    setSchedLocation(req.type === "Visita" ? "Residência / Hospital" : "Gabinete Pastoral");
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = () => {
    if (!selectedReq) return;

    // 1. Cria o agendamento oficial
    create("appointments", {
      membro: selectedReq.person || selectedReq.membro,
      person: selectedReq.person || selectedReq.membro,
      member_id: selectedReq.member_id,
      data: schedDate,
      hora: schedTime,
      start_time: schedTime,
      tipo: selectedReq.type || selectedReq.tipo || "Gabinete",
      motivo: selectedReq.reason || selectedReq.motivo || "Solicitação de atendimento",
      location: schedLocation,
      local: schedLocation,
      status: "Agendado",
      observacoes: selectedReq.notes || "",
    });

    // 2. Atualiza a solicitação para "Agendado"
    update("pastoral_requests", {
      ...selectedReq,
      status: "Agendado",
      situacao: "Agendado",
    });

    setScheduleModalOpen(false);
    setSelectedReq(null);
  };

  const handleCancelRequest = (req: Row) => {
    update("pastoral_requests", {
      ...req,
      status: "Cancelado",
      situacao: "Cancelado",
    });
  };

  // Se a tela de nova solicitação estiver aberta
  if (reqModalOpen) {
    return (
      <div className="space-y-6 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReqModalOpen(false)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="size-4 rotate-180" />
              Voltar para Agenda Pastoral
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <CalendarClock className="size-6 text-primary" />
                Nova Solicitação de Atendimento
              </h1>
              <p className="text-xs text-muted-foreground">Registre pedidos de visitas pastorais ou gabinete com os membros.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setReqModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRequest} className="px-6">
              Salvar Solicitação
            </Button>
          </div>
        </div>

        <div className="max-w-4xl rounded-3xl border bg-card p-6 md:p-8 shadow-card space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 text-sm">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Pessoa / Solicitante *</label>
              <input
                type="text"
                required
                placeholder="Nome do membro ou visitante..."
                value={reqPerson}
                onChange={(e) => setReqPerson(e.target.value)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Tipo de Atendimento</label>
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value as "Gabinete" | "Visita")}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none cursor-pointer shadow-sm"
              >
                <option value="Gabinete">Gabinete Pastoral (Na igreja)</option>
                <option value="Visita">Visita Pastoral (Na residência ou hospital)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Motivo / Assunto do Pedido *</label>
              <textarea
                rows={3}
                required
                placeholder="Ex: Aconselhamento conjugal, oração por cura, orientação profissional..."
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary resize-none shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Observações / Preferência de Horário</label>
              <input
                type="text"
                placeholder="Ex: Prefere terças ou quintas após as 18h..."
                value={reqNotes}
                onChange={(e) => setReqNotes(e.target.value)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button variant="outline" onClick={() => setReqModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRequest} className="px-8">
              Salvar Solicitação
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se a tela de agendamento estiver aberta
  if (scheduleModalOpen && selectedReq) {
    return (
      <div className="space-y-6 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleModalOpen(false)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="size-4 rotate-180" />
              Voltar para Solicitações
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-6 text-emerald-500" />
                Confirmar Agendamento Pastoral
              </h1>
              <p className="text-xs text-muted-foreground">
                Para: <strong>{String(selectedReq.person ?? selectedReq.membro)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSchedule} className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-6">
              <CheckCircle2 className="size-4" />
              Confirmar Agendamento
            </Button>
          </div>
        </div>

        <div className="max-w-3xl rounded-3xl border bg-card p-6 md:p-8 shadow-card space-y-6">
          <div className="p-4 rounded-2xl bg-secondary/60 text-xs space-y-2 border border-border/50">
            <div className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <span className="inline-block size-2 rounded-full bg-primary" />
              Tipo de Atendimento: {String(selectedReq.type ?? selectedReq.tipo)}
            </div>
            <div className="text-muted-foreground text-sm">
              Motivo: {String(selectedReq.reason ?? selectedReq.motivo)}
            </div>
            {selectedReq.notes && (
              <div className="text-muted-foreground text-xs italic">
                Observações do solicitante: {String(selectedReq.notes)}
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 text-sm">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Data do Atendimento *</label>
              <input
                type="date"
                required
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none cursor-pointer shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Horário (00:00) *</label>
              <input
                type="text"
                required
                placeholder="00:00"
                maxLength={5}
                value={schedTime}
                onChange={(e) => setSchedTime(maskTime(e.target.value))}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-foreground">Local do Atendimento</label>
              <input
                type="text"
                value={schedLocation}
                onChange={(e) => setSchedLocation(e.target.value)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSchedule} className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-8">
              <CheckCircle2 className="size-4" />
              Confirmar e Agendar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-rise">
      {/* Cards de Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className={`rounded-2xl border bg-gradient-to-br ${s.c} to-card p-5 shadow-card card-hover`}>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {s.l}
              <s.i className="size-5 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Seção: Solicitações de Gabinete e Visitas */}
      <section className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Inbox className="size-5 text-amber-500" />
              Solicitações de Atendimento (Gabinete & Visitas)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pedidos de oração, aconselhamento e visitas enviados por membros ou pela secretaria.
            </p>
          </div>
          <Button size="sm" onClick={() => setReqModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="size-3.5" />
            Nova Solicitação
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pessoa / Membro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo / Pedido</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Data Solicitação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length ? (
                requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-foreground flex items-center gap-2">
                      <User className="size-4 text-primary" />
                      <span>{String(r.person ?? r.membro)}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          r.type === "Visita" ? "bg-blue-500/15 text-blue-500" : "bg-purple-500/15 text-purple-500"
                        }`}
                      >
                        {String(r.type ?? r.tipo)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[260px] truncate" title={String(r.reason ?? r.motivo)}>
                      {String(r.reason ?? r.motivo)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {String(r.notes || "—")}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {fmtDate(r.requested_at || r.data)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.status === "Pendente"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                            : r.status === "Agendado"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {String(r.status ?? r.situacao)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "Pendente" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenSchedule(r)}
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <CalendarClock className="size-3" />
                            Agendar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelRequest(r)}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Nenhuma solicitação de atendimento pendente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Próximos Atendimentos */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Próximos atendimentos agendados</h2>
        {proximos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proximos.map((a) => (
              <div key={a.id} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-card card-hover">
                <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <span className="text-xl font-bold leading-none">{String(a["data"]).slice(8, 10)}</span>
                  <span className="text-[10px] uppercase">
                    {new Date(String(a["data"]) + "T12:00").toLocaleDateString("pt-BR", { month: "short" })}
                  </span>
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <User className="size-4 text-muted-foreground" />
                    <span className="truncate">{a["membro"]}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {a["tipo"]} · {a["motivo"] || "Sem motivo informado"}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {fmtDate(a["data"])} {a["hora"] ? `às ${a["hora"]}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            Nenhum atendimento futuro agendado.
          </div>
        )}
      </section>

      {/* CRUD Completo de Atendimentos */}
      <CrudPage
        title="Agenda Pastoral"
        subtitle="Visitas, aconselhamentos e atendimentos agendados com os membros."
        collection="appointments"
        singular="Agendamento"
        searchKeys={["membro", "motivo"]}
        filterKeys={["tipo", "status"]}
        fields={[
          { key: "membro", label: "Membro", type: "member", table: true, required: true },
          { key: "data", label: "Data", type: "date", table: true, required: true },
          { key: "hora", label: "Horário", type: "time", table: true },
          {
            key: "tipo",
            label: "Tipo",
            type: "select",
            options: ["Visita", "Aconselhamento", "Oração", "Outro"],
            table: true,
          },
          { key: "motivo", label: "Motivo", table: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["Agendado", "Realizado", "Cancelado"],
            table: true,
          },
          { key: "observacoes", label: "Observações", type: "textarea" },
        ]}
      />
    </div>
  );
}
