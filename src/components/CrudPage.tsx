import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, FileSpreadsheet, Printer, ListFilter, SearchX } from "lucide-react";
import { CollectionOverview, collectionIcons } from "@/components/CollectionOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, exportCSV, fmtDate, useStore, type Collection, type Row } from "@/lib/store";
import { toast } from "sonner";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "date" | "number" | "money" | "select" | "textarea" | "email" | "member" | "members" | "cell";
  options?: string[];
  table?: boolean;
  required?: boolean;
  /** Só exibe o campo quando a condição sobre os valores do formulário for verdadeira. */
  enabledWhen?: (values: Record<string, string>) => boolean;
};

export function CrudPage({
  title, subtitle, collection, fields, searchKeys, filterKeys = [], singular, extraAction,
}: {
  title: string; subtitle: string; collection: Collection; fields: Field[]; searchKeys: string[];
  filterKeys?: string[]; singular: string; extraAction?: (row: Row) => React.ReactNode;
}) {
  const { db, create, update, remove } = useStore();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  // Valores controlados do formulário (para campos condicionais e seleção múltipla)
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const memberNames = useMemo(() => db.members.map((m) => String(m.nome)).sort((a, b) => a.localeCompare(b)), [db.members]);
  const cellNames = useMemo(() => db.cells.map((c) => String(c.nome)).sort((a, b) => a.localeCompare(b)), [db.cells]);

  const rows = useMemo(() => db[collection].filter((r) =>
    (!q || searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))) &&
    Object.entries(filters).every(([k, v]) => !v || v === "__all" || r[k] === v)), [db, collection, q, filters, searchKeys]);

  const cols = fields.filter((f) => f.table);
  const Icon = collectionIcons[collection];
  const hasFilters = !!q || Object.values(filters).some((v) => v && v !== "__all");
  const render = (f: Field, v: Row[string]) => {
    if (f.type === "money") return brl(Number(v || 0));
    if (f.type === "date") return fmtDate(v);
    if (f.key === "situacao" || f.key === "tipo" || f.key === "status" || f.key === "estado") {
      const good = ["Ativo", "Ativa", "Receita", "Membro", "Dízimo", "Realizado", "Bom", "Novo"].includes(String(v));
      const bad = ["Inativo", "Cancelado", "Ruim"].includes(String(v));
      return <Badge variant={good ? "default" : bad ? "destructive" : "secondary"}>{v}</Badge>;
    }
    return v || "—";
  };

  const openForm = (row: Row | null) => {
    setEditing(row);
    const initial: Record<string, string> = {};
    fields.forEach((f) => { initial[f.key] = String(row?.[f.key] ?? (f.options ? f.options[0] : "")); });
    setFormValues(initial);
    setOpen(true);
  };

  const visibleFields = fields.filter((f) => !f.enabledWhen || f.enabledWhen(formValues));

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string | number> = {};
    visibleFields.forEach((f) => {
      if (f.type === "members") { data[f.key] = formValues[f.key] ?? ""; return; }
      if (f.type === "member" || f.type === "select" || f.type === "cell") { data[f.key] = formValues[f.key] ?? String(fd.get(f.key) ?? ""); return; }
      const v = String(fd.get(f.key) ?? "");
      data[f.key] = f.type === "money" || f.type === "number" ? Number(v || 0) : v;
    });
    if (editing?.id) { update(collection, { ...editing, ...data }); toast.success(`${singular} atualizado(a)`); }
    else { create(collection, data); toast.success(`${singular} cadastrado(a)`); }
    setOpen(false);
  };

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-6" /></div>
          <div className="min-w-0"><h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="outline" onClick={() => exportCSV(collection, rows, fields)}><FileSpreadsheet className="size-4" />Excel</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />PDF</Button>
          <Button variant="premium" onClick={() => openForm(null)}><Plus className="size-4" />Novo</Button>
        </div>
      </div>

      <CollectionOverview collection={collection} />
      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><ListFilter className="size-4 text-muted-foreground" />Registros</h2><Badge variant="secondary">{rows.length} de {db[collection].length}</Badge></div>
        <div className="flex flex-wrap gap-3 border-b p-4 no-print">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" aria-label={`Pesquisar ${title.toLowerCase()}`} placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {filterKeys.map((k) => {
            const f = fields.find((x) => x.key === k);
            if (!f) return null;
            const opts = f.options ?? [...new Set(db[collection].map((r) => String(r[k])))];
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-6 md:p-8 rounded-3xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold">{editing ? `Editar ${singular.toLowerCase()}` : `Novo(a) ${singular.toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          <form id="crud-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
            {visibleFields.map((f) => {
              const dv = formValues[f.key] ?? "";
              const isFull = f.type === "textarea" || f.type === "members" || f.key === "endereco" || f.key === "observacoes";
              return (
                <div key={f.key} className={isFull ? "sm:col-span-2 lg:col-span-3 space-y-1.5" : "space-y-1.5"}>
                  <Label htmlFor={f.key} className="text-xs font-semibold">{f.label}</Label>
                  {f.type === "select" ? (
                    <Select name={f.key} value={dv} onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v }))}>
                      <SelectTrigger id={f.key} className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : f.type === "member" ? (
                    <Select name={f.key} value={dv || "__none"} onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v === "__none" ? "" : v }))}>
                      <SelectTrigger id={f.key} className="rounded-xl"><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Nenhum</SelectItem>
                        {memberNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : f.type === "cell" ? (
                    <Select name={f.key} value={dv || "__none"} onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v === "__none" ? "" : v }))}>
                      <SelectTrigger id={f.key} className="rounded-xl"><SelectValue placeholder="Selecione uma célula" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Não participa de célula</SelectItem>
                        {cellNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : f.type === "members" ? (
                    <select
                      id={f.key}
                      multiple
                      className="flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      value={dv ? dv.split("; ") : []}
                      onChange={(e) => setFormValues((s) => ({ ...s, [f.key]: Array.from(e.target.selectedOptions).map((o) => o.value).join("; ") }))}
                    >
                      {memberNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <Textarea id={f.key} name={f.key} defaultValue={dv} rows={3} className="rounded-xl resize-none shadow-sm" />
                  ) : (
                    <Input id={f.key} name={f.key} required={f.required} defaultValue={dv} className="rounded-xl shadow-sm"
                      type={f.type === "money" || f.type === "number" ? "number" : f.type ?? "text"} step={f.type === "money" ? "0.01" : undefined} />
                  )}
                </div>
              );
            })}
          </form>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="premium" type="submit" form="crud-form" className="px-6">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
