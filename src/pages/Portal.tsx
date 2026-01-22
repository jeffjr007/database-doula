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
  Check,
  PenTool,
  Settings,
  HelpCircle,
  Instagram,
  Home,
  Menu,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import logoAD from "@/assets/logo-ad.png";
import mentorPhoto from "@/assets/mentor-photo.png";

import { StageWarningModal } from "@/components/StageWarningModal";
import WelcomeMentorModal from "@/components/WelcomeMentorModal";
import { Stage3WelcomeModal } from "@/components/Stage3WelcomeModal";

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
    color: "from-[#0077B5] to-[#0077B5]/50",
    isDeliverable: true,
  },
  {
    number: 2,
    title: "Gerador de CV",
    description: "Crie seu currículo estratégico com IA, otimizado para indicações diretas",
    icon: FileText,
    path: "/cv",
    color: "from-primary to-accent",
    isDeliverable: false,
  },
  {
    number: 3,
    title: "Funil de Oportunidades",
    description: "Seu funil personalizado para conquistar as melhores vagas",
    icon: Target,
    path: "/etapa/3",
    color: "from-accent to-primary",
    isDeliverable: true,
  },
  {
    number: 4,
    title: "Convencer Recrutador",
    description: "Monte seu roteiro de entrevista com palavras-chave da vaga",
    icon: UserCheck,
    path: "/etapa/4",
    color: "from-blue-500 to-cyan-500",
    isDeliverable: false,
  },
  {
    number: 5,
    title: "Convencer Gestor",
    description: "Transforme seu roteiro em apresentação e mostre autoridade",
    icon: Briefcase,
    path: "/etapa/5",
    color: "from-purple-500 to-pink-500",
    isDeliverable: false,
  },
  {
    number: 6,
    title: "Estratégias Gupy",
    description: "Otimize seu perfil na Gupy para passar no ATS",
    icon: Target,
    path: "/etapa/6",
    color: "from-green-500 to-emerald-500",
    isDeliverable: false,
  },
  {
    number: 7,
    title: "Esteira de Conteúdos",
    description: "Crie posts estratégicos para o LinkedIn com IA",
    icon: PenTool,
    path: "/etapa/7",
    color: "from-pink-500 to-purple-500",
    isDeliverable: false,
  },
];

const impactPhrases = [
  "Sua próxima grande oportunidade começa aqui.",
  "Transforme seu perfil em um ímã de oportunidades.",
  "Construa o caminho para a carreira dos seus sonhos.",
  "O método que está revolucionando recolocações.",
];

const Portal = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [progress, setProgress] = useState<StageProgress[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState(false);
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPhrase] = useState(() =>
    impactPhrases[Math.floor(Math.random() * impactPhrases.length)]
  );

  useEffect(() => {
    const titleTimer = setTimeout(() => setShowTitle(true), 300);
    const contentTimer = setTimeout(() => setShowContent(true), 800);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
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

      const activated = isAdmin ? true : (profile?.platform_activated ?? false);
      setPlatformActivated(activated);

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

    if (stage.number === 3) {
      if (opportunityFunnel?.status === 'published') {
        navigate(stage.path);
      } else {
        setShowStage3Modal(true);
      }
      return;
    }

    navigate(stage.path);
  };

  const handleStage3Continue = () => {
    if (opportunityFunnel?.status === 'published') {
      navigate('/etapa/3');
    }
  };

  const handleWarningConfirm = () => {
    navigate(warningModal.targetPath);
    setWarningModal({ ...warningModal, open: false });
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
  };

  const sidebarLinks = [
    { icon: Home, label: 'Início', onClick: () => {}, active: true },
    { icon: HelpCircle, label: 'Suporte', onClick: () => navigate('/suporte') },
    { icon: Settings, label: 'Configurações', onClick: () => navigate('/configuracoes') },
    { divider: true },
    { icon: Instagram, label: 'Instagram', onClick: () => window.open('https://www.instagram.com/oduarteeoficial/', '_blank'), external: true },
    { icon: Linkedin, label: 'LinkedIn', onClick: () => window.open('https://www.linkedin.com/in/oduarteoficial/', '_blank'), external: true },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <motion.aside 
        className="hidden lg:flex flex-col w-20 hover:w-64 transition-all duration-300 group bg-card/50 backdrop-blur-xl border-r border-border/50 fixed left-0 top-0 bottom-0 z-50"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-center border-b border-border/30">
          <img src={logoAD} alt="AD" className="w-12 h-12 rounded-xl flex-shrink-0" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {sidebarLinks.map((link, index) => {
            if ('divider' in link) {
              return <div key={index} className="h-px bg-border/30 my-4" />;
            }
            
            const Icon = link.icon;
            return (
              <motion.button
                key={index}
                onClick={link.onClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-xl transition-all
                  ${link.active 
                    ? 'bg-primary/15 text-primary' 
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-medium">
                  {link.label}
                </span>
                {link.external && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{userName || 'Usuário'}</p>
                <button 
                  onClick={signOut}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Button */}
        {isAdmin && (
          <div className="p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
              className="w-full gap-2 border-primary/30 hover:bg-primary/10 rounded-xl"
            >
              <Shield className="w-4 h-4" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">Admin</span>
            </Button>
          </div>
        )}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-4 flex items-center justify-between border-b border-border/30">
                <div className="flex items-center gap-3">
                  <img src={logoAD} alt="AD" className="w-10 h-10 rounded-xl" />
                  <span className="font-display font-bold text-foreground">Perfil Glorioso</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 py-6 px-4 space-y-2">
                {sidebarLinks.map((link, index) => {
                  if ('divider' in link) {
                    return <div key={index} className="h-px bg-border/30 my-4" />;
                  }
                  
                  const Icon = link.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        link.onClick();
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl transition-all
                        ${link.active 
                          ? 'bg-primary/15 text-primary' 
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{link.label}</span>
                      {link.external && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                    </button>
                  );
                })}
              </nav>

              {user && (
                <div className="p-4 border-t border-border/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{userName || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={signOut} className="w-full gap-2">
                    <LogOut className="w-4 h-4" /> Sair
                  </Button>
                </div>
              )}

              {isAdmin && (
                <div className="p-4 pt-0">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => { navigate('/admin'); setSidebarOpen(false); }}
                    className="w-full gap-2"
                  >
                    <Shield className="w-4 h-4" /> Painel Admin
                  </Button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-20 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <img src={logoAD} alt="AD" className="w-10 h-10 rounded-xl" />
          {user ? (
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => navigate('/auth')}>
              <LogIn className="w-5 h-5" />
            </Button>
          )}
        </header>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)] lg:min-h-screen relative">
          {/* Background Decorative Elements */}
          <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
            {/* Glowing orbs */}
            <motion.div 
              className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3] 
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl"
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2] 
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            
            {/* Geometric lines */}
            <svg className="absolute top-0 right-0 w-full h-full opacity-[0.03]" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="60" y1="0" x2="100" y2="40" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
              <line x1="70" y1="0" x2="100" y2="30" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
              <line x1="80" y1="0" x2="100" y2="20" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
              <line x1="50" y1="100" x2="100" y2="50" stroke="currentColor" strokeWidth="0.1" className="text-accent" />
              <line x1="60" y1="100" x2="100" y2="60" stroke="currentColor" strokeWidth="0.1" className="text-accent" />
            </svg>
          </div>

          {/* Mentor Section - Now on Left (Background) */}
          <motion.div 
            className="hidden lg:block w-[45%] xl:w-[40%] relative"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="sticky top-0 h-screen">
              <img
                src={mentorPhoto}
                alt="Adriano Duarte - Mentor"
                className="h-full w-full object-cover object-center grayscale"
              />
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
              
            </div>
          </motion.div>

          {/* Stages Section - Now on Right */}
          <div className="flex-1 p-6 lg:p-8 xl:p-12 relative z-10">
            <AnimatePresence>
              {showTitle && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-6">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-sm font-display font-semibold text-primary">Método Perfil Glorioso</span>
                  </div>

                  {user && userName && (
                    <motion.h1 
                      className="text-3xl lg:text-4xl xl:text-5xl font-display font-bold mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Olá, <span className="text-gradient">{userName}</span>
                    </motion.h1>
                  )}

                  <p className="text-lg text-muted-foreground max-w-xl">
                    {currentPhrase}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-xl font-display font-bold text-foreground mb-6">
                    Suas Etapas
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          whileHover={!blocked ? { scale: 1.01 } : {}}
                          whileTap={!blocked ? { scale: 0.99 } : {}}
                          className={`
                            group/card relative p-4 rounded-xl text-left
                            bg-card/60 backdrop-blur-sm border border-border/50
                            transition-all duration-200
                            ${blocked
                              ? 'opacity-40 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-card/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
                            }
                            ${isCompleted ? 'border-primary/50 bg-primary/5' : ''}
                          `}
                          disabled={blocked}
                        >
                          <div className="flex items-center gap-3">
                            {/* Number Badge */}
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm
                              transition-colors
                              ${isCompleted 
                                ? 'bg-primary/20 text-primary' 
                                : blocked 
                                  ? 'bg-muted/30 text-muted-foreground/50'
                                  : 'bg-primary/10 text-primary group-hover/card:bg-primary/20'
                              }
                            `}>
                              {isCompleted ? (
                                <Check className="w-4 h-4" strokeWidth={3} />
                              ) : (
                                stage.number
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-medium ${blocked ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                                {stage.title}
                              </h3>
                              <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">
                                {stage.description}
                              </p>
                            </div>

                            {/* Arrow */}
                            {blocked ? (
                              <Lock className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover/card:text-primary transition-colors flex-shrink-0" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Quote */}
                  <motion.div
                    className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-primary/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-sm text-muted-foreground italic text-center">
                      "Cada etapa foi desenvolvida para te guiar passo a passo na sua recolocação profissional."
                    </p>
                  </motion.div>

                  {/* Progress Stats */}
                  <motion.div
                    className="mt-6 grid grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="p-4 rounded-xl bg-card/40 border border-border/30 text-center">
                      <p className="text-2xl font-display font-bold text-primary">{stages.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Etapas</p>
                    </div>
                    <div className="p-4 rounded-xl bg-card/40 border border-border/30 text-center">
                      <p className="text-2xl font-display font-bold text-accent">
                        {progress.filter(p => p.completed).length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
                    </div>
                    <div className="p-4 rounded-xl bg-card/40 border border-border/30 text-center">
                      <p className="text-2xl font-display font-bold text-foreground">
                        {Math.round((progress.filter(p => p.completed).length / stages.length) * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Progresso</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WelcomeMentorModal
        open={showWelcomeModal}
        onComplete={handleWelcomeComplete}
      />

      <StageWarningModal
        open={warningModal.open}
        onClose={() => setWarningModal({ ...warningModal, open: false })}
        onConfirm={handleWarningConfirm}
        type={warningModal.type}
      />

      <Stage3WelcomeModal
        open={showStage3Modal}
        onOpenChange={setShowStage3Modal}
        hasFunnel={opportunityFunnel?.status === 'published'}
        onContinue={handleStage3Continue}
      />
    </div>
  );
};

export default Portal;
