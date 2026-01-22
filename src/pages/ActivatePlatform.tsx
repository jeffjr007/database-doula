import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, KeyRound, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import logoAd from "@/assets/logo-ad.png";
import WelcomeMentorModal from "@/components/WelcomeMentorModal";

const ActivatePlatform = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [checkingActivation, setCheckingActivation] = useState(true);

  // Form state
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkActivation = async () => {
      // Wait for auth to load
      if (authLoading) return;
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Wait for admin check to complete
      if (adminLoading) return;

      // Admins bypass activation - use window.location to force full reload
      if (isAdmin) {
        // Use SPA navigation to avoid full remount loops.
        navigate("/", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("platform_activated")
        .eq("user_id", user.id)
        .single();

      if (profile?.platform_activated) {
        navigate("/", { replace: true });
        return;
      }

      setCheckingActivation(false);
    };

    checkActivation();
  }, [user, authLoading, adminLoading, isAdmin, navigate]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setLoading(true);

    try {
      const { data: inviteCode, error: fetchError } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .single();

      if (fetchError || !inviteCode) {
        setError("Código inválido. Verifique e tente novamente.");
        setLoading(false);
        return;
      }

      if (inviteCode.used) {
        setError("Este código já foi utilizado.");
        setLoading(false);
        return;
      }

      if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
        setError("Este código expirou.");
        setLoading(false);
        return;
      }

      // Mark code as used
      const { error: updateCodeError } = await supabase
        .from("invite_codes")
        .update({
          used: true,
          used_at: new Date().toISOString(),
          used_by: user.id,
        })
        .eq("id", inviteCode.id);

      if (updateCodeError) throw updateCodeError;

      // Activate platform for user
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ platform_activated: true })
        .eq("user_id", user.id);

      if (updateProfileError) throw updateProfileError;

      setSuccess(true);
      toast.success("Plataforma ativada com sucesso!");

      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 800);
    } catch (err) {
      console.error("Erro ao ativar plataforma:", err);
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeComplete = () => {
    // Persist that the user has completed the welcome animation.
    // This is used by Portal to decide whether to show follow-up modals (e.g., gift/learning path).
    if (user?.id) {
      const welcomeSeenKey = `welcome_seen_${user.id}`;
      localStorage.setItem(welcomeSeenKey, 'true');
    }
    setShowWelcomeModal(false);
    navigate("/");
  };

  if (authLoading || adminLoading || checkingActivation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between py-4 px-4 md:px-6"
      >
        <img src={logoAd} alt="AD Logo" className="h-14 w-auto" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {success ? (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-semibold text-foreground">Plataforma Ativada!</h3>
              <p className="text-sm text-muted-foreground mt-1">Preparando sua jornada...</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-10 h-10 text-primary" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Ative sua Mentoria
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Insira o código de convite que você recebeu para liberar acesso completo às etapas da mentoria.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-foreground font-medium">
                      Código de Convite
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Ex: ABC123"
                      className="text-center text-lg font-mono tracking-widest h-14 border-2 focus:border-primary transition-colors"
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <motion.p
                      className="text-destructive text-sm text-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="w-full h-12 text-base font-semibold rounded-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Ativar Plataforma"
                    )}
                  </Button>
                </div>
              </form>

              {/* Footer note */}
              <p className="text-xs text-muted-foreground text-center mt-6">
                O código é enviado em até 48h após a confirmação da compra.
                <br />
                Dúvidas? Entre em contato com o suporte.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Welcome Modal */}
      <WelcomeMentorModal
        open={showWelcomeModal}
        onComplete={handleWelcomeComplete}
      />
    </div>
  );
};

export default ActivatePlatform;
