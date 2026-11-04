import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/congregacoes")({
  head: () => ({
    meta: [
      { title: "Congregações — Ecclesia" },
      { name: "description", content: "Administração das congregações da igreja." },
      { property: "og:title", content: "Congregações — Ecclesia" },
      { property: "og:description", content: "Administração das congregações da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Congregacoes,
});

function Congregacoes() {
  return (
    <CrudPage title="Congregações" subtitle="Sede e congregações filiadas." collection="congregations" singular="Congregação"
      searchKeys={["nome", "pastor"]} filterKeys={["situacao"]}
      fields={[
        { key: "nome", label: "Nome", table: true, required: true },
        { key: "cnpj", label: "CNPJ" },
        { key: "endereco", label: "Endereço", table: true },
        { key: "telefone", label: "Telefone", table: true },
        { key: "pastor", label: "Pastor responsável", table: true },
        { key: "fundacao", label: "Data de fundação", type: "date" },
        { key: "situacao", label: "Situação", type: "select", options: ["Ativa", "Inativa"], table: true },
      ]}
    />
  );
}
