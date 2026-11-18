import { useState, useMemo, useEffect } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, DEFAULT_CONGREGATION, fmtDate, useStore, type Row } from "@/lib/store";
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

/**
 * Formata o número do recibo de forma profissional.
 * Ex: ID 1 -> "0001", ID 15 -> "0015", IDs alfanuméricos -> últimos 6 caracteres maiúsculos.
 */
function formatReceiptNumber(id: string | number | undefined): string {
  if (!id) return "0001";
  const str = String(id).trim();
  if (/^\d+$/.test(str)) {
    return str.padStart(4, "0");
  }
  return str.slice(-6).toUpperCase();
}

/**
 * Gera um nome de arquivo limpo e padronizado com o nome do contribuinte e número do recibo.
 * Ex: "Recibo-Mailson-Costa-Cardoso-0001.pdf"
 */
function getReceiptFileName(row: Row, ext: "png" | "pdf"): string {
  const rawName = String(row.membro || "Anonimo").trim();
  const safeName = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
  const num = formatReceiptNumber(row.id);
  return `Recibo-${safeName || "Contribuinte"}-${num}.${ext}`;
}

/**
 * Desenha o comprovante diretamente no Canvas 2D em altíssima definição (300 DPI).
 * 100% nativo no navegador, sem biblioteca externa de CSS (imune a erros de oklch) e ultra nítido.
 */
function drawReceiptToCanvas(r: Row, cnpj: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 640;
  const height = 860;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const drawRoundRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    fillStyle?: string,
    strokeStyle?: string,
    lineWidth = 1
  ) => {
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(x, y, w, h, radius);
    } else {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  };

  // 1. Fundo do comprovante
  drawRoundRect(0, 0, width, height, 28, "#0c101d", "#232d4b", 2);

  // 2. Cabeçalho
  drawRoundRect(32, 32, 50, 50, 14, "#2e1d52", "#7c3aed", 1.5);
  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✝", 32 + 25, 32 + 23);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.fillText("Recibo de Contribuição", 96, 54);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  const recNum = `#REC-${formatReceiptNumber(r.id)}`;
  ctx.fillText(`${recNum} · Emissão ${new Date().toLocaleDateString("pt-BR")}`, 96, 74);

  // Badge Oficial
  drawRoundRect(width - 122, 38, 90, 28, 14, "rgba(16, 185, 129, 0.15)", "#10b981", 1);
  ctx.fillStyle = "#34d399";
  ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("OFICIAL", width - 122 + 45, 57);

  // Linha divisória
  ctx.strokeStyle = "#1e2742";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 100);
  ctx.lineTo(width - 32, 100);
  ctx.stroke();

  // 3. Card com os Dados da Contribuição
  const isDinheiro = r.pagamento === "Dinheiro";
  const rows = [
    { label: "Contribuinte", val: String(r.membro || "Anônimo"), highlight: false, isBadge: false, isMono: false },
    { label: "Tipo de Lançamento", val: String(r.tipo || "Dízimo"), highlight: false, isBadge: true, isMono: false },
    { label: "Valor Contribuído", val: brl(Number(r.valor || 0)), highlight: true, isBadge: false, isMono: false },
    { label: "Data do Lançamento", val: fmtDate(r.data), highlight: false, isBadge: false, isMono: false },
    { label: "Forma de Pagamento", val: String(r.pagamento || "—"), highlight: false, isBadge: false, isMono: false },
    ...(isDinheiro
      ? [
          {
            label: "Status do Depósito",
            val: String(r.status_deposito || "Aguardando baixa"),
            highlight: false,
            isBadge: true,
            isMono: false,
          },
          ...(r.id_deposito
            ? [
                {
                  label: "ID Depósito Bancário",
                  val: String(r.id_deposito),
                  highlight: false,
                  isBadge: false,
                  isMono: true,
                },
              ]
            : []),
        ]
      : []),
    { label: "Congregação", val: String(r.congregacao || "Igreja Batista Corpo e Família"), highlight: false, isBadge: false, isMono: false },
    { label: "CNPJ da Igreja", val: cnpj, highlight: false, isBadge: false, isMono: true },
  ];

  const cardY = 118;
  const rowSpacing = rows.length > 7 ? 46 : 55;
  const cardH = 30 + (rows.length - 1) * rowSpacing + 28;
  drawRoundRect(32, cardY, width - 64, cardH, 18, "#141b30", "#1e2742", 1.5);

  let currentY = cardY + 36;

  rows.forEach((row, idx) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 13.5px system-ui, -apple-system, sans-serif";
    ctx.fillText(row.label, 52, currentY);

    ctx.textAlign = "right";
    if (row.highlight) {
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 23px system-ui, -apple-system, sans-serif";
      ctx.fillText(row.val, width - 52, currentY + 2);
    } else if (row.isBadge) {
      const badgeW = row.val.length > 10 ? 122 : 82;
      const badgeH = 25;
      const isPending = row.val === "Aguardando baixa";
      drawRoundRect(
        width - 52 - badgeW,
        currentY - 17,
        badgeW,
        badgeH,
        7,
        isPending ? "rgba(245, 158, 11, 0.15)" : "#1e293b",
        isPending ? "rgba(245, 158, 11, 0.4)" : "#334155",
        1
      );
      ctx.fillStyle = isPending ? "#fbbf24" : "#e2e8f0";
      ctx.font = "600 12px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(row.val, width - 52 - badgeW / 2, currentY);
    } else {
      ctx.fillStyle = "#f8fafc";
      ctx.font = row.isMono ? "600 13.5px monospace, system-ui" : "600 14px system-ui, -apple-system, sans-serif";
      ctx.fillText(row.val, width - 52, currentY);
    }

    if (idx < rows.length - 1) {
      ctx.strokeStyle = "rgba(30, 39, 66, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(52, currentY + 12);
      ctx.lineTo(width - 52, currentY + 12);
      ctx.stroke();
    }

    currentY += rowSpacing;
  });

  // 4. Caixa do Versículo Bíblico
  const verseY = cardY + cardH + 20;
  const verseH = 105;
  drawRoundRect(32, verseY, width - 64, verseH, 16, "rgba(30, 23, 56, 0.75)", "#3b2d66", 1.5);

  ctx.textAlign = "center";
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "italic 13.5px system-ui, -apple-system, sans-serif";
  ctx.fillText("“Cada um dê conforme determinou em seu coração, não com pesar", width / 2, verseY + 34);
  ctx.fillText("ou por obrigação, pois Deus ama quem dá com alegria.”", width / 2, verseY + 56);

  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("2 Coríntios 9:7", width / 2, verseY + 84);

  // 5. Rodapé Institucional
  const footY = verseY + verseH + 26;
  ctx.strokeStyle = "#1e2742";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, footY);
  ctx.lineTo(width - 70, footY);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("Tesouraria / Ministério Financeiro", width / 2, footY + 24);

  ctx.fillStyle = "#64748b";
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${r.congregacao || "Igreja Batista Corpo e Família"} · CNPJ ${cnpj}`, width / 2, footY + 44);

  ctx.fillStyle = "#475569";
  ctx.font = "10.5px system-ui, -apple-system, sans-serif";
  ctx.fillText("Autenticação Eletrônica EclesiaPro · Documento Oficial", width / 2, footY + 66);

  return canvas;
}

function printReceiptDirect(r: Row, cnpj: string) {
  const printWindow = window.open("", "_blank", "width=600,height=800");
  if (!printWindow) {
    toast.error("Não foi possível abrir a janela de impressão.");
    return;
  }
  const recNum = `#REC-${formatReceiptNumber(r.id)}`;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Recibo - ${recNum}</title>
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
            <div style="margin-top: 4px;">${recNum}</div>
            <div style="font-size: 9.5px; font-weight: normal;">${new Date().toLocaleDateString("pt-BR")}</div>
          </div>
        </div>

        <div class="row"><span class="label">Contribuinte:</span><span class="val">${r.membro || "Anônimo"}</span></div>
        <div class="row"><span class="label">Tipo de Lançamento:</span><span class="val">${r.tipo || "Dízimo"}</span></div>
        <div class="row highlight"><span class="label">Valor Contribuído:</span><span class="val">${brl(Number(r.valor || 0))}</span></div>
        <div class="row"><span class="label">Data do Lançamento:</span><span class="val">${fmtDate(r.data)}</span></div>
        <div class="row"><span class="label">Forma de Pagamento:</span><span class="val">${r.pagamento || "—"}</span></div>
        ${r.pagamento === "Dinheiro" ? `
        <div class="row"><span class="label">Status do Depósito:</span><span class="val">${r.status_deposito || "Aguardando baixa"}</span></div>
        ${r.id_deposito ? `<div class="row"><span class="label">ID Depósito Bancário:</span><span class="val">${r.id_deposito}</span></div>` : ""}
        ` : ""}
        <div class="row"><span class="label">Congregação:</span><span class="val">${r.congregacao || "Igreja Batista Corpo e Família"}</span></div>
        <div class="row"><span class="label">CNPJ da Igreja:</span><span class="val">${cnpj}</span></div>

        <div class="verse">
          &ldquo;Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria.&rdquo;
          <span>2 Coríntios 9:7</span>
        </div>

        <div class="signature">
          <div class="sig-title">Tesouraria / Ministério Financeiro</div>
          <div class="sig-sub">${r.congregacao || "Igreja Batista Corpo e Família"} &middot; CNPJ ${cnpj}</div>
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

  const handleDownloadImage = () => {
    try {
      const canvas = drawReceiptToCanvas(row, churchCnpj);
      const fileName = getReceiptFileName(row, "png");
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(`Imagem oficial (${fileName}) baixada em alta resolução!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar imagem do comprovante.");
    }
  };

  const handleDownloadPdf = () => {
    try {
      const canvas = drawReceiptToCanvas(row, churchCnpj);
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Formato A5 retrato oficial
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

      // Fundo escuro luxo igual ao comprovante
      doc.setFillColor(12, 16, 29);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.addImage(imgData, "PNG", margin, posY, targetWidth, targetHeight, undefined, "FAST");
      const fileName = getReceiptFileName(row, "pdf");
      doc.save(fileName);
      toast.success(`PDF oficial (${fileName}) gerado com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF do comprovante.");
    }
  };

  const handleShareWhatsApp = async () => {
    setIsProcessing(true);

    try {
      const canvas = drawReceiptToCanvas(row, churchCnpj);

      const cleanPhone = phone.replace(/\D/g, "");
      let targetPhone = cleanPhone;
      if (targetPhone.length >= 10 && !targetPhone.startsWith("55")) {
        targetPhone = `55${targetPhone}`;
      }

      const recNum = `#REC-${formatReceiptNumber(row.id)}`;
      const messageText = [
        `*RECIBO OFICIAL DE CONTRIBUIÇÃO - ECLESIAPRO*`,
        `📄 *Nº:* ${recNum}`,
        `👤 *Contribuinte:* ${row.membro || "Anônimo"}`,
        `🏷️ *Tipo:* ${row.tipo || "Dízimo"}`,
        `💰 *Valor:* ${brl(Number(row.valor || 0))}`,
        `📅 *Data:* ${fmtDate(row.data)}`,
        `💳 *Forma de Pagamento:* ${row.pagamento || "—"}`,
        ...(row.pagamento === "Dinheiro"
          ? [
              `🏦 *Status do Depósito:* ${row.status_deposito || "Aguardando baixa"}`,
              ...(row.id_deposito ? [`🔖 *ID do Depósito:* ${row.id_deposito}`] : []),
            ]
          : []),
        `⛪ *Congregação:* ${row.congregacao || "Igreja Batista Corpo e Família"}`,
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

      const fileName = getReceiptFileName(row, "png");
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
          "Imagem do comprovante copiada! No WhatsApp Web, basta apertar Ctrl + V para colar a imagem na conversa.",
          { duration: 6500 }
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
      <DialogContent className="max-w-[420px] p-3.5 sm:p-4 rounded-3xl border border-[#232d4b] bg-[#0c101d] text-[#f8fafc] shadow-2xl space-y-2.5 focus:outline-none max-h-[94vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#232d4b] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {/* Cabeçalho do Modal */}
        <DialogHeader className="flex flex-row items-center gap-3 pr-6 space-y-0 text-left">
          <div className="grid size-9 place-items-center rounded-xl bg-[#2e1d52] border border-[#7c3aed]/40 text-[#c084fc] shadow-sm shrink-0">
            <Receipt className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-sm sm:text-base font-bold text-[#f8fafc] tracking-tight">
              Recibo de Contribuição
            </DialogTitle>
            <DialogDescription className="text-[11px] text-[#94a3b8] mt-0.5">
              Nº #REC-{formatReceiptNumber(row.id)} &middot; Emissão {new Date().toLocaleDateString("pt-BR")}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Card de Informações do Recibo */}
        <div className="rounded-2xl border border-[#1e2742] bg-[#141b30] p-3 sm:p-3.5 space-y-1 shadow-inner">
          <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/80 text-xs">
            <span className="text-[#94a3b8] font-medium">Contribuinte</span>
            <span className="font-semibold text-[#f8fafc] text-right truncate max-w-[210px]">
              {row.membro || "Anônimo"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/80 text-xs">
            <span className="text-[#94a3b8] font-medium">Tipo de Lançamento</span>
            <span className="rounded-md border border-[#334155] bg-[#1e293b] px-2 py-0.5 text-[10.5px] font-semibold text-[#e2e8f0]">
              {row.tipo || "Dízimo"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/80 text-xs">
            <span className="text-[#94a3b8] font-medium">Valor Contribuído</span>
            <span className="text-base sm:text-lg font-extrabold text-[#10b981] tracking-tight">
              {brl(Number(row.valor || 0))}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/80 text-xs">
            <span className="text-[#94a3b8] font-medium">Data</span>
            <span className="font-semibold text-[#f8fafc]">{fmtDate(row.data)}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/80 text-xs">
            <span className="text-[#94a3b8] font-medium">Forma de Pagamento</span>
            <span className="font-semibold text-[#f8fafc]">{row.pagamento || "—"}</span>
          </div>

          {row.pagamento === "Dinheiro" && (
            <>
              <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/80 text-xs">
                <span className="text-[#94a3b8] font-medium">Status do Depósito</span>
                <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold border ${
                  row.status_deposito === "Depositado / Baixado"
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/15 text-amber-400"
                }`}>
                  {row.status_deposito || "Aguardando baixa"}
                </span>
              </div>
              {row.id_deposito && (
                <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/80 text-xs">
                  <span className="text-[#94a3b8] font-medium">ID do Depósito</span>
                  <span className="font-mono text-[11px] font-semibold text-[#f8fafc]">{String(row.id_deposito)}</span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between py-1 border-b border-[#1e2742]/80 text-xs">
            <span className="text-[#94a3b8] font-medium">Congregação</span>
            <span className="font-semibold text-[#f8fafc] text-right truncate max-w-[200px]">
              {row.congregacao || "Igreja Batista Corpo e Família"}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 text-xs">
            <span className="text-[#94a3b8] font-medium">CNPJ da Igreja</span>
            <span className="font-mono text-[11px] font-semibold text-[#cbd5e1]">{churchCnpj}</span>
          </div>
        </div>

        {/* Versículo Bíblico */}
        <div className="rounded-xl border border-[#2e2652] bg-[#1e1738]/60 p-2 sm:p-2.5 text-center">
          <p className="text-[10px] sm:text-[10.5px] italic text-[#cbd5e1] leading-relaxed">
            &ldquo;Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria.&rdquo;
          </p>
          <span className="block text-[9.5px] font-bold text-[#c084fc] mt-0.5">2 Coríntios 9:7</span>
        </div>

        {/* Rodapé institucional */}
        <div className="text-center space-y-0.5 border-t border-[#1e2742]/60 pt-2">
          <div className="text-[10.5px] font-semibold text-[#cbd5e1]">Tesouraria / Ministério Financeiro</div>
          <div className="text-[9px] text-[#64748b]">
            {row.congregacao || "Igreja Batista Corpo e Família"} &middot; CNPJ {churchCnpj}
          </div>
        </div>

        {/* Telefone WhatsApp */}
        <div className="space-y-1 pt-1">
          <Label htmlFor="whatsapp-phone" className="text-[11px] font-semibold flex items-center gap-1.5 text-[#cbd5e1]">
            <Smartphone className="size-3 text-emerald-400" />
            Telefone para envio via WhatsApp (Android / iOS / Web)
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

        {/* Botões de Ação */}
        <div className="space-y-2 pt-1">
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
              <ImageIcon className="size-3.5" />
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
              <Download className="size-3.5" />
              <span>Baixar PDF</span>
            </Button>
          </div>

          <Button
            type="button"
            disabled={isProcessing}
            onClick={handleShareWhatsApp}
            className="w-full h-10 rounded-xl text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold gap-2 cursor-pointer transition-all"
          >
            {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
            <span>WhatsApp</span>
          </Button>
        </div>
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
        filterKeys={["tipo", "pagamento", "status_deposito", "congregacao"]}
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
          {
            key: "status_deposito",
            label: "Depósito Bancário",
            type: "select",
            options: ["Aguardando baixa", "Depositado / Baixado"],
            table: true,
            enabledWhen: (values) => values.pagamento === "Dinheiro",
          },
          {
            key: "id_deposito",
            label: "ID / Comprovante do Depósito",
            type: "text",
            table: false,
            enabledWhen: (values) => values.pagamento === "Dinheiro",
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
