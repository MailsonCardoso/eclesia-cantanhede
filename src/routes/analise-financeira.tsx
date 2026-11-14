import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ChartNoAxesCombined,
  LineChart,
  Download,
  ArrowLeft,
  ArrowRight,
  Printer,
  FileText,
  Building2,
  Info,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl, fmtDate, useStore, type Row } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadChartAsPng } from "@/lib/chart-download";

export const Route = createFileRoute("/analise-financeira")({
  head: () => ({
    meta: [
      { title: "Análise Financeira, DRE e Balancete — EclesiaPro" },
      { name: "description", content: "Compare receitas, despesas, saldo, DRE mês a mês e Balancete de contas." },
      { property: "og:title", content: "Análise Financeira, DRE e Balancete — EclesiaPro" },
      { property: "og:description", content: "Compare receitas, despesas, saldo, DRE mês a mês e Balancete de contas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analise,
});

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
const OPTIONS = [2, 3, 6, 9, 12, 18, 24];

function formatMonthYear(ym: string) {
  if (!ym || !ym.includes("-")) return ym;
  const [y, m] = ym.split("-");
  const monthIdx = parseInt(m, 10) - 1;
  return `${MONTHS_FULL[monthIdx] || m} de ${y}`;
}

// -------------------------------------------------------------
// COMPONENTE: TELA DEDICADA DE DRE (MÊS A MÊS)
// -------------------------------------------------------------
function DreView({
  onBack,
  onSwitchToBalancete,
  db,
}: {
  onBack: () => void;
  onSwitchToBalancete: () => void;
  db: ReturnType<typeof useStore>["db"];
}) {
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    // Garante que o mês atual sempre exista
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    db.transactions.forEach((t) => {
      if (t.data) set.add(String(t.data).slice(0, 7));
    });
    db.contributions.forEach((c) => {
      if (c.data) set.add(String(c.data).slice(0, 7));
    });
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [db.transactions, db.contributions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || "");

  // Filtra dados do mês selecionado
  const monthTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    return db.transactions.filter((t) => String(t.data).startsWith(selectedMonth));
  }, [db.transactions, selectedMonth]);

  const monthContributions = useMemo(() => {
    if (!selectedMonth) return [];
    return db.contributions.filter((c) => String(c.data).startsWith(selectedMonth));
  }, [db.contributions, selectedMonth]);

  // Itens de Receitas
  const recDizimos = monthContributions.filter((c) => c.tipo === "Dízimo").reduce((a, c) => a + Number(c.valor || 0), 0);
  const recOfertas = monthContributions.filter((c) => c.tipo === "Oferta").reduce((a, c) => a + Number(c.valor || 0), 0);
  const recOfertasEsp = monthContributions.filter((c) => c.tipo === "Oferta especial").reduce((a, c) => a + Number(c.valor || 0), 0);

  const txReceitas = monthTransactions.filter((t) => t.tipo === "Receita");
  const categoriesReceita = [
    "Cantina",
    "Bazar",
    "Eventos",
    "Inscrições",
    "Campanhas",
    "Doações gerais",
    "Rendimentos",
    "Aluguel de espaço",
    "Outras receitas",
  ];
  // Captura também categorias extras se houver
  const extraRecCats = [...new Set(txReceitas.map((t) => String(t.categoria || "Outras receitas")))].filter(
    (c) => !categoriesReceita.includes(c)
  );
  const allRecCats = [...categoriesReceita, ...extraRecCats];

  const recItems = allRecCats
    .map((cat) => ({
      cat,
      valor: txReceitas.filter((t) => String(t.categoria).trim().toLowerCase() === cat.trim().toLowerCase()).reduce((a, t) => a + Number(t.valor || 0), 0),
    }))
    .filter((i) => i.valor > 0);

  const totalReceitas = recDizimos + recOfertas + recOfertasEsp + recItems.reduce((a, i) => a + i.valor, 0);

  // Itens de Despesas
  const txDespesas = monthTransactions.filter((t) => t.tipo === "Despesa");
  const categoriesDespesa = [
    "Água",
    "Energia",
    "Internet",
    "Aluguel",
    "Manutenção",
    "Ajuda ministerial",
    "Ação social",
    "Materiais",
    "Taxas bancárias",
    "Outras despesas",
  ];
  const extraDespCats = [...new Set(txDespesas.map((t) => String(t.categoria || "Outras despesas")))].filter(
    (c) => !categoriesDespesa.includes(c)
  );
  const allDespCats = [...categoriesDespesa, ...extraDespCats];

  const despItems = allDespCats
    .map((cat) => ({
      cat,
      valor: txDespesas.filter((t) => String(t.categoria).trim().toLowerCase() === cat.trim().toLowerCase()).reduce((a, t) => a + Number(t.valor || 0), 0),
    }))
    .filter((i) => i.valor > 0);

  const totalDespesas = despItems.reduce((a, i) => a + i.valor, 0);
  const resultadoLiquido = totalReceitas - totalDespesas;
  const isSuperavit = resultadoLiquido >= 0;

  return (
    <div className="space-y-6 animate-rise">
      {/* Barra de Ações Superior */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2 text-xs">
            <ArrowLeft className="size-4" /> Voltar à Análise Geral
          </Button>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="size-6 text-primary" />
              DRE — Demonstração do Resultado do Exercício
            </h1>
            <p className="text-xs text-muted-foreground">Prestação de contas mensal com apuração de receitas e gastos item a item.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <div className="w-56">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
              <SelectContent>
                {availableMonths.map((ym) => (
                  <SelectItem key={ym} value={ym} className="text-xs font-medium">
                    {formatMonthYear(ym)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs rounded-xl">
            <Printer className="size-3.5" /> Imprimir DRE
          </Button>
          <Button variant="secondary" size="sm" onClick={onSwitchToBalancete} className="gap-1.5 text-xs rounded-xl">
            <Building2 className="size-3.5 text-chart-2" /> Ver Balancete
          </Button>
        </div>
      </div>

      {/* Caixa de Regra de Negócio & Explicação */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 text-sm space-y-2">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Info className="size-4" />
          Regra de Negócio da DRE
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A <strong>DRE</strong> demonstra a saúde financeira da igreja no mês selecionado (<strong>{formatMonthYear(selectedMonth)}</strong>).
          Ela confronta <strong>todas as receitas arrecadadas</strong> contra <strong>todos os gastos e despesas discriminados item a item</strong>.
          Se as receitas forem maiores que as despesas, a congregação opera em <strong>Superávit (+)</strong> (recursos poupados para obras, missões e expansão);
          caso as despesas superem a arrecadação, apura-se um <strong>Déficit (−)</strong> (alerta para contingenciamento de custos).
        </p>
      </div>

      {/* Cards de Destaque do Período */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>(+) Receitas Totais</span>
            <ArrowDownLeft className="size-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{brl(totalReceitas)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Arrecadação total em {formatMonthYear(selectedMonth)}</div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>(−) Despesas Totais</span>
            <ArrowUpRight className="size-4 text-destructive" />
          </div>
          <div className="text-xl font-bold text-destructive mt-2">{brl(totalDespesas)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Gastos e contas pagas no mês</div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${isSuperavit ? "bg-emerald-500/10 border-emerald-500/30" : "bg-destructive/10 border-destructive/30"}`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>(=) Resultado do Mês</span>
            {isSuperavit ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-destructive" />}
          </div>
          <div className={`text-xl font-bold mt-2 ${isSuperavit ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {brl(resultadoLiquido)}
          </div>
          <div className="text-[11px] font-medium mt-0.5">
            {isSuperavit ? "Superávit do Exercício" : "Déficit do Exercício"}
            {totalReceitas > 0 && ` · Margem: ${((resultadoLiquido / totalReceitas) * 100).toFixed(1)}%`}
          </div>
        </div>
      </div>

      {/* Tabela Estruturada da DRE */}
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="border-b px-5 py-4 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <div>
            <h3 className="font-bold text-foreground">Relatório Detalhado da DRE — {formatMonthYear(selectedMonth)}</h3>
            <p className="text-xs text-muted-foreground">Discriminação linha a linha de receitas e despesas por item</p>
          </div>
          <Badge variant={isSuperavit ? "default" : "destructive"}>
            {isSuperavit ? "Superávit" : "Déficit"}: {brl(resultadoLiquido)}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground tracking-wider">
                <th className="py-3 px-5">Item / Categoria</th>
                <th className="py-3 px-5 text-right">Valor no Mês</th>
                <th className="py-3 px-5 text-right">% Participação</th>
              </tr>
            </thead>
            <tbody>
              {/* SEÇÃO 1: RECEITAS */}
              <tr className="bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400 border-b">
                <td className="py-2.5 px-5" colSpan={2}>1. RECEITAS OPERACIONAIS E MINISTERIAIS</td>
                <td className="py-2.5 px-5 text-right">{brl(totalReceitas)}</td>
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 px-5 pl-8 text-foreground font-medium">• Dízimos de Membros</td>
                <td className="py-2 px-5 text-right font-medium">{brl(recDizimos)}</td>
                <td className="py-2 px-5 text-right text-xs text-muted-foreground">
                  {totalReceitas > 0 ? `${((recDizimos / totalReceitas) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 px-5 pl-8 text-foreground font-medium">• Ofertas Gerais de Culto</td>
                <td className="py-2 px-5 text-right font-medium">{brl(recOfertas)}</td>
                <td className="py-2 px-5 text-right text-xs text-muted-foreground">
                  {totalReceitas > 0 ? `${((recOfertas / totalReceitas) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              {recOfertasEsp > 0 && (
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 px-5 pl-8 text-foreground font-medium">• Ofertas Especiais</td>
                  <td className="py-2 px-5 text-right font-medium">{brl(recOfertasEsp)}</td>
                  <td className="py-2 px-5 text-right text-xs text-muted-foreground">
                    {totalReceitas > 0 ? `${((recOfertasEsp / totalReceitas) * 100).toFixed(1)}%` : "0%"}
                  </td>
                </tr>
              )}
              {recItems.map((item) => (
                <tr key={item.cat} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-5 pl-8 text-foreground font-medium">• {item.cat}</td>
                  <td className="py-2 px-5 text-right font-medium">{brl(item.valor)}</td>
                  <td className="py-2 px-5 text-right text-xs text-muted-foreground">
                    {totalReceitas > 0 ? `${((item.valor / totalReceitas) * 100).toFixed(1)}%` : "0%"}
                  </td>
                </tr>
              ))}
              <tr className="border-b bg-muted/20 font-semibold text-xs">
                <td className="py-2 px-5 pl-8 uppercase">(=) Subtotal de Receitas Arrecadadas</td>
                <td className="py-2 px-5 text-right font-bold text-emerald-600 dark:text-emerald-400">{brl(totalReceitas)}</td>
                <td className="py-2 px-5 text-right font-bold">100.0%</td>
              </tr>

              {/* SEÇÃO 2: DESPESAS */}
              <tr className="bg-destructive/10 font-bold text-destructive border-b">
                <td className="py-2.5 px-5" colSpan={2}>2. DESPESAS OPERACIONAIS (GASTOS ITEM A ITEM)</td>
                <td className="py-2.5 px-5 text-right">{brl(totalDespesas)}</td>
              </tr>
              {despItems.map((item) => (
                <tr key={item.cat} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-5 pl-8 text-foreground font-medium">• {item.cat}</td>
                  <td className="py-2 px-5 text-right font-medium text-destructive">{brl(item.valor)}</td>
                  <td className="py-2 px-5 text-right text-xs text-muted-foreground">
                    {totalReceitas > 0 ? `${((item.valor / totalReceitas) * 100).toFixed(1)}% da receita` : "—"}
                  </td>
                </tr>
              ))}
              {despItems.length === 0 && (
                <tr className="border-b">
                  <td className="py-3 px-5 pl-8 text-muted-foreground italic" colSpan={3}>
                    Nenhuma despesa lançada neste mês.
                  </td>
                </tr>
              )}
              <tr className="border-b bg-muted/20 font-semibold text-xs">
                <td className="py-2 px-5 pl-8 uppercase">(=) Subtotal de Despesas Realizadas</td>
                <td className="py-2 px-5 text-right font-bold text-destructive">{brl(totalDespesas)}</td>
                <td className="py-2 px-5 text-right font-bold text-muted-foreground">
                  {totalReceitas > 0 ? `${((totalDespesas / totalReceitas) * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>

              {/* SEÇÃO 3: RESULTADO LÍQUIDO */}
              <tr className={`border-t-2 text-base font-bold ${isSuperavit ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                <td className="py-3.5 px-5 uppercase">
                  (=) {isSuperavit ? "SUPERÁVIT DO MÊS" : "DÉFICIT DO MÊS"}
                </td>
                <td className="py-3.5 px-5 text-right text-lg">{brl(resultadoLiquido)}</td>
                <td className="py-3.5 px-5 text-right text-xs font-semibold">
                  {totalReceitas > 0 ? `${((resultadoLiquido / totalReceitas) * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENTE: TELA DEDICADA DE BALANCETE (CONTAS BANCÁRIAS & CAIXA)
// -------------------------------------------------------------
function BalanceteView({
  onBack,
  onSwitchToDre,
  db,
}: {
  onBack: () => void;
  onSwitchToDre: () => void;
  db: ReturnType<typeof useStore>["db"];
}) {
  const accounts = ["Banco do Brasil", "Caixa Geral / Espécie"];

  const accountBalances = useMemo(() => {
    return accounts.map((acc) => {
      const txReceitas = db.transactions
        .filter((t) => t.tipo === "Receita" && String(t.conta || "").trim().toLowerCase() === acc.toLowerCase())
        .reduce((a, t) => a + Number(t.valor || 0), 0);

      const txDespesas = db.transactions
        .filter((t) => t.tipo === "Despesa" && String(t.conta || "").trim().toLowerCase() === acc.toLowerCase())
        .reduce((a, t) => a + Number(t.valor || 0), 0);

      // Dízimos sem conta específica vão proporcionalmente para conta principal ou são listados
      return {
        conta: acc,
        receitas: txReceitas,
        despesas: txDespesas,
        saldo: txReceitas - txDespesas,
      };
    });
  }, [db.transactions]);

  const paymentMethods = useMemo(() => {
    const methods = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"];
    return methods.map((m) => {
      const ctVal = db.contributions.filter((c) => String(c.pagamento).toLowerCase() === m.toLowerCase()).reduce((a, c) => a + Number(c.valor || 0), 0);
      const txVal = db.transactions.filter((t) => String(t.pagamento).toLowerCase() === m.toLowerCase()).reduce((a, t) => a + Number(t.valor || 0), 0);
      return {
        metodo: m,
        contribuicoes: ctVal,
        movimentacoes: txVal,
        total: ctVal + txVal,
      };
    });
  }, [db.contributions, db.transactions]);

  const congregationsData = useMemo(() => {
    const list = db.congregations.map((c) => String(c.nome));
    const all = list.length > 0 ? list : ["Sede Central", "Congregação Betel", "Congregação Esperança"];
    return all.map((cong) => {
      const ctVal = db.contributions.filter((c) => String(c.congregacao).toLowerCase() === cong.toLowerCase()).reduce((a, c) => a + Number(c.valor || 0), 0);
      const txVal = db.transactions.filter((t) => String(t.congregacao).toLowerCase() === cong.toLowerCase()).reduce((a, t) => a + Number(t.valor || 0), 0);
      return {
        congregacao: cong,
        dizimosOfertas: ctVal,
        movimentacoes: txVal,
        total: ctVal + txVal,
      };
    });
  }, [db.congregations, db.contributions, db.transactions]);

  return (
    <div className="space-y-6 animate-rise">
      {/* Barra de Ações Superior */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2 text-xs">
            <ArrowLeft className="size-4" /> Voltar à Análise Geral
          </Button>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="size-6 text-chart-2" />
              Balancete de Contas e Posição Patrimonial
            </h1>
            <p className="text-xs text-muted-foreground">Posição dos saldos bancários, disponibilidades e movimentações por canal.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs rounded-xl">
            <Printer className="size-3.5" /> Imprimir Balancete
          </Button>
          <Button variant="secondary" size="sm" onClick={onSwitchToDre} className="gap-1.5 text-xs rounded-xl">
            <FileText className="size-3.5 text-primary" /> Ver DRE
          </Button>
        </div>
      </div>

      {/* Caixa de Regra de Negócio & Explicação */}
      <div className="rounded-2xl border border-chart-2/20 bg-chart-2/5 p-4 md:p-5 text-sm space-y-2">
        <div className="flex items-center gap-2 font-semibold text-chart-2">
          <Info className="size-4" />
          Regra de Negócio do Balancete
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          O <strong>Balancete de Verificação</strong> é a fotografia da posição patrimonial da igreja. Enquanto a DRE analisa o resultado
          do período (se sobrou ou faltou recurso), o Balancete demonstra <strong>onde o dinheiro está depositado</strong> (discriminando
          os saldos na conta bancária do Banco do Brasil e Caixa em Espécie) e detalha a origem das entradas
          por forma de pagamento e por congregação. É o relatório oficial para auditoria do <strong>Conselho Fiscal</strong>.
        </p>
      </div>

      {/* Tabela 1: Saldos por Conta Bancária & Caixa */}
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="border-b px-5 py-4 bg-muted/20">
          <h3 className="font-bold text-foreground">1. Disponibilidades por Conta Bancária e Caixa</h3>
          <p className="text-xs text-muted-foreground">Saldos acumulados e fluxo apurado por instituição financeira</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground tracking-wider">
                <th className="py-3 px-5">Conta / Instituição</th>
                <th className="py-3 px-5 text-right">Receitas Registradas</th>
                <th className="py-3 px-5 text-right">Despesas Registradas</th>
                <th className="py-3 px-5 text-right">Saldo na Conta</th>
              </tr>
            </thead>
            <tbody>
              {accountBalances.map((acc) => (
                <tr key={acc.conta} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-5 font-semibold text-foreground flex items-center gap-2">
                    <Wallet className="size-4 text-muted-foreground" />
                    {acc.conta}
                  </td>
                  <td className="py-3 px-5 text-right text-emerald-600 dark:text-emerald-400 font-medium">{brl(acc.receitas)}</td>
                  <td className="py-3 px-5 text-right text-destructive font-medium">{brl(acc.despesas)}</td>
                  <td className={`py-3 px-5 text-right font-bold ${acc.saldo >= 0 ? "text-foreground" : "text-destructive"}`}>
                    {brl(acc.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Formas de Pagamento e Congregações */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tabela 2: Formas de Pagamento */}
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="border-b px-5 py-4 bg-muted/20">
            <h3 className="font-bold text-foreground">2. Movimentação por Forma de Pagamento</h3>
            <p className="text-xs text-muted-foreground">Origem das entradas e pagamentos realizados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2.5 px-4">Método</th>
                  <th className="py-2.5 px-4 text-right">Dízimos/Ofertas</th>
                  <th className="py-2.5 px-4 text-right">Movimentações</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map((pm) => (
                  <tr key={pm.metodo} className="border-b hover:bg-muted/30">
                    <td className="py-2.5 px-4 font-medium">{pm.metodo}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{brl(pm.contribuicoes)}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{brl(pm.movimentacoes)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold">{brl(pm.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela 3: Por Congregação */}
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="border-b px-5 py-4 bg-muted/20">
            <h3 className="font-bold text-foreground">3. Movimentação por Congregação</h3>
            <p className="text-xs text-muted-foreground">Arrecadação e custeio por filial da igreja</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2.5 px-4">Congregação</th>
                  <th className="py-2.5 px-4 text-right">Dízimos/Ofertas</th>
                  <th className="py-2.5 px-4 text-right">Movimentações</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {congregationsData.map((c) => (
                  <tr key={c.congregacao} className="border-b hover:bg-muted/30">
                    <td className="py-2.5 px-4 font-medium">{c.congregacao}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{brl(c.dizimosOfertas)}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{brl(c.movimentacoes)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold">{brl(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL: ANÁLISE FINANCEIRA GERAL
// -------------------------------------------------------------
function Analise() {
  const { db } = useStore();
  const [activeView, setActiveView] = useState<"geral" | "dre" | "balancete">("geral");
  const [n, setN] = useState(6);
  const now = new Date();

  const rows = Array.from({ length: n }, (_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (n - 1) + i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const tx = db.transactions.filter((t) => String(t.data).startsWith(key));
    const ct = db.contributions.filter((c) => String(c.data).startsWith(key));
    const receitas =
      tx.filter((t) => t.tipo === "Receita").reduce((a, t) => a + Number(t.valor || 0), 0) +
      ct.reduce((a, c) => a + Number(c.valor || 0), 0);
    const despesas = tx.filter((t) => t.tipo === "Despesa").reduce((a, t) => a + Number(t.valor || 0), 0);
    return {
      mes: `${MONTHS[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`,
      Receitas: receitas,
      Despesas: despesas,
      Saldo: receitas - despesas,
    };
  });

  const tot = rows.reduce((a, r) => ({ r: a.r + r.Receitas, d: a.d + r.Despesas }), { r: 0, d: 0 });
  const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 };

  // Se o usuário selecionou uma tela específica, renderiza a tela dedicada
  if (activeView === "dre") {
    return <DreView onBack={() => setActiveView("geral")} onSwitchToBalancete={() => setActiveView("balancete")} db={db} />;
  }

  if (activeView === "balancete") {
    return <BalanceteView onBack={() => setActiveView("geral")} onSwitchToDre={() => setActiveView("dre")} db={db} />;
  }

  return (
    <div className="space-y-8 animate-rise">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <LineChart className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Análise Financeira</h1>
            <p className="text-sm text-muted-foreground">Compare receitas, despesas e saldo mês a mês.</p>
          </div>
        </div>
        <div className="w-48 no-print">
          <label className="mb-1 block text-xs text-muted-foreground">Meses para comparar</label>
          <Select value={String(n)} onValueChange={(v) => setN(Number(v))}>
            <SelectTrigger aria-label="Meses para comparar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS.map((o) => (
                <SelectItem key={o} value={String(o)}>
                  Últimos {o} meses
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Receitas no período" value={brl(tot.r)} icon={ArrowDownLeft} tone="green" />
        <MetricCard label="Despesas no período" value={brl(tot.d)} icon={ArrowUpRight} tone="orange" />
        <MetricCard label="Saldo no período" value={brl(tot.r - tot.d)} icon={Landmark} tone="blue" />
        <MetricCard label="Média mensal de saldo" value={brl((tot.r - tot.d) / n)} icon={ChartNoAxesCombined} tone="violet" />
      </div>

      {/* Gráfico Comparativo Mensal */}
      <div className="min-w-0 border-t pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Comparativo mensal</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChartAsPng("chart-comparativo-mensal", "comparativo-mensal-financeiro")}
            className="gap-2 text-xs no-print"
          >
            <Download className="size-3.5" /> Baixar Gráfico (PNG)
          </Button>
        </div>
        <div id="chart-comparativo-mensal" className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => brl(v)} contentStyle={tip} />
              <Legend />
              <Bar dataKey="Receitas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Saldo" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela do Comparativo Mensal */}
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
        <table className="w-full min-w-96 text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground bg-muted/20">
              <th className="p-3">Mês</th>
              <th className="p-3 text-right">Receitas</th>
              <th className="p-3 text-right">Despesas</th>
              <th className="p-3 text-right">Saldo</th>
              <th className="p-3 text-right">Variação do saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const prev = rows[i - 1]?.Saldo;
              const varr =
                prev === undefined
                  ? "—"
                  : prev === 0
                  ? "—"
                  : `${(((r.Saldo - prev) / Math.abs(prev)) * 100).toFixed(1)}%`;
              return (
                <tr key={r.mes} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{r.mes}</td>
                  <td className="p-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{brl(r.Receitas)}</td>
                  <td className="p-3 text-right font-medium text-destructive">{brl(r.Despesas)}</td>
                  <td className={`p-3 text-right font-bold ${r.Saldo < 0 ? "text-destructive" : "text-foreground"}`}>
                    {brl(r.Saldo)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">{varr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SEÇÃO NO FINAL DA TELA: BOTÕES DRE E BALANCETE COM EXPLICAÇÕES E REGRAS DE NEGÓCIO */}
      <div className="border-t pt-8 space-y-4 no-print">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Relatórios Oficiais Contábeis</h2>
          <p className="text-xs text-muted-foreground">
            Acesse as telas dedicadas com as regras de negócio, explicações resumidas e detalhamento completo de cada relatório.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card / Botão DRE */}
          <div className="rounded-2xl border bg-card p-5 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-semibold text-primary">Demonstração de Resultado</Badge>
                <FileText className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">DRE — Mês a Mês</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Traz o período do mês com todas as informações de receitas, gastos e despesas discriminadas por cada item, apurando o Superávit ou Déficit operacional.
              </p>
            </div>
            <Button onClick={() => setActiveView("dre")} className="w-full gap-2 rounded-xl">
              Acessar DRE Completa <ArrowRight className="size-4" />
            </Button>
          </div>

          {/* Card / Botão Balancete */}
          <div className="rounded-2xl border bg-card p-5 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-semibold text-chart-2">Contas & Patrimônio</Badge>
                <Building2 className="size-5 text-chart-2" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Balancete de Contas</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Demonstra a posição patrimonial, saldos na conta bancária (Banco do Brasil), caixa físico e movimentações por canal.
              </p>
            </div>
            <Button variant="outline" onClick={() => setActiveView("balancete")} className="w-full gap-2 rounded-xl">
              Acessar Balancete de Contas <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
