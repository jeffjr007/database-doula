import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, User, Shield, Bell, Palette, HelpCircle, LogOut, ChevronRight, Save, Loader2, Mail, Phone, Lock, Trash2, ExternalLink, Moon, Globe, FileText, MessageSquare, MapPin, Calendar, Linkedin } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Logo } from "@/components/Logo";
import LogoutModal from "@/components/LogoutModal";
type SettingsSection = "profile" | "security" | "notifications" | "appearance" | "support";
const SettingsPage = () => {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Notification preferences (local state for now)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      const {
        data
      } = await supabase.from("profiles").select("full_name, phone, avatar_url, age, location, linkedin_url").eq("user_id", user.id).single();
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAvatarUrl(data.avatar_url || "");
        setAge(data.age || "");
        setLocation(data.location || "");
        setLinkedinUrl(data.linkedin_url || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, authLoading, navigate]);

  // Show loading while auth is being checked
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }

  // If no user after loading, don't render (redirect will happen)
  if (!user) {
    return null;
  }
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const {
      error
    } = await supabase.from("profiles").update({
      full_name: fullName,
      phone: phone,
      age: age,
      location: location,
      linkedin_url: linkedinUrl,
      updated_at: new Date().toISOString()
    }).eq("user_id", user.id);

    // Invalidate cache so forms refresh
    sessionStorage.removeItem('user_personal_data_cache');
    if (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
    }
    setSaving(false);
  };
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive"
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }
    setChangingPassword(true);
    const {
      error
    } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso."
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };
  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('delete-account');
      if (error) {
        console.error('Delete account error:', error);
        toast({
          title: "Erro ao excluir conta",
          description: "Não foi possível excluir sua conta. Tente novamente.",
          variant: "destructive"
        });
        setDeletingAccount(false);
        return;
      }
      toast({
        title: "Conta excluída",
        description: "Sua conta foi removida com sucesso."
      });

      // Sign out and redirect
      await signOut();
      navigate("/auth");
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao excluir sua conta.",
        variant: "destructive"
      });
      setDeletingAccount(false);
    }
  };
  const sections = [{
    id: "profile" as const,
    label: "Perfil",
    icon: User
  }, {
    id: "security" as const,
    label: "Segurança",
    icon: Shield
  }, {
    id: "notifications" as const,
    label: "Notificações",
    icon: Bell
  }, {
    id: "appearance" as const,
    label: "Aparência",
    icon: Palette
  }, {
    id: "support" as const,
    label: "Ajuda",
    icon: HelpCircle
  }];
  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <motion.div key="profile" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Perfil</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie suas informações pessoais
              </p>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-5">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-2xl object-cover" /> : <User className="w-7 h-7 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Foto do perfil</p>
                  <p className="text-xs text-muted-foreground">Em breve você poderá alterar</p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Nome completo</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" className="h-12 bg-card/50 border-border/50 rounded-xl focus:border-primary/50" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input value={user?.email || ""} disabled className="h-12 bg-muted/20 border-border/30 rounded-xl text-muted-foreground" />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Telefone
                </Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="h-12 bg-card/50 border-border/50 rounded-xl focus:border-primary/50" />
              </div>

              {/* Age and Location Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Idade
                  </Label>
                  <Input value={age} onChange={e => setAge(e.target.value)} placeholder="Ex: 28 anos" className="h-12 bg-card/50 border-border/50 rounded-xl focus:border-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Localização
                  </Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="São Paulo, SP" className="h-12 bg-card/50 border-border/50 rounded-xl focus:border-primary/50" />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </Label>
                <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/seuperfil" className="h-12 bg-card/50 border-border/50 rounded-xl focus:border-primary/50" />
                <p className="text-xs text-muted-foreground">Será preenchido automaticamente nos formulários de CV e cartas</p>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar alterações
              </Button>
            </div>
          </motion.div>;
      case "security":
        return <motion.div key="security" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Segurança</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Proteja sua conta com configurações de segurança
              </p>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-6">
              {/* Change Password - TEMPORARILY DISABLED */}
              <div className="p-5 rounded-2xl bg-card/20 border border-border/30 space-y-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Alterar senha</p>
                    <p className="text-xs text-muted-foreground">Em breve disponível</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    Esta funcionalidade estará disponível em breve.
                  </p>
                </div>
              </div>

              {/* Delete Account */}
              <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Excluir conta</p>
                    <p className="text-xs text-muted-foreground">Esta ação é irreversível</p>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={deletingAccount} className="w-full h-11 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                      {deletingAccount ? <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Excluindo...
                        </> : "Excluir minha conta"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">⚠️ Excluir conta permanentemente</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>Esta ação <strong>não pode ser desfeita</strong>. Ao confirmar, serão removidos permanentemente:</p>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                          <li>Seu perfil e informações pessoais</li>
                          <li>Todos os CVs e cartas de apresentação</li>
                          <li>Histórico de conversas e progresso</li>
                          <li>Acesso à plataforma</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={deletingAccount} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                        {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Sim, excluir minha conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>;
      case "notifications":
        return <motion.div key="notifications" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Notificações</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Controle como você recebe atualizações
              </p>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Notificações por email</p>
                    <p className="text-xs text-muted-foreground">Receba atualizações importantes</p>
                  </div>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              {/* Progress Updates */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Atualizações de progresso</p>
                    <p className="text-xs text-muted-foreground">Lembretes sobre suas etapas</p>
                  </div>
                </div>
                <Switch checked={progressUpdates} onCheckedChange={setProgressUpdates} />
              </div>

              {/* Marketing Emails */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Emails promocionais</p>
                    <p className="text-xs text-muted-foreground">Novidades e ofertas especiais</p>
                  </div>
                </div>
                <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              </div>

              <p className="text-xs text-muted-foreground text-center pt-2">
                Configurações de notificação serão implementadas em breve
              </p>
            </div>
          </motion.div>;
      case "appearance":
        return <motion.div key="appearance" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Aparência</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Personalize a aparência da plataforma
              </p>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tema escuro</p>
                    <p className="text-xs text-muted-foreground">O tema padrão da plataforma</p>
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>

              {/* Language */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Idioma</p>
                    <p className="text-xs text-muted-foreground">Português (Brasil)</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted/20">
                  Em breve
                </span>
              </div>
            </div>
          </motion.div>;
      case "support":
        return <motion.div key="support" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Ajuda & Suporte</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Encontre respostas e entre em contato
              </p>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-4">
              {/* Support */}
              <button onClick={() => navigate("/suporte")} className="w-full flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40 hover:bg-card/60 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Central de Suporte</p>
                    <p className="text-xs text-muted-foreground">Envie suas dúvidas e problemas</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Terms */}
              <button onClick={() => window.open("#", "_blank")} className="w-full flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40 hover:bg-card/60 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Termos de Uso</p>
                    <p className="text-xs text-muted-foreground">Leia nossos termos e condições</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Privacy */}
              <button onClick={() => window.open("#", "_blank")} className="w-full flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40 hover:bg-card/60 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Política de Privacidade</p>
                    <p className="text-xs text-muted-foreground">Como protegemos seus dados</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Version */}
              <div className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Método Perfil Glorioso v1.0.0
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">© 2025 oDuarte. Todos os direitos reservados.</p>
              </div>
            </div>
          </motion.div>;
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <h1 className="font-display font-bold text-lg">Configurações</h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowLogoutModal(true)} className="text-muted-foreground hover:text-destructive gap-2 rounded-xl">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <LogoutModal open={showLogoutModal} onComplete={async () => {
      await signOut();
      navigate('/auth');
    }} />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-1">
              {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return <button key={section.id} onClick={() => setActiveSection(section.id)} className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                      ${isActive ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:bg-card/50 hover:text-foreground border border-transparent"}
                    `}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{section.label}</span>
                  </button>;
            })}
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/40 p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default SettingsPage;