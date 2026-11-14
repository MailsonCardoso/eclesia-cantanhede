import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { Receipt, Printer, Download, MessageSquare, Smartphone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { brl, fmtDate, useStore, type Row } from "@/lib/store";
import { maskPhone } from "@/lib/masks";
import { toast } from "sonner";
import jsPDF from "jspdf";

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

function downloadPdfReceipt(r: Row, cnpj: string) {
  try {
    const doc = new jsPDF({
      unit: "mm",
      format: "a5",
      orientation: "portrait",
    });

    // Card border
    doc.setDrawColor(220, 226, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(8, 8, 132, 194, 4, 4, "FD");

    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(8, 8, 132, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("ECLESIAPRO - GESTÃO ECLESIÁSTICA", 74, 18, { align: "center" });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("RECIBO OFICIAL DE CONTRIBUIÇÃO", 74, 25, { align: "center" });

    // Header info
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Recibo Nº: #REC-${String(r.id).slice(-6).toUpperCase()}`, 14, 40);
    doc.text(`Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 134, 40, { align: "right" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 43, 134, 43);

    // Fields
    let y = 51;
    const addField = (label: string, value: string, isHighlight = false) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(label, 14, y);

      doc.setFont("helvetica", isHighlight ? "bold" : "normal");
      doc.setFontSize(isHighlight ? 12 : 9.5);
      if (isHighlight) {
        doc.setTextColor(22, 163, 74);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(value, 134, y, { align: "right" });

      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 3, 134, y + 3);
      y += 10;
    };

    addField("Contribuinte:", String(r.membro || "Anônimo"));
    addField("Tipo de Contribuição:", String(r.tipo || "Dízimo"));
    addField("Valor Contribuído:", brl(Number(r.valor || 0)), true);
    addField("Data do Lançamento:", fmtDate(r.data));
    addField("Forma de Pagamento:", String(r.pagamento || "Dinheiro"));
    addField("Congregação:", String(r.congregacao || "Sede Central"));
    addField("CNPJ da Igreja:", cnpj);

    // Biblical verse
    y += 7;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const verse =
      '"Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." (2 Coríntios 9:7)';
    const splitVerse = doc.splitTextToSize(verse, 118);
    doc.text(splitVerse, 74, y, { align: "center" });

    // Signature
    y += 26;
    doc.setDrawColor(148, 163, 184);
    doc.line(34, y, 114, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("Tesouraria / Ministério Financeiro", 74, y + 5, { align: "center" });
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`${r.congregacao || "Igreja Local"} · CNPJ ${cnpj}`, 74, y + 10, { align: "center" });

    doc.save(`recibo-${r.id}.pdf`);
    toast.success("Recibo baixado em PDF com sucesso!");
  } catch (err) {
    console.error(err);
    toast.error("Erro ao gerar PDF do recibo.");
  }
}

function printReceiptDirect(r: Row, cnpj: string) {
  const printWindow = window.open("", "_blank", "width=600,height=750");
  if (!printWindow) {
    toast.error("Não foi possível abrir a janela de impressão.");
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Recibo - #${r.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #fff; color: #1e293b; max-width: 520px; margin: 0 auto; }
        .receipt-card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 28px; }
        .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { font-size: 18px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { font-size: 13px; color: #64748b; margin: 0; }
        .num { font-size: 12px; color: #94a3b8; margin-top: 8px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .row .label { color: #64748b; font-weight: 500; }
        .row .val { font-weight: 600; color: #0f172a; }
        .row.highlight .val { font-size: 18px; color: #16a34a; font-weight: bold; }
        .verse { font-style: italic; font-size: 12px; color: #64748b; text-align: center; margin: 24px 0 32px; line-height: 1.4; }
        .signature { text-align: center; margin-top: 40px; }
        .line { width: 220px; height: 1px; background: #94a3b8; margin: 0 auto 8px; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <h1>EclesiaPro</h1>
          <p>Recibo Oficial de Contribuição</p>
          <div class="num">Nº #REC-${String(r.id).slice(-6).toUpperCase()} · CNPJ: ${cnpj} · Emissão: ${new Date().toLocaleDateString("pt-BR")}</div>
        </div>
        <div class="row"><span class="label">Contribuinte:</span><span class="val">${r.membro || "Anônimo"}</span></div>
        <div class="row"><span class="label">Tipo:</span><span class="val">${r.tipo || "Dízimo"}</span></div>
        <div class="row highlight"><span class="label">Valor:</span><span class="val">${brl(Number(r.valor || 0))}</span></div>
        <div class="row"><span class="label">Data:</span><span class="val">${fmtDate(r.data)}</span></div>
        <div class="row"><span class="label">Forma de Pagamento:</span><span class="val">${r.pagamento || "—"}</span></div>
        <div class="row"><span class="label">Congregação:</span><span class="val">${r.congregacao || "Sede Central"}</span></div>
        <div class="row"><span class="label">CNPJ da Igreja:</span><span class="val">${cnpj}</span></div>
        <div class="verse">"Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." (2 Co 9:7)</div>
        <div class="signature">
          <div class="line"></div>
          <div style="font-size: 13px; font-weight: 600;">Tesouraria / Ministério Financeiro</div>
          <div style="font-size: 11px; color: #64748b;">${r.congregacao || "Igreja Local"} · CNPJ ${cnpj}</div>
        </div>
        <div class="footer">Gerado pelo sistema de gestão eclesiástica EclesiaPro</div>
      </div>
      <script>window.onload = function() { window.print(); window.close(); };</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function sendToWhatsapp(r: Row, phone: string, cnpj: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  let targetPhone = cleanPhone;
  if (targetPhone.length >= 10 && !targetPhone.startsWith("55")) {
    targetPhone = `55${targetPhone}`;
  }

  const message = [
    `*RECIBO DE CONTRIBUIÇÃO - ECLESIAPRO*`,
    `----------------------------------------`,
    `📄 *Recibo Nº:* #REC-${String(r.id).slice(-6).toUpperCase()}`,
    `🏢 *CNPJ:* ${cnpj}`,
    `👤 *Contribuinte:* ${r.membro || "Anônimo"}`,
    `🏷️ *Tipo:* ${r.tipo || "Dízimo"}`,
    `💰 *Valor:* ${brl(Number(r.valor || 0))}`,
    `📅 *Data:* ${fmtDate(r.data)}`,
    `💳 *Forma de Pagamento:* ${r.pagamento || "—"}`,
    `⛪ *Congregação:* ${r.congregacao || "Sede Central"}`,
    `----------------------------------------`,
    `_"Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." (2 Co 9:7)_`,
    ``,
    `Agradecemos a sua generosidade e fidelidade na obra do Senhor! 🙏`,
  ].join("\n");

  const encoded = encodeURIComponent(message);
  const whatsappUrl = targetPhone
    ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(whatsappUrl, "_blank");
  toast.success("Abrindo WhatsApp para compartilhamento...");
}

function ReceiptModal({
  row,
  onClose,
  members,
  congregations,
}: {
  row: Row | null;
  onClose: () => void;
  members: Array<{ id: string; nome: string; telefone?: string }>;
  congregations: Array<Row>;
}) {
  const memberData = useMemo(() => {
    if (!row?.membro) return null;
    return members.find(
      (m) => String(m.nome).trim().toLowerCase() === String(row.membro).trim().toLowerCase()
    );
  }, [members, row?.membro]);

  const churchCnpj = useMemo(() => {
    if (!row) return "12.345.678/0001-90";
    const matched = congregations.find(
      (c) => String(c.nome).trim().toLowerCase() === String(row.congregacao || "").trim().toLowerCase()
    );
    if (matched?.cnpj) return String(matched.cnpj);
    const sede = congregations.find((c) => Boolean(c.cnpj)) || congregations[0];
    return String(sede?.cnpj || "12.345.678/0001-90");
  }, [congregations, row]);

  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (memberData?.telefone) {
      setPhone(maskPhone(String(memberData.telefone)));
    } else {
      setPhone("");
    }
  }, [memberData, row]);

  if (!row) return null;

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[440px] p-0 overflow-hidden rounded-2xl border shadow-2xl">
        <DialogHeader className="px-5 py-3 bg-muted/40 border-b">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Recibo de Contribuição
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                Nº #REC-{String(row.id).slice(-6).toUpperCase()} · Emissão {new Date().toLocaleDateString("pt-BR")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Visual do Recibo */}
        <div className="px-5 py-3 space-y-2.5 text-xs">
          <div className="rounded-xl border bg-card px-3.5 py-2 space-y-1 shadow-sm">
            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-[11px] text-muted-foreground font-medium">Contribuinte</span>
              <span className="font-semibold text-foreground">{row.membro || "Anônimo"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-[11px] text-muted-foreground font-medium">Tipo de Lançamento</span>
              <Badge variant="outline" className="text-[10px] py-0 px-2 font-semibold">{row.tipo}</Badge>
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-[11px] text-muted-foreground font-medium">Valor Contribuído</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {brl(Number(row.valor || 0))}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-[11px] text-muted-foreground font-medium">Data</span>
              <span className="font-medium text-foreground">{fmtDate(row.data)}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-[11px] text-muted-foreground font-medium">Forma de Pagamento</span>
              <span className="font-medium text-foreground">{row.pagamento || "—"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-[11px] text-muted-foreground font-medium">Congregação</span>
              <span className="font-medium text-foreground">{row.congregacao || "Sede Central"}</span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-[11px] text-muted-foreground font-medium">CNPJ da Igreja</span>
              <span className="font-mono text-[11px] font-semibold text-foreground">{churchCnpj}</span>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 px-3 py-1.5 text-center border border-primary/10">
            <p className="text-[10.5px] italic text-muted-foreground leading-snug">
              "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria."
              <span className="block text-[10px] font-semibold text-primary/80 mt-0.5">2 Coríntios 9:7</span>
            </p>
          </div>

          {/* Campo de Telefone para WhatsApp */}
          <div className="space-y-1 pt-0.5">
            <Label htmlFor="whatsapp-phone" className="text-[11px] font-semibold flex items-center gap-1.5 text-foreground">
              <Smartphone className="size-3 text-emerald-600" />
              Telefone para envio via WhatsApp (Android / iOS / Web)
            </Label>
            <Input
              id="whatsapp-phone"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              className="h-8 rounded-lg shadow-sm text-xs"
            />
            {memberData?.telefone && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CheckCircle className="size-2.5 text-emerald-500" /> Telefone carregado do cadastro do membro
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-2.5 bg-muted/30 border-t flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printReceiptDirect(row, churchCnpj)}
            className="gap-1.5 rounded-lg text-xs flex-1 h-8"
          >
            <Printer className="size-3.5" />
            Imprimir
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadPdfReceipt(row, churchCnpj)}
            className="gap-1.5 rounded-lg text-xs flex-1 h-8"
          >
            <Download className="size-3.5" />
            Baixar PDF
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => sendToWhatsapp(row, phone, churchCnpj)}
            className="gap-1.5 rounded-lg text-xs flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium"
          >
            <MessageSquare className="size-3.5" />
            WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Contribuicoes() {
  const { db } = useStore();
  const [selectedReceipt, setSelectedReceipt] = useState<Row | null>(null);
  const membros = ["Anônimo", ...db.members.map((m) => String(m.nome))];

  return (
    <>
      <CrudPage
        title="Dízimos e ofertas"
        subtitle="Acesso restrito à tesouraria. Contribuições anônimas são permitidas."
        collection="contributions"
        singular="Contribuição"
        searchKeys={["membro"]}
        filterKeys={["tipo", "congregacao"]}
        extraAction={(r) => (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Ver Recibo"
            title="Ver / Baixar / Enviar Recibo"
            onClick={() => setSelectedReceipt(r)}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Receipt className="size-4" />
          </Button>
        )}
        fields={[
          { key: "membro", label: "Contribuinte", type: "select", options: membros, table: true },
          {
            key: "tipo",
            label: "Tipo",
            type: "select",
            options: ["Dízimo", "Oferta", "Oferta especial"],
            table: true,
          },
          { key: "valor", label: "Valor", type: "money", table: true, required: true },
          { key: "data", label: "Data", type: "date", table: true, required: true },
          {
            key: "pagamento",
            label: "Forma de pagamento",
            type: "select",
            options: ["PIX", "Dinheiro", "Cartão", "Transferência"],
            table: true,
          },
          { key: "congregacao", label: "Congregação", type: "congregation", table: true },
        ]}
      />

      <ReceiptModal
        row={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        members={db.members as Array<{ id: string; nome: string; telefone?: string }>}
        congregations={db.congregations as Array<Row>}
      />
    </>
  );
}
