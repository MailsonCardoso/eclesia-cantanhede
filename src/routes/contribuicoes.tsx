import { useState, useMemo, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import {
  Receipt,
  Printer,
  Download,
  MessageSquare,
  Smartphone,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { brl, DEFAULT_CONGREGATION, fmtDate, useStore, type Row } from "@/lib/store";
import { maskPhone } from "@/lib/masks";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

async function generateReceiptCanvas(element: HTMLElement) {
  return await html2canvas(element, {
    scale: 3, // 300 DPI ultra-sharp
    useCORS: true,
    backgroundColor: "#0f1424",
    logging: false,
  });
}

function printReceiptDirect(r: Row, cnpj: string) {
  const printWindow = window.open("", "_blank", "width=600,height=800");
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
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; background: #fff; color: #0f172a; max-width: 480px; margin: 0 auto; }
        .receipt-card { border: 2px solid #0f172a; border-radius: 18px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
        .header h1 { font-size: 16px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: #0f172a; }
        .header p { font-size: 11px; color: #64748b; margin: 3px 0 0 0; }
        .num { font-size: 11px; color: #64748b; font-weight: 600; text-align: right; }
        .badge { display: inline-block; background: #16a34a; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .row .label { color: #64748b; font-weight: 500; }
        .row .val { font-weight: 600; color: #0f172a; text-align: right; }
        .row.highlight .val { font-size: 17px; color: #16a34a; font-weight: 800; }
        .verse { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; font-style: italic; font-size: 11.5px; color: #475569; text-align: center; margin: 16px 0; line-height: 1.45; }
        .verse span { display: block; font-style: normal; font-weight: bold; color: #7c3aed; font-size: 10.5px; margin-top: 4px; }
        .signature { text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .sig-title { font-size: 12px; font-weight: 700; color: #1e293b; }
        .sig-sub { font-size: 10.5px; color: #64748b; margin-top: 2px; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div>
            <h1>Recibo de Contribuição</h1>
            <p>EclesiaPro &middot; Gestão Eclesiástica</p>
          </div>
          <div class="num">
            <span class="badge">OFICIAL</span>
            <div style="margin-top: 4px;">#REC-${String(r.id).slice(-6).toUpperCase()}</div>
            <div style="font-size: 9.5px; font-weight: normal;">${new Date().toLocaleDateString("pt-BR")}</div>
          </div>
        </div>

        <div class="row"><span class="label">Contribuinte:</span><span class="val">${r.membro || "Anônimo"}</span></div>
        <div class="row"><span class="label">Tipo de Lançamento:</span><span class="val">${r.tipo || "Dízimo"}</span></div>
        <div class="row highlight"><span class="label">Valor Contribuído:</span><span class="val">${brl(Number(r.valor || 0))}</span></div>
        <div class="row"><span class="label">Data do Lançamento:</span><span class="val">${fmtDate(r.data)}</span></div>
        <div class="row"><span class="label">Forma de Pagamento:</span><span class="val">${r.pagamento || "—"}</span></div>
        <div class="row"><span class="label">Congregação:</span><span class="val">${r.congregacao || "Igreja Batista Cristo e Família"}</span></div>
        <div class="row"><span class="label">CNPJ da Igreja:</span><span class="val">${cnpj}</span></div>

        <div class="verse">
          &ldquo;Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria.&rdquo;
          <span>2 Coríntios 9:7</span>
        </div>

        <div class="signature">
          <div class="sig-title">Tesouraria / Ministério Financeiro</div>
          <div class="sig-sub">${r.congregacao || "Igreja Batista Cristo e Família"} &middot; CNPJ ${cnpj}</div>
        </div>
      </div>
      <script>window.onload = function() { window.print(); window.close(); };</script>
    </body>
    </html>
  `);
  printWindow.document.close();
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
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phone, setPhone] = useState("");

  const memberData = useMemo(() => {
    if (!row?.membro) return null;
    return members.find(
      (m) => String(m.nome).trim().toLowerCase() === String(row.membro).trim().toLowerCase()
    );
  }, [members, row?.membro]);

  const churchCnpj = useMemo(() => {
    if (!row) return "50.264.838/0001-60";
    const matched = congregations.find(
      (c) => String(c.nome).trim().toLowerCase() === String(row.congregacao || "").trim().toLowerCase()
    );
    if (matched?.cnpj) return String(matched.cnpj);
    const sede = congregations.find((c) => Boolean(c.cnpj)) || congregations[0];
    return String(sede?.cnpj || "50.264.838/0001-60");
  }, [congregations, row]);

  useEffect(() => {
    if (memberData?.telefone) {
      setPhone(maskPhone(String(memberData.telefone)));
    } else {
      setPhone("");
    }
  }, [memberData, row]);

  if (!row) return null;

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsProcessing(true);
    try {
      const canvas = await generateReceiptCanvas(receiptRef.current);
      const link = document.createElement("a");
      link.download = `comprovante-${row.id || "recibo"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Imagem do comprovante baixada em alta resolução!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar imagem do comprovante.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsProcessing(true);
    try {
      const canvas = await generateReceiptCanvas(receiptRef.current);
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Formato A5 retrato (148 x 210 mm)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5",
      });

      const pageWidth = 148;
      const pageHeight = 210;
      const margin = 10;
      const targetWidth = pageWidth - margin * 2;
      const targetHeight = (imgHeight * targetWidth) / imgWidth;
      const posY = Math.max(margin, (pageHeight - targetHeight) / 2);

      // Fundo escuro elegante para combinar com o comprovante oficial
      doc.setFillColor(15, 20, 36);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.addImage(imgData, "PNG", margin, posY, targetWidth, targetHeight, undefined, "FAST");
      doc.save(`recibo-${row.id || "contribuicao"}.pdf`);
      toast.success("PDF oficial gerado e baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF do comprovante.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!receiptRef.current) return;
    setIsProcessing(true);

    try {
      const canvas = await generateReceiptCanvas(receiptRef.current);

      const cleanPhone = phone.replace(/\D/g, "");
      let targetPhone = cleanPhone;
      if (targetPhone.length >= 10 && !targetPhone.startsWith("55")) {
        targetPhone = `55${targetPhone}`;
      }

      const messageText = [
        `*RECIBO OFICIAL DE CONTRIBUIÇÃO - ECLESIAPRO*`,
        `📄 *Nº:* #REC-${String(row.id).slice(-6).toUpperCase()}`,
        `👤 *Contribuinte:* ${row.membro || "Anônimo"}`,
        `🏷️ *Tipo:* ${row.tipo || "Dízimo"}`,
        `💰 *Valor:* ${brl(Number(row.valor || 0))}`,
        `📅 *Data:* ${fmtDate(row.data)}`,
        `💳 *Forma de Pagamento:* ${row.pagamento || "—"}`,
        `⛪ *Congregação:* ${row.congregacao || "Igreja Batista Cristo e Família"}`,
        `🏢 *CNPJ:* ${churchCnpj}`,
        ``,
        `_"Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." (2 Co 9:7)_`,
        ``,
        `Agradecemos a sua fidelidade e generosidade na obra do Senhor! 🙏`,
      ].join("\n");

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 0.95)
      );

      if (!blob) throw new Error("Falha ao gerar arquivo de imagem.");

      const fileName = `comprovante-${row.id || "recibo"}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // 1. No Celular: Web Share API (Android e iOS) permite anexar a imagem direto no WhatsApp!
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Recibo de Contribuição",
            text: messageText,
          });
          toast.success("Comprovante compartilhado com sucesso!");
          return;
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") {
            return;
          }
          console.warn("Falha no navigator.share, usando fallback", shareErr);
        }
      }

      // 2. No Computador (WhatsApp Web): Copia a imagem para a área de transferência
      let copiedToClipboard = false;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ "image/png": blob }),
          ]);
          copiedToClipboard = true;
        }
      } catch (clipErr) {
        console.warn("Não foi possível copiar para clipboard", clipErr);
      }

      // Abre o WhatsApp com o número e o texto oficial
      const encoded = encodeURIComponent(messageText);
      const whatsappUrl = targetPhone
        ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;

      window.open(whatsappUrl, "_blank");

      if (copiedToClipboard) {
        toast.success(
          "Imagem do comprovante copiada! No WhatsApp Web, aperte Ctrl + V para colar a imagem no chat.",
          { duration: 6000 }
        );
      } else {
        toast.info("WhatsApp aberto com os dados do comprovante!");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error(err);
        toast.error("Erro ao preparar envio para o WhatsApp.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[430px] p-0 overflow-hidden rounded-3xl border border-[#232d4b] bg-[#0c101c] text-[#f8fafc] shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Recibo de Contribuição</DialogTitle>
          <DialogDescription>
            Nº #REC-{String(row.id).slice(-6).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-3.5 max-h-[85vh] overflow-y-auto">
          {/* Card Capturável e Exportável */}
          <div
            ref={receiptRef}
            className="rounded-2xl border border-[#232d4b] bg-[#0f1424] text-[#f8fafc] p-4 space-y-3 select-none shadow-xl"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {/* Topo do Recibo */}
            <div className="flex items-center justify-between border-b border-[#1e2742] pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-[#2e1d52] border border-[#7c3aed]/40 text-[#c084fc] shadow-sm shrink-0">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight text-[#f8fafc]">
                    Recibo de Contribuição
                  </div>
                  <div className="text-[10.5px] text-[#94a3b8]">
                    Nº #REC-{String(row.id).slice(-6).toUpperCase()} &middot; Emissão {new Date().toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded-full bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 text-[10px] font-semibold text-[#34d399]">
                  Oficial
                </span>
                <div className="text-[9.5px] text-[#64748b] mt-0.5">EclesiaPro</div>
              </div>
            </div>

            {/* Linhas de Informações */}
            <div className="rounded-xl border border-[#1e2742] bg-[#141b30] p-2.5 space-y-1 shadow-inner">
              <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/70 text-xs">
                <span className="text-[#94a3b8] font-medium">Contribuinte</span>
                <span className="font-semibold text-[#f8fafc] text-right truncate max-w-[210px]">
                  {row.membro || "Anônimo"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/70 text-xs">
                <span className="text-[#94a3b8] font-medium">Tipo de Lançamento</span>
                <span className="rounded-md border border-[#334155] bg-[#1e293b] px-2 py-0.5 text-[10.5px] font-semibold text-[#e2e8f0]">
                  {row.tipo || "Dízimo"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/70 text-xs">
                <span className="text-[#94a3b8] font-medium">Valor Contribuído</span>
                <span className="text-base sm:text-lg font-extrabold text-[#10b981] tracking-tight">
                  {brl(Number(row.valor || 0))}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/70 text-xs">
                <span className="text-[#94a3b8] font-medium">Data</span>
                <span className="font-semibold text-[#f8fafc]">{fmtDate(row.data)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/70 text-xs">
                <span className="text-[#94a3b8] font-medium">Forma de Pagamento</span>
                <span className="font-semibold text-[#f8fafc]">{row.pagamento || "—"}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/70 text-xs">
                <span className="text-[#94a3b8] font-medium">Congregação</span>
                <span className="font-semibold text-[#f8fafc] text-right truncate max-w-[210px]">
                  {row.congregacao || "Igreja Batista Cristo e Família"}
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5 text-xs">
                <span className="text-[#94a3b8] font-medium">CNPJ da Igreja</span>
                <span className="font-mono text-[11px] font-semibold text-[#cbd5e1]">{churchCnpj}</span>
              </div>
            </div>

            {/* Versículo */}
            <div className="rounded-xl border border-[#2e2652] bg-[#1e1738]/60 p-2 text-center shadow-xs">
              <p className="text-[10px] sm:text-[10.5px] italic text-[#cbd5e1] leading-relaxed">
                &ldquo;Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria.&rdquo;
              </p>
              <span className="block text-[9.5px] font-bold text-[#c084fc] mt-0.5">2 Coríntios 9:7</span>
            </div>

            {/* Rodapé institucional */}
            <div className="pt-0.5 text-center border-t border-[#1e2742]/60 space-y-0.5">
              <div className="text-[10.5px] font-semibold text-[#cbd5e1]">Tesouraria / Ministério Financeiro</div>
              <div className="text-[9px] text-[#64748b]">
                {row.congregacao || "Igreja Batista Cristo e Família"} &middot; CNPJ {churchCnpj}
              </div>
            </div>
          </div>

          {/* Campo de Telefone para WhatsApp */}
          <div className="space-y-1">
            <Label htmlFor="whatsapp-phone" className="text-[11px] font-semibold flex items-center gap-1.5 text-[#cbd5e1]">
              <Smartphone className="size-3 text-emerald-400" />
              Telefone para envio via WhatsApp
            </Label>
            <Input
              id="whatsapp-phone"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              className="h-9 rounded-xl border-[#232d4b] bg-[#12182a] text-[#f8fafc] placeholder:text-[#64748b] text-xs font-medium focus-visible:border-emerald-500"
            />
            {memberData?.telefone && (
              <p className="text-[10.5px] text-[#94a3b8] flex items-center gap-1">
                <CheckCircle className="size-3 text-emerald-400" /> Telefone carregado do cadastro do membro
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="p-3.5 sm:p-4 bg-[#080b14] border-t border-[#1c2438] flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => printReceiptDirect(row, churchCnpj)}
              className="h-9 rounded-xl text-xs border-[#26314d] bg-[#12182b] text-[#cbd5e1] hover:bg-[#1a233d] hover:text-[#f8fafc] gap-1 cursor-pointer font-medium"
            >
              <Printer className="size-3.5" />
              <span>Imprimir</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={handleDownloadImage}
              className="h-9 rounded-xl text-xs border-[#26314d] bg-[#12182b] text-[#cbd5e1] hover:bg-[#1a233d] hover:text-[#f8fafc] gap-1 cursor-pointer font-medium"
            >
              {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
              <span>Imagem</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={handleDownloadPdf}
              className="h-9 rounded-xl text-xs border-[#26314d] bg-[#12182b] text-[#cbd5e1] hover:bg-[#1a233d] hover:text-[#f8fafc] gap-1 cursor-pointer font-medium"
            >
              {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              <span>PDF</span>
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={handleShareWhatsApp}
            className="w-full h-10 rounded-xl text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold gap-2 cursor-pointer transition-all"
          >
            {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
            <span>Enviar no WhatsApp</span>
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
        enablePeriodFilter={true}
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
          { key: "congregacao", label: "Congregação", type: "congregation", options: [DEFAULT_CONGREGATION], table: true },
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
