import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  FileText,
  UserCheck,
  Briefcase,
  Target,
  Crown,
  LogIn,
  LogOut,
  User,
  ChevronRight,
  Lock,
  Linkedin,
  Shield,
  Check
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import logoAD from "@/assets/logo-ad.png";
import mentorPhoto from "@/assets/mentor-photo.png";

import { StageWarningModal } from "@/components/StageWarningModal";
import WelcomeMentorModal from "@/components/WelcomeMentorModal";

interface StageProgress {
  stage_number: number;
  completed: boolean;
  current_step: number;
}

interface LinkedInDiagnostic {
  status: string;
}

interface OpportunityFunnel {
  status: string;
}

interface SavedCV {
  id: string;
  name: string;
  cv_data: any;
}

const stages = [
  {
    number: 1,
    title: "LinkedIn Estratégico",
    description: "Seu diagnóstico completo do LinkedIn com todas as seções reformuladas",
    icon: Linkedin,
    path: "/etapa/1",
    color: "from-violet-500/30 to-cyan-500/20",
    isDeliverable: true,
  },
  {
    number: 2,
    title: "Gerador de CV",
    description: "Crie seu currículo estratégico com IA, otimizado para indicações diretas",
    icon: FileText,
    path: "/cv",
    color: "from-primary/30 to-accent/20",
    isDeliverable: false,
  },
  {
    number: 3,
    title: "Funil de Oportunidades",
    description: "Seu funil personalizado para conquistar as melhores vagas",
    icon: Target,
    path: "/etapa/3",
    color: "from-cyan-500/30 to-violet-500/20",
    isDeliverable: true,
  },
  {
    number: 4,
    title: "Convencer Recrutador",
    description: "Monte seu roteiro de entrevista com palavras-chave da vaga",
    icon: UserCheck,
    path: "/etapa/4",
    color: "from-blue-500/30 to-purple-500/20",
    isDeliverable: false,
  },
  {
    number: 5,
    title: "Convencer Gestor",
    description: "Transforme seu roteiro em apresentação e mostre autoridade",
    icon: Briefcase,
    path: "/etapa/5",
    color: "from-purple-500/30 to-pink-500/20",
    isDeliverable: false,
  },
  {
    number: 6,
    title: "Estratégias Gupy",
    description: "Otimize seu perfil na Gupy para passar no ATS",
    icon: Target,
    path: "/etapa/6",
    color: "from-indigo-500/30 to-cyan-500/20",
    isDeliverable: false,
  },
];

const impactPhrases = [
  "Sua história profissional merece ser contada da forma certa.",
  "Transforme experiências em narrativas que convencem.",
  "O método que coloca você na frente dos recrutadores.",
  "Cada detalhe do seu perfil é uma oportunidade de impressionar.",
];

const Portal = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [progress, setProgress] = useState<StageProgress[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [linkedinDiagnostic, setLinkedinDiagnostic] = useState<LinkedInDiagnostic | null>(null);
  const [opportunityFunnel, setOpportunityFunnel] = useState<OpportunityFunnel | null>(null);
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [platformActivated, setPlatformActivated] = useState<boolean | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [warningModal, setWarningModal] = useState<{ open: boolean; type: 'linkedin-cv' | 'linkedin-gupy'; targetPath: string }>({
    open: false,
    type: 'linkedin-cv',
    targetPath: '',
  });
  const [currentPhrase] = useState(() =>
    impactPhrases[Math.floor(Math.random() * impactPhrases.length)]
  );

  useEffect(() => {
    // Sequência de animação conversacional
    const titleTimer = setTimeout(() => setShowTitle(true), 300);
    const phraseTimer = setTimeout(() => setShowPhrase(true), 1200);
    const contentTimer = setTimeout(() => setShowContent(true), 2200);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(phraseTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      // Wait admin role check to avoid redirect loops
      if (adminLoading) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, platform_activated')
        .eq('user_id', user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0]);
      }

      // Admins bypass activation
      const activated = isAdmin ? true : (profile?.platform_activated ?? false);
      setPlatformActivated(activated);

      // Redirect to activation page if not activated (non-admin only)
      if (!activated) {
        navigate('/ativar');
        return;
      }

      const { data: progressData } = await supabase
        .from('mentoring_progress')
        .select('stage_number, completed, current_step')
        .eq('user_id', user.id);

      if (progressData) {
        setProgress(progressData);
      }

      // Fetch deliverables status
      const { data: diagnosticData } = await supabase
        .from('linkedin_diagnostics')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .maybeSingle();

      if (diagnosticData) {
        setLinkedinDiagnostic(diagnosticData);
      }

      const { data: funnelData } = await supabase
        .from('opportunity_funnels')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .maybeSingle();

      if (funnelData) {
        setOpportunityFunnel(funnelData);
      }

      // Fetch saved CVs to check for personalized and ATS
      const { data: cvsData } = await supabase
        .from('saved_cvs')
        .select('id, name, cv_data')
        .eq('user_id', user.id);

      if (cvsData) {
        setSavedCVs(cvsData);
      }
    };

    fetchData();
  }, [user?.id, adminLoading, isAdmin, navigate]);

  // Check if user has both CV types
  const hasPersonalizedCV = savedCVs.some(cv => {
    const data = cv.cv_data as any;
    return data?.sumario && !data?.isATS;
  });

  const hasATSCV = savedCVs.some(cv => {
    const data = cv.cv_data as any;
    return data?.isATS === true;
  });

  const hasBothCVTypes = hasPersonalizedCV && hasATSCV;

  const getStageStatus = (stageNumber: number) => {
    if (stageNumber === 1) {
      return linkedinDiagnostic?.status === 'published' ? 'available' : 'pending';
    }
    if (stageNumber === 3) {
      return opportunityFunnel?.status === 'published' ? 'available' : 'pending';
    }

    const stageProgress = progress.find(p => p.stage_number === stageNumber);
    if (stageProgress?.completed) return 'completed';
    if (stageProgress) return 'in_progress';
    return 'not_started';
  };

  const isStageBlocked = (stageNumber: number) => {
    if (stageNumber === 1) {
      return linkedinDiagnostic?.status !== 'published';
    }

    if (stageNumber === 2) {
      return false;
    }

    if (stageNumber === 3) {
      return !hasBothCVTypes;
    }

    if (stageNumber === 4) {
      return false;
    }

    if (stageNumber === 5) {
      const stage4Status = getStageStatus(4);
      return stage4Status !== 'completed';
    }

    return false;
  };

  const getStageWarning = (stageNumber: number): 'linkedin-cv' | 'linkedin-gupy' | null => {
    if (stageNumber === 2) return 'linkedin-cv';
    if (stageNumber === 6) return 'linkedin-gupy';
    return null;
  };

  const handleStageClick = (stage: typeof stages[0]) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!platformActivated) {
      return;
    }

    if (isStageBlocked(stage.number)) {
      return;
    }

    const warning = getStageWarning(stage.number);
    if (warning) {
      setWarningModal({ open: true, type: warning, targetPath: stage.path });
      return;
    }

    navigate(stage.path);
  };

  const handleWarningConfirm = () => {
    navigate(warningModal.targetPath);
    setWarningModal({ ...warningModal, open: false });
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Space Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Nebula glows */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[80px]" />
        {/* Star field overlay */}
        <div className="absolute inset-0 starfield opacity-40" />
        {/* Floating orbs */}
        <div className="absolute top-20 right-20 w-3 h-3 bg-cyan-400 rounded-full animate-star-twinkle" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-40 w-2 h-2 bg-violet-400 rounded-full animate-star-twinkle" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-40 right-60 w-2 h-2 bg-purple-400 rounded-full animate-star-twinkle" style={{ animationDelay: '1s' }} />
        <div className="absolute top-60 left-[60%] w-2 h-2 bg-cyan-300 rounded-full animate-star-twinkle" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Mentor Photo - Left Side (Desktop Only) */}
      <motion.div
        className="hidden lg:block fixed left-0 top-0 h-full w-[45%] z-0"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative h-full w-full">
          <img
            src={mentorPhoto}
            alt="Adriano Duarte - Mentor"
            className="h-full w-full object-cover object-center grayscale"
          />
          {/* Gradient overlay to blend with background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between py-4 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={logoAD}
            alt="AD Logo"
            className="w-12 h-12 rounded-lg"
          />
        </motion.div>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {user ? (
            <>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="gap-2 border-primary/30 hover:bg-primary/10"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <User className="w-3 h-3" />
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-2 relative z-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/auth'}
              className="gap-2 border-primary/30 hover:bg-primary/10"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </Button>
          )}
        </motion.div>
      </nav>

      {/* Main Content - Pushed to the right on desktop */}
      <div className="relative z-10 flex flex-col min-h-[calc(100vh-80px)] lg:ml-[40%]">
        {/* Hero Section with Conversational Animation */}
        <header className="py-12 px-4 lg:px-8 xl:px-16">
          <AnimatePresence>
            {showTitle && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-6"
              >
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/30 backdrop-blur-sm">
                  <Crown className="w-6 h-6 text-primary" />
                  <span className="text-lg md:text-xl font-display font-bold text-primary tracking-wide">
                    Método Perfil Glorioso
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPhrase && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-8"
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight max-w-xl">
                  <span className="text-gradient">{currentPhrase}</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPhrase && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              >
                {user && userName && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bem-vindo de volta,</p>
                      <p className="text-lg font-semibold text-foreground">{userName}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Stages Section */}
        <AnimatePresence>
          {showContent && (
            <motion.main
              className="flex-1 px-4 lg:px-8 xl:px-16 pb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  Escolha sua próxima etapa
                </h2>
                <p className="text-sm text-muted-foreground">
                  Continue sua jornada de transformação profissional
                </p>
              </motion.div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
                {stages.map((stage, index) => {
                  const status = getStageStatus(stage.number);
                  const blocked = isStageBlocked(stage.number);
                  const Icon = stage.icon;
                  const isCompleted = status === 'completed';

                  return (
                    <motion.button
                      key={stage.number}
                      onClick={() => handleStageClick(stage)}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      whileHover={!blocked ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!blocked ? { scale: 0.98 } : {}}
                      className={`
                        group relative p-4 rounded-xl border
                        bg-secondary/30 backdrop-blur-sm
                        transition-all duration-300
                        text-left
                        ${blocked
                          ? 'opacity-40 cursor-not-allowed border-border/30'
                          : 'border-border/50 hover:border-primary/40 hover:bg-secondary/50 cursor-pointer'
                        }
                        ${isCompleted ? 'border-green-500/30' : ''}
                      `}
                      disabled={blocked}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          relative p-2.5 rounded-lg transition-colors
                          ${isCompleted
                            ? 'bg-green-500/10'
                            : blocked
                              ? 'bg-muted/30'
                              : 'bg-primary/10 group-hover:bg-primary/20'
                          }
                        `}>
                          <Icon className={`w-4 h-4 ${
                            isCompleted
                              ? 'text-green-500'
                              : blocked
                                ? 'text-muted-foreground/50'
                                : 'text-primary'
                          }`} />

                          {isCompleted && (
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-1.5 h-1.5 text-background" strokeWidth={4} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/60 font-mono">{stage.number}</span>
                            <h3 className={`font-medium text-sm truncate ${
                              blocked ? 'text-muted-foreground/50' : 'text-foreground group-hover:text-primary'
                            } transition-colors`}>
                              {stage.title}
                            </h3>
                          </div>
                          <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mt-0.5">
                            {stage.description}
                          </p>
                        </div>

                        {blocked ? (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Motivational footer */}
              <motion.div
                className="mt-8 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 max-w-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-sm text-muted-foreground italic text-center">
                  "Cada etapa foi desenvolvida para te guiar passo a passo na sua recolocação profissional."
                </p>
              </motion.div>
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* Welcome Mentor Modal */}
      <WelcomeMentorModal
        open={showWelcomeModal}
        onComplete={handleWelcomeComplete}
      />

      {/* Stage Warning Modal */}
      <StageWarningModal
        open={warningModal.open}
        onClose={() => setWarningModal({ ...warningModal, open: false })}
        onConfirm={handleWarningConfirm}
        type={warningModal.type}
      />
    </div>
  );
};

export default Portal;
