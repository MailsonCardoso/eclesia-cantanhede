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
  LogOut,
  Shield,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth, type UserRole } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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

function canAccessRoute(role: UserRole | undefined, url: string): boolean {
  if (!role || role === "Administrador") return true;

  if (url === "/") return true;

  switch (role) {
    case "Pastor":
      return (
        url.startsWith("/pastor") ||
        url === "/agenda-pastoral" ||
        url === "/membros" ||
        url === "/congregacoes" ||
        url === "/departamentos" ||
        url === "/celulas" ||
        url === "/contribuicoes" ||
        url === "/financeiro" ||
        url === "/relatorio-membros" ||
        url === "/agenda-eventos"
      );

    case "Secretaria":
      return (
        url === "/membros" ||
        url === "/congregacoes" ||
        url === "/departamentos" ||
        url === "/celulas" ||
        url === "/inventario" ||
        url === "/relatorio-membros" ||
        url === "/agenda-eventos"
      );

    case "Tesoureiro":
      return (
        url === "/financeiro" ||
        url === "/contribuicoes" ||
        url === "/analise-financeira" ||
        url === "/inventario" ||
        url === "/relatorio-membros"
      );

    case "Líder":
      return (
        url === "/celulas" ||
        url === "/membros" ||
        url === "/agenda-eventos"
      );

    default:
      return true;
  }
}

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
          <p className="text-xs text-muted-foreground">Iniciando EclesiaPro...</p>
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

  // Filtra os menus de acordo com as permissões do perfil autenticado
  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => canAccessRoute(user?.role, item.url)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="no-print border-r border-sidebar-border">
          {/* Topo do Sidebar com Logo e Perfil do Usuário Integrado */}
          <SidebarHeader className="p-3 space-y-3 border-b border-sidebar-border/60">
            {/* Logo do Sistema */}
            <div className="flex items-center gap-3 px-1 pt-1">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-md">
                <Church className="size-5" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden min-w-0">
                <div className="font-display text-base font-semibold text-sidebar-accent-foreground leading-tight truncate">
                  EclesiaPro
                </div>
                <div className="text-[11px] text-sidebar-foreground/70 leading-none truncate">
                  Gestão eclesiástica
                </div>
              </div>
            </div>

            {/* Perfil Oficial Integrado no Topo da Sidebar */}
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-sm ring-1 ring-primary/20"
                  title={user?.name}
                >
                  {user?.avatar || "US"}
                </div>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <div className="font-semibold text-xs text-sidebar-accent-foreground truncate leading-tight">
                    {user?.name || "Usuário"}
                  </div>
                  <div className="text-[10px] text-sidebar-foreground/75 truncate mt-0.5 font-medium">
                    {user?.cargo || user?.role || "Usuário"}
                  </div>
                </div>
              </div>
            </div>
          </SidebarHeader>

          {/* Menus de Navegação */}
          <SidebarContent>
            {visibleGroups.map((g) => (
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
        </Sidebar>

        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 md:px-8 backdrop-blur no-print">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
              <div className="font-display text-lg font-semibold truncate text-foreground">{pageTitle}</div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Badge indicando o papel ativo do usuário */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-muted/30 text-xs font-medium text-muted-foreground">
                <Shield className="size-3.5 text-primary" />
                <span>{user?.cargo || user?.role}</span>
              </div>

              {/* Central de Notificações (Sininho posicionado à frente) */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground size-9 rounded-xl"
                  aria-label="Notificações"
                  title="Notificações"
                >
                  <Bell className="size-4" />
                </Button>
                <span className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
              </div>

              {/* Botão de Alternar Modo Escuro / Claro */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark((v) => !v)}
                className="text-muted-foreground hover:text-foreground size-9 rounded-xl"
                aria-label="Alternar tema"
                title={dark ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>

              <div className="h-4 w-px bg-border my-auto mx-0.5" />

              {/* Botão de Sair fixado no cantinho superior */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                className="h-9 px-2.5 sm:px-3 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors gap-1.5"
                title="Sair do sistema (Logout)"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
