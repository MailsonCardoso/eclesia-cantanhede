import { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  UserCheck,
  UserRound,
  HeartHandshake,
  Church,
  Home,
  Network,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Pencil,
  Trash2,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  X,
  ShieldCheck,
  Sparkles,
  Layers,
  Baby,
  Cake,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { MetricCard } from "@/components/MetricCard";
import { useStore, exportCSV, fmtDate, type Row } from "@/lib/store";
import { maskCPF, maskPhone, maskCEP } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/membros")({
  head: () => ({
    meta: [
      { title: "Membros — EclesiaPro" },
      { name: "description", content: "Cadastro, acompanhamento de membros, ficha cadastral e estatísticas." },
      { property: "og:title", content: "Membros — EclesiaPro" },
      { property: "og:description", content: "Cadastro, acompanhamento de membros, ficha cadastral e estatísticas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Membros,
});

const CARGOS = [
  "Sem função / cargo",
  "Pastor",
  "Líder",
  "Diácono",
  "Obreiro",
  "Ministro de louvor",
  "Instrumentista",
  "Financeiro",
  "Secretaria",
];

const ESTADOS_CIVIS = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
];

const TIPOS_VINCULO = ["Membro", "Congregado"];
const SITUACOES = ["Ativo", "Inativo", "Transferido"];
const SEXOS = ["Feminino", "Masculino"];

const AVATAR_GRADIENTS = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
];

function getInitials(name: string): string {
  if (!name) return "M";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function calculateAge(nascimento?: unknown): number | null {
  const s = String(nascimento ?? "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const b = new Date(s.slice(0, 10) + "T12:00:00");
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 ? age : null;
}

// Componente para busca e seleção de membro único (Cônjuge, Pai, Mãe)
function MemberSearchSelect({
  value,
  onChange,
  placeholder,
  members,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  members: Array<{ id: string; nome: string; congregacao?: string; cargo?: string }>;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return members.slice(0, 8);
    const q = query.toLowerCase().trim();
    return members.filter((m) => String(m.nome).toLowerCase().includes(q)).slice(0, 8);
  }, [members, query]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-background px-3.5 py-2 text-sm shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <UserRound className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground truncate">{value}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
          className="size-7 text-muted-foreground hover:text-destructive"
          title="Remover / trocar membro"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={placeholder || "Digite o nome para buscar..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-8 rounded-xl shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border bg-popover p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95">
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Nenhum membro encontrado.
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(String(m.nome));
                  setQuery("");
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-accent flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">{String(m.nome)}</div>
                  {(m.congregacao || m.cargo) && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {String(m.congregacao || "")} {m.cargo && m.cargo !== "Sem função / cargo" ? `· ${m.cargo}` : ""}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
                  Selecionar
                </Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Componente para busca e inclusão múltipla de Filhos
function ChildrenSearchInput({
  value,
  onChange,
  members,
}: {
  value: string;
  onChange: (val: string) => void;
  members: Array<{ id: string; nome: string; congregacao?: string; cargo?: string }>;
}) {
  const [childQuery, setChildQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const currentChildren = useMemo(() => {
    return value ? value.split("; ").map((c) => c.trim()).filter(Boolean) : [];
  }, [value]);

  const filtered = useMemo(() => {
    if (!childQuery.trim()) return [];
    const q = childQuery.toLowerCase().trim();
    return members
      .filter((m) => String(m.nome).toLowerCase().includes(q) && !currentChildren.includes(String(m.nome)))
      .slice(0, 8);
  }, [members, childQuery, currentChildren]);

  const handleAdd = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (currentChildren.includes(trimmed)) {
      toast.warning("Este filho já foi adicionado.");
      return;
    }
    const next = [...currentChildren, trimmed].join("; ");
    onChange(next);
    setChildQuery("");
    setIsOpen(false);
  };

  const handleRemove = (nameToRemove: string) => {
    const next = currentChildren.filter((c) => c !== nameToRemove).join("; ");
    onChange(next);
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Digite o nome para buscar ou cadastrar filho..."
              value={childQuery}
              onChange={(e) => {
                setChildQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (childQuery.trim()) setIsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd(childQuery);
                }
              }}
              className="pl-9 pr-8 rounded-xl shadow-sm"
            />
            {childQuery && (
              <button
                type="button"
                onClick={() => {
                  setChildQuery("");
                  setIsOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAdd(childQuery)}
            className="shrink-0 gap-1.5 rounded-xl font-medium"
          >
            <Plus className="size-4" />
            Adicionar
          </Button>
        </div>

        {isOpen && filtered.length > 0 && (
          <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border bg-popover p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Membros Encontrados
            </div>
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleAdd(String(m.nome))}
                className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-accent flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">{String(m.nome)}</div>
                  {(m.congregacao || m.cargo) && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {String(m.congregacao || "")} {m.cargo && m.cargo !== "Sem função / cargo" ? `· ${m.cargo}` : ""}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
                  Adicionar Filho
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-10 p-2.5 rounded-xl border bg-background/50 items-center">
        {currentChildren.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">Nenhum filho adicionado ainda.</span>
        ) : (
          currentChildren.map((child) => (
            <Badge key={child} variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-normal">
              <Baby className="size-3 text-primary shrink-0" />
              {child}
              <button
                type="button"
                onClick={() => handleRemove(child)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                title="Remover"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

function Membros() {
  const { db, create, update, remove } = useStore();

  // Estados de visualização e filtros
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [q, setQ] = useState("");
  const [filtroCongregacao, setFiltroCongregacao] = useState("__all");
  const [filtroSituacao, setFiltroSituacao] = useState("__all");
  const [filtroTipo, setFiltroTipo] = useState("__all");
  const [filtroCargo, setFiltroCargo] = useState("__all");
  const [filtroCelula, setFiltroCelula] = useState("__all");

  // Estados de modais e edição
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const [selectedMember, setSelectedMember] = useState<Row | null>(null);

  // Formulário 100% limpo ao criar novo membro
  const emptyForm = {
    nome: "",
    cpf: "",
    nascimento: "",
    sexo: "",
    estadoCivil: "",
    telefone: "",
    email: "",
    endereco: "",
    cep: "",
    bairro: "",
    cidade: "",
    uf: "",
    conversao: "",
    batismo: "",
    recebimento: "",
    tipo: "Membro",
    situacao: "Ativo",
    congregacao: "",
    departamento: "",
    celula: "",
    cargo: "Sem função / cargo",
    conjuge: "",
    pai: "",
    mae: "",
    filhos: "",
    observacoes: "",
  };

  const [form, setForm] = useState(emptyForm);

  // Listas auxiliares para selects
  const congregations = useMemo(() => {
    return (db.congregations || []).map((c) => String(c.nome)).sort((a, b) => a.localeCompare(b));
  }, [db.congregations]);

  const departments = useMemo(() => {
    return (db.departments || []).map((d) => String(d.nome)).sort((a, b) => a.localeCompare(b));
  }, [db.departments]);

  const cells = useMemo(() => {
    return (db.cells || []).map((c) => String(c.nome)).sort((a, b) => a.localeCompare(b));
  }, [db.cells]);

  const membersCompact = useMemo(() => {
    return db.members.map((m) => ({
      id: String(m.id),
      nome: String(m.nome),
      congregacao: String(m.congregacao || ""),
      cargo: String(m.cargo || ""),
    }));
  }, [db.members]);

  // Métricas do Topo com percentuais
  const metrics = useMemo(() => {
    const total = db.members.length;
    const totalSafe = total || 1;

    const ativos = db.members.filter((m) => m.situacao === "Ativo").length;
    const percentAtivos = Math.round((ativos / totalSafe) * 100);

    const emCelulas = db.members.filter((m) => {
      const c = String(m.celula || "").trim().toLowerCase();
      return c && c !== "não participa de célula" && c !== "__none" && c !== "";
    }).length;
    const percentCelulas = Math.round((emCelulas / totalSafe) * 100);

    const comCargo = db.members.filter((m) => {
      const c = String(m.cargo || "").trim();
      return c && c !== "Sem função / cargo" && c !== "__none";
    }).length;
    const percentCargo = Math.round((comCargo / totalSafe) * 100);

    return {
      total,
      ativos,
      percentAtivos,
      emCelulas,
      percentCelulas,
      comCargo,
      percentCargo,
    };
  }, [db.members]);

  // Membros filtrados
  const filteredMembers = useMemo(() => {
    const query = q.toLowerCase().trim();
    return db.members.filter((m) => {
      const matchQuery =
        !query ||
        String(m.nome || "").toLowerCase().includes(query) ||
        String(m.cpf || "").toLowerCase().includes(query) ||
        String(m.telefone || "").toLowerCase().includes(query) ||
        String(m.email || "").toLowerCase().includes(query) ||
        String(m.cargo || "").toLowerCase().includes(query);

      const matchCong = filtroCongregacao === "__all" || m.congregacao === filtroCongregacao;
      const matchSit = filtroSituacao === "__all" || m.situacao === filtroSituacao;
      const matchTipo = filtroTipo === "__all" || m.tipo === filtroTipo;
      const matchCargo = filtroCargo === "__all" || m.cargo === filtroCargo;
      const matchCel =
        filtroCelula === "__all"
          ? true
          : filtroCelula === "__none"
          ? !m.celula || m.celula === "Não participa de célula" || m.celula === "__none"
          : m.celula === filtroCelula;

      return matchQuery && matchCong && matchSit && matchTipo && matchCargo && matchCel;
    });
  }, [db.members, q, filtroCongregacao, filtroSituacao, filtroTipo, filtroCargo, filtroCelula]);

  // Abertura do Formulário Novo (100% limpo)
  const handleOpenNew = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      // Deixar opções como vazias para o usuário selecionar conscientemente
      tipo: "Membro",
      situacao: "Ativo",
      cargo: "Sem função / cargo",
    });
    setOpenForm(true);
  };

  // Abertura do Formulário Edição
  const handleOpenEdit = (member: Row) => {
    setEditing(member);
    setForm({
      nome: String(member.nome || ""),
      cpf: member.cpf ? maskCPF(String(member.cpf)) : "",
      nascimento: String(member.nascimento || ""),
      sexo: String(member.sexo || ""),
      estadoCivil: String(member.estadoCivil || ""),
      telefone: member.telefone ? maskPhone(String(member.telefone)) : "",
      email: String(member.email || ""),
      endereco: String(member.endereco || ""),
      cep: member.cep ? maskCEP(String(member.cep)) : "",
      bairro: String(member.bairro || ""),
      cidade: String(member.cidade || ""),
      uf: String(member.uf || ""),
      conversao: String(member.conversao || ""),
      batismo: String(member.batismo || ""),
      recebimento: String(member.recebimento || ""),
      tipo: String(member.tipo || "Membro"),
      situacao: String(member.situacao || "Ativo"),
      congregacao: String(member.congregacao || ""),
      departamento: String(member.departamento || ""),
      celula: String(member.celula || ""),
      cargo: String(member.cargo || "Sem função / cargo"),
      conjuge: String(member.conjuge || ""),
      pai: String(member.pai || ""),
      mae: String(member.mae || ""),
      filhos: String(member.filhos || ""),
      observacoes: String(member.observacoes || ""),
    });
    setOpenForm(true);
  };

  // Busca de CEP Automática (ViaCEP)
  const handleCepChange = (val: string) => {
    const masked = maskCEP(val);
    setForm((s) => ({ ...s, cep: masked }));
    const clean = masked.replace(/\D/g, "");
    if (clean.length === 8) {
      toast.info("Consultando CEP...");
      fetch(`https://viacep.com.br/ws/${clean}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setForm((prev) => ({
              ...prev,
              cidade: data.localidade || prev.cidade || "",
              uf: data.uf || prev.uf || "",
              bairro: data.bairro || prev.bairro || "",
              endereco: data.logradouro
                ? `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ""}`
                : prev.endereco || "",
            }));
            toast.success(`Endereço carregado: ${data.localidade}/${data.uf}`);
          } else {
            toast.error("CEP não localizado.");
          }
        })
        .catch(() => {
          toast.error("Erro na busca do CEP.");
        });
    }
  };

  // Salvar Membro
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome completo do membro.");
      return;
    }

    const payload = {
      ...form,
      // Se não for casado, limpa o cônjuge
      conjuge: form.estadoCivil === "Casado(a)" ? form.conjuge : "",
    };

    if (editing?.id) {
      update("members", { ...editing, ...payload });
      toast.success("Membro atualizado com sucesso!");
    } else {
      create("members", payload);
      toast.success("Membro cadastrado com sucesso!");
    }

    setOpenForm(false);
  };

  // Exportar Excel
  const handleExportCSV = () => {
    const dataToExport = filteredMembers.map((m) => ({
      Nome: m.nome,
      CPF: m.cpf || "",
      "Data Nasc.": fmtDate(m.nascimento),
      Sexo: m.sexo || "",
      "Estado Civil": m.estadoCivil || "",
      Telefone: m.telefone || "",
      Email: m.email || "",
      Vínculo: m.tipo || "",
      Situação: m.situacao || "",
      Congregação: m.congregacao || "",
      Departamento: m.departamento || "",
      Célula: m.celula || "",
      Cargo: m.cargo || "",
      "Data Batismo": fmtDate(m.batismo),
      "Data Conversão": fmtDate(m.conversao),
      Endereço: m.endereco || "",
      Bairro: m.bairro || "",
      Cidade: m.cidade || "",
      UF: m.uf || "",
    }));

    exportCSV("members", dataToExport, [
      { key: "Nome", label: "Nome" },
      { key: "CPF", label: "CPF" },
      { key: "Data Nasc.", label: "Data Nasc." },
      { key: "Sexo", label: "Sexo" },
      { key: "Estado Civil", label: "Estado Civil" },
      { key: "Telefone", label: "Telefone" },
      { key: "Email", label: "Email" },
      { key: "Vínculo", label: "Vínculo" },
      { key: "Situação", label: "Situação" },
      { key: "Congregação", label: "Congregação" },
      { key: "Departamento", label: "Departamento" },
      { key: "Célula", label: "Célula" },
      { key: "Cargo", label: "Cargo" },
      { key: "Data Batismo", label: "Data Batismo" },
      { key: "Data Conversão", label: "Data Conversão" },
      { key: "Endereço", label: "Endereço" },
      { key: "Bairro", label: "Bairro" },
      { key: "Cidade", label: "Cidade" },
      { key: "UF", label: "UF" },
    ]);
  };

  // Se o formulário estiver aberto
  if (openForm) {
    return (
      <div className="space-y-6 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenForm(false)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Voltar para Membros
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Users className="size-6 text-primary" />
                {editing ? "Editar Membro" : "Novo Membro"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Preencha os dados pessoais, eclesiásticos e familiares do membro.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button variant="premium" type="submit" form="membro-form" className="px-6">
              Salvar Membro
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-card gradient-top">
          <form id="membro-form" onSubmit={handleSave} className="space-y-8">
            {/* Bloco 1: Dados Pessoais */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2 border-b pb-2">
                <UserRound className="size-4" /> Dados Pessoais
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nome" className="text-xs font-semibold">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Ex: João da Silva Santos"
                    value={form.nome}
                    onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                    required
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cpf" className="text-xs font-semibold">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={form.cpf}
                    onChange={(e) => setForm((s) => ({ ...s, cpf: maskCPF(e.target.value) }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nascimento" className="text-xs font-semibold">
                    Data de Nascimento
                  </Label>
                  <Input
                    id="nascimento"
                    type="date"
                    value={form.nascimento}
                    onChange={(e) => setForm((s) => ({ ...s, nascimento: e.target.value }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sexo" className="text-xs font-semibold">
                    Sexo
                  </Label>
                  <Select
                    value={form.sexo || "__none"}
                    onValueChange={(v) => setForm((s) => ({ ...s, sexo: v === "__none" ? "" : v }))}
                  >
                    <SelectTrigger id="sexo" className="rounded-xl">
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Não especificado</SelectItem>
                      {SEXOS.map((sx) => (
                        <SelectItem key={sx} value={sx}>
                          {sx}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estadoCivil" className="text-xs font-semibold">
                    Estado Civil
                  </Label>
                  <Select
                    value={form.estadoCivil || "__none"}
                    onValueChange={(v) => setForm((s) => ({ ...s, estadoCivil: v === "__none" ? "" : v }))}
                  >
                    <SelectTrigger id="estadoCivil" className="rounded-xl">
                      <SelectValue placeholder="Selecione o estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Não especificado</SelectItem>
                      {ESTADOS_CIVIS.map((ec) => (
                        <SelectItem key={ec} value={ec}>
                          {ec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bloco 2: Contato & Endereço */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2 border-b pb-2">
                <Phone className="size-4" /> Contato e Localização
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-xs font-semibold">
                    Telefone / WhatsApp
                  </Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={form.telefone}
                    onChange={(e) => setForm((s) => ({ ...s, telefone: maskPhone(e.target.value) }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cep" className="text-xs font-semibold">
                    CEP (Busca automática)
                  </Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    maxLength={9}
                    value={form.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="endereco" className="text-xs font-semibold">
                    Endereço Completo
                  </Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, complemento..."
                    value={form.endereco}
                    onChange={(e) => setForm((s) => ({ ...s, endereco: e.target.value }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bairro" className="text-xs font-semibold">
                    Bairro
                  </Label>
                  <Input
                    id="bairro"
                    placeholder="Bairro"
                    value={form.bairro}
                    onChange={(e) => setForm((s) => ({ ...s, bairro: e.target.value }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cidade" className="text-xs font-semibold">
                    Cidade
                  </Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={form.cidade}
                    onChange={(e) => setForm((s) => ({ ...s, cidade: e.target.value }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="uf" className="text-xs font-semibold">
                    UF
                  </Label>
                  <Input
                    id="uf"
                    placeholder="UF"
                    maxLength={2}
                    value={form.uf}
                    onChange={(e) => setForm((s) => ({ ...s, uf: e.target.value.toUpperCase() }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Dados Eclesiásticos */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2 border-b pb-2">
                <Church className="size-4" /> Dados Eclesiásticos e Ministérios
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tipo" className="text-xs font-semibold">
                    Vínculo
                  </Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((s) => ({ ...s, tipo: v }))}>
                    <SelectTrigger id="tipo" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_VINCULO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="situacao" className="text-xs font-semibold">
                    Situação Cadastral
                  </Label>
                  <Select value={form.situacao} onValueChange={(v) => setForm((s) => ({ ...s, situacao: v }))}>
                    <SelectTrigger id="situacao" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SITUACOES.map((sit) => (
                        <SelectItem key={sit} value={sit}>
                          {sit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cargo" className="text-xs font-semibold">
                    Cargo / Função
                  </Label>
                  <Select value={form.cargo} onValueChange={(v) => setForm((s) => ({ ...s, cargo: v }))}>
                    <SelectTrigger id="cargo" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARGOS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="congregacao" className="text-xs font-semibold">
                    Congregação
                  </Label>
                  <Select
                    value={form.congregacao || "__none"}
                    onValueChange={(v) => setForm((s) => ({ ...s, congregacao: v === "__none" ? "" : v }))}
                  >
                    <SelectTrigger id="congregacao" className="rounded-xl">
                      <SelectValue placeholder="Selecione a congregação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Sede / Geral</SelectItem>
                      {congregations.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="departamento" className="text-xs font-semibold">
                    Departamento
                  </Label>
                  <Select
                    value={form.departamento || "__none"}
                    onValueChange={(v) => setForm((s) => ({ ...s, departamento: v === "__none" ? "" : v }))}
                  >
                    <SelectTrigger id="departamento" className="rounded-xl">
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Nenhum / Geral</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="celula" className="text-xs font-semibold">
                    Célula
                  </Label>
                  <Select
                    value={form.celula || "__none"}
                    onValueChange={(v) => setForm((s) => ({ ...s, celula: v === "__none" ? "" : v }))}
                  >
                    <SelectTrigger id="celula" className="rounded-xl">
                      <SelectValue placeholder="Selecione a célula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Não participa de célula</SelectItem>
                      {cells.map((cel) => (
                        <SelectItem key={cel} value={cel}>
                          {cel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="conversao" className="text-xs font-semibold">
                    Data de Conversão
                  </Label>
                  <Input
                    id="conversao"
                    type="date"
                    value={form.conversao}
                    onChange={(e) => setForm((s) => ({ ...s, conversao: e.target.value }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="batismo" className="text-xs font-semibold">
                    Data de Batismo
                  </Label>
                  <Input
                    id="batismo"
                    type="date"
                    value={form.batismo}
                    onChange={(e) => setForm((s) => ({ ...s, batismo: e.target.value }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recebimento" className="text-xs font-semibold">
                    Data de Recebimento
                  </Label>
                  <Input
                    id="recebimento"
                    type="date"
                    value={form.recebimento}
                    onChange={(e) => setForm((s) => ({ ...s, recebimento: e.target.value }))}
                    className="rounded-xl shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 4: Família */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2 border-b pb-2">
                <HeartHandshake className="size-4" /> Vínculos Familiares
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {form.estadoCivil === "Casado(a)" && (
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold">Cônjuge (membro)</Label>
                    <MemberSearchSelect
                      value={form.conjuge}
                      onChange={(val) => setForm((s) => ({ ...s, conjuge: val }))}
                      placeholder="Pesquise o cônjuge na lista de membros..."
                      members={membersCompact}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Pai (membro)</Label>
                  <MemberSearchSelect
                    value={form.pai}
                    onChange={(val) => setForm((s) => ({ ...s, pai: val }))}
                    placeholder="Pesquise o pai na membresia..."
                    members={membersCompact}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mãe (membro)</Label>
                  <MemberSearchSelect
                    value={form.mae}
                    onChange={(val) => setForm((s) => ({ ...s, mae: val }))}
                    placeholder="Pesquise a mãe na membresia..."
                    members={membersCompact}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <Label className="text-xs font-semibold">Filhos (membros ou dependentes)</Label>
                  <ChildrenSearchInput
                    value={form.filhos}
                    onChange={(val) => setForm((s) => ({ ...s, filhos: val }))}
                    members={membersCompact}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 5: Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-semibold">
                Observações Pastorais / Notas
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Anotações pastorais, dons ministeriais, histórico ou particularidades..."
                rows={3}
                value={form.observacoes}
                onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))}
                className="rounded-xl shadow-sm"
              />
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-rise">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Membros da Igreja</h1>
            <p className="text-sm text-muted-foreground">
              Cadastro completo, ficha cadastral, ministérios e indicadores de engajamento.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 rounded-xl text-xs">
            <FileSpreadsheet className="size-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2 rounded-xl text-xs">
            <Printer className="size-4" /> Imprimir
          </Button>
          <Button variant="premium" onClick={handleOpenNew} className="gap-2 rounded-xl text-xs">
            <Plus className="size-4" /> Novo Membro
          </Button>
        </div>
      </div>

      {/* Cards de Métricas e Estatísticas Consolidadas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Membros cadastrados"
          value={metrics.total}
          icon={Users}
          tone="blue"
        />
        <MetricCard
          label="Membros ativos"
          value={`${metrics.ativos} (${metrics.percentAtivos}%)`}
          icon={UserCheck}
          tone="green"
        />
        <MetricCard
          label="Engajamento em células"
          value={`${metrics.emCelulas} (${metrics.percentCelulas}%)`}
          icon={Home}
          tone="orange"
        />
        <MetricCard
          label="Cargos e ministérios"
          value={`${metrics.comCargo} (${metrics.percentCargo}%)`}
          icon={ShieldCheck}
          tone="violet"
        />
      </div>

      {/* Barra de Filtros, Busca e Alternador de Modo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm no-print">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Pesquisar por nome, CPF, telefone, cargo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 rounded-xl text-xs shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Congregação */}
          <Select value={filtroCongregacao} onValueChange={setFiltroCongregacao}>
            <SelectTrigger className="w-40 rounded-xl text-xs">
              <SelectValue placeholder="Congregação: todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as Congregações</SelectItem>
              {congregations.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Situação */}
          <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
            <SelectTrigger className="w-32 rounded-xl text-xs">
              <SelectValue placeholder="Situação: todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as Situações</SelectItem>
              {SITUACOES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Cargo */}
          <Select value={filtroCargo} onValueChange={setFiltroCargo}>
            <SelectTrigger className="w-36 rounded-xl text-xs">
              <SelectValue placeholder="Cargo: todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os Cargos</SelectItem>
              {CARGOS.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Célula */}
          <Select value={filtroCelula} onValueChange={setFiltroCelula}>
            <SelectTrigger className="w-36 rounded-xl text-xs">
              <SelectValue placeholder="Célula: todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as Células</SelectItem>
              <SelectItem value="__none" className="text-xs italic">
                Sem célula
              </SelectItem>
              {cells.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(q ||
            filtroCongregacao !== "__all" ||
            filtroSituacao !== "__all" ||
            filtroTipo !== "__all" ||
            filtroCargo !== "__all" ||
            filtroCelula !== "__all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setFiltroCongregacao("__all");
                setFiltroSituacao("__all");
                setFiltroTipo("__all");
                setFiltroCargo("__all");
                setFiltroCelula("__all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </Button>
          )}

          {/* Alternador de Visualização Cards / Tabela */}
          <div className="flex items-center rounded-xl border bg-muted/40 p-0.5 ml-1">
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 px-2.5 rounded-lg text-xs gap-1.5"
              title="Visualização em Cards"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-2.5 rounded-lg text-xs gap-1.5"
              title="Visualização em Tabela"
            >
              <TableIcon className="size-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Visualização 1: Grade de Cards */}
      {viewMode === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member, idx) => {
            const avatarColor = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            const initials = getInitials(String(member.nome));
            const age = calculateAge(member.nascimento);
            const isAtivo = member.situacao === "Ativo";
            const isLideranca =
              member.cargo &&
              member.cargo !== "Sem função / cargo" &&
              member.cargo !== "__none";

            const rawPhone = String(member.telefone || "").replace(/\D/g, "");
            const whatsappUrl =
              rawPhone.length >= 10
                ? `https://wa.me/55${rawPhone}?text=Olá,%20${encodeURIComponent(
                    String(member.nome).split(" ")[0]
                  )}!%20A%20paz%20do%20Senhor.`
                : null;

            return (
              <div
                key={member.id}
                className="rounded-3xl border bg-card p-5 shadow-card transition-all card-hover flex flex-col justify-between space-y-4 hover:border-primary/40"
              >
                {/* Topo do Card */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`grid size-12 shrink-0 place-items-center rounded-2xl border font-bold text-base shadow-sm ${avatarColor}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-base text-foreground truncate leading-snug">
                          {String(member.nome)}
                        </h2>
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {isLideranca ? (
                            <Badge variant="outline" className="text-[10.5px] font-semibold text-primary border-primary/30 bg-primary/5">
                              <ShieldCheck className="size-3 mr-1 text-primary" />
                              {member.cargo}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {member.tipo || "Membro"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={isAtivo ? "default" : "secondary"}
                      className="shrink-0 text-[11px] font-semibold"
                    >
                      {member.situacao}
                    </Badge>
                  </div>

                  {/* Informações Eclesiásticas */}
                  <div className="rounded-2xl border bg-muted/20 p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-foreground font-medium truncate">
                      <Church className="size-3.5 text-primary shrink-0" />
                      <span className="text-muted-foreground font-normal">Congregação:</span>
                      <span className="truncate">{member.congregacao || "Sede Central"}</span>
                    </div>

                    {member.departamento && member.departamento !== "Nenhum / Geral" && (
                      <div className="flex items-center gap-2 text-foreground font-medium truncate">
                        <Network className="size-3.5 text-chart-2 shrink-0" />
                        <span className="text-muted-foreground font-normal">Depto:</span>
                        <span className="truncate">{member.departamento}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-foreground font-medium truncate">
                      <Home className="size-3.5 text-amber-500 shrink-0" />
                      <span className="text-muted-foreground font-normal">Célula:</span>
                      <span className="truncate">
                        {member.celula && member.celula !== "Não participa de célula"
                          ? member.celula
                          : "Não vinculada"}
                      </span>
                    </div>
                  </div>

                  {/* Contato e Idade */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                    {member.telefone && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate text-foreground font-medium">
                          <Phone className="size-3.5 text-primary shrink-0" />
                          <span>{member.telefone}</span>
                        </div>
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 px-2 py-0.5 rounded-lg shrink-0"
                            title="Enviar WhatsApp"
                          >
                            WhatsApp
                            <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-0.5 text-muted-foreground">
                      {age !== null ? (
                        <span className="flex items-center gap-1">
                          <Cake className="size-3 text-muted-foreground" />
                          {age} anos ({fmtDate(member.nascimento)})
                        </span>
                      ) : (
                        <span>Nascimento: {fmtDate(member.nascimento) || "—"}</span>
                      )}
                      <span>{member.estadoCivil || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Ações */}
                <div className="pt-3 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMember(member)}
                    className="h-8 gap-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <Eye className="size-3.5" />
                    Ver Ficha
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(member)}
                      className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Editar Membro"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDel(member)}
                      className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                      title="Excluir Membro"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="col-span-full rounded-3xl border bg-card p-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 size-10 text-muted-foreground/50" />
              <p className="text-base font-semibold text-foreground">Nenhum membro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar os filtros ou adicione um novo membro no botão superior.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Visualização 2: Tabela */
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone / WhatsApp</TableHead>
                <TableHead>Congregação</TableHead>
                <TableHead>Cargo / Função</TableHead>
                <TableHead>Célula</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-28 text-right no-print">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {getInitials(String(member.nome))}
                      </div>
                      <span className="truncate">{String(member.nome)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{member.cpf || "—"}</TableCell>
                  <TableCell className="text-xs font-medium">{member.telefone || "—"}</TableCell>
                  <TableCell className="text-xs">{member.congregacao || "Sede Central"}</TableCell>
                  <TableCell className="text-xs">
                    {member.cargo && member.cargo !== "Sem função / cargo" ? (
                      <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                        {member.cargo}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{member.celula || "—"}</TableCell>
                  <TableCell className="text-xs">{member.tipo || "Membro"}</TableCell>
                  <TableCell>
                    <Badge variant={member.situacao === "Ativo" ? "default" : "secondary"} className="text-[10px]">
                      {member.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right no-print whitespace-nowrap">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedMember(member)}
                      title="Ver Ficha"
                      className="size-8"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenEdit(member)}
                      title="Editar"
                      className="size-8"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDel(member)}
                      title="Excluir"
                      className="size-8 text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    Nenhum membro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>{filteredMembers.length} membro(s) exibido(s)</span>
            <span>Total da igreja: {db.members.length}</span>
          </div>
        </div>
      )}

      {/* Modal: Ficha Cadastral Completa do Membro */}
      <Dialog open={!!selectedMember} onOpenChange={(o) => !o && setSelectedMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          {selectedMember && (
            <div className="space-y-6">
              {/* Topo da Ficha */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-xl shrink-0 border border-primary/20">
                    {getInitials(String(selectedMember.nome))}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{String(selectedMember.nome)}</h2>
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <Badge variant="outline" className="text-[11px] font-semibold text-primary border-primary/30">
                        {selectedMember.cargo || "Sem função / cargo"}
                      </Badge>
                      <Badge variant={selectedMember.situacao === "Ativo" ? "default" : "secondary"} className="text-[11px]">
                        {selectedMember.situacao}
                      </Badge>
                      <span className="text-xs text-muted-foreground">· {selectedMember.tipo || "Membro"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="gap-1.5 rounded-xl text-xs"
                  >
                    <Printer className="size-3.5" /> Imprimir Ficha
                  </Button>
                </div>
              </div>

              {/* Seção 1: Dados Pessoais */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserRound className="size-3.5 text-primary" /> Informações Pessoais
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl border bg-muted/20 p-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">CPF</span>
                    <span className="font-semibold text-foreground">{selectedMember.cpf || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Data de Nascimento</span>
                    <span className="font-semibold text-foreground">
                      {fmtDate(selectedMember.nascimento) || "Não informada"}
                      {calculateAge(selectedMember.nascimento) !== null && (
                        <span className="text-muted-foreground font-normal ml-1">
                          ({calculateAge(selectedMember.nascimento)} anos)
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Sexo</span>
                    <span className="font-semibold text-foreground">{selectedMember.sexo || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Estado Civil</span>
                    <span className="font-semibold text-foreground">{selectedMember.estadoCivil || "Não informado"}</span>
                  </div>
                  {selectedMember.estadoCivil === "Casado(a)" && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[11px]">Cônjuge</span>
                      <span className="font-semibold text-foreground">{selectedMember.conjuge || "Não informado"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 2: Eclesiástico */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Church className="size-3.5 text-primary" /> Histórico Eclesiástico
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl border bg-muted/20 p-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Congregação</span>
                    <span className="font-semibold text-foreground">{selectedMember.congregacao || "Sede Central"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Departamento</span>
                    <span className="font-semibold text-foreground">{selectedMember.departamento || "Geral"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Célula</span>
                    <span className="font-semibold text-foreground">{selectedMember.celula || "Não participa de célula"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Data de Conversão</span>
                    <span className="font-semibold text-foreground">{fmtDate(selectedMember.conversao) || "Não informada"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Data de Batismo</span>
                    <span className="font-semibold text-foreground">{fmtDate(selectedMember.batismo) || "Não informada"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Recebido em</span>
                    <span className="font-semibold text-foreground">{fmtDate(selectedMember.recebimento) || "Não informada"}</span>
                  </div>
                </div>
              </div>

              {/* Seção 3: Família */}
              {(selectedMember.pai || selectedMember.mae || selectedMember.filhos) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HeartHandshake className="size-3.5 text-primary" /> Família
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border bg-muted/20 p-4 text-xs">
                    {selectedMember.pai && (
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Pai</span>
                        <span className="font-semibold text-foreground">{selectedMember.pai}</span>
                      </div>
                    )}
                    {selectedMember.mae && (
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Mãe</span>
                        <span className="font-semibold text-foreground">{selectedMember.mae}</span>
                      </div>
                    )}
                    {selectedMember.filhos && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-[11px]">Filhos</span>
                        <span className="font-semibold text-foreground">{selectedMember.filhos}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seção 4: Contato & Endereço */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" /> Contato e Endereço
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border bg-muted/20 p-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Telefone</span>
                    <span className="font-semibold text-foreground">{selectedMember.telefone || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">E-mail</span>
                    <span className="font-semibold text-foreground">{selectedMember.email || "Não informado"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[11px]">Endereço</span>
                    <span className="font-semibold text-foreground">
                      {[
                        selectedMember.endereco,
                        selectedMember.bairro,
                        selectedMember.cidade ? `${selectedMember.cidade}/${selectedMember.uf || ""}` : "",
                        selectedMember.cep ? `CEP: ${selectedMember.cep}` : "",
                      ]
                        .filter(Boolean)
                        .join(", ") || "Endereço não informado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção 5: Observações */}
              {selectedMember.observacoes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Observações Pastorais
                  </h3>
                  <div className="rounded-2xl border bg-muted/20 p-4 text-xs text-foreground whitespace-pre-wrap">
                    {selectedMember.observacoes}
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMember(null)}
                  className="rounded-xl"
                >
                  Fechar
                </Button>
                <Button
                  variant="premium"
                  onClick={() => {
                    const toEdit = selectedMember;
                    setSelectedMember(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="rounded-xl gap-1.5"
                >
                  <Pencil className="size-3.5" /> Editar Cadastro
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Exclusão */}
      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle>Excluir Membro?</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir o cadastro de{" "}
              <strong className="text-foreground">{confirmDel?.nome}</strong>? Esta ação ficará registrada na auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setConfirmDel(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmDel) return;
                remove("members", confirmDel.id);
                setConfirmDel(null);
                toast.success("Membro excluído com sucesso.");
              }}
              className="rounded-xl"
            >
              Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
