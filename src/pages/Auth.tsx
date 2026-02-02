import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight, Check, Phone, Bell, FileText, MapPin, Calendar, Linkedin, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoAD from "@/assets/logo-ad.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [nacionalidade, setNacionalidade] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const goNextStep = () => setStep(2);
  const goBackStep = () => setStep(1);

  const isStep1Valid = fullName.trim() && phone.trim() && age.trim() && location.trim() && nacionalidade.trim();
  const passwordRequirements = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password],
  );

  const isPasswordValid = useMemo(() => Object.values(passwordRequirements).every(Boolean), [passwordRequirements]);

  const requirementsMet = useMemo(
    () => Object.values(passwordRequirements).filter(Boolean).length,
    [passwordRequirements],
  );

  useEffect(() => {
    if (user) window.location.href = "/";
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && !isPasswordValid) {
      toast({
        title: "Senha inválida",
        description: "A senha não atende aos requisitos mínimos.",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && !acceptTerms) {
      toast({
        title: "Aceite os termos",
        description: "Você precisa aceitar os termos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
              age,
              location,
              linkedin_url: linkedinUrl,
              nacionalidade,
              email_notifications: emailNotifications,
            },
          },
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* glow background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* logo */}
        <div className="flex justify-center mb-8">
          <img src={logoAD} className="w-16 h-16 rounded-2xl" />
        </div>

        {/* step indicator */}
        {!isLogin && (
          <div className="flex justify-center gap-2 mb-6">
            <div className={`h-1 w-16 rounded-full ${step === 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1 w-16 rounded-full ${step === 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        )}

        <form onSubmit={step === 2 || isLogin ? handleSubmit : (e) => e.preventDefault()}>
          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {!isLogin && step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Nacionalidade"
                    value={nacionalidade}
                    onChange={(e) => setNacionalidade(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Idade" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Localização"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="LinkedIn (opcional)"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>

                <Button type="button" disabled={!isStep1Valid} onClick={goNextStep} className="w-full">
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {(isLogin || step === 2) && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {!isLogin && (
                  <Button type="button" variant="ghost" onClick={goBackStep}>
                    ← Voltar
                  </Button>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      className="pl-10"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {!isLogin && password && (
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            requirementsMet <= 1
                              ? "bg-destructive"
                              : requirementsMet <= 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${(requirementsMet / 5) * 100}%` }}
                        />
                      </div>
                      <p className={`text-xs ${
                        requirementsMet <= 1
                          ? "text-destructive"
                          : requirementsMet <= 3
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}>
                        {requirementsMet <= 1 ? "Fraca" : requirementsMet <= 3 ? "Média" : "Forte"}
                      </p>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={emailNotifications}
                        onCheckedChange={(v) => setEmailNotifications(v as boolean)}
                      />
                      Receber notificações
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v as boolean)} />
                      Aceito os termos
                    </label>
                  </>
                )}

                <Button disabled={loading || (!isLogin && !acceptTerms)} className="w-full">
                  {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* toggle login/signup */}
        <div className="text-center mt-6 text-sm">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setStep(1);
            }}
            className="text-primary hover:underline"
          >
            {isLogin ? "Criar conta" : "Já tem conta? Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
