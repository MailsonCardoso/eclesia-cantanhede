import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Boxes,
  Package,
  Landmark,
  ShieldCheck,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Pencil,
  Trash2,
  ArrowLeft,
  MapPin,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  DollarSign,
  Tag,
  Tv,
  Music,
  Laptop,
  Wind,
  BookOpen,
  Utensils,
  Armchair,
  X,
  AlertTriangle,
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
import { useStore, exportCSV, fmtDate, brl, type Row } from "@/lib/store";
import { maskMoney, parseMoney, formatMoneyValue } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário e Patrimônio — EclesiaPro" },
      { name: "description", content: "Controle do patrimônio, bens, equipamentos e materiais da igreja." },
      { property: "og:title", content: "Inventário e Patrimônio — EclesiaPro" },
      { property: "og:description", content: "Controle do patrimônio, bens, equipamentos e materiais da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inventario,
});

const CATEGORIAS = [
  "Mobiliário",
  "Áudio",
  "Audiovisual",
  "Instrumentos",
  "Material didático",
  "Climatização",
  "Informática",
  "Cozinha",
  "Outros",
];

const ESTADOS = ["Novo", "Bom", "Regular", "Ruim"];

function getCategoryIcon(cat: string) {
  const c = String(cat || "").toLowerCase();
  if (c.includes("áudio") || c.includes("som")) return Music;
  if (c.includes("instrumento")) return Music;
  if (c.includes("audiovisual") || c.includes("vídeo") || c.includes("projetor")) return Tv;
  if (c.includes("informática") || c.includes("computador")) return Laptop;
  if (c.includes("climatização") || c.includes("ar")) return Wind;
  if (c.includes("didático") || c.includes("livro") || c.includes("bíblia")) return BookOpen;
  if (c.includes("cozinha")) return Utensils;
  if (c.includes("mobiliário") || c.includes("cadeira") || c.includes("mesa")) return Armchair;
  return Package;
}

function getEstadoBadge(estado: string) {
  const e = String(estado || "").toLowerCase();
  if (e === "novo") {
    return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Novo</Badge>;
  }
  if (e === "bom") {
    return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Bom</Badge>;
  }
  if (e === "regular") {
    return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Regular</Badge>;
  }
  return <Badge variant="destructive">Ruim</Badge>;
}

function Inventario() {
  const { db, create, update, remove } = useStore();

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [q, setQ] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("__all");
  const [filtroEstado, setFiltroEstado] = useState("__all");
  const [filtroLocal, setFiltroLocal] = useState("__all");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);

  // Formulário 100% limpo ao criar novo item
  const emptyForm = {
    nome: "",
    categoria: "",
    quantidade: "1",
    estado: "Bom",
    local: "",
    aquisicao: "",
    valor: "",
    observacoes: "",
  };

  const [form, setForm] = useState(emptyForm);

  // Lista de locais/congregações disponíveis
  const locations = useMemo(() => {
    const list = new Set<string>();
    list.add("Sede Central");
    list.add("Depósito");
    (db.congregations || []).forEach((c) => {
      if (c.nome) list.add(String(c.nome));
    });
    (db.inventory || []).forEach((i) => {
      if (i.local) list.add(String(i.local));
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b));
  }, [db.congregations, db.inventory]);

  // Itens calculados com valor total
  const itemsWithValues = useMemo(() => {
    return (db.inventory || []).map((item) => {
      const qtd = Number(item.quantidade || 0);
      const valUnit = Number(item.valor || 0);
      const totalItem = qtd * valUnit;

      return {
        ...item,
        qtd,
        valUnit,
        totalItem,
      };
    });
  }, [db.inventory]);

  // Métricas Consolidadas do Topo (sem alterar gráficos)
  const metrics = useMemo(() => {
    const totalItens = itemsWithValues.length;
    const totalUnidades = itemsWithValues.reduce((acc, curr) => acc + curr.qtd, 0);
    const valorPatrimonial = itemsWithValues.reduce((acc, curr) => acc + curr.totalItem, 0);

    const emBomEstado = itemsWithValues.filter(
      (i) => i.estado === "Bom" || i.estado === "Novo"
    ).length;

    const percentBomEstado = totalItens > 0 ? Math.round((emBomEstado / totalItens) * 100) : 0;

    return {
      totalItens,
      totalUnidades,
      valorPatrimonial,
      emBomEstado,
      percentBomEstado,
    };
  }, [itemsWithValues]);

  // Filtros aplicados
  const filteredItems = useMemo(() => {
    const query = q.toLowerCase().trim();
    return itemsWithValues.filter((item) => {
      const matchQuery =
        !query ||
        String(item.nome || "").toLowerCase().includes(query) ||
        String(item.categoria || "").toLowerCase().includes(query) ||
        String(item.local || "").toLowerCase().includes(query) ||
        String(item.observacoes || "").toLowerCase().includes(query);

      const matchCat = filtroCategoria === "__all" || item.categoria === filtroCategoria;
      const matchEst = filtroEstado === "__all" || item.estado === filtroEstado;
      const matchLoc = filtroLocal === "__all" || item.local === filtroLocal;

      return matchQuery && matchCat && matchEst && matchLoc;
    });
  }, [itemsWithValues, q, filtroCategoria, filtroEstado, filtroLocal]);

  // Abrir Formulário Novo (limpo)
  const handleOpenNew = () => {
    setEditing(null);
    setForm({
      nome: "",
      categoria: "",
      quantidade: "1",
      estado: "Bom",
      local: "",
      aquisicao: "",
      valor: "",
      observacoes: "",
    });
    setOpenForm(true);
  };

  // Abrir Formulário Edição
  const handleOpenEdit = (item: Row) => {
    setEditing(item);
    setForm({
      nome: String(item.nome || ""),
      categoria: String(item.categoria || ""),
      quantidade: item.quantidade !== undefined && item.quantidade !== null ? String(item.quantidade) : "1",
      estado: String(item.estado || "Bom"),
      local: String(item.local || ""),
      aquisicao: String(item.aquisicao || ""),
      valor: item.valor !== undefined && item.valor !== null && item.valor !== "" ? formatMoneyValue(item.valor) : "",
      observacoes: String(item.observacoes || ""),
    });
    setOpenForm(true);
  };

  // Salvar Item
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }

    const payload = {
      ...form,
      quantidade: Math.max(1, Number(form.quantidade || 1)),
      valor: form.valor ? parseMoney(form.valor) : 0,
    };

    if (editing?.id) {
      update("inventory", { ...editing, ...payload });
      toast.success("Item atualizado no patrimônio!");
    } else {
      create("inventory", payload);
      toast.success("Item adicionado ao patrimônio!");
    }

    setOpenForm(false);
  };

  // Exportar Excel (CSV)
  const handleExportCSV = () => {
    const dataToExport = filteredItems.map((item) => ({
      Item: item.nome,
      Categoria: item.categoria || "",
      Quantidade: item.qtd,
      "Estado de Conservação": item.estado || "",
      Local: item.local || "",
      "Data de Aquisição": fmtDate(item.aquisicao),
      "Valor Unitário": brl(item.valUnit),
      "Valor Total": brl(item.totalItem),
      Observações: item.observacoes || "",
    }));

    exportCSV("inventory", dataToExport, [
      { key: "Item", label: "Item" },
      { key: "Categoria", label: "Categoria" },
      { key: "Quantidade", label: "Quantidade" },
      { key: "Estado de Conservação", label: "Estado de Conservação" },
      { key: "Local", label: "Local" },
      { key: "Data de Aquisição", label: "Data de Aquisição" },
      { key: "Valor Unitário", label: "Valor Unitário" },
      { key: "Valor Total", label: "Valor Total" },
      { key: "Observações", label: "Observações" },
    ]);
  };

  // Se o formulário estiver aberto
  if (openForm) {
    const qtdNum = Math.max(1, Number(form.quantidade || 1));
    const valNum = form.valor ? parseMoney(form.valor) : 0;
    const previewTotal = qtdNum * valNum;

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
              <ArrowLeft className="size-4" /> Voltar para Inventário
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Boxes className="size-6 text-primary" />
                {editing ? "Editar Item do Patrimônio" : "Novo Item do Patrimônio"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Informe a descrição, categoria, quantidade e estado de conservação do bem.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button variant="premium" type="submit" form="item-form" className="px-6">
              Salvar Item
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-card gradient-top">
          <form id="item-form" onSubmit={handleSave} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome" className="text-xs font-semibold">
                Nome do Item / Descrição do Bem *
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Mesa de som 16 canais, Projetor Epson, Cadeira plástica..."
                value={form.nome}
                onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                required
                className="rounded-xl shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoria" className="text-xs font-semibold">
                Categoria do Bem
              </Label>
              <Select
                value={form.categoria || "__none"}
                onValueChange={(v) => setForm((s) => ({ ...s, categoria: v === "__none" ? "" : v }))}
              >
                <SelectTrigger id="categoria" className="rounded-xl">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Selecione a categoria</SelectItem>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantidade" className="text-xs font-semibold">
                Quantidade (Unidades) *
              </Label>
              <Input
                id="quantidade"
                type="number"
                min={1}
                value={form.quantidade}
                onChange={(e) => setForm((s) => ({ ...s, quantidade: e.target.value }))}
                required
                className="rounded-xl shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estado" className="text-xs font-semibold">
                Estado de Conservação
              </Label>
              <Select value={form.estado} onValueChange={(v) => setForm((s) => ({ ...s, estado: v }))}>
                <SelectTrigger id="estado" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="local" className="text-xs font-semibold">
                Localização / Congregação
              </Label>
              <Select
                value={form.local || "__none"}
                onValueChange={(v) => setForm((s) => ({ ...s, local: v === "__none" ? "" : v }))}
              >
                <SelectTrigger id="local" className="rounded-xl">
                  <SelectValue placeholder="Selecione a localização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Selecione o local</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aquisicao" className="text-xs font-semibold">
                Data de Aquisição
              </Label>
              <Input
                id="aquisicao"
                type="date"
                value={form.aquisicao}
                onChange={(e) => setForm((s) => ({ ...s, aquisicao: e.target.value }))}
                className="rounded-xl shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valor" className="text-xs font-semibold">
                Valor Unitário
              </Label>
              <Input
                id="valor"
                placeholder="R$ 0,00"
                value={form.valor}
                onChange={(e) => setForm((s) => ({ ...s, valor: maskMoney(e.target.value) }))}
                className="rounded-xl shadow-sm"
              />
            </div>

            {/* Resumo do Valor Total do Lote */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Valor Patrimonial Total
              </Label>
              <div className="rounded-xl border bg-muted/40 px-3.5 py-2.5 text-xs flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">
                  {brl(previewTotal)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  ({qtdNum} un. × {brl(valNum)})
                </span>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="observacoes" className="text-xs font-semibold">
                Observações / Número de Patrimônio / Detalhes
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Número de tombo, número de série, marca/modelo, doador ou responsável..."
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
            <Boxes className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventário e Patrimônio</h1>
            <p className="text-sm text-muted-foreground">
              Controle físico e financeiro de bens, móveis, equipamentos e materiais da igreja.
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
            <Plus className="size-4" /> Novo Item
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas (sem alterar gráficos) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Itens cadastrados"
          value={metrics.totalItens}
          icon={Boxes}
          tone="blue"
        />
        <MetricCard
          label="Unidades no acervo"
          value={metrics.totalUnidades}
          icon={Package}
          tone="green"
        />
        <MetricCard
          label="Valor do patrimônio"
          value={brl(metrics.valorPatrimonial)}
          icon={Landmark}
          tone="violet"
        />
        <MetricCard
          label="Em bom / novo estado"
          value={`${metrics.emBomEstado} (${metrics.percentBomEstado}%)`}
          icon={CheckCircle2}
          tone="orange"
        />
      </div>

      {/* Barra de Filtros, Busca e Alternador de Modo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm no-print">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Pesquisar por item, categoria, local..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 rounded-xl text-xs shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Categoria */}
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-36 rounded-xl text-xs">
              <SelectValue placeholder="Categoria: todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as Categorias</SelectItem>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Estado */}
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-32 rounded-xl text-xs">
              <SelectValue placeholder="Estado: todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os Estados</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e} className="text-xs">
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Local */}
          <Select value={filtroLocal} onValueChange={setFiltroLocal}>
            <SelectTrigger className="w-36 rounded-xl text-xs">
              <SelectValue placeholder="Local: todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os Locais</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc} className="text-xs">
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(q || filtroCategoria !== "__all" || filtroEstado !== "__all" || filtroLocal !== "__all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setFiltroCategoria("__all");
                setFiltroEstado("__all");
                setFiltroLocal("__all");
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

      {/* Visualização 1: Grade de Cards do Patrimônio */}
      {viewMode === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const ItemIcon = getCategoryIcon(String(item.categoria || ""));

            return (
              <div
                key={item.id}
                className="rounded-3xl border bg-card p-5 shadow-card transition-all card-hover flex flex-col justify-between space-y-4 hover:border-primary/50"
              >
                {/* Topo do Card */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0 border border-primary/20">
                        <ItemIcon className="size-5.5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-base text-foreground truncate">{item.nome}</h2>
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {item.categoria && (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {item.categoria}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">{getEstadoBadge(String(item.estado || "Bom"))}</div>
                  </div>

                  {/* Informações de Localização e Quantidade */}
                  <div className="rounded-2xl border bg-muted/20 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-foreground font-medium">
                      <span className="flex items-center gap-1.5 text-muted-foreground font-normal">
                        <Package className="size-3.5 text-primary shrink-0" /> Quantidade:
                      </span>
                      <span className="font-bold text-foreground">
                        {item.qtd} {item.qtd === 1 ? "unidade" : "unidades"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-foreground font-medium truncate">
                      <span className="flex items-center gap-1.5 text-muted-foreground font-normal">
                        <MapPin className="size-3.5 text-chart-2 shrink-0" /> Local:
                      </span>
                      <span className="truncate">{item.local || "Sede Central"}</span>
                    </div>

                    {item.aquisicao && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-amber-500 shrink-0" /> Aquisição:
                        </span>
                        <span>{fmtDate(item.aquisicao)}</span>
                      </div>
                    )}
                  </div>

                  {/* Bloco Financeiro Patrimonial */}
                  <div className="rounded-2xl border bg-card p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valor unitário:</span>
                      <span className="font-semibold text-foreground">
                        {item.valUnit > 0 ? brl(item.valUnit) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-1.5">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Landmark className="size-3.5 text-primary" /> Valor total:
                      </span>
                      <span className="font-bold text-primary text-sm">
                        {item.totalItem > 0 ? brl(item.totalItem) : "—"}
                      </span>
                    </div>
                  </div>

                  {item.observacoes && (
                    <p className="text-[11px] text-muted-foreground italic line-clamp-2 px-1">
                      "{item.observacoes}"
                    </p>
                  )}
                </div>

                {/* Rodapé do Card: Ações */}
                <div className="pt-3 border-t flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="h-8 gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDel(item)}
                    className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                    title="Excluir Item"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full rounded-3xl border bg-card p-12 text-center text-muted-foreground">
              <Boxes className="mx-auto mb-3 size-10 text-muted-foreground/50" />
              <p className="text-base font-semibold text-foreground">Nenhum item encontrado no inventário</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar os filtros ou adicione um novo bem no botão superior.
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
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Data Aquisição</TableHead>
                <TableHead>Valor Unitário</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead className="w-28 text-right no-print">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-foreground">
                    <span className="truncate">{String(item.nome)}</span>
                  </TableCell>
                  <TableCell className="text-xs">{item.categoria || "—"}</TableCell>
                  <TableCell className="text-xs font-semibold">{item.qtd}</TableCell>
                  <TableCell>{getEstadoBadge(String(item.estado || "Bom"))}</TableCell>
                  <TableCell className="text-xs">{item.local || "Sede Central"}</TableCell>
                  <TableCell className="text-xs">{fmtDate(item.aquisicao) || "—"}</TableCell>
                  <TableCell className="text-xs font-medium">
                    {item.valUnit > 0 ? brl(item.valUnit) : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-primary">
                    {item.totalItem > 0 ? brl(item.totalItem) : "—"}
                  </TableCell>
                  <TableCell className="text-right no-print whitespace-nowrap">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenEdit(item)}
                      title="Editar"
                      className="size-8"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDel(item)}
                      title="Excluir"
                      className="size-8 text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    Nenhum item encontrado no inventário.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>{filteredItems.length} item(ns) exibido(s)</span>
            <span>Total no patrimônio: {(db.inventory || []).length}</span>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle>Excluir Item do Patrimônio?</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir o bem{" "}
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
                remove("inventory", confirmDel.id);
                setConfirmDel(null);
                toast.success("Item excluído do patrimônio.");
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
