import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useDev } from "@/hooks/useDev";
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
  X,
  Gift,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import logoAD from "@/assets/logo-ad.png";
import mentorPhoto from "@/assets/mentor-photo.png";

import { StageWarningModal } from "@/components/StageWarningModal";
import WelcomeMentorModal from "@/components/WelcomeMentorModal";
import { Stage3WelcomeModal } from "@/components/Stage3WelcomeModal";
import LogoutModal from "@/components/LogoutModal";

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

interface SavedInterview {
  id: string;
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
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, isAdminSticky, loading: adminLoading } = useAdmin();
  const { isDev, loading: devLoading } = useDev();

  // Effective admin status: either current check or sticky (once admin, always admin in session)
  const effectiveIsAdmin = isAdmin || isAdminSticky;

  // Dev users have full access to all stages
  const effectiveIsDev = isDev;

  // Cache keys for instant loading
  const CACHE_KEY_USER = "portal_user_cache";

  // Try to load cached user data immediately for instant display
  const getCachedUserData = () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_USER);
      if (cached) {
        const data = JSON.parse(cached);
        // Only use cache if it's for the current user
        if (data.userId === user?.id) {
          return data;
        }
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  };

  const cachedData = user?.id ? getCachedUserData() : null;

  const [progress, setProgress] = useState<StageProgress[]>([]);
  // Initialize userName from cache for instant display
  const [userName, setUserName] = useState<string | null>(cachedData?.userName || null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isIdentityReady, setIsIdentityReady] = useState(false);
  const [linkedinDiagnostic, setLinkedinDiagnostic] = useState<LinkedInDiagnostic | null>(null);
  const [opportunityFunnel, setOpportunityFunnel] = useState<OpportunityFunnel | null>(null);
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [savedInterviews, setSavedInterviews] = useState<SavedInterview[]>([]);
  const [platformActivated, setPlatformActivated] = useState<boolean | null>(cachedData?.platformActivated ?? null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [warningModal, setWarningModal] = useState<{
    open: boolean;
    type: "linkedin-cv" | "linkedin-gupy";
    targetPath: string;
  }>({
    open: false,
    type: "linkedin-cv",
    targetPath: "",
  });
  const [stage2Unlocked, setStage2Unlocked] = useState<boolean>(cachedData?.stage2Unlocked ?? false);
  const [stage2Completed, setStage2Completed] = useState<boolean>(cachedData?.stage2Completed ?? false);
  const [showStage3Modal, setShowStage3Modal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasLearningPath, setHasLearningPath] = useState(cachedData?.hasLearningPath ?? false);
  const [currentPhrase] = useState(() => impactPhrases[Math.floor(Math.random() * impactPhrases.length)]);

  // Cache still helps populate userName quickly, but UI is blocked until identity + data are confirmed.

  // Removed artificial delay timers - content now shows when data is ready

  // Save user data to cache for instant loading on next visit
  const saveToCache = (data: {
    userName: string | null;
    platformActivated: boolean;
    stage2Unlocked: boolean;
    stage2Completed: boolean;
    hasLearningPath: boolean;
  }) => {
    if (!user?.id) return;
    try {
      sessionStorage.setItem(
        CACHE_KEY_USER,
        JSON.stringify({
          userId: user.id,
          ...data,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // Ignore cache errors
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Hard reset gates when user changes
      setIsDataReady(false);
      setIsIdentityReady(false);

      // If no user, mark as ready immediately (guest view)
      if (!user?.id) {
        setIsDataReady(true);
        setIsIdentityReady(true);
        return;
      }

      if (adminLoading || devLoading) return;

      // ADMIN or DEV = PORTAL DIRETO, sem nenhuma verificação de ativação ou presente
      if (effectiveIsAdmin || effectiveIsDev) {
        console.log("[Portal] Admin/Dev detected - bypassing all activation/gift checks");
        setPlatformActivated(true);
      }

      // Fetch profile and remaining data in parallel for maximum speed
      const [profileResult, progressResult, diagnosticResult, funnelResult, cvsResult, interviewsResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, platform_activated, stage2_unlocked, stage2_completed, learning_path")
            .eq("user_id", user.id)
            .single(),
          supabase.from("mentoring_progress").select("stage_number, completed, current_step").eq("user_id", user.id),
          supabase
            .from("linkedin_diagnostics")
            .select("status")
            .eq("user_id", user.id)
            .eq("status", "published")
            .maybeSingle(),
          supabase
            .from("opportunity_funnels")
            .select("status")
            .eq("user_id", user.id)
            .eq("status", "published")
            .maybeSingle(),
          supabase.from("saved_cvs").select("id, name, cv_data").eq("user_id", user.id),
          supabase.from("interview_history").select("id").eq("user_id", user.id),
        ]);

      const profile = profileResult.data;
      const profileError = profileResult.error;

      // If profile fetch fails, don't redirect - just show loading or error
      if (profileError) {
        console.error("[Portal] Error fetching profile:", profileError);
        // For admin/dev, just continue - they don't need activation
        if (effectiveIsAdmin || effectiveIsDev) {
          // Admin/Dev can continue even without profile
          setIsDataReady(true);
        } else {
          // Non-admin with profile error: mark as ready to show error state
          setIsDataReady(true);
          return;
        }
      }

      const fallbackName = (() => {
        const metaName = (user.user_metadata as any)?.full_name as string | undefined;
        const fromMeta = metaName?.trim() ? metaName.trim().split(" ")[0] : null;
        if (fromMeta) return fromMeta;

        const email = user.email?.trim();
        if (email) return email.split("@")[0] || null;
        return null;
      })();

      let extractedUserName: string | null = fallbackName;

      if (profile) {
        const s2Unlocked = profile.stage2_unlocked ?? false;
        const s2Completed = profile.stage2_completed ?? false;
        const hasPath = !!profile.learning_path;

        setStage2Unlocked(s2Unlocked);
        setStage2Completed(s2Completed);
        setHasLearningPath(hasPath);

        if (profile.full_name?.trim()) {
          extractedUserName = profile.full_name.trim().split(" ")[0];
        }

        // Always set a non-null name when possible (prevents greeting race/blank)
        if (extractedUserName) setUserName(extractedUserName);

        // Cache the user data for instant loading next time
        saveToCache({
          userName: extractedUserName,
          platformActivated: profile.platform_activated ?? false,
          stage2Unlocked: s2Unlocked,
          stage2Completed: s2Completed,
          hasLearningPath: hasPath,
        });
      }

      // ADMIN/DEV NEVER gets redirected to /ativar or /presente
      if (!effectiveIsAdmin && !effectiveIsDev) {
        const activated = profile?.platform_activated ?? false;
        setPlatformActivated(activated);

        if (!activated) {
          console.log("[Portal] Non-admin/dev not activated, redirecting to /ativar");
          window.location.href = "/ativar";
          return;
        }

        // NOTE: Gift redirect is handled by ActivatePlatform after user clicks "Começar Jornada"
        // Do NOT auto-redirect to /presente here - user must explicitly start their journey
      }

      if (progressResult.data) {
        setProgress(progressResult.data);
      }

      if (diagnosticResult.data) {
        setLinkedinDiagnostic(diagnosticResult.data);
      }

      if (funnelResult.data) {
        setOpportunityFunnel(funnelResult.data);
      }

      if (cvsResult.data) {
        setSavedCVs(cvsResult.data);
      }

      if (interviewsResult.data) {
        setSavedInterviews(interviewsResult.data);
      }

      // Identity is considered resolved once we have a stable name (or confirmed it's unavailable)
      setIsIdentityReady(true);

      // All data loaded - show content
      setIsDataReady(true);
    };

    fetchData();
  }, [user?.id, adminLoading, devLoading, effectiveIsAdmin, effectiveIsDev, navigate]);

  // Mandatory render lock: do not paint ANY portal UI until auth is resolved and
  // (when logged in) both identity + data are fully loaded.
  const renderGateReady = (() => {
    if (authLoading) return false;
    if (!user?.id) return isDataReady && isIdentityReady;
    // Require a resolved name to avoid greeting popping in later.
    // If for some reason we can't determine a name, we still unblock after identity step.
    const hasName = !!userName;
    return isDataReady && isIdentityReady && hasName;
  })();

  const hasPersonalizedCV = savedCVs.some((cv) => {
    const data = cv.cv_data as any;
    return data?.sumario && !data?.isATS;
  });

  const hasATSCV = savedCVs.some((cv) => {
    const data = cv.cv_data as any;
    return data?.isATS === true;
  });

  const hasBothCVTypes = hasPersonalizedCV && hasATSCV;

  const getStageStatus = (stageNumber: number) => {
    // Check mentoring_progress for completed status first
    const stageProgress = progress.find((p) => p.stage_number === stageNumber);
    if (stageProgress?.completed) return "completed";

    if (stageNumber === 1) {
      return linkedinDiagnostic?.status === "published" ? "available" : "pending";
    }
    if (stageNumber === 3) {
      return opportunityFunnel?.status === "published" ? "available" : "pending";
    }

    if (stageProgress) return "in_progress";
    return "not_started";
  };

  const isStageBlocked = (stageNumber: number) => {
    // TEMPORARY: Block all stages except 2 for non-admin users
    // Admins and dev users have full access
    if (effectiveIsAdmin || effectiveIsDev) {
      // Original logic for admin/dev
      if (stageNumber === 1) {
        return linkedinDiagnostic?.status !== "published";
      }
      if (stageNumber === 2) {
        return !stage2Unlocked;
      }
      if (stageNumber === 3) {
        return !stage2Completed;
      }
      if (stageNumber === 5) {
        return savedInterviews.length === 0;
      }
      return false;
    }

    // TEMPORARY: For regular users, block stages 1, 3, 4, 5, 6, 7
    if ([1, 3, 4, 5, 6, 7].includes(stageNumber)) {
      return true;
    }

    // TEMPORARY: Stage 2 is ALWAYS unlocked for regular users in temporary mode
    if (stageNumber === 2) {
      return false; // Always unlocked
    }

    return false;
  };

  const getStageWarning = (stageNumber: number): "linkedin-cv" | "linkedin-gupy" | null => {
    if (stageNumber === 2) return "linkedin-cv";
    if (stageNumber === 6) return "linkedin-gupy";
    return null;
  };

  const handleStageClick = (stage: (typeof stages)[0]) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Admin/Dev always has platform activated
    if (!effectiveIsAdmin && !effectiveIsDev && !platformActivated) {
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
      // Stage 3 is unlocked but funnel may not be ready yet
      if (opportunityFunnel?.status === "published") {
        navigate(stage.path);
      } else {
        // Show modal explaining funnel is being prepared
        setShowStage3Modal(true);
      }
      return;
    }

    navigate(stage.path);
  };

  const handleStage3Continue = () => {
    if (opportunityFunnel?.status === "published") {
      navigate("/etapa/3");
    }
  };

  const handleWarningConfirm = () => {
    navigate(warningModal.targetPath);
    setWarningModal({ ...warningModal, open: false });
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutComplete = async () => {
    await signOut();
    navigate("/auth");
  };

  const sidebarLinks = [
    { icon: Home, label: "Início", onClick: () => {}, active: true },
    {
      icon: Gift,
      label: "Minha Trilha",
      onClick: () => {
        if (hasLearningPath) navigate("/presente", { state: { direct: true } });
      },
      highlight: true,
    },
    {
      icon: HelpCircle,
      label: "Suporte",
      onClick: () => {
        window.location.href = "/suporte";
      },
    },
    {
      icon: Settings,
      label: "Configurações",
      onClick: () => {
        window.location.href = "/configuracoes";
      },
    },
    { divider: true },
    {
      icon: Instagram,
      label: "Instagram",
      onClick: () => window.open("https://www.instagram.com/oduarteeoficial/", "_blank"),
      external: true,
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      onClick: () => window.open("https://www.linkedin.com/in/oduarteoficial/", "_blank"),
      external: true,
    },
  ];

  // HARD render gate: show nothing except the loading screen until the portal is fully ready.
  if (!renderGateReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <img src={logoAD} alt="AD" className="w-16 h-16 rounded-xl" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside
        className="hidden lg:flex flex-col w-20 hover:w-64 transition-all duration-300 group bg-card/80 border-r border-border/50 fixed left-0 top-0 bottom-0 z-50"
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-center border-b border-border/30">
          <img src={logoAD} alt="AD" className="w-12 h-12 rounded-xl flex-shrink-0" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {sidebarLinks.map((link, index) => {
            if ("divider" in link) {
              return <div key={index} className="h-px bg-border/30 my-4" />;
            }

            const Icon = link.icon;
            return (
              <button
                key={index}
                onClick={link.onClick}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-xl transition-all border
                  ${
                    "highlight" in link && link.highlight
                      ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30"
                      : link.active
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-foreground border-transparent"
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
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        {user ? (
          <div className="p-4 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{userName || "Usuário"}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-border/30">
            <button
              onClick={() => {
                window.location.href = "/auth";
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
            >
              <LogIn className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-muted-foreground">
                Entrar
              </span>
            </button>
          </div>
        )}

        {/* Admin Button */}
        {effectiveIsAdmin && (
          <div className="p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
              className="w-full gap-2 border-primary/30 hover:bg-primary/10 rounded-xl"
            >
              <Shield className="w-4 h-4" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">Admin</span>
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-background/90 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside
              className={`lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col transition-transform duration-200 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
              <div className="p-4 flex items-center justify-between border-b border-border/30">
                <div className="flex items-center gap-3">
                  <img src={logoAD} alt="AD" className="w-10 h-10 rounded-xl" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 py-6 px-4 space-y-2">
                {sidebarLinks.map((link, index) => {
                  if ("divider" in link) {
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
                        ${
                          link.active
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
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

              {user ? (
                <div className="p-4 border-t border-border/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{userName || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full gap-2">
                    <LogOut className="w-4 h-4" /> Sair
                  </Button>
                </div>
              ) : (
                <div className="p-4 border-t border-border/30">
                  <button
                    onClick={() => {
                      window.location.href = "/auth";
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <LogIn className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Entrar</span>
                  </button>
                </div>
              )}

              {effectiveIsAdmin && (
                <div className="p-4 pt-0">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      navigate("/admin");
                      setSidebarOpen(false);
                    }}
                    className="w-full gap-2"
                  >
                    <Shield className="w-4 h-4" /> Painel Admin
                  </Button>
                </div>
              )}
            </aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-20 min-h-screen">
        {/* Mobile Header - removed backdrop-blur for performance */}
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <img src={logoAD} alt="AD" className="w-10 h-10 rounded-xl" />
          {user ? (
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.location.href = "/auth";
              }}
            >
              <LogIn className="w-5 h-5" />
            </Button>
          )}
        </header>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)] lg:min-h-screen relative">
          {/* Background Decorative Elements - Desktop only, no animations */}
          <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
            {/* Static decorative orbs - no animations for performance */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-40" />
            <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl opacity-30" />

            {/* Geometric lines */}
            <svg
              className="absolute top-0 right-0 w-full h-full opacity-[0.03]"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line x1="60" y1="0" x2="100" y2="40" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
              <line x1="70" y1="0" x2="100" y2="30" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
              <line x1="80" y1="0" x2="100" y2="20" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
              <line x1="50" y1="100" x2="100" y2="50" stroke="currentColor" strokeWidth="0.1" className="text-accent" />
              <line x1="60" y1="100" x2="100" y2="60" stroke="currentColor" strokeWidth="0.1" className="text-accent" />
            </svg>
          </div>

          {/* Mentor Section - Now on Left (Background) */}
          <div
            className="hidden lg:block w-[45%] xl:w-[40%] relative animate-fade-in"
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
          </div>

          {/* Stages Section - Now on Right */}
          <div className="flex-1 p-6 lg:p-8 xl:p-12 relative z-10">
            {isDataReady && (
              <div className="mb-8 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-6">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-semibold text-primary">Método Perfil Glorioso</span>
                </div>

                {user && userName && (
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-display font-bold mb-4">
                    Olá, <span className="text-gradient">{userName}</span>
                  </h1>
                )}

                <p className="text-lg text-muted-foreground max-w-xl">{currentPhrase}</p>
              </div>
            )}

            {isDataReady && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">Suas Etapas</h2>

                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {stages.map((stage) => {
                    const status = getStageStatus(stage.number);
                    const blocked = isStageBlocked(stage.number);
                    const Icon = stage.icon;
                    const isCompleted = status === "completed";

                    return (
                      <button
                        key={stage.number}
                        onClick={() => handleStageClick(stage)}
                        className={`
                          group/card relative p-4 text-left
                          rounded-2xl border border-white/5
                          transition-all duration-150
                          ${
                            blocked
                              ? "opacity-40 cursor-not-allowed"
                              : "cursor-pointer hover:bg-card/80 active:scale-[0.98]"
                          }
                          ${isCompleted ? "bg-primary/5" : ""}
                        `}
                        disabled={blocked}
                      >
                          <div className="flex items-center gap-3">
                            {/* Number Badge */}
                            <div
                              className={`
                              w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm
                              transition-colors
                              ${
                                isCompleted
                                  ? "bg-primary/20 text-primary"
                                  : blocked
                                    ? "bg-muted/30 text-muted-foreground/50"
                                    : "bg-primary/10 text-primary group-hover/card:bg-primary/20"
                              }
                            `}
                            >
                              {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : stage.number}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`text-sm font-medium ${blocked ? "text-muted-foreground/50" : "text-foreground"}`}
                              >
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
                        </button>
                      );
                    })}
                  </div>

                  {/* Quote */}
                  <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-primary/20">
                    <p className="text-sm text-muted-foreground italic text-center">
                      "Cada etapa foi desenvolvida para te guiar passo a passo na sua recolocação profissional."
                    </p>
                  </div>

                  {/* Progress Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-card/40 border border-border/30 text-center">
                      <p className="text-2xl font-display font-bold text-primary">{stages.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Etapas</p>
                    </div>
                    <div className="p-4 rounded-xl bg-card/40 border border-border/30 text-center">
                      <p className="text-2xl font-display font-bold text-accent">
                        {progress.filter((p) => p.completed).length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
                    </div>
                    <div className="p-4 rounded-xl bg-card/40 border border-border/30 text-center">
                      <p className="text-2xl font-display font-bold text-foreground">
                        {Math.round((progress.filter((p) => p.completed).length / stages.length) * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Progresso</p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <WelcomeMentorModal open={showWelcomeModal} onComplete={handleWelcomeComplete} />

      <StageWarningModal
        open={warningModal.open}
        onClose={() => setWarningModal({ ...warningModal, open: false })}
        onConfirm={handleWarningConfirm}
        type={warningModal.type}
      />

      <Stage3WelcomeModal
        open={showStage3Modal}
        onOpenChange={setShowStage3Modal}
        hasFunnel={opportunityFunnel?.status === "published"}
        onContinue={handleStage3Continue}
      />

      <LogoutModal open={showLogoutModal} onComplete={handleLogoutComplete} />
    </div>
  );
};

export default Portal;
