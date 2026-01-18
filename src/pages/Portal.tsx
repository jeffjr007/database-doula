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
import { Stage3WelcomeModal } from "@/components/Stage3WelcomeModal";
import { SupportButton } from "@/components/SupportButton";

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
    color: "from-[#0077B5]/20 to-primary/10",
    isDeliverable: true,
  },
  {
    number: 2,
    title: "Gerador de CV",
    description: "Crie seu currículo estratégico com IA, otimizado para indicações diretas",
    icon: FileText,
    path: "/cv",
    color: "from-primary/20 to-accent/10",
    isDeliverable: false,
  },
  {
    number: 3,
    title: "Funil de Oportunidades",
    description: "Seu funil personalizado para conquistar as melhores vagas",
    icon: Target,
    path: "/etapa/3",
    color: "from-accent/20 to-primary/10",
    isDeliverable: true,
  },
  {
    number: 4,
    title: "Convencer Recrutador",
    description: "Monte seu roteiro de entrevista com palavras-chave da vaga",
    icon: UserCheck,
    path: "/etapa/4",
    color: "from-blue-500/20 to-primary/10",
    isDeliverable: false,
  },
  {
    number: 5,
    title: "Convencer Gestor",
    description: "Transforme seu roteiro em apresentação e mostre autoridade",
    icon: Briefcase,
    path: "/etapa/5",
    color: "from-purple-500/20 to-primary/10",
    isDeliverable: false,
  },
  {
    number: 6,
    title: "Estratégias Gupy",
    description: "Otimize seu perfil na Gupy para passar no ATS",
    icon: Target,
    path: "/etapa/6",
    color: "from-green-500/20 to-primary/10",
    isDeliverable: false,
  },
];

const impactPhrases = [
  "Conquiste a vaga dos seus sonhos.",
  "Destaque-se no mercado.",
  "Sua carreira, outro nível.",
  "O perfil que impressiona.",
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
  const [stage2Unlocked, setStage2Unlocked] = useState<boolean>(false);
  const [stage2Completed, setStage2Completed] = useState<boolean>(false);
  const [showStage3Modal, setShowStage3Modal] = useState(false);
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
        .select('full_name, platform_activated, stage2_unlocked, stage2_completed')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setStage2Unlocked(profile.stage2_unlocked ?? false);
        setStage2Completed(profile.stage2_completed ?? false);
      }

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
      return !stage2Unlocked;
    }

    if (stageNumber === 3) {
      return false;
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

    // Stage 3: Only navigate if funnel is published, otherwise show modal
    if (stage.number === 3) {
      if (opportunityFunnel?.status === 'published') {
        navigate(stage.path);
      } else {
        // No funnel - show modal (or show again)
        setShowStage3Modal(true);
      }
      return;
    }

    navigate(stage.path);
  };

  const handleStage3Continue = () => {
    // Only navigate to Stage 3 if there's a published funnel
    if (opportunityFunnel?.status === 'published') {
      navigate('/etapa/3');
    }
    // Otherwise just close the modal (user stays on Portal)
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
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Mentor Photo Background - Mobile */}
      <motion.div
        className="lg:hidden fixed inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div className="relative h-full w-full">
          <img
            src={mentorPhoto}
            alt=""
            className="h-full w-full object-cover object-top opacity-[0.08]"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
      </motion.div>

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

      {/* Navigation - Mobile First */}
      <nav className="mobile-header relative z-50 md:py-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={logoAD}
            alt="AD Logo"
            className="w-11 h-11 md:w-12 md:h-12 rounded-2xl md:rounded-lg"
          />
        </motion.div>

        <motion.div
          className="flex items-center gap-3 md:gap-2"
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
                  className="gap-2 border-primary/30 hover:bg-primary/10 rounded-xl md:rounded-lg min-h-[44px] md:min-h-[36px] px-4 md:px-3"
                >
                  <Shield className="w-5 h-5 md:w-4 md:h-4" />
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
                className="gap-2 relative z-50 rounded-xl md:rounded-lg min-h-[44px] md:min-h-[36px] px-4 md:px-3"
              >
                <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/auth'}
              className="gap-2 border-primary/30 hover:bg-primary/10 rounded-xl md:rounded-lg min-h-[44px] md:min-h-[36px] px-4 md:px-3"
            >
              <LogIn className="w-5 h-5 md:w-4 md:h-4" />
              Entrar
            </Button>
          )}
        </motion.div>
      </nav>

      {/* Main Content - Pushed to the right on desktop */}
      <div className="relative z-10 flex flex-col min-h-[calc(100vh-80px)] lg:ml-[40%]">
        {/* Hero Section - Mobile First - More spacious */}
        <header className="md:bg-transparent md:rounded-none py-10 md:py-12 px-6 md:px-4 lg:px-8 xl:px-16">
          <AnimatePresence>
            {showTitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-8 md:mb-6"
              >
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="text-sm font-display font-semibold text-primary tracking-wide">
                    Método Perfil Glorioso
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPhrase && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-10 md:mb-8"
              >
                <h1 className="text-[1.75rem] md:text-4xl lg:text-5xl font-display font-bold leading-[1.3] max-w-4xl">
                  <span className="text-gradient">{currentPhrase}</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPhrase && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              >
                {user && userName && (
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="w-14 h-14 md:w-10 md:h-10 rounded-2xl md:rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                      <User className="w-6 h-6 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground/80">Bem-vindo de volta,</p>
                      <p className="text-xl md:text-lg font-semibold text-foreground">{userName}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Stages Section - Mobile First - More spacious */}
        <AnimatePresence>
          {showContent && (
            <motion.main
              className="flex-1 px-6 md:px-4 lg:px-8 xl:px-16 pb-28 md:pb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <motion.div
                className="mb-8 md:mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h2 className="text-xl md:text-xl font-display font-bold text-foreground mb-2">
                  Escolha sua próxima etapa
                </h2>
                <p className="text-sm text-muted-foreground/70">
                  Continue sua jornada de transformação profissional
                </p>
              </motion.div>

              <div className="flex flex-col gap-5 md:gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
                {stages.map((stage, index) => {
                  const status = getStageStatus(stage.number);
                  const blocked = isStageBlocked(stage.number);
                  const Icon = stage.icon;
                  const isCompleted = status === 'completed';

                  return (
                    <motion.button
                      key={stage.number}
                      onClick={() => handleStageClick(stage)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.06 }}
                      whileHover={!blocked ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!blocked ? { scale: 0.97 } : {}}
                      className={`
                        relative overflow-hidden
                        p-5 md:p-4 
                        rounded-[1.25rem] md:rounded-xl
                        bg-card/60 backdrop-blur-md
                        border border-border/40
                        transition-all duration-300
                        text-left
                        ${blocked
                          ? 'opacity-40 cursor-not-allowed'
                          : 'cursor-pointer hover:border-primary/30 hover:bg-card/80'
                        }
                        ${isCompleted ? 'border-green-500/30 bg-green-500/5' : ''}
                      `}
                      disabled={blocked}
                    >
                      <div className="flex items-center gap-5 md:gap-3">
                        <div className={`
                          relative w-14 h-14 md:w-10 md:h-10 rounded-2xl md:rounded-lg
                          flex items-center justify-center
                          transition-colors
                          ${isCompleted
                            ? 'bg-green-500/15'
                            : blocked
                              ? 'bg-muted/30'
                              : 'bg-primary/12'
                          }
                        `}>
                          <Icon className={`w-6 h-6 md:w-4 md:h-4 ${
                            isCompleted
                              ? 'text-green-500'
                              : blocked
                                ? 'text-muted-foreground/50'
                                : 'text-primary'
                          }`} />

                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 md:w-2.5 md:h-2.5 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 md:w-1.5 md:h-1.5 text-background" strokeWidth={4} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5 md:mb-0">
                            <span className="text-xs text-primary/80 font-mono font-bold bg-primary/10 px-2.5 py-1 md:px-2 md:py-0.5 rounded-full">{stage.number}</span>
                            <h3 className={`text-base md:text-sm font-semibold md:font-medium ${
                              blocked ? 'text-muted-foreground/50' : 'text-foreground'
                            } transition-colors`}>
                              {stage.title}
                            </h3>
                          </div>
                          <p className="text-sm md:text-[11px] text-muted-foreground/70 line-clamp-2 md:line-clamp-1 mt-1 leading-relaxed">
                            {stage.description}
                          </p>
                        </div>

                        {blocked ? (
                          <Lock className="w-6 h-6 md:w-3.5 md:h-3.5 text-muted-foreground/40 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-7 h-7 md:w-4 md:h-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Motivational footer - More spacious */}
              <motion.div
                className="mt-10 md:mt-8 p-6 md:p-4 rounded-2xl md:rounded-xl bg-gradient-to-r from-primary/8 to-transparent border border-primary/15 max-w-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-[15px] md:text-sm text-muted-foreground/80 italic text-center leading-relaxed">
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

      {/* Stage 3 Welcome Modal */}
      <Stage3WelcomeModal
        open={showStage3Modal}
        onOpenChange={setShowStage3Modal}
        hasFunnel={opportunityFunnel?.status === 'published'}
        onContinue={handleStage3Continue}
      />

      {/* Floating Support Button */}
      {user && <SupportButton />}
    </div>
  );
};

export default Portal;
