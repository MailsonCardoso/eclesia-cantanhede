import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Mail,
  Lock,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  Church,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth, type UserRole, type UserAccount, ROLE_DEFINITIONS, formatCPF, cleanCPF } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e Acessos — EclesiaPro" },
      { name: "description", content: "Gerenciamento de operadores, vinculação com membros e controle de níveis de acesso." },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { user: currentLoggedUser, users, addUser, updateUser, deleteUser, toggleUserStatus } = useAuth();
  const { db } = useStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState<UserRole>("Secretaria");
  const [cargo, setCargo] = useState("");
  const [status, setStatus] = useState<"Ativo" | "Inativo">("Ativo");

  // Member Autocomplete Search in Dialog
  const [memberSearch, setMemberSearch] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  // Protection: Restrict to Administrador
  const isAdmin = currentLoggedUser?.role === "Administrador";

  // Filter members based on search in modal
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return db.members.slice(0, 6);
    const q = memberSearch.toLowerCase().trim();
    const qDigits = cleanCPF(q);
    return db.members.filter((m) => {
      const matchName = (m.nome || m.name || "").toLowerCase().includes(q);
      const matchCpf = cleanCPF(m.cpf || "").includes(qDigits);
      const matchEmail = (m.email || "").toLowerCase().includes(q);
      return matchName || matchCpf || matchEmail;
    }).slice(0, 8);
  }, [db.members, memberSearch]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchTerm.toLowerCase().trim();
      const qDigits = cleanCPF(q);

      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        cleanCPF(u.cpf).includes(qDigits) ||
        (u.cargo && u.cargo.toLowerCase().includes(q));

      const matchesRole = roleFilter === "todos" || u.role === roleFilter;
      const matchesStatus = statusFilter === "todos" || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "Administrador").length;
    const pastores = users.filter((u) => u.role === "Pastor").length;
    const secretaria = users.filter((u) => u.role === "Secretaria").length;
    const tesouraria = users.filter((u) => u.role === "Tesoureiro").length;
    const lideres = users.filter((u) => u.role === "Líder").length;
    const ativos = users.filter((u) => u.status === "Ativo").length;
    return { total, admins, pastores, secretaria, tesouraria, lideres, ativos };
  }, [users]);

  // Open Modal for New User
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setSelectedMemberId("");
    setName("");
    setEmail("");
    setCpf("");
    setRole("Secretaria");
    setCargo("");
    setStatus("Ativo");
    setMemberSearch("");
    setIsMemberDropdownOpen(false);
    setIsDialogOpen(true);
  };

  // Open Modal for Editing User
  const handleOpenEditUser = (userToEdit: UserAccount) => {
    setEditingUser(userToEdit);
    setSelectedMemberId(userToEdit.memberId || "");
    setName(userToEdit.name);
    setEmail(userToEdit.email);
    setCpf(userToEdit.cpf);
    setRole(userToEdit.role);
    setCargo(userToEdit.cargo);
    setStatus(userToEdit.status);
    setMemberSearch(userToEdit.name);
    setIsMemberDropdownOpen(false);
    setIsDialogOpen(true);
  };

  // Select Member from Autocomplete
  const handleSelectMember = (member: (typeof db.members)[0]) => {
    const memberName = member.nome || member.name || "";
    setSelectedMemberId(member.id);
    setName(memberName);
    setMemberSearch(memberName);
    setIsMemberDropdownOpen(false);

    if (member.email) {
      setEmail(member.email);
    }
    if (member.cpf) {
      setCpf(formatCPF(member.cpf));
    }

    // Sugere perfil baseado no cargo do membro
    const churchCargo = (member.cargo || member.role || "").toLowerCase();
    if (churchCargo.includes("pastor") || churchCargo.includes("pastora")) {
      setRole("Pastor");
      setCargo(member.cargo || "Pastor(a)");
    } else if (churchCargo.includes("líder") || churchCargo.includes("lider")) {
      setRole("Líder");
      setCargo(member.cargo || "Líder de Célula");
    } else if (churchCargo.includes("tesour") || churchCargo.includes("financ")) {
      setRole("Tesoureiro");
      setCargo(member.cargo || "Tesoureiro Geral");
    } else if (churchCargo.includes("secret")) {
      setRole("Secretaria");
      setCargo(member.cargo || "Secretária Executiva");
    } else {
      setCargo(member.cargo || ROLE_DEFINITIONS[role].label);
    }

    toast.info(`Membro ${memberName} selecionado!`);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Informe o nome do usuário.");
      return;
    }
    if (!email.trim()) {
      toast.error("Informe o e-mail de acesso do usuário.");
      return;
    }
    if (!cpf.trim() || cleanCPF(cpf).length < 11) {
      toast.error("Informe um CPF válido com 11 dígitos.");
      return;
    }

    if (editingUser) {
      // Update
      const res = updateUser(editingUser.id, {
        memberId: selectedMemberId || editingUser.memberId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        cpf: formatCPF(cpf),
        role,
        cargo: cargo.trim() || ROLE_DEFINITIONS[role].label,
        status,
      });

      if (res.success) {
        setIsDialogOpen(false);
      } else {
        toast.error(res.error || "Erro ao atualizar usuário.");
      }
    } else {
      // Add
      const res = addUser({
        memberId: selectedMemberId || undefined,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        cpf: formatCPF(cpf),
        role,
        cargo: cargo.trim() || ROLE_DEFINITIONS[role].label,
        status,
      });

      if (res.success) {
        setIsDialogOpen(false);
      } else {
        toast.error(res.error || "Erro ao cadastrar usuário.");
      }
    }
  };

  // Handle Delete with Confirmation
  const handleDelete = (id: string, userName: string) => {
    if (currentLoggedUser?.id === id) {
      toast.error("Você não pode excluir sua própria conta conectada.");
      return;
    }

    if (window.confirm(`Tem certeza de que deseja remover o acesso do usuário "${userName}"?`)) {
      const res = deleteUser(id);
      if (!res.success) {
        toast.error(res.error || "Erro ao excluir usuário.");
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive shadow-md">
          <ShieldAlert className="size-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-xl font-bold text-foreground">Acesso Restrito ao Administrador</h2>
          <p className="text-sm text-muted-foreground">
            Apenas operadores com o perfil de Administrador Geral possuem permissão para gerenciar as credenciais e os níveis de acesso do sistema.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/">
            <ArrowLeft className="size-4 mr-2" />
            Voltar ao Painel Principal
          </Link>
        </Button>
      </div>
    );
  }

  const roleInfo = ROLE_DEFINITIONS[role];

  return (
    <div className="space-y-6 animate-rise">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display flex items-center gap-2.5">
            <Users className="size-7 text-primary" />
            Usuários & Níveis de Acesso
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Vincule membros cadastrados para liberar acessos ao sistema utilizando E-mail e CPF.
          </p>
        </div>

        <Button
          onClick={handleOpenNewUser}
          variant="premium"
          className="h-10 px-4 rounded-xl shadow-md gap-2 font-semibold shrink-0 cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Vincular Novo Usuário</span>
        </Button>
      </div>

      {/* Cards de Métricas e Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground font-medium">Total de Operadores</span>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {stats.ativos} ativos no sistema
            </span>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground font-medium">Administradores</span>
            <div className="text-2xl font-bold text-foreground">{stats.admins}</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
              Acesso irrestrito
            </span>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-purple-500/10 text-purple-500">
            <ShieldCheck className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground font-medium">Pastoral & Líderes</span>
            <div className="text-2xl font-bold text-foreground">{stats.pastores + stats.lideres}</div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              {stats.pastores} pastores &middot; {stats.lideres} líderes
            </span>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
            <Church className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground font-medium">Secretaria & Finanças</span>
            <div className="text-2xl font-bold text-foreground">{stats.secretaria + stats.tesouraria}</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Gestão eclesiástica
            </span>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <KeyRound className="size-5" />
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome do membro, e-mail institucional ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl text-xs sm:text-sm bg-background border-border/70"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro por Função / Perfil */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os Perfis</option>
            <option value="Administrador">Administrador</option>
            <option value="Pastor">Pastor</option>
            <option value="Secretaria">Secretária</option>
            <option value="Tesoureiro">Tesoureiro</option>
            <option value="Líder">Líder de Célula</option>
          </select>

          {/* Filtro por Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os Status</option>
            <option value="Ativo">Apenas Ativos</option>
            <option value="Inativo">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards de Usuários */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-3xl border bg-card p-12 text-center space-y-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-muted mx-auto text-muted-foreground">
            <Users className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Nenhum operador encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Não foram localizados usuários correspondentes aos filtros aplicados. Tente ajustar o termo de busca ou adicione um novo operador.
          </p>
          <Button onClick={handleOpenNewUser} variant="outline" className="rounded-xl text-xs gap-1.5 mt-2">
            <Plus className="size-3.5" />
            Vincular Primeiro Membro
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.Secretaria;
            const isMe = currentLoggedUser?.id === u.id;

            return (
              <div
                key={u.id}
                className="group relative rounded-3xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Faixa decorativa superior com gradiente sutil */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 opacity-70" />

                <div className="space-y-4">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-sm ring-2 ring-primary/20 shrink-0">
                        {u.avatar || "US"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-foreground truncate">{u.name}</h3>
                          {isMe && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary text-primary bg-primary/5">
                              Você
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.cargo || roleDef.label}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className="cursor-pointer"
                      title={u.status === "Ativo" ? "Clique para desativar o usuário" : "Clique para reativar"}
                    >
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold gap-1 px-2 py-0.5 rounded-full transition-colors ${
                          u.status === "Ativo"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            u.status === "Ativo" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                          }`}
                        />
                        {u.status}
                      </Badge>
                    </button>
                  </div>

                  {/* Informações de Credenciais (E-mail e CPF) */}
                  <div className="rounded-2xl border bg-muted/40 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Mail className="size-3.5 text-primary" />
                        E-mail de Login
                      </span>
                      <span className="font-mono text-foreground font-medium truncate max-w-[170px]" title={u.email}>
                        {u.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/50">
                      <span className="flex items-center gap-1.5 font-medium">
                        <KeyRound className="size-3.5 text-amber-500" />
                        Senha / Acesso (CPF)
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {u.cpf}
                      </span>
                    </div>
                  </div>

                  {/* Perfil & Nível de Acesso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="size-3 text-primary" />
                        Perfil Atribuído:
                      </span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${roleDef.badgeClass}`}>
                        {roleDef.label}
                      </Badge>
                    </div>

                    {/* Módulos Liberados */}
                    <div>
                      <div className="text-[10px] text-muted-foreground font-medium mb-1.5">
                        Módulos liberados ({roleDef.modules.length}):
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar">
                        {roleDef.modules.slice(0, 5).map((mod) => (
                          <span
                            key={mod.path}
                            className="text-[9.5px] bg-background border px-1.5 py-0.5 rounded-md text-muted-foreground font-medium"
                          >
                            {mod.name}
                          </span>
                        ))}
                        {roleDef.modules.length > 5 && (
                          <span className="text-[9.5px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-md">
                            +{roleDef.modules.length - 5} módulos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="mt-5 pt-3.5 border-t flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditUser(u)}
                      className="h-8 px-2.5 rounded-xl text-xs gap-1 text-foreground hover:border-primary hover:text-primary cursor-pointer"
                    >
                      <Edit2 className="size-3.5" />
                      <span>Editar</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleUserStatus(u.id)}
                      disabled={isMe}
                      className="h-8 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      title={u.status === "Ativo" ? "Desativar acesso" : "Ativar acesso"}
                    >
                      {u.status === "Ativo" ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5 text-emerald-500" />}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(u.id, u.name)}
                    disabled={isMe}
                    className="h-8 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    title={isMe ? "Você não pode excluir sua própria conta" : "Remover usuário"}
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    <span>Excluir</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Dialog de Cadastro & Edição de Usuário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wide uppercase">
              <KeyRound className="size-4" />
              Controle de Acesso Institucional
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold font-display">
              {editingUser ? "Editar Operador do Sistema" : "Vincular Membro & Criar Acesso"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Selecione um membro cadastrado da congregação para vincular o perfil e liberar o login pelo E-mail e CPF.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-3">
            {/* Campo 1: Autocomplete de Membro Cadastrado */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  Membro da Congregação (Busca em Tempo Real)
                </Label>
                {selectedMemberId && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Membro Vinculado
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Digite o nome do membro cadastrado para vincular..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setName(e.target.value);
                    setIsMemberDropdownOpen(true);
                  }}
                  onFocus={() => setIsMemberDropdownOpen(true)}
                  className="pl-10 h-11 rounded-xl text-sm bg-background"
                />
                {memberSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSearch("");
                      setName("");
                      setSelectedMemberId("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Lista suspensa de resultados do membro */}
              {isMemberDropdownOpen && filteredMembers.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 rounded-2xl border bg-popover shadow-xl max-h-56 overflow-y-auto p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95">
                  <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                    Membros encontrados no cadastro ({filteredMembers.length})
                  </div>
                  {filteredMembers.map((m) => {
                    const mName = m.nome || m.name || "";
                    const mCargo = m.cargo || m.role || "Membro";
                    const isSelected = selectedMemberId === m.id;

                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => handleSelectMember(m)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                            {mName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate">{mName}</div>
                            <div className="text-[10.5px] text-muted-foreground truncate">
                              CPF: {m.cpf || "Não informado"} &middot; {mCargo}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <Check className="size-4 text-primary shrink-0" />
                        ) : (
                          <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-md bg-primary/10 shrink-0">
                            Selecionar
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Linha com E-mail e CPF (as duas credenciais de acesso) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="user-email" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-primary" />
                  E-mail de Login
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  required
                  placeholder="ex: operador@eclesiapro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl text-sm"
                />
                <span className="text-[10.5px] text-muted-foreground">
                  Identificador para entrar no sistema.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-cpf" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-amber-500" />
                  CPF do Membro (Senha de Acesso)
                </Label>
                <Input
                  id="user-cpf"
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  maxLength={14}
                  className="h-10 rounded-xl text-sm font-mono"
                />
                <span className="text-[10.5px] text-muted-foreground">
                  O CPF será a senha de acesso ao painel.
                </span>
              </div>
            </div>

            {/* Linha com Função/Cargo customizado */}
            <div className="space-y-1.5">
              <Label htmlFor="user-cargo" className="text-xs font-bold text-foreground">
                Título / Cargo Exibido (Opcional)
              </Label>
              <Input
                id="user-cargo"
                placeholder={ROLE_DEFINITIONS[role].label}
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="h-10 rounded-xl text-sm"
              />
            </div>

            {/* Seleção do Perfil & Nível de Acesso */}
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Perfil & Nível de Acesso do Operador
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Define quais telas e ações serão liberadas
                </span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((rKey) => {
                  const item = ROLE_DEFINITIONS[rKey];
                  const isSelected = role === rKey;

                  return (
                    <button
                      type="button"
                      key={rKey}
                      onClick={() => setRole(rKey)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          {item.label}
                        </span>
                        {isSelected && <Check className="size-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-[10.5px] text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumo Visual das Permissões do Perfil Selecionado */}
            <div className="rounded-2xl border bg-muted/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  Módulos com acesso liberado para este perfil:
                </span>
                <Badge variant="outline" className={`text-[10px] font-bold ${roleInfo.badgeClass}`}>
                  {roleInfo.modules.length} Módulos
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {roleInfo.modules.map((m) => (
                  <span
                    key={m.path}
                    className="text-[10px] font-medium bg-background border px-2 py-0.5 rounded-lg text-foreground shadow-2xs"
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Aviso de Confirmação do Acesso */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>
                <strong>Acesso imediato:</strong> Este usuário poderá acessar o sistema informando o e-mail <code>{email || "seu.email"}</code> ou CPF, e a senha será o CPF <code>{cpf || "000.000.000-00"}</code>.
              </span>
            </div>

            {/* Botões do Rodapé com "Voltar" destacado */}
            <DialogFooter className="pt-2 gap-2 sm:gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-11 px-5 rounded-xl border-border/80 font-medium hover:bg-muted text-foreground cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="size-4" />
                <span>Voltar / Cancelar</span>
              </Button>

              <Button
                type="submit"
                variant="premium"
                className="h-11 px-6 rounded-xl font-bold gap-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                <span>{editingUser ? "Atualizar Usuário" : "Salvar & Conceder Acesso"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
