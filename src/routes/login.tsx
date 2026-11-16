import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Church,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — EclesiaPro" },
      { name: "description", content: "Acesso administrativo ao sistema de gestão eclesiástica EclesiaPro." },
      { property: "og:title", content: "Entrar — EclesiaPro" },
      { property: "og:description", content: "Acesso administrativo ao sistema de gestão eclesiástica EclesiaPro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Se já estiver logado, redireciona para a página apropriada
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "Tesoureiro") {
        navigate({ to: "/analise-financeira" });
      } else if (user?.role === "Líder") {
        navigate({ to: "/area-estudos" });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    setTimeout(() => {
      const res = login(email, password, remember);
      setLoading(false);

      if (res.success) {
        if (res.user?.role === "Tesoureiro") {
          navigate({ to: "/analise-financeira" });
        } else if (res.user?.role === "Líder") {
          navigate({ to: "/area-estudos" });
        } else {
          navigate({ to: "/" });
        }
      } else {
        setErrorMessage(res.error || "Erro ao realizar login.");
        toast.error(res.error || "Credenciais inválidas.");
      }
    }, 300);
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMessage("");
    setLoading(true);

    setTimeout(() => {
      const res = login(quickEmail, quickPass, true);
      setLoading(false);

      if (res.success) {
        if (res.user?.role === "Tesoureiro") {
          navigate({ to: "/analise-financeira" });
        } else if (res.user?.role === "Líder") {
          navigate({ to: "/area-estudos" });
        } else {
          navigate({ to: "/" });
        }
      } else {
        setErrorMessage(res.error || "Erro ao realizar login.");
        toast.error(res.error || "Credenciais inválidas.");
      }
    }, 200);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background overflow-hidden selection:bg-primary/20">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 -left-28 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-28 size-96 rounded-full bg-chart-2/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6 z-10 animate-rise">
        {/* Logotipo e Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-grid size-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-xl ring-8 ring-primary/10 mb-2">
            <Church className="size-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
            EclesiaPro
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Plataforma de Gestão Eclesiástica Integrada
          </p>
        </div>

        {/* Card do Formulário de Login */}
        <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-card gradient-top relative backdrop-blur-sm">
          <div className="space-y-1 mb-6 text-center sm:text-left">
            <h2 className="text-lg font-bold text-foreground">Acesso ao Painel</h2>
            <p className="text-xs text-muted-foreground">
              Insira seu e-mail e senha cadastrados para entrar no sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium animate-in fade-in-50">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                E-mail ou CPF
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="text"
                  required
                  placeholder="seu.email@eclesiapro.com ou 000.000.000-00"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl shadow-sm h-11 text-sm"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Senha de Acesso (CPF)
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Digite seu CPF cadastrado"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl shadow-sm h-11 text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4 accent-primary"
                />
                Lembrar-me neste dispositivo
              </label>
            </div>

            <Button
              type="submit"
              variant="premium"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold gap-2 mt-2 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <span>Validando acesso...</span>
              ) : (
                <>
                  <LogIn className="size-4" />
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="size-3.5 ml-auto" />
                </>
              )}
            </Button>

            {/* Acesso Rápido para Demonstração / Teste no Celular */}
            <div className="pt-4 border-t border-border/70 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span>Perfis de teste (toque para entrar direto):</span>
                <span className="text-[10px] text-primary font-semibold">1 clique</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("admin@eclesiapro.com", "admin123")}
                  className="text-xs h-9 justify-start gap-1.5 rounded-xl border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 font-medium cursor-pointer"
                >
                  <ShieldCheck className="size-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">Administrador</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("lider@eclesiapro.com", "lider123")}
                  className="text-xs h-9 justify-start gap-1.5 rounded-xl border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer"
                >
                  <BookOpen className="size-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">Líder de Célula</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("pastor@eclesiapro.com", "pastor123")}
                  className="text-xs h-9 justify-start gap-1.5 rounded-xl border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
                >
                  <Church className="size-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Pastor</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("tesoureiro@eclesiapro.com", "tesouro123")}
                  className="text-xs h-9 justify-start gap-1.5 rounded-xl border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium cursor-pointer"
                >
                  <Wallet className="size-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">Tesoureiro</span>
                </Button>
              </div>

              {/* Dica de Acesso Rápido */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <span>Credenciais válidas para digitação:</span>
                </p>
                <p className="leading-tight">
                  &bull; <strong>Admin:</strong> <code className="text-foreground">admin@eclesiapro.com</code> (ou apenas <code className="text-foreground">admin</code>) &bull; Senha: <code className="text-foreground">admin123</code> (ou <code className="text-foreground">admin</code>)
                </p>
                <p className="leading-tight">
                  &bull; <strong>Líder:</strong> <code className="text-foreground">lider@eclesiapro.com</code> (ou apenas <code className="text-foreground">lider</code>) &bull; Senha: <code className="text-foreground">lider123</code> (ou <code className="text-foreground">lider</code>)
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Rodapé Seguro de Produção */}
        <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-muted-foreground/80" />
          <span>Ambiente institucional protegido &bull; EclesiaPro &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
