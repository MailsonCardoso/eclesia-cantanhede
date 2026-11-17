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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await login(email, password, remember);
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
    } catch (err: any) {
      setLoading(false);
      setErrorMessage("Erro ao conectar ao servidor.");
      toast.error("Erro ao conectar ao servidor.");
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-background overflow-x-hidden selection:bg-primary/20">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 -left-28 size-80 sm:size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-28 size-80 sm:size-96 rounded-full bg-chart-2/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm sm:max-w-md my-auto space-y-4 sm:space-y-6 z-10 animate-rise">
        {/* Logotipo e Cabeçalho Compacto e Elegante */}
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="inline-grid size-12 sm:size-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-xl ring-4 ring-primary/15 mb-1 sm:mb-2">
            <Church className="size-6 sm:size-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
            EclesiaPro
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Plataforma de Gestão Eclesiástica Integrada
          </p>
        </div>

        {/* Card do Formulário de Login no Estilo App */}
        <div className="rounded-3xl border border-border/80 bg-card/95 sm:bg-card p-5 sm:p-7 shadow-2xl gradient-top relative backdrop-blur-md">
          <div className="space-y-1 mb-4 sm:mb-5 text-center">
            <h2 className="text-base sm:text-lg font-bold text-foreground">Acesso ao Painel</h2>
            <p className="text-xs text-muted-foreground">
              Insira suas credenciais para entrar no sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
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
                  placeholder="Digite seu e-mail ou CPF"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl shadow-sm h-11 text-sm bg-background/50 focus:bg-background transition-colors"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Senha de Acesso
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Digite sua senha de acesso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl shadow-sm h-11 text-sm bg-background/50 focus:bg-background transition-colors"
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

            <div className="flex items-center justify-between text-xs pt-0.5">
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
              className="w-full h-11 sm:h-12 rounded-xl text-sm font-semibold gap-2 mt-2 shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
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
          </form>
        </div>

        {/* Rodapé Seguro de Produção */}
        <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pb-2">
          <ShieldCheck className="size-3.5 text-muted-foreground/80" />
          <span>Ambiente institucional protegido &bull; EclesiaPro &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
