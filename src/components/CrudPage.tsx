import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, FileSpreadsheet, Printer } from "lucide-react";
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
  type?: "text" | "date" | "number" | "money" | "select" | "textarea" | "email" | "member" | "members";
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

  const rows = useMemo(() => db[collection].filter((r) =>
    (!q || searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))) &&
    Object.entries(filters).every(([k, v]) => !v || v === "__all" || r[k] === v)), [db, collection, q, filters, searchKeys]);

  const cols = fields.filter((f) => f.table);
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
      if (f.type === "member" || f.type === "select") { data[f.key] = formValues[f.key] ?? String(fd.get(f.key) ?? ""); return; }
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
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={() => exportCSV(collection, rows, fields)}><FileSpreadsheet className="size-4" />Excel</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />PDF</Button>
          <Button onClick={() => openForm(null)}><Plus className="size-4" />Novo</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex flex-wrap gap-3 border-b p-4 no-print">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {filterKeys.map((k) => {
            const f = fields.find((x) => x.key === k)!;
            const opts = f.options ?? [...new Set(db[collection].map((r) => String(r[k])))];
            return (
              <Select key={k} value={filters[k] ?? "__all"} onValueChange={(v) => setFilters((s) => ({ ...s, [k]: v }))}>
                <SelectTrigger className="w-52"><SelectValue placeholder={f.label} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">{f.label}: todos</SelectItem>
                  {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            );
          })}
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
            {!rows.length && <TableRow><TableCell colSpan={cols.length + 1} className="py-10 text-center text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">{rows.length} registro(s)</div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Editar ${singular.toLowerCase()}` : `Novo(a) ${singular.toLowerCase()}`}</DialogTitle></DialogHeader>
          <form id="crud-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {visibleFields.map((f) => {
              const dv = formValues[f.key] ?? "";
              return (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                  <Label htmlFor={f.key}>{f.label}</Label>
                  {f.type === "select" ? (
                    <Select name={f.key} value={dv} onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v }))}>
                      <SelectTrigger id={f.key}><SelectValue /></SelectTrigger>
                      <SelectContent>{f.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : f.type === "member" ? (
                    <Select name={f.key} value={dv || "__none"} onValueChange={(v) => setFormValues((s) => ({ ...s, [f.key]: v === "__none" ? "" : v }))}>
                      <SelectTrigger id={f.key}><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Nenhum</SelectItem>
                        {memberNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : f.type === "members" ? (
                    <select
                      id={f.key}
                      multiple
                      className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={dv ? dv.split("; ") : []}
                      onChange={(e) => setFormValues((s) => ({ ...s, [f.key]: Array.from(e.target.selectedOptions).map((o) => o.value).join("; ") }))}
                    >
                      {memberNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <Textarea id={f.key} name={f.key} defaultValue={dv} />
                  ) : (
                    <Input id={f.key} name={f.key} required={f.required} defaultValue={dv}
                      type={f.type === "money" || f.type === "number" ? "number" : f.type ?? "text"} step={f.type === "money" ? "0.01" : undefined} />
                  )}
                </div>
              );
            })}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="crud-form">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir registro?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Esta ação ficará registrada na auditoria.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { remove(collection, confirmDel!.id); setConfirmDel(null); toast.success("Excluído"); }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
