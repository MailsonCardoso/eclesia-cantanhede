import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/celulas")({
  head: () => ({
    meta: [
      { title: "Células — EclesiaPro" },
      { name: "description", content: "Cadastro e acompanhamento das células da igreja." },
      { property: "og:title", content: "Células — EclesiaPro" },
      { property: "og:description", content: "Cadastro e acompanhamento das células da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Celulas,
});

function Celulas() {
  return (
    <CrudPage title="Células" subtitle="Grupos de comunhão nos lares: líderes, horários e participantes." collection="cells" singular="Célula"
      searchKeys={["nome", "lider", "endereco"]} filterKeys={["congregacao", "situacao"]}
      fields={[
        { key: "nome", label: "Nome da célula", table: true, required: true },
        { key: "lider", label: "Líder", type: "member", table: true },
        { key: "anfitriao", label: "Anfitrião (lar)", type: "member" },
        { key: "endereco", label: "Endereço de encontro" },
        { key: "dia", label: "Dia da reunião", type: "select", options: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"], table: true },
        { key: "hora", label: "Horário", table: true },
        { key: "congregacao", label: "Congregação", type: "select", options: ["Sede Central", "Congregação Vila Nova", "Congregação Jardim Esperança"], table: true },
        { key: "participantes", label: "Nº de participantes", type: "number", table: true },
        { key: "situacao", label: "Situação", type: "select", options: ["Ativa", "Inativa"], table: true },
        { key: "observacoes", label: "Observações", type: "textarea" },
      ]}
    />
  );
}
