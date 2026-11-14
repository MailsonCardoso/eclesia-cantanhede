import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Church,
  Wallet,
  HandCoins,
  Network,
  Moon,
  Sun,
  CalendarClock,
  CalendarDays,
  Boxes,
  BarChart3,
  Bell,
  LineChart,
  Home,
  BookOpen,
  Layers,
  Sparkles,
  Trash2,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const groups = [
  {
    label: "Principal",
    items: [{ title: "Painel", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Gabinete Pastoral",
    items: [
      { title: "Altar & Sermões", url: "/pastor", icon: BookOpen },
      { title: "Séries de Mensagens", url: "/pastor/series", icon: Layers },
      { title: "Banco de Insights", url: "/pastor/insights", icon: Sparkles },
      { title: "Agenda Pastoral", url: "/agenda-pastoral", icon: CalendarClock },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Membros", url: "/membros", icon: Users },
      { title: "Congregações", url: "/congregacoes", icon: Church },
      { title: "Departamentos", url: "/departamentos", icon: Network },
      { title: "Células", url: "/celulas", icon: Home },
      { title: "Inventário", url: "/inventario", icon: Boxes },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
      { title: "Dízimos e Ofertas", url: "/contribuicoes", icon: HandCoins },
      { title: "Análise Financeira", url: "/analise-financeira", icon: LineChart },
    ],
  },
  {
    label: "Relatórios & Agenda",
    items: [
      { title: "Relatórios de Membros", url: "/relatorio-membros", icon: BarChart3 },
      { title: "Agenda de Eventos", url: "/agenda-eventos", icon: CalendarDays },
    ],
  },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Dark mode premium é o padrão; o modo claro fica disponível no botão do cabeçalho.
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(localStorage.getItem("theme") !== "light");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Redireciona para /login quando não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated && path !== "/login") {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, path, navigate]);

  // Se estiver na tela de login, renderiza em tela cheia sem sidebar nem header
  if (path === "/login") {
    return <div className="w-full min-h-screen bg-background text-foreground">{children}</div>;
  }

  // Se estiver carregando sessão inicial
  if (isLoading && !isAuthenticated) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Church className="size-6" />
          </div>
          <p className="text-xs text-muted-foreground">Carregando EclesiaPro...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, não renderiza as telas protegidas enquanto redireciona
  if (!isAuthenticated) {
    return null;
  }

  // Se estiver na tela imersiva do Púlpito, renderiza sem sidebar nem headers para tela limpa
  if (path.startsWith("/pastor/pulpito")) {
    return <div className="w-full min-h-screen bg-background text-foreground">{children}</div>;
  }

  const pageTitle =
    groups
      .flatMap((g) => g.items as readonly { title: string; url: string }[])
      .find((i) => i.url === path)?.title ?? "EclesiaPro";

  const { clearAll, loadDemoData } = useStore();

  const handleClearAll = () => {
    if (window.confirm("Atenção: deseja limpar todos os dados mockados de todas as telas para iniciar os testes com a base vazia?")) {
      clearAll();
      toast.success("Todos os dados mockados foram limpos! Agora você pode testar com dados reais.");
    }
  };

  const handleLoadDemo = () => {
    if (window.confirm("Deseja restaurar os dados de demonstração/exemplo para testes?")) {
      loadDemoData();
      toast.success("Dados de demonstração carregados com sucesso!");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="no-print">
          <SidebarHeader className="px-3 py-5">
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-lg">
                <Church className="size-5" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="font-display text-lg font-semibold text-sidebar-accent-foreground leading-none">
                  EclesiaPro
                </div>
                <div className="text-xs text-sidebar-foreground/70 mt-1">Gestão eclesiástica</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {groups.map((g) => (
              <SidebarGroup key={g.label}>
                <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((it) => {
                      const active = path === it.url;
                      return (
                        <SidebarMenuItem key={it.url}>
                          <SidebarMenuButton asChild isActive={active} tooltip={it.title}>
                            <Link to={it.url}>
                              <it.icon className="size-4" />
                              <span>{it.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter className="border-t p-3">
            <div className="flex items-center justify-between gap-2 rounded-2xl border bg-muted/40 p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                  {user?.avatar || "AD"}
                </div>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <div className="font-semibold text-xs text-foreground truncate">
                    {user?.name || "Administrador"}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {user?.email || "admin@eclesiapro.com"}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:hidden shrink-0"
                title="Sair da conta"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 md:px-8 backdrop-blur no-print">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
              <div className="font-display text-lg font-semibold truncate text-foreground">{pageTitle}</div>
            </div>
            <div className="flex items-center gap-2">
              {/* Perfil do Administrador Logado */}
              <div className="hidden sm:flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl border bg-card/60 shadow-sm">
                <div className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-[10.5px]">
                  {user?.avatar || "AD"}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-foreground leading-none">
                    {user?.name || "Administrador"}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight pt-0.5">
                    {user?.role || "Admin"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 rounded-lg ml-1"
                  title="Sair da conta"
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden xl:inline">Sair</span>
                </Button>
              </div>

              <div className="h-4 w-px bg-border hidden sm:block" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40"
                title="Limpar todos os dados mockados para testar com base vazia"
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">Limpar Dados</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadDemo}
                className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
                title="Restaurar dados de demonstração/exemplo"
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span className="hidden md:inline">Restaurar Demo</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark((v) => !v)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Alternar tema"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <div className="relative">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Notificações">
                  <Bell className="size-4" />
                </Button>
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
