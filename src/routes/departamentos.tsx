import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/departamentos")({
  head: () => ({
    meta: [
      { title: "Departamentos — EclesiaPro" },
      { name: "description", content: "Departamentos e ministérios da igreja." },
      { property: "og:title", content: "Departamentos — EclesiaPro" },
      { property: "og:description", content: "Departamentos e ministérios da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Departamentos,
});

function Departamentos() {
  return (
    <CrudPage title="Departamentos e ministérios" subtitle="Líderes, integrantes e situação." collection="departments" singular="Departamento"
      searchKeys={["nome", "lider"]} filterKeys={["situacao"]}
      fields={[
        { key: "nome", label: "Nome", table: true, required: true },
        { key: "lider", label: "Líder responsável", type: "leader", table: true },
        { key: "integrantes", label: "Nº de integrantes", type: "number", table: true },
        { key: "situacao", label: "Situação", type: "select", options: ["Ativo", "Inativo"], table: true },
        { key: "descricao", label: "Descrição", type: "textarea" },
      ]}
    />
  );
}
