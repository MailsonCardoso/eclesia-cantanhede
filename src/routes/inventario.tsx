import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { brl, useStore } from "@/lib/store";

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
  const { db } = useStore();
  const patrimonio = db.inventory.reduce((a, i) => a + Number(i.valor || 0) * Number(i["quantidade"] || 0), 0);
  const itens = db.inventory.reduce((a, i) => a + Number(i["quantidade"] || 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Itens cadastrados", String(db.inventory.length)],
          ["Unidades no total", String(itens)],
          ["Valor do patrimônio", brl(patrimonio)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="text-sm text-muted-foreground">{l}</div>
            <div className="mt-1 text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <CrudPage title="Inventário" subtitle="Bens, equipamentos e materiais da igreja."
        collection="inventory" singular="Item"
        searchKeys={["nome", "categoria", "local"]} filterKeys={["categoria", "estado", "local"]}
        fields={[
          { key: "nome", label: "Item", table: true, required: true },
          { key: "categoria", label: "Categoria", type: "select", options: ["Mobiliário", "Áudio", "Audiovisual", "Instrumentos", "Material didático", "Climatização", "Informática", "Cozinha", "Outros"], table: true },
          { key: "quantidade", label: "Quantidade", type: "number", table: true, required: true },
          { key: "estado", label: "Estado de conservação", type: "select", options: ["Novo", "Bom", "Regular", "Ruim"], table: true },
          { key: "local", label: "Local", type: "select", options: ["Sede Central", "Congregação Vila Nova", "Congregação Jardim Esperança", "Depósito"], table: true },
          { key: "aquisicao", label: "Data de aquisição", type: "date", table: true },
          { key: "valor", label: "Valor unitário", type: "money", table: true },
          { key: "observacoes", label: "Observações", type: "textarea" },
        ]}
      />
    </div>
  );
}
