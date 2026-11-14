/**
 * Utilitários de Máscaras e Formatação de Formulários
 */

export function maskCPF(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function maskPhone(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function maskCEP(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskTime(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    if (Number(digits) > 23) return "23";
    return digits;
  }
  const hh = Math.min(Number(digits.slice(0, 2)), 23).toString().padStart(2, "0");
  const mm = Math.min(Number(digits.slice(2, 4)), 59).toString().padStart(digits.length - 2, "0");
  return `${hh}:${mm}`;
}

export function maskMoney(val: string | number): string {
  if (val === "" || val === undefined || val === null) return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parseMoney(val: string | number): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}
