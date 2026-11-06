import { describe, expect, it } from "vitest";
import { ageOf, bucketOf } from "@/routes/relatorio-membros";
import { seed } from "@/lib/store";

describe("Relatório de membros por idade", () => {
  const ref = new Date("2026-11-06T12:00:00");

  it("calcula a idade a partir da data de nascimento", () => {
    expect(ageOf("1990-11-01", ref)).toBe(36);
    expect(ageOf("1990-12-01", ref)).toBe(35); // aniversário ainda não chegou
  });

  it("retorna null para data inválida ou vazia", () => {
    expect(ageOf("", ref)).toBeNull();
    expect(ageOf(undefined, ref)).toBeNull();
    expect(ageOf("não é data", ref)).toBeNull();
  });

  it("classifica cada idade na faixa etária correta", () => {
    expect(bucketOf(5)).toBe("0–12");
    expect(bucketOf(15)).toBe("13–17");
    expect(bucketOf(20)).toBe("18–25");
    expect(bucketOf(30)).toBe("26–35");
    expect(bucketOf(40)).toBe("36–45");
    expect(bucketOf(50)).toBe("46–59");
    expect(bucketOf(65)).toBe("60–69");
    expect(bucketOf(80)).toBe("70+");
  });
});

describe("Dados de demonstração", () => {
  const db = seed();

  it("agenda pastoral sempre referencia um membro da lista", () => {
    const names = new Set(db.members.map((m) => String(m.nome)));
    expect(db.appointments.length).toBeGreaterThan(0);
    db.appointments.forEach((a) => expect(names.has(String(a.membro))).toBe(true));
  });

  it("inventário e agenda de eventos vêm preenchidos", () => {
    expect(db.inventory.length).toBeGreaterThanOrEqual(10);
    expect(db.events.length).toBeGreaterThanOrEqual(8);
  });

  it("membros casados de exemplo têm cônjuge vinculado", () => {
    const casados = db.members.filter((m) => m["estadoCivil"] === "Casado(a)");
    expect(casados.length).toBeGreaterThan(0);
    casados.forEach((m) => expect(String(m["conjuge"] ?? "").length).toBeGreaterThan(0));
  });
});
