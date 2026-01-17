import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowRight, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full max-w-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="text-2xl font-display font-bold text-gradient">
            Perfil Glorioso
          </div>
        </motion.div>

        {/* Card - Fixed dimensions */}
        <motion.div
          variants={itemVariants}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 min-h-[480px] flex flex-col"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h1 className="text-2xl font-display font-semibold text-foreground mb-1">
              {isLogin ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin
                ? 'Acesse sua conta para continuar'
                : 'Preencha os dados abaixo'}
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <Label htmlFor="name" className="text-foreground/70 flex items-center gap-2 text-xs">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Nome completo
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className="h-11 bg-secondary/30 border-border/40 focus:border-primary/50 rounded-xl text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground/70 flex items-center gap-2 text-xs">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-secondary/30 border-border/40 focus:border-primary/50 rounded-xl text-sm"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground/70 flex items-center gap-2 text-xs">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-secondary/30 border-border/40 focus:border-primary/50 rounded-xl text-sm"
                />
              </motion.div>

              {/* Password requirements - Fixed height container, always visible in signup */}
              <div className={`h-[72px] transition-opacity duration-200 ${!isLogin ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 p-3 bg-secondary/20 rounded-lg border border-border/20">
                  <PasswordRequirement met={passwordRequirements.minLength} text="8+ caracteres" />
                  <PasswordRequirement met={passwordRequirements.hasUppercase} text="Maiúscula" />
                  <PasswordRequirement met={passwordRequirements.hasLowercase} text="Minúscula" />
                  <PasswordRequirement met={passwordRequirements.hasNumber} text="Número" />
                  <PasswordRequirement met={passwordRequirements.hasSpecial} text="Especial (!@#...)" />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <motion.div variants={itemVariants} className="mt-4">
              <Button
                type="submit"
                className="w-full h-11 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>{isLogin ? 'Entrando...' : 'Criando...'}</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? 'Entrar' : 'Criar conta'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Toggle */}
          <motion.div variants={itemVariants} className="text-center mt-4 pt-4 border-t border-border/30">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword('');
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
          className="text-center text-[10px] text-muted-foreground/40 mt-6"
        >
          Método Perfil Glorioso
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Auth;
