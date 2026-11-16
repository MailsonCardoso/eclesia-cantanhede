import { useMemo, useState, useRef, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, FileSpreadsheet, Printer, ListFilter, SearchX, ArrowLeft, X, UserRound } from "lucide-react";
import { CollectionOverview, collectionIcons } from "@/components/CollectionOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, exportCSV, fmtDate, useStore, DEFAULT_CONGREGATION, type Collection, type Row } from "@/lib/store";
import { maskCPF, maskPhone, maskCEP, maskTime, maskMoney, parseMoney, formatMoneyValue } from "@/lib/masks";
import { toast } from "sonner";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "date" | "number" | "money" | "select" | "textarea" | "email" | "member" | "members" | "cell" | "department" | "congregation" | "leader" | "time" | "cpf" | "phone" | "cep" | "children";
  options?: string[] | ((values: Record<string, string>) => string[]);
  table?: boolean;
  required?: boolean;
  /** Só exibe o campo quando a condição sobre os valores do formulário for verdadeira. */
  enabledWhen?: (values: Record<string, string>) => boolean;
};

function MemberSearchInput({
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
          placeholder={placeholder || "Digite o nome para buscar membro..."}
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
            onClick={() => setQuery("")}
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
              Nenhum membro encontrado com esse nome.
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
                <Badge variant="outline" className="text-[10px] shrink-0 font-normal">Selecionar</Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

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
    if (!currentChildren.includes(trimmed)) {
      const next = [...currentChildren, trimmed].join("; ");
      onChange(next);
    }
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
                <Badge variant="outline" className="text-[10px] shrink-0 font-normal">Adicionar Filho</Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Badges dos filhos adicionados */}
      <div className="flex flex-wrap gap-1.5 min-h-10 p-2.5 rounded-xl border bg-background/50 items-center">
        {currentChildren.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">Nenhum filho adicionado ainda.</span>
        ) : (
          currentChildren.map((child) => (
            <Badge key={child} variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-normal">
              <UserRound className="size-3 text-primary shrink-0" />
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

const MONTHS_LIST = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function CrudPage({
  title, subtitle, collection, fields, searchKeys, filterKeys = [], singular, extraAction, enablePeriodFilter = false,
}: {
  title: string; subtitle: string; collection: Collection; fields: Field[]; searchKeys: string[];
  filterKeys?: string[]; singular: string; extraAction?: (row: Row) => React.ReactNode;
  enablePeriodFilter?: boolean;
}) {
  const { db, create, update, remove } = useStore();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  // Valores controlados do formulário (para campos condicionais e seleção múltipla)
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Controle de Mês e Ano para telas financeiras
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(now.getMonth() + 1);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    set.add(now.getFullYear());
    set.add(now.getFullYear() - 1);
    set.add(now.getFullYear() + 1);
    db[collection].forEach((r) => {
      if (r.data) {
        const y = parseInt(String(r.data).slice(0, 4), 10);
        if (!isNaN(y)) set.add(y);
      }
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [db, collection, now]);

  const memberNames = useMemo(() => db.members.map((m) => String(m.nome)).sort((a, b) => a.localeCompare(b)), [db.members]);
  const cellNames = useMemo(() => db.cells.map((c) => String(c.nome)).sort((a, b) => a.localeCompare(b)), [db.cells]);
  const departmentNames = useMemo(() => (db.departments || []).map((d) => String(d.nome)).sort((a, b) => a.localeCompare(b)), [db.departments]);
  const congregationNames = useMemo(() => (db.congregations || []).map((c) => String(c.nome)).sort((a, b) => a.localeCompare(b)), [db.congregations]);
  const leaderNames = useMemo(() => {
    return db.members
      .filter((m) => {
        const c = String(m.cargo || "").trim().toLowerCase();
        return c === "líder" || c === "lider" || c.includes("líder") || c.includes("lider");
      })
      .map((m) => String(m.nome))
      .sort((a, b) => a.localeCompare(b));
  }, [db.members]);

  const rows = useMemo(() => {
    let list = db[collection];
    if (enablePeriodFilter) {
      list = list.filter((r) => {
        if (!r.data) return false;
        const strData = String(r.data);
        if (selectedMonth === "all") {
          return strData.startsWith(`${selectedYear}-`);
        }
        const targetPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
        return strData.startsWith(targetPrefix);
      });
    }
    return list.filter((r) =>
      (!q || searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))) &&
      Object.entries(filters).every(([k, v]) => !v || v === "__all" || r[k] === v)
    );
  }, [db, collection, enablePeriodFilter, selectedYear, selectedMonth, q, filters, searchKeys]);

  const cols = fields.filter((f) => f.table);
  const Icon = collectionIcons[collection];
  const hasFilters = !!q || Object.values(filters).some((v) => v && v !== "__all");
  const render = (f: Field, v: Row[string]) => {
    if (f.type === "money" || f.key === "valor" || f.key === "valor_unitario") return brl(Number(v || 0));
    if (f.type === "date") return fmtDate(v);
    if (f.key === "situacao" || f.key === "tipo" || f.key === "status" || f.key === "estado") {
      const good = ["Ativo", "Ativa", "Receita", "Membro", "Dízimo", "Realizado", "Bom", "Novo"].includes(String(v));
      const bad = ["Inativo", "Cancelado", "Ruim"].includes(String(v));
      return <Badge variant={good ? "default" : bad ? "destructive" : "secondary"}>{v}</Badge>;
    }
    if (f.type === "congregation" || f.key === "congregacao") {
      return v || DEFAULT_CONGREGATION;
    }
    return v || "—";
  };

  const handleCepChange = (key: string, val: string) => {
    const masked = maskCEP(val);
    setFormValues((prev) => ({ ...prev, [key]: masked }));
    const clean = masked.replace(/\D/g, "");
    if (clean.length === 8) {
      toast.info("Consultando CEP...");
      fetch(`https://viacep.com.br/ws/${clean}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setFormValues((prev) => ({
              ...prev,
              cidade: data.localidade || prev["cidade"] || "",
              uf: data.uf || prev["uf"] || "",
              bairro: data.bairro || prev["bairro"] || "",
              endereco: data.logradouro ? `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ""}` : prev["endereco"] || "",
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

  const openForm = (row: Row | null) => {
    setEditing(row);
    const initial: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === "money" || f.key === "valor" || f.key === "valor_unitario") {
        initial[f.key] = row?.[f.key] !== undefined && row?.[f.key] !== "" ? formatMoneyValue(row[f.key]) : "";
      } else if (f.type === "cpf" || f.key === "cpf") {
        initial[f.key] = row?.[f.key] ? maskCPF(String(row[f.key])) : "";
      } else if (f.type === "phone" || f.key === "telefone") {
        initial[f.key] = row?.[f.key] ? maskPhone(String(row[f.key])) : "";
      } else if (f.type === "cep" || f.key === "cep") {
        initial[f.key] = row?.[f.key] ? maskCEP(String(row[f.key])) : "";
      } else if (f.type === "time" || f.key === "hora" || f.key === "horario") {
        initial[f.key] = row?.[f.key] ? maskTime(String(row[f.key])) : "";
      } else if (f.type === "congregation" || f.key === "congregacao") {
        initial[f.key] = String(row?.[f.key] || DEFAULT_CONGREGATION);
      } else if (f.type === "date" && f.key === "data") {
        if (row?.[f.key]) {
          initial[f.key] = String(row[f.key]);
        } else if (enablePeriodFilter && selectedMonth !== "all" && (selectedMonth !== now.getMonth() + 1 || selectedYear !== now.getFullYear())) {
          initial[f.key] = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
        } else {
          initial[f.key] = new Date().toISOString().slice(0, 10);
        }
      } else {
        const opts = typeof f.options === "function" ? f.options({ ...row, ...initial }) : f.options;
        initial[f.key] = String(row?.[f.key] ?? (opts ? opts[0] : ""));
      }
    });
    setFormValues(initial);
    setOpen(true);
  };

  const visibleFields = fields.filter((f) => !f.enabledWhen || f.enabledWhen(formValues));

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string | number> = {};
    visibleFields.forEach((f) => {
      if (f.type === "members" || f.type === "children" || f.key === "filhos") {
        data[f.key] = formValues[f.key] ?? "";
        return;
      }
      if (f.type === "congregation" || f.key === "congregacao") {
        data[f.key] = formValues[f.key] || DEFAULT_CONGREGATION;
        return;
      }
      if (f.type === "member" || f.type === "select" || f.type === "cell" || f.type === "department" || f.type === "leader") {
        data[f.key] = formValues[f.key] ?? String(fd.get(f.key) ?? "");
        return;
      }
      if (f.type === "money" || f.key === "valor" || f.key === "valor_unitario") {
        data[f.key] = parseMoney(formValues[f.key] ?? fd.get(f.key) ?? 0);
        return;
      }
      const v = formValues[f.key] ?? String(fd.get(f.key) ?? "");
      data[f.key] = f.type === "number" ? Number(v || 0) : v;
    });
    if (editing?.id) { update(collection, { ...editing, ...data }); toast.success(`${singular} atualizado(a)`); }
    else { create(collection, data); toast.success(`${singular} cadastrado(a)`); }
    setOpen(false);
  };

  if (open) {
    return (
      <div className="space-y-6 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              className="group gap-2.5 rounded-xl border border-border/80 bg-background/95 px-3.5 py-2 font-semibold text-foreground shadow-sm hover:border-primary/40 hover:bg-accent hover:shadow transition-all"
            >
              <div className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              </div>
              <span className="text-xs sm:text-sm">Voltar para {title}</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Icon className="size-6 text-primary" />
                {editing ? `Editar ${singular}` : `Novo(a) ${singular}`}
              </h1>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="premium" type="submit" form="crud-form" className="px-6">Salvar {singular}</Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-card gradient-top">
          <form id="crud-form" onSubmit={save} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleFields.map((f) => {
              const dv = formValues[f.key] ?? "";
              const isFull = f.type === "textarea" || f.type === "members" || f.type === "children" || f.key === "filhos" || f.key === "endereco" || f.key === "observacoes";
              return (
                <div key={f.key} className={isFull ? "sm:col-span-2 lg:col-span-3 space-y-1.5" : "space-y-1.5"}>
                  <Label htmlFor={f.key} className="text-xs font-semibold">{f.label}</Label>
                  {f.type === "select" ? (
                    (() => {
                      const opts = typeof f.options === "function" ? f.options(formValues) : f.options;
                      return (
                        <Select
                          name={f.key}
                          value={dv}
                          onValueChange={(v) => {
                            setFormValues((s) => {
                              const next = { ...s, [f.key]: v };
                              fields.forEach((other) => {
                                if (typeof other.options === "function" && other.key !== f.key) {
                                  const nextOpts = other.options(next);
                                  if (nextOpts && nextOpts.length > 0 && !nextOpts.includes(next[other.key])) {
                                    next[other.key] = nextOpts[0];
                                  }
                                }
                              });
                              return next;
                            });
                          }}
                        >
                          <SelectTrigger id={f.key} className="rounded-xl"><SelectValue placeholder={`Selecione ${f.label.toLowerCase()}`} /></SelectTrigger>
                          <SelectContent>{opts?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      );
                    })()
                  ) : f.type === "congregation" ? (
                    <Select
                      name={f.key}
                      value={dv || DEFAULT_CONGREGATION}
                      onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v || DEFAULT_CONGREGATION }))}
                    >
                      <SelectTrigger id={f.key} className="rounded-xl">
                        <SelectValue placeholder={`Selecione ${f.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set([
                            DEFAULT_CONGREGATION,
                            ...congregationNames,
                            ...(typeof f.options === "function" ? f.options(formValues) : (f.options || [])),
                          ].filter(Boolean))
                        ).map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.type === "department" ? (
                    <Select name={f.key} value={dv || "__none"} onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v === "__none" ? "" : v }))}>
                      <SelectTrigger id={f.key} className="rounded-xl"><SelectValue placeholder="Selecione um departamento" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Nenhum / Geral</SelectItem>
                        {departmentNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : f.type === "leader" ? (
                    <Select name={f.key} value={dv || "__none"} onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v === "__none" ? "" : v }))}>
                      <SelectTrigger id={f.key} className="rounded-xl"><SelectValue placeholder="Selecione o líder responsável" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Nenhum</SelectItem>
                        {leaderNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : f.type === "member" ? (
                    <MemberSearchInput
                      value={dv}
                      onChange={(val) => setFormValues((s) => ({ ...s, [f.key]: val }))}
                      placeholder={`Digite o nome para buscar ${f.label.toLowerCase()}...`}
                      members={db.members as Array<{ id: string; nome: string; congregacao?: string; cargo?: string }>}
                    />
                  ) : f.type === "cell" ? (
                    <Select name={f.key} value={dv || "__none"} onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v === "__none" ? "" : v }))}>
                      <SelectTrigger id={f.key} className="rounded-xl"><SelectValue placeholder="Selecione uma célula" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Não participa de célula</SelectItem>
                        {cellNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : f.type === "children" || f.type === "members" || f.key === "filhos" ? (
                    <ChildrenSearchInput
                      value={dv}
                      onChange={(val) => setFormValues((s) => ({ ...s, [f.key]: val }))}
                      members={db.members as Array<{ id: string; nome: string; congregacao?: string; cargo?: string }>}
                    />
                  ) : f.type === "cpf" || f.key === "cpf" ? (
                    <Input
                      id={f.key}
                      name={f.key}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((s) => ({ ...s, [f.key]: maskCPF(e.target.value) }))}
                      className="rounded-xl shadow-sm"
                    />
                  ) : f.type === "phone" || f.key === "telefone" ? (
                    <Input
                      id={f.key}
                      name={f.key}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((s) => ({ ...s, [f.key]: maskPhone(e.target.value) }))}
                      className="rounded-xl shadow-sm"
                    />
                  ) : f.type === "cep" || f.key === "cep" ? (
                    <Input
                      id={f.key}
                      name={f.key}
                      placeholder="00000-000"
                      maxLength={9}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => handleCepChange(f.key, e.target.value)}
                      className="rounded-xl shadow-sm"
                    />
                  ) : f.type === "time" || f.key === "hora" || f.key === "horario" ? (
                    <Input
                      id={f.key}
                      name={f.key}
                      placeholder="00:00"
                      maxLength={5}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((s) => ({ ...s, [f.key]: maskTime(e.target.value) }))}
                      className="rounded-xl shadow-sm"
                    />
                  ) : f.type === "money" || f.key === "valor" || f.key === "valor_unitario" ? (
                    <Input
                      id={f.key}
                      name={f.key}
                      placeholder="R$ 0,00"
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((s) => ({ ...s, [f.key]: maskMoney(e.target.value) }))}
                      className="rounded-xl shadow-sm"
                    />
                  ) : f.type === "textarea" ? (
                    <Textarea
                      id={f.key}
                      name={f.key}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((s) => ({ ...s, [f.key]: e.target.value }))}
                      rows={4}
                      className="rounded-xl resize-none shadow-sm"
                    />
                  ) : (
                    <Input
                      id={f.key}
                      name={f.key}
                      required={f.required}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((s) => ({ ...s, [f.key]: e.target.value }))}
                      className="rounded-xl shadow-sm"
                      type={f.type === "number" ? "number" : f.type ?? "text"}
                    />
                  )}
                </div>
              );
            })}
          </form>
          <div className="flex items-center justify-end gap-3 border-t pt-5 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="premium" type="submit" form="crud-form" className="px-8">Salvar {singular}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-6" /></div>
          <div className="min-w-0"><h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          {enablePeriodFilter && (
            <div className="flex items-center gap-2 mr-1">
              <Select
                value={String(selectedMonth)}
                onValueChange={(val) => setSelectedMonth(val === "all" ? "all" : Number(val))}
              >
                <SelectTrigger className="h-10 min-w-[140px] rounded-2xl text-xs font-semibold bg-background shadow-xs border-border/70 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-bold text-primary">
                    Ano Todo ({selectedYear})
                  </SelectItem>
                  {MONTHS_LIST.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-xs font-medium">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(selectedYear)}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                <SelectTrigger className="h-10 min-w-[95px] rounded-2xl text-xs font-semibold bg-background shadow-xs border-border/70 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((yr) => (
                    <SelectItem key={yr} value={String(yr)} className="text-xs font-medium">
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedMonth !== now.getMonth() + 1 || selectedYear !== now.getFullYear()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMonth(now.getMonth() + 1);
                    setSelectedYear(now.getFullYear());
                  }}
                  className="h-10 px-3 text-xs font-semibold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all"
                  title="Voltar ao mês atual"
                >
                  Mês Atual
                </Button>
              )}
            </div>
          )}

          <Button variant="outline" onClick={() => exportCSV(collection, rows, fields)}><FileSpreadsheet className="size-4" />Excel</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />PDF</Button>
          <Button variant="premium" onClick={() => openForm(null)}><Plus className="size-4" />Novo</Button>
        </div>
      </div>

      <CollectionOverview
        collection={collection}
        filterYear={enablePeriodFilter ? selectedYear : undefined}
        filterMonth={enablePeriodFilter ? selectedMonth : undefined}
      />
      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ListFilter className="size-4 text-muted-foreground" />Registros
          </h2>
          <Badge variant="secondary">
            {enablePeriodFilter
              ? `${rows.length} no período (${db[collection].length} no total)`
              : `${rows.length} de ${db[collection].length}`}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 border-b p-4 no-print">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" aria-label={`Pesquisar ${title.toLowerCase()}`} placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {filterKeys.map((k) => {
            const f = fields.find((x) => x.key === k);
            if (!f) return null;
            const opts = f.type === "congregation" || f.key === "congregacao"
              ? [...new Set([...congregationNames, ...(typeof f.options === "function" ? [] : (f.options || []))])]
              : f.type === "department"
              ? departmentNames
              : f.type === "leader"
              ? leaderNames
              : typeof f.options === "function"
              ? [...new Set([
                  ...f.options({ tipo: "Receita" }),
                  ...f.options({ tipo: "Despesa" }),
                  ...db[collection].map((r) => String(r[k] ?? "")).filter(Boolean),
                ])]
              : f.options ?? [...new Set(db[collection].map((r) => String(r[k])))];
            return (
              <Select key={k} value={filters[k] ?? "__all"} onValueChange={(v) => setFilters((s) => ({ ...s, [k]: v }))}>
                <SelectTrigger className="w-full sm:w-52" aria-label={`Filtrar por ${f.label.toLowerCase()}`}><SelectValue placeholder={f.label} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">{f.label}: todos</SelectItem>
                  {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            );
          })}
          {hasFilters && <Button variant="ghost" onClick={() => { setQ(""); setFilters({}); }}>Limpar filtros</Button>}
        </div>
        <Table>
          <TableHeader>
            <TableRow>{cols.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}<TableHead className="w-32 no-print" /></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                {cols.map((c) => <TableCell key={c.key} className={c.key === cols[0]?.key ? "font-medium" : ""}>{render(c, r[c.key])}</TableCell>)}
                <TableCell className="text-right no-print whitespace-nowrap">
                  {extraAction?.(r)}
                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => openForm(r)}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => setConfirmDel(r)}><Trash2 className="size-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={cols.length + 1} className="py-12 text-center text-muted-foreground"><SearchX className="mx-auto mb-3 size-7" />Nenhum registro encontrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">{rows.length} registro(s)</div>
      </div>

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir registro?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Esta ação ficará registrada na auditoria.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { if (!confirmDel) return; remove(collection, confirmDel.id); setConfirmDel(null); toast.success("Excluído"); }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
