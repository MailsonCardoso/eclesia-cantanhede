import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — EclesiaPro" },
      { name: "description", content: "Receitas, despesas, fluxo de caixa e auditoria." },
      { property: "og:title", content: "Financeiro — EclesiaPro" },
      { property: "og:description", content: "Receitas, despesas, fluxo de caixa e auditoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Financeiro,
});

function Financeiro() {
  const { db } = useStore();
  return (
    <div className="space-y-8 animate-rise">
      <CrudPage title="Movimentações" subtitle="Lançamentos de receitas e despesas." collection="transactions" singular="Lançamento"
        searchKeys={["descricao", "categoria"]} filterKeys={["tipo", "categoria", "congregacao"]}
        fields={[
          { key: "data", label: "Data", type: "date", table: true, required: true },
          { key: "tipo", label: "Tipo", type: "select", options: ["Receita", "Despesa"], table: true },
          { key: "categoria", label: "Categoria", type: "select", options: ["Dízimos", "Ofertas", "Ofertas especiais", "Campanhas", "Doações", "Outras receitas", "Água", "Energia", "Internet", "Aluguel", "Manutenção", "Ajuda ministerial", "Ação social", "Materiais", "Outras despesas"], table: true },
          { key: "descricao", label: "Descrição", table: true },
          { key: "valor", label: "Valor", type: "money", table: true, required: true },
          { key: "pagamento", label: "Forma de pagamento", type: "select", options: ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"] },
          { key: "conta", label: "Conta bancária", type: "select", options: ["Banco do Brasil", "Nubank", "Itaú", "Santander"] },
          { key: "congregacao", label: "Congregação", type: "congregation", table: true },
        ]}
      />
      <div className="border-t pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="size-5 text-chart-1" />Auditoria de alterações</h2>
        <ul className="space-y-2 text-sm">
          {db.audit.slice(0, 15).map((a) => (
            <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b py-3 last:border-0">
              <span><span className="font-medium capitalize">{a.action}</span> · {a.label} <span className="text-muted-foreground">({a.collection})</span></span>
              <span className="text-muted-foreground">{new Date(a.at).toLocaleString("pt-BR")}</span>
            </li>
          ))}
          {!db.audit.length && <li className="text-muted-foreground">Nenhuma alteração registrada ainda.</li>}
        </ul>
      </div>
    </div>
  );
}
