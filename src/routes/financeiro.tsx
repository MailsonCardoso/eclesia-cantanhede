import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { brl, useStore } from "@/lib/store";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Ecclesia" },
      { name: "description", content: "Receitas, despesas, fluxo de caixa e auditoria." },
      { property: "og:title", content: "Financeiro — Ecclesia" },
      { property: "og:description", content: "Receitas, despesas, fluxo de caixa e auditoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Financeiro,
});

function Financeiro() {
  const { db } = useStore();
  const rec = db.transactions.filter((t) => t.tipo === "Receita").reduce((a, t) => a + Number(t.valor), 0);
  const desp = db.transactions.filter((t) => t.tipo === "Despesa").reduce((a, t) => a + Number(t.valor), 0);
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Receitas", rec], ["Despesas", desp], ["Saldo em caixa", rec - desp]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-card p-5 shadow-card card-hover">
            <div className="text-sm text-muted-foreground">{l}</div>
            <div className="mt-1 text-2xl font-bold tracking-tight">{brl(Number(v))}</div>
          </div>
        ))}
      </div>
      <CrudPage title="Movimentações" subtitle="Lançamentos de receitas e despesas." collection="transactions" singular="Lançamento"
        searchKeys={["descricao", "categoria"]} filterKeys={["tipo", "categoria", "congregacao"]}
        fields={[
          { key: "data", label: "Data", type: "date", table: true, required: true },
          { key: "tipo", label: "Tipo", type: "select", options: ["Receita", "Despesa"], table: true },
          { key: "categoria", label: "Categoria", type: "select", options: ["Dízimos", "Ofertas", "Ofertas especiais", "Campanhas", "Doações", "Outras receitas", "Água", "Energia", "Internet", "Aluguel", "Manutenção", "Ajuda ministerial", "Ação social", "Materiais", "Outras despesas"], table: true },
          { key: "descricao", label: "Descrição", table: true },
          { key: "valor", label: "Valor", type: "money", table: true, required: true },
          { key: "pagamento", label: "Forma de pagamento", type: "select", options: ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"] },
          { key: "conta", label: "Conta bancária", type: "select", options: ["Conta principal", "Caixa", "Poupança"] },
          { key: "congregacao", label: "Congregação", type: "select", options: ["Sede Central", "Congregação Vila Nova", "Congregação Jardim Esperança"], table: true },
          { key: "comprovante", label: "Comprovante (link)" },
        ]}
      />
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-semibold">Auditoria de alterações</h2>
        <ul className="space-y-2 text-sm">
          {db.audit.slice(0, 15).map((a) => (
            <li key={a.id} className="flex justify-between border-b pb-2 last:border-0">
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
