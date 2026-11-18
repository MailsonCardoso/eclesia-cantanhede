import { useState, useMemo, useEffect } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Cake,
  Calendar,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  BookMarked,
  Wallet,
  HandCoins,
  MessageSquare,
  ExternalLink,
  Check,
  CheckCheck,
  X,
  Sparkles,
  Home,
  HeartHandshake,
  Wrench,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore, brl, fmtDate } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: "contextual" | "global";
  priority: "celebration" | "high" | "medium" | "low";
  iconName: string;
  tag: string;
  route?: string;
  actionLabel?: string;
  externalLink?: string;
  onAction?: () => void;
}

function getScreenInfo(pathname: string) {
  if (pathname === "/") return { label: "Painel Principal" };
  if (pathname.startsWith("/membros")) return { label: "Membros" };
  if (pathname.startsWith("/relatorio-membros")) return { label: "Relatório de Membros" };
  if (pathname.startsWith("/celulas")) return { label: "Células" };
  if (pathname.startsWith("/area-estudos")) return { label: "Área de Estudos" };
  if (pathname.startsWith("/pastor/series")) return { label: "Séries de Mensagens" };
  if (pathname.startsWith("/pastor/insights")) return { label: "Banco de Insights" };
  if (pathname.startsWith("/pastor")) return { label: "Gabinete Pastoral" };
  if (pathname.startsWith("/agenda-pastoral")) return { label: "Agenda Pastoral" };
  if (pathname.startsWith("/financeiro")) return { label: "Gestão Financeira" };
  if (pathname.startsWith("/analise-financeira")) return { label: "Análise Financeira" };
  if (pathname.startsWith("/contribuicoes")) return { label: "Dízimos e Ofertas" };
  if (pathname.startsWith("/departamentos")) return { label: "Departamentos" };
  if (pathname.startsWith("/congregacoes")) return { label: "Congregações" };
  if (pathname.startsWith("/agenda-eventos")) return { label: "Agenda de Eventos" };
  if (pathname.startsWith("/inventario")) return { label: "Inventário & Bens" };
  if (pathname.startsWith("/usuarios")) return { label: "Usuários & Acessos" };
  return { label: "Módulo Atual" };
}

function renderNotificationIcon(name: string, priority: NotificationItem["priority"]) {
  const iconProps = { className: "size-4 shrink-0" };
  switch (name) {
    case "Cake":
      return <Cake {...iconProps} className="size-4 shrink-0 text-pink-500" />;
    case "Calendar":
      return <Calendar {...iconProps} className="size-4 shrink-0 text-indigo-500" />;
    case "CalendarClock":
      return <CalendarClock {...iconProps} className="size-4 shrink-0 text-amber-500" />;
    case "AlertTriangle":
      return <AlertTriangle {...iconProps} className="size-4 shrink-0 text-rose-500" />;
    case "Users":
      return <Users {...iconProps} className="size-4 shrink-0 text-blue-500" />;
    case "Home":
      return <Home {...iconProps} className="size-4 shrink-0 text-emerald-500" />;
    case "BookMarked":
      return <BookMarked {...iconProps} className="size-4 shrink-0 text-violet-500" />;
    case "Wallet":
      return <Wallet {...iconProps} className="size-4 shrink-0 text-amber-500" />;
    case "HandCoins":
      return <HandCoins {...iconProps} className="size-4 shrink-0 text-emerald-500" />;
    case "Wrench":
      return <Wrench {...iconProps} className="size-4 shrink-0 text-orange-500" />;
    case "ShieldAlert":
      return <ShieldAlert {...iconProps} className="size-4 shrink-0 text-rose-500" />;
    case "Sparkles":
      return <Sparkles {...iconProps} className="size-4 shrink-0 text-purple-500" />;
    case "TrendingDown":
      return <TrendingDown {...iconProps} className="size-4 shrink-0 text-rose-500" />;
    case "TrendingUp":
      return <TrendingUp {...iconProps} className="size-4 shrink-0 text-emerald-500" />;
    default:
      return <Info {...iconProps} className="size-4 shrink-0 text-primary" />;
  }
}

export function NotificationCenter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { db } = useStore();
  const { user, users } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"screen" | "global" | "all">("screen");

  // Alertas dispensados pelo usuário armazenados localmente
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("eclesia_dismissed_notifications") || "[]");
    } catch {
      return [];
    }
  });

  const dismissNotification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissedIds((prev) => {
      const next = [...new Set([...prev, id])];
      try {
        localStorage.setItem("eclesia_dismissed_notifications", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const restoreDismissed = () => {
    setDismissedIds([]);
    try {
      localStorage.removeItem("eclesia_dismissed_notifications");
    } catch {}
  };

  const dismissAll = () => {
    const allIds = allGeneratedNotifications.map((n) => n.id);
    setDismissedIds((prev) => {
      const next = [...new Set([...prev, ...allIds])];
      try {
        localStorage.setItem("eclesia_dismissed_notifications", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Motor de Inteligência de Alertas
  const allGeneratedNotifications = useMemo(() => {
    const list: NotificationItem[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentMonthStr = String(currentMonth).padStart(2, "0");
    const currentDayStr = String(currentDay).padStart(2, "0");
    const todayMMDD = `${currentMonthStr}-${currentDayStr}`;
    const todayYMD = `${currentYear}-${currentMonthStr}-${currentDayStr}`;
    const currentYearMonth = `${currentYear}-${currentMonthStr}`;

    const daysOfWeek = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const todayWeekDay = daysOfWeek[now.getDay()];

    // ==========================================
    // 1. ALERTAS GLOBAIS DA IGREJA
    // ==========================================

    // Aniversariantes de Hoje
    db.members.forEach((m) => {
      if (!m.nascimento) return;
      const s = String(m.nascimento);
      if (s.slice(5, 10) === todayMMDD) {
        const phoneDigits = String(m.telefone || "").replace(/\D/g, "");
        const cleanPhone = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;
        const hasPhone = phoneDigits.length >= 10;
        const msg = encodeURIComponent(
          `A paz do Senhor, ${m.nome}! Toda a família da Igreja deseja a você um dia muito abençoado e cheio da presença de Deus. Feliz Aniversário! 🎉🎂`
        );
        list.push({
          id: `bday_today_${m.id}`,
          category: "global",
          priority: "celebration",
          title: `Hoje é aniversário de ${m.nome}! 🎂`,
          description: `Membro ${m.congregacao ? `de ${m.congregacao}` : "da igreja"}. Que tal enviar uma mensagem especial?`,
          iconName: "Cake",
          tag: "Aniversário Hoje",
          externalLink: hasPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : undefined,
          route: hasPhone ? undefined : "/membros",
          actionLabel: hasPhone ? "Parabenizar no WhatsApp" : "Ver Cadastro",
        });
      }
    });

    // Aniversariantes da semana (próximos 7 dias)
    db.members.forEach((m) => {
      if (!m.nascimento) return;
      const s = String(m.nascimento);
      const mDay = s.slice(5, 10);
      if (mDay === todayMMDD) return;
      const bMonth = parseInt(s.slice(5, 7), 10);
      const bDate = parseInt(s.slice(8, 10), 10);
      const bdayDate = new Date(currentYear, bMonth - 1, bDate);
      const diffTime = bdayDate.getTime() - new Date(currentYear, currentMonth - 1, currentDay).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 7) {
        list.push({
          id: `bday_week_${m.id}`,
          category: "global",
          priority: "low",
          title: `Aniversário em ${diffDays} dia${diffDays === 1 ? "" : "s"}: ${m.nome}`,
          description: `Data: ${bDate.toString().padStart(2, "0")}/${bMonth.toString().padStart(2, "0")}. Lembre-se de parabenizar!`,
          iconName: "Cake",
          tag: "Em Breve",
          route: "/membros",
          actionLabel: "Ver Membro",
        });
      }
    });

    // Próximos Eventos / Cultos da Igreja
    db.events.forEach((e) => {
      if (!e.data) return;
      const evtDate = new Date(String(e.data) + "T00:00:00");
      const todayDate = new Date(currentYear, currentMonth - 1, currentDay);
      const diffDays = Math.ceil((evtDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        list.push({
          id: `event_today_${e.id}`,
          category: "global",
          priority: "high",
          title: `Evento Hoje: ${e.titulo || "Culto Programado"}`,
          description: `${e.local ? `Local: ${e.local}. ` : ""}${e.horario ? `Horário: ${e.horario}. ` : ""}Não esqueça de mobilizar os irmãos.`,
          iconName: "Calendar",
          tag: "Evento Hoje",
          route: "/agenda-eventos",
          actionLabel: "Ver Agenda",
        });
      } else if (diffDays > 0 && diffDays <= 3) {
        list.push({
          id: `event_soon_${e.id}`,
          category: "global",
          priority: "medium",
          title: `Em ${diffDays} dia${diffDays === 1 ? "" : "s"}: ${e.titulo}`,
          description: `Data: ${fmtDate(e.data)}${e.local ? ` · ${e.local}` : ""}.`,
          iconName: "Calendar",
          tag: "Agenda",
          route: "/agenda-eventos",
          actionLabel: "Ver Detalhes",
        });
      }
    });

    const isPastoralStaff = user?.role === "Pastor" || user?.role === "Administrador";
    const isFinancialStaff = user?.role === "Administrador" || user?.role === "Pastor" || user?.role === "Tesoureiro";
    const isAdmin = user?.role === "Administrador";

    // Pedidos Pastorais Pendentes (CONFIDENCIAL: Apenas Pastor e Administrador)
    if (isPastoralStaff) {
      const pendingRequests = db.pastoral_requests?.filter((p) => p.status === "Pendente" || !p.status) || [];
      if (pendingRequests.length > 0) {
        list.push({
          id: "pastoral_requests_pending",
          category: "global",
          priority: "medium",
          title: `${pendingRequests.length} Pedido(s) Pastoral(is) Pendente(s)`,
          description: `Há membros aguardando atendimento pastoral, visitação ou oração reservada.`,
          iconName: "Sparkles",
          tag: "Gabinete Pastoral",
          route: "/pastor",
          actionLabel: "Atender Pedidos",
        });
      }
    }

    // ==========================================
    // 2. ALERTAS CONTEXTUAIS DA TELA ATUAL
    // ==========================================

    // Tela: /membros ou /relatorio-membros
    if (pathname.startsWith("/membros") || pathname.startsWith("/relatorio-membros")) {
      const incomplete = db.members.filter((m) => !m.cpf || !m.telefone || !m.nascimento);
      if (incomplete.length > 0) {
        list.push({
          id: "members_incomplete_profiles",
          category: "contextual",
          priority: "medium",
          title: `${incomplete.length} membro(s) com cadastro incompleto`,
          description: `Existem fichas sem CPF, telefone ou data de nascimento informados.`,
          iconName: "AlertTriangle",
          tag: "Cadastros",
          route: "/relatorio-membros",
          actionLabel: "Ver Relatório",
        });
      }

      const inactives = db.members.filter((m) => m.situacao === "Inativo" || m.status === "Inativo");
      if (inactives.length > 0) {
        list.push({
          id: "members_inactives_alert",
          category: "contextual",
          priority: "low",
          title: `${inactives.length} membro(s) com status Inativo`,
          description: `Considere planejar visitas de reconciliação e acolhimento pastoral.`,
          iconName: "Users",
          tag: "Acolhimento",
          route: "/membros",
          actionLabel: "Filtrar Membros",
        });
      }
    }

    // Tela: /celulas
    if (pathname.startsWith("/celulas")) {
      const cellsToday = db.cells.filter((c) => {
        const dia = String(c.dia || "").toLowerCase();
        return dia.includes(todayWeekDay.toLowerCase()) || dia.includes(todayWeekDay.toLowerCase().split("-")[0]);
      });
      if (cellsToday.length > 0) {
        list.push({
          id: "cells_meeting_today",
          category: "contextual",
          priority: "high",
          title: `${cellsToday.length} Célula(s) reúnem-se hoje (${todayWeekDay})!`,
          description: `Encontros programados: ${cellsToday.map((c) => c.nome).slice(0, 3).join(", ")}.`,
          iconName: "Home",
          tag: "Encontro Hoje",
          route: "/celulas",
          actionLabel: "Ver Células",
        });
      }

      // Alerta administrativo para atribuir liderança (Pastor e Admin)
      if (isPastoralStaff) {
        const noLeader = db.cells.filter((c) => !c.lider || c.lider === "__none" || c.lider === "Nenhum");
        if (noLeader.length > 0) {
          list.push({
            id: "cells_no_leader",
            category: "contextual",
            priority: "high",
            title: `${noLeader.length} célula(s) sem líder responsável`,
            description: `Atribua um líder em Células para manter o discipulado ativo.`,
            iconName: "AlertTriangle",
            tag: "Liderança",
            route: "/celulas",
            actionLabel: "Atribuir Líder",
          });
        }
      }

      // Estudo agendado para o líder da célula
      if (user?.role === "Líder" && user.cellId) {
        const scheduledStudy = db.studies.find(
          (s) => s.cellId === user.cellId && s.status === "Agendado"
        );
        if (scheduledStudy) {
          list.push({
            id: `cell_scheduled_study_${scheduledStudy.id}`,
            category: "contextual",
            priority: "medium",
            title: `Estudo da sua célula: ${scheduledStudy.titulo}`,
            description: `Tema: "${scheduledStudy.tema || scheduledStudy.versiculo || "Palavra edificante"}". Pronto para o encontro.`,
            iconName: "BookMarked",
            tag: "Palavra da Semana",
            route: "/area-estudos",
            actionLabel: "Abrir Estudo",
          });
        }
      }
    }

    // Tela: /area-estudos
    if (pathname.startsWith("/area-estudos")) {
      const drafts = db.studies.filter((s) => s.status === "Rascunho");
      if (drafts.length > 0) {
        list.push({
          id: "studies_drafts_review",
          category: "contextual",
          priority: "medium",
          title: `${drafts.length} estudo(s) em Rascunho`,
          description: `Estudos prontos para revisão e publicação aos líderes de célula.`,
          iconName: "BookMarked",
          tag: "Revisão",
          route: "/area-estudos",
          actionLabel: "Revisar Estudos",
        });
      }

      if (user?.role === "Líder" && user.cellId) {
        const hasScheduled = db.studies.some(
          (s) => s.cellId === user.cellId && s.status === "Agendado"
        );
        if (!hasScheduled) {
          list.push({
            id: "studies_no_scheduled_leader",
            category: "contextual",
            priority: "medium",
            title: `Sem estudo agendado para sua célula`,
            description: `Selecione um dos estudos do acervo para ministrar no seu próximo encontro.`,
            iconName: "BookMarked",
            tag: "Célula",
            route: "/area-estudos",
            actionLabel: "Escolher Estudo",
          });
        }
      }
    }

    // Tela: /financeiro ou /analise-financeira (Apenas Tesoureiro, Pastor e Admin)
    if (isFinancialStaff && (pathname.startsWith("/financeiro") || pathname.startsWith("/analise-financeira"))) {
      const monthTxs = db.transactions.filter((t) => String(t.data).startsWith(currentYearMonth));
      const income = monthTxs.filter((t) => t.tipo === "Receita").reduce((a, t) => a + Number(t.valor || 0), 0);
      const expenses = monthTxs.filter((t) => t.tipo === "Despesa").reduce((a, t) => a + Number(t.valor || 0), 0);
      const balance = income - expenses;

      if (expenses > income && income > 0) {
        list.push({
          id: "finance_deficit_alert",
          category: "contextual",
          priority: "high",
          title: `Atenção: Despesas superam receitas no mês`,
          description: `Total de saídas: ${brl(expenses)} vs Entradas: ${brl(income)}. Saldo do mês: ${brl(balance)}.`,
          iconName: "TrendingDown",
          tag: "Alerta Financeiro",
          route: "/analise-financeira",
          actionLabel: "Ver Gráficos",
        });
      } else {
        list.push({
          id: "finance_month_health",
          category: "contextual",
          priority: "low",
          title: `Fluxo de Caixa do Mês em dia`,
          description: `Saldo líquido do mês atual: ${brl(balance)} (${monthTxs.length} lançamentos).`,
          iconName: "TrendingUp",
          tag: "Balanço",
          route: "/financeiro",
          actionLabel: "Ver Lançamentos",
        });
      }
    }

    // Tela: /contribuicoes (Apenas Tesoureiro, Pastor e Admin)
    if (isFinancialStaff && pathname.startsWith("/contribuicoes")) {
      const monthCt = db.contributions.filter((c) => String(c.data).startsWith(currentYearMonth));
      const totalCt = monthCt.reduce((a, c) => a + Number(c.valor || 0), 0);
      list.push({
        id: "contrib_summary_month",
        category: "contextual",
        priority: "medium",
        title: `Dízimos e Ofertas do Mês: ${brl(totalCt)}`,
        description: `Foram registradas ${monthCt.length} contribuição(ões) no período atual.`,
        iconName: "HandCoins",
        tag: "Tesouraria",
        route: "/contribuicoes",
        actionLabel: "Novo Recibo",
      });
    }

    // Tela: /departamentos
    if (pathname.startsWith("/departamentos")) {
      const noLeaderDeps = db.departments.filter((d) => !d.lider || d.lider === "__none" || d.lider === "Nenhum");
      if (noLeaderDeps.length > 0) {
        list.push({
          id: "deps_no_leader",
          category: "contextual",
          priority: "medium",
          title: `${noLeaderDeps.length} departamento(s) sem liderança definida`,
          description: `Ministérios ativos sem um líder responsável associado.`,
          iconName: "AlertTriangle",
          tag: "Ministérios",
          route: "/departamentos",
          actionLabel: "Definir Líder",
        });
      }
    }

    // Tela: /inventario
    if (pathname.startsWith("/inventario")) {
      const avariados = db.inventory.filter((i) => {
        const s = String(i.situacao || "").toLowerCase();
        return s.includes("manuten") || s.includes("danific") || s.includes("avaria");
      });
      if (avariados.length > 0) {
        list.push({
          id: "inventory_damaged_items",
          category: "contextual",
          priority: "medium",
          title: `${avariados.length} bem(ns) em manutenção ou com avaria`,
          description: `Equipamentos que requerem reparo ou conferência patrimonial.`,
          iconName: "Wrench",
          tag: "Patrimônio",
          route: "/inventario",
          actionLabel: "Ver Itens",
        });
      }
    }

    // Tela: /pastor ou /agenda-pastoral (CONFIDENCIAL: Apenas Pastor e Administrador)
    if (isPastoralStaff && (pathname.startsWith("/pastor") || pathname.startsWith("/agenda-pastoral"))) {
      const todayAppts = db.appointments.filter((a) => String(a.data).startsWith(todayYMD));
      if (todayAppts.length > 0) {
        list.push({
          id: "pastoral_appts_today",
          category: "contextual",
          priority: "high",
          title: `${todayAppts.length} atendimento(s) pastoral(is) hoje`,
          description: `${todayAppts.map((a) => a.titulo || a.membro).join(", ")}.`,
          iconName: "CalendarClock",
          tag: "Agenda Hoje",
          route: "/agenda-pastoral",
          actionLabel: "Ver Agenda",
        });
      }

      list.push({
        id: "pastoral_sermon_prep",
        category: "contextual",
        priority: "low",
        title: "Altar & Planejamento de Sermões",
        description: "Mantenha as séries de mensagens bíblicas e notas de pregação atualizadas.",
        iconName: "Sparkles",
        tag: "Ministério",
        route: "/pastor/series",
        actionLabel: "Ver Séries",
      });
    }

    // Tela: /usuarios (Apenas Administrador)
    if (isAdmin && pathname.startsWith("/usuarios")) {
      const leadersWithoutCell = users.filter((u) => u.role === "Líder" && !u.cellId);
      if (leadersWithoutCell.length > 0) {
        list.push({
          id: "users_leaders_no_cell",
          category: "contextual",
          priority: "high",
          title: `${leadersWithoutCell.length} líder(es) de célula sem vínculo`,
          description: `Operadores com perfil Líder que ainda não foram vinculados à sua respectiva célula.`,
          iconName: "ShieldAlert",
          tag: "Acessos",
          route: "/usuarios",
          actionLabel: "Vincular Líder",
        });
      }
    }

    return list;
  }, [db, pathname, user, users]);

  // Filtra itens já dispensados
  const activeNotifications = useMemo(() => {
    return allGeneratedNotifications.filter((n) => !dismissedIds.includes(n.id));
  }, [allGeneratedNotifications, dismissedIds]);

  const contextualItems = useMemo(() => {
    return activeNotifications.filter((n) => n.category === "contextual");
  }, [activeNotifications]);

  const globalItems = useMemo(() => {
    return activeNotifications.filter((n) => n.category === "global");
  }, [activeNotifications]);

  const unreadCount = activeNotifications.length;
  const screenInfo = getScreenInfo(pathname);

  const displayedItems =
    activeTab === "screen"
      ? contextualItems
      : activeTab === "global"
      ? globalItems
      : activeNotifications;

  const handleAction = (item: NotificationItem) => {
    if (item.externalLink) {
      window.open(item.externalLink, "_blank", "noopener,noreferrer");
    } else if (item.route) {
      navigate({ to: item.route as any });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-9 rounded-xl relative transition-all"
            aria-label="Central de Notificações"
            title={
              unreadCount > 0
                ? `${unreadCount} alerta(s) na Central de Notificações`
                : "Central de Notificações — Tudo em dia"
            }
          >
            <Bell className={`size-4 transition-transform ${unreadCount > 0 ? "text-primary" : ""}`} />
          </Button>

          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-background animate-in zoom-in-75 select-none pointer-events-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[390px] sm:w-[440px] max-w-[95vw] p-0 rounded-2xl border shadow-2xl bg-card text-card-foreground overflow-hidden z-50"
      >
        {/* Cabeçalho do Popover */}
        <div className="p-4 border-b bg-muted/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <Bell className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Central de Alertas</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold bg-primary/10 text-primary border-primary/20">
                    {unreadCount} ativo{unreadCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Alertas inteligentes e ações rápidas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissAll}
                className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                title="Limpar todos os alertas da visualização"
              >
                <CheckCheck className="size-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Abas de Navegação */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="px-3 pt-2.5 bg-muted/20 border-b">
            <TabsList className="w-full grid grid-cols-3 h-8 p-0.5 rounded-xl bg-muted/60">
              <TabsTrigger value="screen" className="text-xs rounded-lg py-1 gap-1.5 data-[state=active]:font-semibold">
                <span>Nesta Tela</span>
                {contextualItems.length > 0 && (
                  <span className="grid place-items-center size-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                    {contextualItems.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="global" className="text-xs rounded-lg py-1 gap-1.5 data-[state=active]:font-semibold">
                <span>Gerais</span>
                {globalItems.length > 0 && (
                  <span className="grid place-items-center size-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                    {globalItems.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs rounded-lg py-1 gap-1.5 data-[state=active]:font-semibold">
                <span>Todas</span>
                {activeNotifications.length > 0 && (
                  <span className="grid place-items-center size-4 rounded-full bg-muted-foreground/20 text-foreground text-[10px] font-bold">
                    {activeNotifications.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Lista de Notificações */}
          <ScrollArea className="max-h-[380px] p-3 space-y-2.5">
            {displayedItems.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center space-y-2">
                <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="font-semibold text-xs text-foreground">Tudo em dia!</div>
                <p className="text-[11px] text-muted-foreground max-w-[240px]">
                  {activeTab === "screen"
                    ? `Nenhuma pendência ou alerta pendente para a tela de ${screenInfo.label}.`
                    : "Nenhum alerta ativo nesta seção no momento."}
                </p>
                {dismissedIds.length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={restoreDismissed}
                    className="text-[11px] gap-1 text-primary h-auto p-0 mt-2"
                  >
                    <RotateCcw className="size-3" />
                    Restaurar alertas dispensados ({dismissedIds.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedItems.map((item) => {
                  const isCelebration = item.priority === "celebration";
                  const isHigh = item.priority === "high";

                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-xl border p-3 transition-all hover:shadow-xs flex flex-col gap-1.5 ${
                        isCelebration
                          ? "border-pink-500/30 bg-pink-50/50 dark:bg-pink-950/20"
                          : isHigh
                          ? "border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20"
                          : "border-border bg-card/60 hover:bg-accent/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="mt-0.5">
                            {renderNotificationIcon(item.iconName, item.priority)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-foreground leading-snug">
                                {item.title}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1.5 font-medium shrink-0 bg-background/80"
                              >
                                {item.tag}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Botão de Dispensar Item */}
                        <button
                          type="button"
                          onClick={(e) => dismissNotification(item.id, e)}
                          className="text-muted-foreground/60 hover:text-foreground hover:bg-muted p-1 rounded-md transition-colors shrink-0"
                          title="Dispensar alerta"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>

                      {/* Botão de Ação Rápida */}
                      {(item.route || item.externalLink) && (
                        <div className="flex items-center justify-end pt-1">
                          <Button
                            size="sm"
                            variant={isCelebration ? "default" : "outline"}
                            onClick={() => handleAction(item)}
                            className={`h-7 px-2.5 text-[11px] font-medium rounded-lg gap-1.5 transition-all ${
                              isCelebration
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                : ""
                            }`}
                          >
                            {isCelebration ? (
                              <MessageSquare className="size-3" />
                            ) : item.externalLink ? (
                              <ExternalLink className="size-3" />
                            ) : (
                              <ArrowRight className="size-3" />
                            )}
                            {item.actionLabel || "Acessar"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Tabs>

        {/* Rodapé Informativo */}
        <div className="px-4 py-2.5 border-t bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1 truncate font-medium">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">Tela: {screenInfo.label}</span>
          </div>

          {dismissedIds.length > 0 && (
            <button
              type="button"
              onClick={restoreDismissed}
              className="text-[10px] text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
              title="Restaurar notificações dispensadas"
            >
              <RotateCcw className="size-2.5" />
              Restaurar ({dismissedIds.length})
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
