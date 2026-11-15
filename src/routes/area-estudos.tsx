import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Eye,
  FileText,
  Filter,
  Flame,
  HeartHandshake,
  HelpCircle,
  Home,
  Layers,
  MessageSquare,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  Check,
  CalendarCheck,
  Church,
  Maximize2,
  Minimize2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/MetricCard";
import { useStore, fmtDate, type Row } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/area-estudos")({
  head: () => ({
    meta: [
      { title: "Área de Estudos Bíblicos — EclesiaPro" },
      {
        name: "description",
        content:
          "Caderno digital e gestão de estudos bíblicos exclusivos para líderes de células da igreja.",
      },
    ],
  }),
  component: AreaEstudosPage,
});

export type StudyStatus = "Rascunho" | "Agendado" | "Ministrado";

export interface StudyItem {
  id: string;
  title: string;
  theme: string;
  biblical_reference: string;
  objective: string;
  introduction: string;
  development: string;
  reflection_questions: string;
  conclusion: string;
  scheduled_date: string;
  ministered_at?: string;
  status: StudyStatus;
  cell_id: string;
  cell_name: string;
  leader_id: string;
  leader_name: string;
  created_at: string;
  updated_at: string;
}

const TEMAS_SUGERIDOS = [
  "Vida em Comunidade",
  "Oração e Intercessão",
  "Fé e Confiança",
  "Evangelismo e Missões",
  "Família e Relacionamentos",
  "Santidade e Vida Cristã",
  "Discipulado e Liderança",
  "Graça e Perdão",
  "Generosidade e Serviço",
  "Esperança e Perseverança",
];

function AreaEstudosPage() {
  const { user } = useAuth();
  const { db, create, update, remove } = useStore();

  // Permissões
  const isLeader = user?.role === "Líder";
  const isAdmin = user?.role === "Administrador";
  const isPastor = user?.role === "Pastor";

  // Identifica a célula correspondente ao usuário logado
  const userCell = useMemo(() => {
    if (!user) return null;
    // 1. Procura por cellId explícito se existir
    if (user.cellId) {
      const found = db.cells.find((c) => c.id === user.cellId);
      if (found) return found;
    }
    // 2. Procura pelo nome do líder na lista de células
    const cleanUserName = (user.name || "").trim().toLowerCase();
    const foundByName = db.cells.find(
      (c) => (c.lider || "").toString().trim().toLowerCase() === cleanUserName
    );
    if (foundByName) return foundByName;

    // 3. Se for admin ou pastor e não houver célula própria, pega a primeira ativa como padrão para visualização
    if ((isAdmin || isPastor) && db.cells.length > 0) {
      return db.cells[0];
    }
    return null;
  }, [user, db.cells, isAdmin, isPastor]);

  // Filtro de célula (para Administrador e Pastor poderem alternar entre células)
  const [selectedCellFilter, setSelectedCellFilter] = useState<string>("todas");

  // Filtros de busca
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [periodFilter, setPeriodFilter] = useState<string>("todos");

  // Estados dos modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isMinisterModalOpen, setIsMinisterModalOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<StudyItem | null>(null);

  // Tamanho da fonte do modo leitura (celular)
  const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "xlarge">("normal");

  // Estado do formulário de criação/edição (3 seções)
  const [activeFormTab, setActiveFormTab] = useState<"geral" | "conteudo" | "programacao">("geral");
  const [formId, setFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formTheme, setFormTheme] = useState("Vida em Comunidade");
  const [formBiblicalRef, setFormBiblicalRef] = useState("");
  const [formObjective, setFormObjective] = useState("");
  const [formIntro, setFormIntro] = useState("");
  const [formDev, setFormDev] = useState("");
  const [formQuestions, setFormQuestions] = useState("");
  const [formConclusion, setFormConclusion] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<StudyStatus>("Agendado");
  const [formMinisteredAt, setFormMinisteredAt] = useState("");
  const [formTargetCellId, setFormTargetCellId] = useState<string>("todas");

  // Estado da ministração rápida
  const [effectiveMinisterDate, setEffectiveMinisterDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // Lista todos os estudos da base de dados tipados
  const allStudies = useMemo(() => {
    return ((db.studies || []) as unknown as StudyItem[]).sort((a, b) => {
      const dateA = a.scheduled_date || a.created_at || "";
      const dateB = b.scheduled_date || b.created_at || "";
      return dateB.localeCompare(dateA);
    });
  }, [db.studies]);

  // Se o usuário for líder, ele vê os estudos da sua célula + os estudos gerais direcionados a todas as células ("todas")
  // Se for admin ou pastor, tem visão global e pode filtrar por célula ou ver gerais
  const cellFilteredStudies = useMemo(() => {
    if (isLeader) {
      if (!userCell) return [];
      return allStudies.filter(
        (s) =>
          s.cell_id === "todas" ||
          s.cell_id === userCell.id ||
          (s.leader_name &&
            user?.name &&
            s.leader_name.toLowerCase() === user.name.toLowerCase())
      );
    }
    // Visão Pastor / Admin
    if (selectedCellFilter === "geral_pastoral") {
      return allStudies.filter((s) => s.cell_id === "todas");
    }
    if (selectedCellFilter !== "todas") {
      return allStudies.filter((s) => s.cell_id === selectedCellFilter);
    }
    return allStudies;
  }, [allStudies, isLeader, userCell, user?.name, selectedCellFilter]);

  // Aplica filtros de texto, status e período
  const filteredStudies = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);

    return cellFilteredStudies.filter((s) => {
      // Busca por título, tema, referência bíblica e objetivo
      const matchesSearch =
        !q ||
        (s.title || "").toLowerCase().includes(q) ||
        (s.theme || "").toLowerCase().includes(q) ||
        (s.biblical_reference || "").toLowerCase().includes(q) ||
        (s.objective || "").toLowerCase().includes(q);

      // Filtro por status
      const matchesStatus = statusFilter === "todos" || s.status === statusFilter;

      // Filtro por período
      let matchesPeriod = true;
      if (periodFilter === "mes_atual") {
        matchesPeriod = Boolean(s.scheduled_date && s.scheduled_date.startsWith(currentMonthPrefix));
      } else if (periodFilter === "futuros") {
        const todayStr = now.toISOString().slice(0, 10);
        matchesPeriod = Boolean(s.scheduled_date && s.scheduled_date >= todayStr);
      } else if (periodFilter === "passados") {
        const todayStr = now.toISOString().slice(0, 10);
        matchesPeriod = Boolean(s.scheduled_date && s.scheduled_date < todayStr);
      }

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [cellFilteredStudies, searchTerm, statusFilter, periodFilter]);

  // Indicadores Numéricos
  const stats = useMemo(() => {
    const total = cellFilteredStudies.length;
    const rascunhos = cellFilteredStudies.filter((s) => s.status === "Rascunho").length;
    const agendados = cellFilteredStudies.filter((s) => s.status === "Agendado").length;
    const ministrados = cellFilteredStudies.filter((s) => s.status === "Ministrado").length;
    return { total, rascunhos, agendados, ministrados };
  }, [cellFilteredStudies]);

  // Abre formulário para Novo Estudo
  const handleOpenNewStudy = () => {
    if (isLeader && !userCell) {
      toast.error(
        "Você precisa estar vinculado como líder responsável a uma célula ativa para cadastrar estudos."
      );
      return;
    }

    setFormId(null);
    setFormTitle("");
    setFormTheme("Vida em Comunidade");
    setFormBiblicalRef("");
    setFormObjective("");
    setFormIntro("");
    setFormDev("");
    setFormQuestions("");
    setFormConclusion("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormStatus("Agendado");
    setFormMinisteredAt("");
    setFormTargetCellId(isAdmin || isPastor ? "todas" : (userCell?.id || "cel_1"));
    setActiveFormTab("geral");
    setIsFormOpen(true);
  };

  // Abre formulário para Edição
  const handleOpenEditStudy = (study: StudyItem) => {
    setFormId(study.id);
    setFormTitle(study.title);
    setFormTheme(study.theme || "Vida em Comunidade");
    setFormBiblicalRef(study.biblical_reference);
    setFormObjective(study.objective || "");
    setFormIntro(study.introduction || "");
    setFormDev(study.development || "");
    setFormQuestions(study.reflection_questions || "");
    setFormConclusion(study.conclusion || "");
    setFormDate(study.scheduled_date || new Date().toISOString().slice(0, 10));
    setFormStatus(study.status);
    setFormMinisteredAt(study.ministered_at || "");
    setFormTargetCellId(study.cell_id || "todas");
    setActiveFormTab("geral");
    setIsFormOpen(true);
  };

  // Abre modo leitura imersivo / Caderno Digital
  const handleOpenReader = (study: StudyItem) => {
    setSelectedStudy(study);
    setIsReaderOpen(true);
  };

  // Duplicar Estudo (cria novo registro independente com status RASCUNHO)
  const handleDuplicateStudy = (study: StudyItem) => {
    // Se um líder estiver duplicando um estudo geral pastoral ("todas"), vincula automaticamente à sua célula
    let targetCellId = study.cell_id || "todas";
    let targetCellName = study.cell_name || "Todas as Células";
    let targetLeaderId = user?.id || study.leader_id || "usr_lider";
    let targetLeaderName = user?.name || study.leader_name || "Líder de Célula";

    if (isLeader) {
      targetCellId = userCell?.id || "cel_1";
      targetCellName = userCell?.nome || "Célula Betel";
      targetLeaderId = user?.id || "usr_lider";
      targetLeaderName = user?.name || "Líder de Célula";
    }

    const duplicatedData: Omit<StudyItem, "id"> = {
      title: `${study.title} (Cópia)`,
      theme: study.theme,
      biblical_reference: study.biblical_reference,
      objective: study.objective,
      introduction: study.introduction,
      development: study.development,
      reflection_questions: study.reflection_questions,
      conclusion: study.conclusion,
      scheduled_date: new Date().toISOString().slice(0, 10),
      ministered_at: "",
      status: "Rascunho",
      cell_id: targetCellId,
      cell_name: targetCellName,
      leader_id: targetLeaderId,
      leader_name: targetLeaderName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    create("studies", duplicatedData as unknown as Row);
    toast.success(
      isLeader && study.cell_id === "todas"
        ? "Estudo pastoral duplicado e vinculado à sua célula como rascunho independente!"
        : "Estudo duplicado com sucesso como rascunho independente!"
    );
  };

  // Excluir estudo com confirmação
  const handleDeleteStudy = (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja excluir o estudo "${title}"?`)) {
      remove("studies", id);
      toast.success("Estudo excluído com sucesso.");
      if (selectedStudy?.id === id) {
        setIsReaderOpen(false);
      }
    }
  };

  // Salvar formulário (Salvar Estudo ou Salvar como Rascunho)
  const handleSaveForm = (forceDraft = false) => {
    if (!formTitle.trim()) {
      toast.error("O título do estudo é obrigatório.");
      setActiveFormTab("geral");
      return;
    }
    if (!formBiblicalRef.trim()) {
      toast.error("A referência bíblica principal é obrigatória.");
      setActiveFormTab("geral");
      return;
    }

    const finalStatus: StudyStatus = forceDraft
      ? "Rascunho"
      : formStatus;

    // Define o destino do estudo e os responsáveis
    let cellId = "todas";
    let cellName = "Todas as Células (Geral)";
    let leaderId = user?.id || "pastoral";
    let leaderName = user?.name || "Gabinete Pastoral";

    if (isLeader) {
      cellId = userCell?.id || "cel_1";
      cellName = userCell?.nome || "Célula Betel";
      leaderId = user?.id || "usr_lider";
      leaderName = user?.name || "Líder de Célula";
    } else {
      // Visão Administrador / Pastor
      if (formTargetCellId === "todas") {
        cellId = "todas";
        cellName = "Todas as Células (Geral)";
        leaderId = user?.id || "pastoral";
        leaderName = `${user?.name || "Gabinete Pastoral"} (Geral)`;
      } else {
        const foundTarget = db.cells.find((c) => c.id === formTargetCellId);
        if (foundTarget) {
          cellId = foundTarget.id;
          cellName = foundTarget.nome;
          leaderId = foundTarget.lider_id || foundTarget.lider || "lider";
          leaderName = foundTarget.lider || "Líder Responsável";
        }
      }
    }

    if (formId) {
      // Atualizar
      update("studies", {
        id: formId,
        title: formTitle.trim(),
        theme: formTheme,
        biblical_reference: formBiblicalRef.trim(),
        objective: formObjective.trim(),
        introduction: formIntro.trim(),
        development: formDev.trim(),
        reflection_questions: formQuestions.trim(),
        conclusion: formConclusion.trim(),
        scheduled_date: formDate,
        ministered_at: finalStatus === "Ministrado" ? (formMinisteredAt || formDate) : "",
        status: finalStatus,
        cell_id: cellId,
        cell_name: cellName,
        leader_id: leaderId,
        leader_name: leaderName,
        updated_at: new Date().toISOString(),
      } as unknown as Row);
      toast.success("Estudo atualizado com sucesso!");
    } else {
      // Criar Novo
      create("studies", {
        title: formTitle.trim(),
        theme: formTheme,
        biblical_reference: formBiblicalRef.trim(),
        objective: formObjective.trim(),
        introduction: formIntro.trim(),
        development: formDev.trim(),
        reflection_questions: formQuestions.trim(),
        conclusion: formConclusion.trim(),
        scheduled_date: formDate,
        ministered_at: finalStatus === "Ministrado" ? (formMinisteredAt || formDate) : "",
        status: finalStatus,
        cell_id: cellId,
        cell_name: cellName,
        leader_id: leaderId,
        leader_name: leaderName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Row);
      toast.success(
        forceDraft
          ? "Estudo salvo como rascunho!"
          : "Novo estudo bíblico cadastrado com sucesso!"
      );
    }

    setIsFormOpen(false);
  };

  // Marcar como Ministrado
  const handleQuickMarkMinistered = (study: StudyItem) => {
    setSelectedStudy(study);
    setEffectiveMinisterDate(
      study.scheduled_date || new Date().toISOString().slice(0, 10)
    );
    setIsMinisterModalOpen(true);
  };

  const handleConfirmMinistered = () => {
    if (!selectedStudy) return;
    update("studies", {
      ...selectedStudy,
      status: "Ministrado",
      ministered_at: effectiveMinisterDate,
      updated_at: new Date().toISOString(),
    } as unknown as Row);
    toast.success(`Estudo "${selectedStudy.title}" marcado como ministrado!`);
    setIsMinisterModalOpen(false);
    if (isReaderOpen) {
      setSelectedStudy((s) => (s ? { ...s, status: "Ministrado", ministered_at: effectiveMinisterDate } : null));
    }
  };

  // Copiar conteúdo completo para envio no WhatsApp
  const handleCopyStudyContent = (study: StudyItem) => {
    const text = `📖 *${study.title.toUpperCase()}*\n` +
      `📌 *Tema:* ${study.theme}\n` +
      `📖 *Texto Bíblico:* ${study.biblical_reference}\n` +
      (study.objective ? `🎯 *Objetivo:* ${study.objective}\n\n` : "\n") +
      `--- *INTRODUÇÃO* ---\n${study.introduction || "Não informada"}\n\n` +
      `--- *DESENVOLVIMENTO* ---\n${study.development || "Não informado"}\n\n` +
      `--- *PERGUNTAS PARA REFLEXÃO* ---\n${study.reflection_questions || "Não informadas"}\n\n` +
      `--- *CONCLUSÃO* ---\n${study.conclusion || "Não informada"}\n\n` +
      `⛪ *${study.cell_name}* | Batista Corpo e Família`;

    navigator.clipboard.writeText(text);
    toast.success("Texto completo do estudo copiado para a área de transferência!");
  };

  // Caso seja perfil Líder mas não tenha célula ativa vinculada
  if (isLeader && !userCell) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 animate-rise">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 md:p-8 text-center space-y-4 shadow-xl">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Vínculo de Célula Necessário
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
              Olá, <strong>{user?.name}</strong>! Seu usuário possui o perfil de{" "}
              <strong>Líder de Célula</strong>, porém ainda não está associado como líder
              responsável em nenhuma célula ativa no sistema.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-background/60 border max-w-md mx-auto text-xs text-muted-foreground text-left space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Church className="size-4 text-primary" />
              Como regularizar o seu acesso:
            </div>
            <p>
              1. Solicite ao Pastor ou Administrador que acesse o módulo <strong>Células</strong>.
            </p>
            <p>
              2. Vincule seu nome como líder responsável da sua congregação/célula.
            </p>
            <p>
              3. O seu caderno digital de estudos bíblicos será liberado automaticamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise max-w-7xl mx-auto pb-12">
      {/* CABEÇALHO DO MÓDULO & IDENTIFICAÇÃO DA CÉLULA */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-5 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary text-xs font-bold gap-1.5 py-1 px-3 rounded-full"
              >
                <BookMarked className="size-3.5" />
                Área de Estudos Bíblicos
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold gap-1.5 py-1 px-3 rounded-full"
              >
                <Church className="size-3.5" />
                Batista Corpo e Família
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
              Meus Estudos Bíblicos
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Prepare, organize e acompanhe os estudos bíblicos que serão ministrados aos
              irmãos durante os encontros da sua célula.
            </p>
          </div>

          {/* Cartão de Identificação do Líder ou Coordenação Pastoral */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-3.5 rounded-2xl border bg-background/80 backdrop-blur shadow-sm space-y-1 min-w-[220px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-semibold text-muted-foreground flex items-center gap-1">
                  <UserCheck className="size-3 text-primary" />
                  {isAdmin || isPastor ? "Supervisão Ministerial" : "Líder Responsável"}
                </span>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                  {user?.role || "Líder"}
                </span>
              </div>
              <div className="font-bold text-sm text-foreground truncate">
                {user?.name || "Líder da Célula"}
              </div>

              <div className="pt-1 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Home className="size-3 text-emerald-500" />
                  {isAdmin || isPastor ? "Alcance:" : "Célula:"}
                </span>
                <span className="font-semibold text-foreground">
                  {isAdmin || isPastor ? "Todas as Células (Pastoral)" : (userCell?.nome || "Célula Betel")}
                </span>
              </div>
            </div>

            <Button
              variant="premium"
              size="lg"
              onClick={handleOpenNewStudy}
              className="h-12 px-5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 cursor-pointer shrink-0"
            >
              <Plus className="size-5" />
              <span>+ NOVO ESTUDO</span>
            </Button>
          </div>
        </div>

        {/* Seletor de Células (disponível para Administrador e Pastor) */}
        {(isAdmin || isPastor) && (
          <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Filter className="size-3.5 text-primary" />
              Filtrar por Destino / Célula (Visão Pastoral & Coordenação):
            </span>
            <div className="w-full sm:w-80">
              <Select value={selectedCellFilter} onValueChange={setSelectedCellFilter}>
                <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                  <SelectValue placeholder="Selecione o filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">
                    Todas as Células & Estudos ({allStudies.length})
                  </SelectItem>
                  <SelectItem value="geral_pastoral">
                    🌟 Apenas Estudos Gerais da Igreja (Pastoral)
                  </SelectItem>
                  {db.cells.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} (Líder: {c.lider || "Sem líder"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* DASHBOARD - 4 INDICADORES NUMÉRICOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Total de Estudos"
          value={stats.total}
          icon={BookOpen}
          tone="blue"
        />
        <MetricCard
          label="Em Rascunho"
          value={stats.rascunhos}
          icon={FileText}
          tone="orange"
        />
        <MetricCard
          label="Estudos Agendados"
          value={stats.agendados}
          icon={Calendar}
          tone="violet"
        />
        <MetricCard
          label="Ministrados na Célula"
          value={stats.ministrados}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      {/* FILTROS, BUSCA & CONTROLES */}
      <div className="p-4 rounded-2xl border bg-card/60 backdrop-blur space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Campo de Busca em Tempo Real */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar por título, tema ou referência bíblica (ex: Atos 2, Filipenses)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-xl text-xs sm:text-sm bg-background"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Filtros por Status */}
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
            {[
              { id: "todos", label: "Todos" },
              { id: "Rascunho", label: "Rascunhos" },
              { id: "Agendado", label: "Agendados" },
              { id: "Ministrado", label: "Ministrados" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Filtro por Período */}
          <div className="w-full sm:w-44">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="h-10 rounded-xl text-xs bg-background">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Períodos</SelectItem>
                <SelectItem value="mes_atual">Neste Mês</SelectItem>
                <SelectItem value="futuros">Próximos / Futuros</SelectItem>
                <SelectItem value="passados">Anteriores / Passados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* LISTAGEM DOS ESTUDOS BÍBLICOS (MOBILE-FIRST) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <BookMarked className="size-5 text-primary" />
            <span>Estudos Cadastrados ({filteredStudies.length})</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            Ordenados por data prevista (mais recentes primeiro)
          </span>
        </div>

        {filteredStudies.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-10 text-center space-y-4 bg-muted/20">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Nenhum estudo encontrado</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {searchTerm || statusFilter !== "todos" || periodFilter !== "todos"
                  ? "Tente ajustar os filtros de busca para encontrar o estudo bíblico desejado."
                  : "Comece criando o primeiro estudo bíblico da sua célula para ministrar aos irmãos."}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleOpenNewStudy}
              className="rounded-xl gap-2 font-semibold text-xs"
            >
              <Plus className="size-4" />
              + Criar Meu Primeiro Estudo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudies.map((study) => {
              const isMinistrado = study.status === "Ministrado";
              const isRascunho = study.status === "Rascunho";
              const isAgendado = study.status === "Agendado";

              return (
                <div
                  key={study.id}
                  className="group relative flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <div className="space-y-3">
                    {/* Linha de Status & Categoria */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full gap-1.5 ${
                            isMinistrado
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : isAgendado
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {isMinistrado && <CheckCircle2 className="size-3" />}
                          {isAgendado && <Calendar className="size-3" />}
                          {isRascunho && <FileText className="size-3" />}
                          {study.status}
                        </Badge>

                        {study.cell_id === "todas" && (
                          <Badge
                            variant="outline"
                            className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 gap-1"
                          >
                            <Sparkles className="size-3" />
                            Geral Pastoral
                          </Badge>
                        )}
                      </div>

                      <Badge
                        variant="secondary"
                        className="text-[10.5px] font-semibold text-muted-foreground truncate max-w-[150px]"
                      >
                        {study.theme || "Estudo Bíblico"}
                      </Badge>
                    </div>

                    {/* Título & Referência Bíblica */}
                    <div>
                      <h3
                        onClick={() => handleOpenReader(study)}
                        className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors cursor-pointer line-clamp-2"
                        title={study.title}
                      >
                        {study.title}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <BookOpen className="size-3.5 shrink-0" />
                        <span>{study.biblical_reference}</span>
                      </div>
                    </div>

                    {/* Objetivo Resumido */}
                    {study.objective && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                        "{study.objective}"
                      </p>
                    )}

                    {/* Detalhes de Programação & Célula */}
                    <div className="pt-3 border-t space-y-1.5 text-[11.5px] text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-primary" />
                          Previsão:
                        </span>
                        <span className="font-semibold text-foreground">
                          {fmtDate(study.scheduled_date)}
                        </span>
                      </div>

                      {study.ministered_at && (
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="flex items-center gap-1">
                            <CalendarCheck className="size-3" />
                            Ministrado em:
                          </span>
                          <span>{fmtDate(study.ministered_at)}</span>
                        </div>
                      )}

                      {study.cell_id === "todas" ? (
                        <div className="flex items-center justify-between pt-1 text-[11px] text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg">
                          <span className="flex items-center gap-1 font-bold">
                            <Sparkles className="size-3 shrink-0" />
                            Todas as Células da Igreja
                          </span>
                          <span className="truncate opacity-90 font-medium">{study.leader_name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1 text-[11px] opacity-80">
                          <span className="truncate">Célula: {study.cell_name}</span>
                          <span className="truncate">Líder: {study.leader_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de Ações (Visualizar, Editar, Duplicar, Compartilhar, Excluir) */}
                  <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-1.5">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenReader(study)}
                      className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 shadow-2xs cursor-pointer flex-1"
                    >
                      <Eye className="size-3.5" />
                      <span>Visualizar</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditStudy(study)}
                      className="h-8 px-2.5 rounded-xl text-xs gap-1 cursor-pointer text-foreground hover:border-primary hover:text-primary"
                      title="Editar Estudo"
                    >
                      <Edit2 className="size-3.5" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateStudy(study)}
                      className="h-8 px-2.5 rounded-xl text-xs gap-1 cursor-pointer text-foreground hover:border-primary hover:text-primary"
                      title="Duplicar como Rascunho"
                    >
                      <Copy className="size-3.5" />
                      <span className="hidden sm:inline">Duplicar</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyStudyContent(study)}
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary cursor-pointer"
                      title="Copiar texto para WhatsApp"
                    >
                      <Share2 className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStudy(study.id, study.title)}
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Excluir Estudo"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: FORMULÁRIO DE CADASTRO / EDIÇÃO DIVIDIDO EM 3 SEÇÕES */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-3xl">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <BookMarked className="size-4" />
              <span>Caderno Digital de Estudos Bíblicos</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold font-display">
              {formId ? "Editar Estudo Bíblico" : "Novo Estudo Bíblico"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preencha as seções abaixo para preparar o estudo da sua célula. A edição é
              totalmente otimizada para celulares.
            </DialogDescription>

            {/* Abas de Navegação Entre as 3 Seções */}
            <div className="mt-3 flex items-center gap-1.5 p-1 bg-muted/70 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveFormTab("geral")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeFormTab === "geral"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>1. Geral</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab("conteudo")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeFormTab === "conteudo"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>2. Conteúdo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab("programacao")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeFormTab === "programacao"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>3. Programação</span>
              </button>
            </div>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveForm(false);
            }}
            className="space-y-4 pt-2"
          >
            {/* SEÇÃO 1: INFORMAÇÕES GERAIS */}
            {activeFormTab === "geral" && (
              <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                {/* Seletor de Destino do Estudo (para Administrador e Pastor) */}
                {(isAdmin || isPastor) && (
                  <div className="space-y-1.5 p-3.5 rounded-2xl border border-primary/20 bg-primary/5">
                    <Label htmlFor="study-destination" className="text-xs font-bold flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Church className="size-3.5 text-primary" />
                        Destinar Estudo Bíblico para:
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-bold">
                        Visão Ministerial
                      </Badge>
                    </Label>
                    <Select value={formTargetCellId} onValueChange={setFormTargetCellId}>
                      <SelectTrigger id="study-destination" className="h-11 rounded-xl text-sm bg-background">
                        <SelectValue placeholder="Selecione o destino do estudo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">
                          🌟 Todas as Células (Estudo Geral da Igreja / Pastoral)
                        </SelectItem>
                        {db.cells.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome} — Líder: {c.lider || "Sem líder"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {formTargetCellId === "todas"
                        ? "Todos os líderes de célula terão acesso a este estudo em seus cadernos digitais para ministrar aos irmãos."
                        : "Este estudo será direcionado especificamente para a célula selecionada."}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="study-title" className="text-xs font-bold">
                    Título do Estudo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="study-title"
                    required
                    placeholder="Ex: O Poder da Oração e Comunhão Fraternal"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="study-theme" className="text-xs font-bold">
                      Tema ou Categoria
                    </Label>
                    <Select value={formTheme} onValueChange={setFormTheme}>
                      <SelectTrigger id="study-theme" className="h-11 rounded-xl text-sm">
                        <SelectValue placeholder="Selecione o tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMAS_SUGERIDOS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="study-biblical-ref" className="text-xs font-bold">
                      Referência Bíblica Principal <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="study-biblical-ref"
                      required
                      placeholder="Ex: Atos 2:42-47 ou Filipenses 4:6-7"
                      value={formBiblicalRef}
                      onChange={(e) => setFormBiblicalRef(e.target.value)}
                      className="h-11 rounded-xl text-sm font-semibold text-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="study-objective" className="text-xs font-bold">
                    Objetivo do Estudo
                  </Label>
                  <Textarea
                    id="study-objective"
                    rows={2}
                    placeholder="Qual a mensagem central que os irmãos devem levar para casa?"
                    value={formObjective}
                    onChange={(e) => setFormObjective(e.target.value)}
                    className="rounded-xl text-xs sm:text-sm resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveFormTab("conteudo")}
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <span>Avançar para Conteúdo Bíblico</span>
                    &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* SEÇÃO 2: CONTEÚDO BÍBLICO (TEXTAREAS AMPLOS PARA CELULAR) */}
            {activeFormTab === "conteudo" && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="space-y-1.5">
                  <Label htmlFor="study-intro" className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    1. Introdução / Quebra-Gelo
                  </Label>
                  <Textarea
                    id="study-intro"
                    rows={3}
                    placeholder="Contextualize o assunto e prepare o coração dos participantes..."
                    value={formIntro}
                    onChange={(e) => setFormIntro(e.target.value)}
                    className="rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="study-dev" className="text-xs font-bold flex items-center gap-1.5">
                    <BookOpen className="size-3.5 text-primary" />
                    2. Desenvolvimento Bíblico (Pontos Principais)
                  </Label>
                  <Textarea
                    id="study-dev"
                    rows={5}
                    placeholder="Registre os tópicos centrais, explicações e versículos adicionais..."
                    value={formDev}
                    onChange={(e) => setFormDev(e.target.value)}
                    className="rounded-xl text-xs sm:text-sm font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="study-questions" className="text-xs font-bold flex items-center gap-1.5">
                    <MessageSquare className="size-3.5 text-primary" />
                    3. Perguntas para Reflexão e Diálogo
                  </Label>
                  <Textarea
                    id="study-questions"
                    rows={3}
                    placeholder="1. Como você pode aplicar essa palavra hoje?\n2. O que mais te chamou a atenção no texto?"
                    value={formQuestions}
                    onChange={(e) => setFormQuestions(e.target.value)}
                    className="rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="study-conclusion" className="text-xs font-bold flex items-center gap-1.5">
                    <HeartHandshake className="size-3.5 text-primary" />
                    4. Conclusão & Motivos de Oração
                  </Label>
                  <Textarea
                    id="study-conclusion"
                    rows={3}
                    placeholder="Mensagem final, aplicação prática e direção de oração mútua..."
                    value={formConclusion}
                    onChange={(e) => setFormConclusion(e.target.value)}
                    className="rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveFormTab("geral")}
                    className="rounded-xl text-xs font-semibold"
                  >
                    &larr; Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveFormTab("programacao")}
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <span>Avançar para Programação</span>
                    &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* SEÇÃO 3: PROGRAMAÇÃO & STATUS */}
            {activeFormTab === "programacao" && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="study-date" className="text-xs font-bold">
                      Data Prevista para Ministração
                    </Label>
                    <Input
                      id="study-date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="study-status" className="text-xs font-bold">
                      Status do Estudo
                    </Label>
                    <Select
                      value={formStatus}
                      onValueChange={(v) => setFormStatus(v as StudyStatus)}
                    >
                      <SelectTrigger id="study-status" className="h-11 rounded-xl text-sm">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rascunho">Rascunho (Em elaboração)</SelectItem>
                        <SelectItem value="Agendado">Agendado (Pronto para ministrar)</SelectItem>
                        <SelectItem value="Ministrado">Ministrado (Já ministrado na célula)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formStatus === "Ministrado" && (
                  <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 animate-in fade-in-50">
                    <Label
                      htmlFor="study-ministered-at"
                      className="text-xs font-bold text-emerald-800 dark:text-emerald-300"
                    >
                      Data Efetiva da Ministração na Célula
                    </Label>
                    <Input
                      id="study-ministered-at"
                      type="date"
                      value={formMinisteredAt || formDate}
                      onChange={(e) => setFormMinisteredAt(e.target.value)}
                      className="h-10 rounded-xl text-sm bg-background"
                    />
                  </div>
                )}

                <div className="rounded-2xl border bg-muted/40 p-3.5 space-y-1 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Home className="size-3.5 text-primary" />
                    Destino & Autoria do Estudo
                  </div>
                  <p className="text-muted-foreground">
                    {formTargetCellId === "todas" ? (
                      <span>
                        Destino: <strong className="text-violet-600 dark:text-violet-400">Todas as Células da Igreja (Estudo Geral Pastoral)</strong> &middot; Autor:{" "}
                        <strong>{user?.name || "Gabinete Pastoral"}</strong>
                      </span>
                    ) : (
                      <span>
                        Célula: <strong>{db.cells.find((c) => c.id === formTargetCellId)?.nome || userCell?.nome || "Célula Betel"}</strong> &middot; Líder Responsável:{" "}
                        <strong>{db.cells.find((c) => c.id === formTargetCellId)?.lider || user?.name || "Líder de Célula"}</strong>
                      </span>
                    )}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveFormTab("conteudo")}
                    className="rounded-xl text-xs font-semibold"
                  >
                    &larr; Voltar para Conteúdo
                  </Button>
                </div>
              </div>
            )}

            {/* AÇÕES FINAIS DO MODAL */}
            <DialogFooter className="pt-4 border-t gap-2 sm:gap-3 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="h-11 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSaveForm(true)}
                className="h-11 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
              >
                <FileText className="size-4" />
                <span>Salvar como Rascunho</span>
              </Button>

              <Button
                type="submit"
                variant="premium"
                className="h-11 px-6 rounded-xl text-xs font-bold gap-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                <span>{formId ? "Atualizar Estudo" : "Salvar Estudo"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: MODO LEITURA IMERSIVO / "CADERNO DIGITAL DO LÍDER" (OTIMIZADO PARA CELULAR) */}
      <Dialog open={isReaderOpen} onOpenChange={setIsReaderOpen}>
        <DialogContent className="max-w-3xl max-h-[94vh] overflow-y-auto p-4 sm:p-7 rounded-3xl">
          {selectedStudy && (
            <div className="space-y-5">
              {/* Barra de Ferramentas do Leitor */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 no-print">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      selectedStudy.status === "Ministrado"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : selectedStudy.status === "Agendado"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {selectedStudy.status}
                  </Badge>

                  {selectedStudy.cell_id === "todas" && (
                    <Badge
                      variant="outline"
                      className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 gap-1"
                    >
                      <Sparkles className="size-3" />
                      Estudo Geral Pastoral
                    </Badge>
                  )}

                  <span className="text-xs text-muted-foreground font-semibold">
                    {selectedStudy.theme}
                  </span>
                </div>

                {/* Ajuste de Tamanho de Fonte para Leitura Fácil no Celular */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                  <span className="text-[10px] text-muted-foreground font-bold px-1.5">Fonte:</span>
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel("normal")}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold cursor-pointer ${
                      fontSizeLevel === "normal" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel("large")}
                    className={`px-2 py-0.5 rounded-lg text-sm font-bold cursor-pointer ${
                      fontSizeLevel === "large" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                    }`}
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel("xlarge")}
                    className={`px-2 py-0.5 rounded-lg text-base font-bold cursor-pointer ${
                      fontSizeLevel === "xlarge" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                    }`}
                  >
                    A++
                  </button>
                </div>
              </div>

              {/* Cabeçalho do Estudo */}
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground font-display leading-tight">
                  {selectedStudy.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-primary">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="size-4 shrink-0" />
                    <span>{selectedStudy.biblical_reference}</span>
                  </div>
                  <span className="text-muted-foreground">&bull;</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>{fmtDate(selectedStudy.scheduled_date)}</span>
                  </div>
                </div>

                {selectedStudy.objective && (
                  <div className="p-3 rounded-2xl bg-muted/30 border text-xs sm:text-sm text-foreground/80 italic">
                    <strong>Objetivo da Mensagem:</strong> {selectedStudy.objective}
                  </div>
                )}
              </div>

              {/* Corpo do Estudo Bíblico com Estilo de Caderno Digital */}
              <div
                className={`space-y-6 pt-2 leading-relaxed ${
                  fontSizeLevel === "large"
                    ? "text-base sm:text-lg"
                    : fontSizeLevel === "xlarge"
                    ? "text-lg sm:text-xl"
                    : "text-sm sm:text-base"
                }`}
              >
                {/* 1. INTRODUÇÃO */}
                {selectedStudy.introduction && (
                  <div className="space-y-2">
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b pb-1">
                      <Sparkles className="size-4" />
                      1. Introdução / Quebra-Gelo
                    </h2>
                    <div className="whitespace-pre-line text-foreground/90 pl-1">
                      {selectedStudy.introduction}
                    </div>
                  </div>
                )}

                {/* 2. DESENVOLVIMENTO BÍBLICO */}
                {selectedStudy.development && (
                  <div className="space-y-2">
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b pb-1">
                      <BookOpen className="size-4" />
                      2. Desenvolvimento & Palavra
                    </h2>
                    <div className="whitespace-pre-line text-foreground/90 pl-1">
                      {selectedStudy.development}
                    </div>
                  </div>
                )}

                {/* 3. PERGUNTAS DE REFLEXÃO */}
                {selectedStudy.reflection_questions && (
                  <div className="space-y-2">
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b pb-1">
                      <MessageSquare className="size-4" />
                      3. Perguntas para Reflexão e Diálogo
                    </h2>
                    <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 whitespace-pre-line text-foreground">
                      {selectedStudy.reflection_questions}
                    </div>
                  </div>
                )}

                {/* 4. CONCLUSÃO & ORAÇÃO */}
                {selectedStudy.conclusion && (
                  <div className="space-y-2">
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border-b pb-1">
                      <HeartHandshake className="size-4" />
                      4. Conclusão & Oração Final
                    </h2>
                    <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 whitespace-pre-line text-foreground">
                      {selectedStudy.conclusion}
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé do Leitor com Ações Rápidas */}
              <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2 no-print">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyStudyContent(selectedStudy)}
                    className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Share2 className="size-3.5" />
                    <span>Copiar p/ WhatsApp</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsReaderOpen(false);
                      handleOpenEditStudy(selectedStudy);
                    }}
                    className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Editar</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedStudy.status !== "Ministrado" ? (
                    <Button
                      variant="premium"
                      size="sm"
                      onClick={() => handleQuickMarkMinistered(selectedStudy)}
                      className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Marcar como Ministrado</span>
                    </Button>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold py-1 px-3"
                    >
                      ✓ Ministrado em {fmtDate(selectedStudy.ministered_at)}
                    </Badge>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsReaderOpen(false)}
                    className="rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: REGISTRO DE MINISTRAÇÃO EFETIVA */}
      <Dialog open={isMinisterModalOpen} onOpenChange={setIsMinisterModalOpen}>
        <DialogContent className="max-w-md p-5 rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span>Concluir Estudo</span>
            </div>
            <DialogTitle className="text-lg font-bold">
              Marcar Estudo como Ministrado
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confirme a data em que este estudo bíblico foi compartilhado com os irmãos na célula.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-2xl bg-muted/40 border text-xs space-y-1">
              <div className="font-bold text-foreground truncate">{selectedStudy?.title}</div>
              <div className="text-primary font-semibold">{selectedStudy?.biblical_reference}</div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minister-date" className="text-xs font-bold">
                Data Efetiva da Ministração
              </Label>
              <Input
                id="minister-date"
                type="date"
                value={effectiveMinisterDate}
                onChange={(e) => setEffectiveMinisterDate(e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMinisterModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="premium"
              onClick={handleConfirmMinistered}
              className="rounded-xl text-xs font-bold gap-1.5 shadow-md"
            >
              <Check className="size-4" />
              <span>Confirmar Ministração</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
