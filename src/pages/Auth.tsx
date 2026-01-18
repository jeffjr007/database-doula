import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowRight, Check, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoAD from "@/assets/logo-ad.png";

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className={`flex items-center gap-1.5 text-[10px] transition-colors duration-200 ${met ? 'text-primary' : 'text-muted-foreground/60'}`}>
    {met ? (
      <Check className="w-3 h-3" />
    ) : (
      <X className="w-3 h-3" />
    )}
    <span className={met ? 'line-through opacity-60' : ''}>{text}</span>
  </div>
);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordRequirements = useMemo(() => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const isPasswordValid = useMemo(() =>
    Object.values(passwordRequirements).every(Boolean),
    [passwordRequirements]
  );

  useEffect(() => {
    if (user) {
      const pendingCV = localStorage.getItem('pending_cv');
      if (pendingCV) {
        window.location.href = '/?openSaveModal=true';
      } else {
        window.location.href = '/';
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && !isPasswordValid) {
      toast({
        title: "Senha inválida",
        description: "A senha não atende aos requisitos mínimos de segurança.",
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

        toast({
          title: "Bem-vindo de volta!",
          description: "Login realizado com sucesso!",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });
        if (error) throw error;

        toast({
          title: "Conta criada!",
          description: "Sua conta foi criada com sucesso!",
        });
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes('User already registered')) {
        message = 'Este email já está cadastrado. Tente fazer login!';
      } else if (message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      }

      toast({
        title: "Ops!",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 md:p-4">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Main content */}
      <motion.div
        className={`relative z-10 w-full transition-all duration-300 ${isLogin ? 'max-w-sm' : 'max-w-md'}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6 md:mb-8">
          <img
            src={logoAD}
            alt="AD Logo"
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-lg"
          />
        </motion.div>

        {/* Card - Mobile First */}
        <motion.div
          variants={itemVariants}
          className="mobile-card-elevated md:bg-card/50 md:backdrop-blur-sm md:border md:border-border/50 md:rounded-2xl md:p-6 flex flex-col"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-6 md:mb-6">
            <h1 className="mobile-title md:text-2xl text-foreground mb-2 md:mb-1">
              {isLogin ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="mobile-caption md:text-sm">
              {isLogin
                ? 'Acesse sua conta para continuar'
                : 'Preencha os dados abaixo'}
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-4 md:space-y-4 flex-1">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Name and Phone in a row on desktop, stacked on mobile */}
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:space-y-1.5">
                        <Label htmlFor="name" className="text-foreground/70 flex items-center gap-2 text-sm md:text-xs">
                          <User className="w-4 h-4 md:w-3.5 md:h-3.5 text-primary" />
                          Nome completo
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Seu nome"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required={!isLogin}
                          className="mobile-input md:h-11 md:min-h-0 md:text-sm md:rounded-xl"
                        />
                      </div>

                      <div className="space-y-2 md:space-y-1.5">
                        <Label htmlFor="phone" className="text-foreground/70 flex items-center gap-2 text-sm md:text-xs">
                          <Phone className="w-4 h-4 md:w-3.5 md:h-3.5 text-primary" />
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required={!isLogin}
                          className="mobile-input md:h-11 md:min-h-0 md:text-sm md:rounded-xl"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email - always full width */}
              <motion.div variants={itemVariants} className="space-y-2 md:space-y-1.5">
                <Label htmlFor="email" className="text-foreground/70 flex items-center gap-2 text-sm md:text-xs">
                  <Mail className="w-4 h-4 md:w-3.5 md:h-3.5 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mobile-input md:h-11 md:min-h-0 md:text-sm md:rounded-xl"
                />
              </motion.div>

              {/* Password and requirements */}
              {!isLogin ? (
                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                  <motion.div variants={itemVariants} className="space-y-2 md:space-y-1.5">
                    <Label htmlFor="password" className="text-foreground/70 flex items-center gap-2 text-sm md:text-xs">
                      <Lock className="w-4 h-4 md:w-3.5 md:h-3.5 text-primary" />
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="mobile-input md:h-11 md:min-h-0 md:text-sm md:rounded-xl"
                    />
                  </motion.div>

                  {/* Password requirements */}
                  <div className="flex items-end">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:gap-y-1 p-4 md:p-3 bg-secondary/30 rounded-2xl md:rounded-lg border border-border/20 w-full">
                      <PasswordRequirement met={passwordRequirements.minLength} text="8+ caracteres" />
                      <PasswordRequirement met={passwordRequirements.hasUppercase} text="Maiúscula" />
                      <PasswordRequirement met={passwordRequirements.hasLowercase} text="Minúscula" />
                      <PasswordRequirement met={passwordRequirements.hasNumber} text="Número" />
                      <PasswordRequirement met={passwordRequirements.hasSpecial} text="Especial (!@#...)" />
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div variants={itemVariants} className="space-y-2 md:space-y-1.5">
                  <Label htmlFor="password" className="text-foreground/70 flex items-center gap-2 text-sm md:text-xs">
                    <Lock className="w-4 h-4 md:w-3.5 md:h-3.5 text-primary" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mobile-input md:h-11 md:min-h-0 md:text-sm md:rounded-xl"
                  />
                </motion.div>
              )}
            </div>

            {/* Submit button - Mobile First */}
            <motion.div variants={itemVariants} className="mt-6 md:mt-4">
              <Button
                type="submit"
                className="mobile-btn-primary w-full md:h-11 md:min-h-0 md:text-sm md:rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 md:w-4 md:h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>{isLogin ? 'Entrando...' : 'Criando...'}</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? 'Entrar' : 'Criar conta'}
                    <ArrowRight className="w-5 h-5 md:w-4 md:h-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Toggle */}
          <motion.div variants={itemVariants} className="text-center mt-6 md:mt-4 pt-5 md:pt-4 border-t border-border/30">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword('');
              }}
              className="text-sm md:text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {isLogin ? (
                <>Não tem conta? <span className="text-primary font-medium">Criar</span></>
              ) : (
                <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>
              )}
            </button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="text-center text-xs md:text-[10px] text-muted-foreground/40 mt-6"
        >
          Método Perfil Glorioso
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Auth;
