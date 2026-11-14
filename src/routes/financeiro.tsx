import { createFileRoute, Link } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { Download, TrendingUp } from "lucide-react";
import { brl, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { downloadChartAsPng } from "@/lib/chart-download";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — EclesiaPro" },
      { name: "description", content: "Receitas, despesas e fluxo de caixa." },
      { property: "og:title", content: "Financeiro — EclesiaPro" },
      { property: "og:description", content: "Receitas, despesas e fluxo de caixa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Financeiro,
});

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function Financeiro() {
  const { db } = useStore();
  const now = new Date();

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const tx = db.transactions.filter((t) => String(t.data).startsWith(key));
    const ct = db.contributions.filter((c) => String(c.data).startsWith(key));
    const receitas =
      tx.filter((t) => t.tipo === "Receita").reduce((a, t) => a + Number(t.valor || 0), 0) +
      ct.reduce((a, c) => a + Number(c.valor || 0), 0);
    const despesas = tx.filter((t) => t.tipo === "Despesa").reduce((a, t) => a + Number(t.valor || 0), 0);
    return {
      mes: `${MONTHS[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`,
      Receitas: receitas,
      Despesas: despesas,
    };
  });

  return (
    <div className="space-y-8 animate-rise">
      <CrudPage
        title="Movimentações"
        subtitle="Lançamentos de receitas e despesas."
        collection="transactions"
        singular="Lançamento"
        searchKeys={["descricao", "categoria"]}
        filterKeys={["tipo", "categoria", "congregacao"]}
        fields={[
          { key: "data", label: "Data", type: "date", table: true, required: true },
          { key: "tipo", label: "Tipo", type: "select", options: ["Receita", "Despesa"], table: true },
          {
            key: "categoria",
            label: "Categoria",
            type: "select",
            options: (values) =>
              values.tipo === "Despesa"
                ? [
                    "Água",
                    "Energia",
                    "Internet",
                    "Aluguel",
                    "Manutenção",
                    "Ajuda ministerial",
                    "Ação social",
                    "Materiais",
                    "Taxas bancárias",
                    "Outras despesas",
                  ]
                : [
                    "Cantina",
                    "Bazar",
                    "Eventos",
                    "Inscrições",
                    "Campanhas",
                    "Doações gerais",
                    "Rendimentos",
                    "Aluguel de espaço",
                    "Outras receitas",
                  ],
            table: true,
          },
          { key: "descricao", label: "Descrição", table: true },
          { key: "valor", label: "Valor", type: "money", table: true, required: true },
          {
            key: "pagamento",
            label: "Forma de pagamento",
            type: "select",
            options: ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"],
          },
          {
            key: "conta",
            label: "Conta bancária",
            type: "select",
            options: ["Banco do Brasil"],
          },
          { key: "congregacao", label: "Congregação", type: "congregation", table: true },
        ]}
      />

      <div className="rounded-2xl border bg-card p-5 shadow-card no-print">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">Fluxo Financeiro Recente</h3>
            <p className="text-xs text-muted-foreground">Receitas e Despesas dos últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/analise-financeira">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary">
                <TrendingUp className="size-3.5" /> Análise Completa
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadChartAsPng("chart-financeiro-fluxo", "fluxo-financeiro")}
              className="gap-2 text-xs"
            >
              <Download className="size-3.5" /> Baixar Gráfico (PNG)
            </Button>
          </div>
        </div>
        <div id="chart-financeiro-fluxo" className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                formatter={(v: number) => brl(v)}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Bar dataKey="Receitas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
