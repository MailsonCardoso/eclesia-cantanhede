import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário — EclesiaPro" },
      { name: "description", content: "Controle do patrimônio e dos bens da igreja." },
      { property: "og:title", content: "Inventário — EclesiaPro" },
      { property: "og:description", content: "Controle do patrimônio e dos bens da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inventario,
});

function Inventario() {
  return (
    <div className="space-y-8 animate-rise">
      <CrudPage title="Inventário" subtitle="Bens, equipamentos e materiais da igreja."
        collection="inventory" singular="Item"
        searchKeys={["nome", "categoria", "local"]} filterKeys={["categoria", "estado", "local"]}
        fields={[
          { key: "nome", label: "Item", table: true, required: true },
          { key: "categoria", label: "Categoria", type: "select", options: ["Mobiliário", "Áudio", "Audiovisual", "Instrumentos", "Material didático", "Climatização", "Informática", "Cozinha", "Outros"], table: true },
          { key: "quantidade", label: "Quantidade", type: "number", table: true, required: true },
          { key: "estado", label: "Estado de conservação", type: "select", options: ["Novo", "Bom", "Regular", "Ruim"], table: true },
          { key: "local", label: "Local", type: "congregation", options: ["Depósito"], table: true },
          { key: "aquisicao", label: "Data de aquisição", type: "date", table: true },
          { key: "valor", label: "Valor unitário", type: "money", table: true },
          { key: "observacoes", label: "Observações", type: "textarea" },
        ]}
      />
    </div>
  );
}
