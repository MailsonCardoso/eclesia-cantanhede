import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Church, Wallet, HandCoins, Network, Moon, Sun, CalendarClock, CalendarDays, Boxes, BarChart3 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Painel", url: "/", icon: LayoutDashboard },
  { title: "Membros", url: "/membros", icon: Users },
  { title: "Congregações", url: "/congregacoes", icon: Church },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Dízimos e Ofertas", url: "/contribuicoes", icon: HandCoins },
  { title: "Departamentos", url: "/departamentos", icon: Network },
  { title: "Agenda Pastoral", url: "/agenda-pastoral", icon: CalendarClock },
  { title: "Agenda de Eventos", url: "/agenda-eventos", icon: CalendarDays },
  { title: "Inventário", url: "/inventario", icon: Boxes },
  { title: "Relatório de Membros", url: "/relatorio-membros", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem("theme") === "dark"); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="no-print">
          <SidebarHeader className="px-3 py-5">
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                <Church className="size-5" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="font-display text-lg font-semibold text-sidebar-accent-foreground leading-none">Ecclesia</div>
                <div className="text-xs text-sidebar-foreground/70 mt-1">Gestão eclesiástica</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((i) => (
                    <SidebarMenuItem key={i.url}>
                      <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}>
                        <Link to={i.url}><i.icon className="size-4" /><span>{i.title}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur no-print">
            <SidebarTrigger />
            <Button variant="ghost" size="icon" aria-label="Alternar tema" onClick={() => setDark((v) => !v)}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
