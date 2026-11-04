import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/membros")({
  head: () => ({
    meta: [
      { title: "Membros — Ecclesia" },
      { name: "description", content: "Cadastro e consulta de membros da igreja." },
      { property: "og:title", content: "Membros — Ecclesia" },
      { property: "og:description", content: "Cadastro e consulta de membros da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Membros,
});

function Membros() {
  return (
    <CrudPage title="Membros" subtitle="Cadastro, consulta e ficha dos membros." collection="members" singular="Membro"
      searchKeys={["nome", "cpf", "telefone"]} filterKeys={["congregacao", "situacao"]}
      fields={[
        { key: "nome", label: "Nome completo", table: true, required: true },
        { key: "cpf", label: "CPF", table: true },
        { key: "nascimento", label: "Data de nascimento", type: "date" },
        { key: "sexo", label: "Sexo", type: "select", options: ["Feminino", "Masculino"] },
        { key: "estadoCivil", label: "Estado civil", type: "select", options: ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)"] },
        { key: "telefone", label: "Telefone / WhatsApp", table: true },
        { key: "email", label: "E-mail", type: "email" },
        { key: "endereco", label: "Endereço completo" },
        { key: "conversao", label: "Data de conversão", type: "date" },
        { key: "batismo", label: "Data de batismo", type: "date" },
        { key: "recebimento", label: "Recebido como membro", type: "date" },
        { key: "tipo", label: "Vínculo", type: "select", options: ["Membro", "Congregado"], table: true },
        { key: "situacao", label: "Situação", type: "select", options: ["Ativo", "Inativo", "Transferido"], table: true },
        { key: "congregacao", label: "Congregação", type: "select", options: ["Sede Central", "Congregação Vila Nova", "Congregação Jardim Esperança"], table: true },
        { key: "departamento", label: "Departamento" },
        { key: "cargo", label: "Cargo / função", table: true },
        { key: "observacoes", label: "Observações", type: "textarea" },
      ]}
    />
  );
}
