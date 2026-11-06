import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeAll } from "vitest";
import { CrudPage } from "@/components/CrudPage";
import { StoreProvider } from "@/lib/store";

// Radix Select precisa destas APIs que o jsdom não implementa.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const fields = [
  { key: "nome", label: "Nome completo", required: true },
  { key: "estadoCivil", label: "Estado civil", type: "select" as const, options: ["Solteiro(a)", "Casado(a)", "Viúvo(a)"] },
  { key: "conjuge", label: "Cônjuge (membro)", type: "member" as const, enabledWhen: (v: Record<string, string>) => v.estadoCivil === "Casado(a)" },
  { key: "pai", label: "Pai (membro)", type: "member" as const },
  { key: "mae", label: "Mãe (membro)", type: "member" as const },
  { key: "filhos", label: "Filhos (membros)", type: "members" as const },
];

function renderForm() {
  render(
    <StoreProvider>
      <CrudPage title="Membros" subtitle="" collection="members" singular="Membro" searchKeys={["nome"]} fields={fields} />
    </StoreProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /novo/i }));
}

describe("Cadastro de membro — vínculos familiares", () => {
  it("campo de cônjuge fica oculto quando o estado civil não é Casado(a)", () => {
    renderForm();
    expect(screen.queryByText("Cônjuge (membro)")).not.toBeInTheDocument();
    expect(screen.getByText("Pai (membro)")).toBeInTheDocument();
    expect(screen.getByText("Mãe (membro)")).toBeInTheDocument();
    expect(screen.getByText("Filhos (membros)")).toBeInTheDocument();
  });

  it("selecionar Casado(a) habilita o cônjuge com a lista de membros", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("combobox", { name: /estado civil/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Casado(a)" }));

    expect(screen.getByText("Cônjuge (membro)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: /cônjuge/i }));
    expect(await screen.findByRole("option", { name: "Ana Beatriz Souza" })).toBeInTheDocument();
  });
});
