/**
 * Utilitário para exportar gráficos Recharts (SVG) em imagem PNG de alta resolução.
 */
export function downloadChartAsPng(elementOrId: HTMLElement | string, filename = "grafico.png") {
  const container = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (!container) return;
  const svg = container.querySelector("svg");
  if (!svg) return;

  const width = svg.clientWidth || svg.getBoundingClientRect().width || 800;
  const height = svg.clientHeight || svg.getBoundingClientRect().height || 400;

  const svgClone = svg.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute("width", `${width}`);
  svgClone.setAttribute("height", `${height}`);

  // Copia as cores computadas (fill, stroke, color, font) para o SVG clonado
  // Isso garante que variáveis CSS como var(--chart-1) e var(--border) sejam renderizadas perfeitamente no Canvas
  const origElements = svg.querySelectorAll("*");
  const cloneElements = svgClone.querySelectorAll("*");
  for (let i = 0; i < origElements.length; i++) {
    const orig = origElements[i];
    const clone = cloneElements[i];
    if (orig && clone) {
      const computed = window.getComputedStyle(orig);
      if (computed.fill && computed.fill !== "none") {
        clone.setAttribute("fill", computed.fill);
      }
      if (computed.stroke && computed.stroke !== "none") {
        clone.setAttribute("stroke", computed.stroke);
      }
      if (computed.fontSize) {
        (clone as HTMLElement).style.fontSize = computed.fontSize;
      }
      if (computed.fontFamily) {
        (clone as HTMLElement).style.fontFamily = computed.fontFamily;
      }
    }
  }

  // Estilos adicionais
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    text { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  `;
  svgClone.insertBefore(styleEl, svgClone.firstChild);

  const svgString = new XMLSerializer().serializeToString(svgClone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const blobURL = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2; // 2x para alta definição
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      const a = document.createElement("a");
      a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
      a.href = canvas.toDataURL("image/png");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(blobURL);
  };
  image.src = blobURL;
}
