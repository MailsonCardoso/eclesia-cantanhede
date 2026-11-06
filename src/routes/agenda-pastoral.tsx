import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/agenda-pastoral")({
  head: () => ({
    meta: [
      { title: "Agenda Pastoral — Ecclesia" },
      { name: "description", content: "Agendamentos de visitas e aconselhamentos pastorais com os membros." },
      { property: "og:title", content: "Agenda Pastoral — Ecclesia" },
      { property: "og:description", content: "Agendamentos de visitas e aconselhamentos pastorais com os membros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaPastoral,
});

function AgendaPastoral() {
  return (
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
  );
}
