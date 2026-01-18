import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, FileCheck, Mail, Lock, ChevronRight, AlertTriangle, ArrowDown, Bot, User2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MentorAvatar } from "@/components/MentorAvatar";

interface CVSelectorProps {
  onSelect: (type: "personalized" | "ats" | "cover-letter") => void;
  onOptionsVisible?: (visible: boolean) => void;
}

const mentorMessages = [
  "Agora vamos criar documentos que vão te destacar no mercado.",
  "Você tem três opções poderosas à sua disposição...",
];

const cvOptions = [
  {
    id: "ats" as const,
    title: "Currículo para ATS",
    subtitle: "Otimizado para sistemas",
    description: "Formatação limpa e compatível com sistemas de rastreamento de candidatos (ATS).",
    icon: FileCheck,
    available: true,
    order: 1,
    indicatorIcon: Bot,
    indicatorLabel: "Pra robôs lerem",
    indicatorDescription: "Gupy, Kenoby, Greenhouse...",
  },
  {
    id: "personalized" as const,
    title: "Currículo Personalizado",
    subtitle: "Para leitura humana",
    description: "Ideal para indicações e contato direto com recrutadores. Design estratégico para causar impacto.",
    icon: FileText,
    available: true,
    order: 2,
    indicatorIcon: User2,
    indicatorLabel: "Pra humanos lerem",
    indicatorDescription: "Indicações, contato direto",
  },
  {
    id: "cover-letter" as const,
    title: "Carta de Apresentação",
    subtitle: "Personalize sua história",
    description: "3 modelos personalizados para você usar em suas candidaturas.",
    icon: Mail,
    available: true,
    order: 3,
    indicatorIcon: Sparkles,
    indicatorLabel: "Seu diferencial",
    indicatorDescription: "Conte sua história",
  },
];

const CV_SELECTOR_ANIMATION_KEY = 'cv_selector_animation_seen';

export function CVSelector({ onSelect, onOptionsVisible }: CVSelectorProps) {
  // Check if animation was already shown this session
  const hasSeenAnimationThisSession = sessionStorage.getItem(CV_SELECTOR_ANIMATION_KEY) === 'true';
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(hasSeenAnimationThisSession ? mentorMessages.length - 1 : 0);
  const [showOptions, setShowOptions] = useState(hasSeenAnimationThisSession);
  const [messagesComplete, setMessagesComplete] = useState(hasSeenAnimationThisSession);
  const [hasAtsCv, setHasAtsCv] = useState(false);
  const [showAtsWarning, setShowAtsWarning] = useState(false);
  const [isCheckingCvs, setIsCheckingCvs] = useState(true);
  const { user } = useAuth();

  // Notify parent immediately if already seen animation
  useEffect(() => {
    if (hasSeenAnimationThisSession) {
      onOptionsVisible?.(true);
    }
  }, [hasSeenAnimationThisSession, onOptionsVisible]);

  // Check if user has an ATS CV saved
  useEffect(() => {
    const checkForAtsCv = async () => {
      if (!user?.id) {
        setIsCheckingCvs(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('saved_cvs')
          .select('cv_data')
          .eq('user_id', user.id);

        // Check if any saved CV is an ATS CV (has 'experiencias' array with 'bullets' but no 'sumario')
        const hasAts = data?.some(cv => {
          const cvData = cv.cv_data as any;
          return cvData?.experiencias?.[0]?.bullets && !cvData?.sumario;
        }) || false;

        setHasAtsCv(hasAts);
      } catch (error) {
        console.error('Error checking for ATS CV:', error);
      } finally {
        setIsCheckingCvs(false);
      }
    };

    checkForAtsCv();
  }, [user?.id]);

  // Animation effect - only runs if not seen this session
  useEffect(() => {
    // Skip if already seen this session
    if (hasSeenAnimationThisSession) return;
    
    if (currentMessageIndex < mentorMessages.length) {
      const timer = setTimeout(() => {
        if (currentMessageIndex === mentorMessages.length - 1) {
          setMessagesComplete(true);
          sessionStorage.setItem(CV_SELECTOR_ANIMATION_KEY, 'true');
          setTimeout(() => {
            setShowOptions(true);
            onOptionsVisible?.(true);
          }, 800);
        } else {
          setCurrentMessageIndex(prev => prev + 1);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, hasSeenAnimationThisSession]);

  const handleSelectOption = (optionId: "personalized" | "ats" | "cover-letter") => {
    if (optionId === "personalized" && !hasAtsCv) {
      setShowAtsWarning(true);
      return;
    }
    onSelect(optionId);
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-8">
      {/* Mentor Section */}
      <AnimatePresence mode="wait">
        {!showOptions && (
          <motion.div
            key="mentor-intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 max-w-2xl mx-auto text-center"
          >
            {/* Mentor Photo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <MentorAvatar size="xxl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <FileText className="w-3 h-3 text-primary-foreground" />
              </div>
            </motion.div>

            {/* Messages */}
            <div className="space-y-4">
              {mentorMessages.slice(0, currentMessageIndex + 1).map((message, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-lg md:text-xl leading-relaxed ${
                    index === currentMessageIndex
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {message}
                </motion.p>
              ))}
            </div>

            {/* Loading dots */}
            {!messagesComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-1 mt-4"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {showOptions && (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
                Seus documentos <span className="text-gradient">estratégicos</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Cada modelo foi pensado pra maximizar suas chances. Mantenha a estrutura — ela funciona.
              </p>
            </div>

            {/* Cards Grid with Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cvOptions.map((option, index) => {
                const Icon = option.icon;
                const IndicatorIcon = option.indicatorIcon;
                const isPersonalizedBlocked = option.id === "personalized" && !hasAtsCv && !isCheckingCvs;

                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 * index }}
                    className="flex flex-col items-center"
                  >
                    {/* Indicator above card */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + 0.1 * index }}
                      className="flex flex-col items-center mb-3"
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2">
                        <IndicatorIcon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-primary">
                          {option.indicatorLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mb-1">
                        {option.indicatorDescription}
                      </span>
                      <ArrowDown className="w-4 h-4 text-primary/50 animate-bounce" />
                    </motion.div>

                    <Card
                      onClick={() => option.available && handleSelectOption(option.id)}
                      className={`
                        relative p-6 w-full h-full cursor-pointer transition-all duration-300
                        ${option.available
                          ? "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                          : "opacity-60 cursor-not-allowed"
                        }
                        ${isPersonalizedBlocked ? "border-amber-500/30" : ""}
                      `}
                    >
                      {!option.available && (
                        <div className="absolute top-3 right-3">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}

                      {isPersonalizedBlocked && (
                        <div className="absolute top-3 right-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                      )}

                      <div className="flex flex-col gap-4 h-full">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center
                          ${option.available
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                          }
                        `}>
                          <Icon className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-display font-semibold text-lg mb-1">
                            {option.title}
                          </h3>
                          <p className="text-xs text-primary font-medium mb-2">
                            {option.subtitle}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {option.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-sm font-medium pt-2">
                          {option.available ? (
                            <>
                              <span className="text-primary">Começar</span>
                              <ChevronRight className="w-4 h-4 text-primary" />
                            </>
                          ) : (
                            <span className="text-muted-foreground/50">Em breve</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ATS CV Warning Modal */}
      <Dialog open={showAtsWarning} onOpenChange={setShowAtsWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <DialogTitle>Crie o Currículo para ATS primeiro</DialogTitle>
            </div>
            <DialogDescription className="text-left space-y-3">
              <p>
                O <strong>Currículo Personalizado</strong> é construído a partir do seu <strong>Currículo para ATS</strong>.
              </p>
              <p>
                Por favor, crie e salve seu Currículo para ATS primeiro. Depois, você poderá gerar o Currículo Personalizado usando ele como base.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAtsWarning(false)}
              className="w-full sm:w-auto"
            >
              Entendi
            </Button>
            <Button
              onClick={() => {
                setShowAtsWarning(false);
                onSelect("ats");
              }}
              className="w-full sm:w-auto"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Criar Currículo para ATS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
