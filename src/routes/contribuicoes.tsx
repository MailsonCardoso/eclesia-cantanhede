import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl, fmtDate, useStore, type Row } from "@/lib/store";

export const Route = createFileRoute("/contribuicoes")({
  head: () => ({
    meta: [
      { title: "Dízimos e Ofertas — EclesiaPro" },
      { name: "description", content: "Registro de contribuições, recibos e histórico." },
      { property: "og:title", content: "Dízimos e Ofertas — EclesiaPro" },
      { property: "og:description", content: "Registro de contribuições, recibos e histórico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contribuicoes,
});

function printReceipt(r: Row) {
  const w = window.open("", "_blank", "width=480,height=600");
  if (!w) return;
  w.document.write(`<html><head><title>Recibo</title></head><body style="font-family:Georgia,serif;padding:32px">
    <h2>Recibo de contribuição</h2><p><b>Contribuinte:</b> ${r.membro}</p><p><b>Tipo:</b> ${r.tipo}</p>
    <p><b>Valor:</b> ${brl(Number(r.valor))}</p><p><b>Data:</b> ${fmtDate(r.data)}</p><p><b>Forma:</b> ${r.pagamento}</p>
    <p><b>Congregação:</b> ${r.congregacao}</p><br/><p>_____________________________<br/>Tesouraria</p></body></html>`);
  w.document.close();
  w.print();
}

function Contribuicoes() {
  const { db } = useStore();
  const membros = ["Anônimo", ...db.members.map((m) => String(m.nome))];
  return (
    <CrudPage title="Dízimos e ofertas" subtitle="Acesso restrito à tesouraria. Contribuições anônimas são permitidas." collection="contributions" singular="Contribuição"
      searchKeys={["membro"]} filterKeys={["tipo", "congregacao"]}
      extraAction={(r) => <Button size="icon" variant="ghost" aria-label="Recibo" onClick={() => printReceipt(r)}><Receipt className="size-4" /></Button>}
      fields={[
        { key: "membro", label: "Contribuinte", type: "select", options: membros, table: true },
        { key: "tipo", label: "Tipo", type: "select", options: ["Dízimo", "Oferta", "Oferta especial", "Campanha"], table: true },
        { key: "valor", label: "Valor", type: "money", table: true, required: true },
        { key: "data", label: "Data", type: "date", table: true, required: true },
        { key: "pagamento", label: "Forma de pagamento", type: "select", options: ["PIX", "Dinheiro", "Cartão", "Transferência"], table: true },
        { key: "congregacao", label: "Congregação", type: "congregation", table: true },
      ]}
    />
  );
}
