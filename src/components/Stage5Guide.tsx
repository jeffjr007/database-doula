import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Zap,
  Check,
  Loader2,
  Lightbulb,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Presentation,
  Trophy,
  Target,
  Rocket,
  Star,
  Crown,
  RotateCcw
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useDevUser } from "@/hooks/useDevUser";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import mentorPhoto from "@/assets/mentor-photo.png";
import { KeywordScript } from "./InterviewScriptBuilder";

interface Stage5GuideProps {
  stageNumber: number;
}

interface IntensifiedScript {
  keyword: string;
  originalScript: string;
  intensifiedHow: string;
  experience: string;
}

interface Stage5Data {
  intensifiedScripts: IntensifiedScript[];
  completed: boolean;
}

const STEPS = [
  { id: 1, title: "Introdução", icon: Users, description: "Por que gestores?" },
  { id: 2, title: "Intensificar", icon: Zap, description: "O COMO" },
  { id: 3, title: "Apresentação", icon: Presentation, description: "Template" },
];

const CANVA_TEMPLATE_URL = "https://www.canva.com/design/DAGwntg9Gqo/aSlyTmQIhVLEeUehTLn7hQ/edit";

const mentorMessages = [
  {
    id: 1,
    text: "E aí! Chegou a hora de falar com os GESTORES. 🎯",
    delay: 0
  },
  {
    id: 2,
    text: "Sabe qual a diferença entre recrutador e gestor? O recrutador te filtra. O gestor vai TRABALHAR com você todo dia.",
    delay: 2.2
  },
  {
    id: 3,
    text: "Por isso, gestor não quer saber só O QUE você fez... ele quer saber COMO você fez. Ele precisa ver que você tem MÉTODO.",
    delay: 4.8
  },
  {
    id: 4,
    text: "E aqui vem o segredo que vai te diferenciar de 99% dos candidatos... 👀",
    delay: 7.4
  },
  {
    id: 5,
    text: "Você vai LEVAR UMA APRESENTAÇÃO VISUAL pro gestor. Isso mesmo. Enquanto todo mundo só fala, você MOSTRA.",
    delay: 9.8,
    highlight: true
  },
  {
    id: 6,
    text: "Imagina a cena: você entra na sala, e ao invés de só responder perguntas...",
    delay: 12.4
  },
  {
    id: 7,
    text: '"Trouxe algo especial pra vocês. Preparei uma apresentação visual do meu trabalho pra facilitar nossa conversa..."',
    delay: 14.8,
    quote: true
  },
  {
    id: 8,
    text: "O gestor vai PIRAR. Ninguém faz isso. Você está mostrando iniciativa, organização, e que leva a oportunidade a sério.",
    delay: 17.4
  }
];

const benefitsCards = [
  {
    icon: Crown,
    title: "Você se destaca IMEDIATAMENTE",
    description: "Enquanto outros candidatos ficam nervosos tentando lembrar o que falar, você tem um roteiro visual que te guia.",
    color: "text-amber-500"
  },
  {
    icon: Target,
    title: "Controle da narrativa",
    description: "Em vez de ficar à mercê das perguntas, VOCÊ conduz a conversa. Mostra o que quer mostrar.",
    color: "text-primary"
  },
  {
    icon: Rocket,
    title: "Demonstra habilidades na prática",
    description: "Você não só FALA que é organizado... você MOSTRA sendo organizado. Ação fala mais que palavras.",
    color: "text-green-500"
  },
  {
    icon: Star,
    title: "Memorável demais",
    description: "Depois de 10 entrevistas, o gestor vai lembrar de quem? Do que trouxe apresentação, óbvio!",
    color: "text-purple-500"
  }
];

export const Stage5Guide = ({ stageNumber }: Stage5GuideProps) => {
  const { user } = useAuth();
  const { bypassValidation, skipAnimations } = useDevUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [stage4Scripts, setStage4Scripts] = useState<KeywordScript[]>([]);
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [visibleMessages, setVisibleMessages] = useState(skipAnimations ? mentorMessages.length : 0);
  const [showBenefits, setShowBenefits] = useState(skipAnimations);
  const [messagesExiting, setMessagesExiting] = useState(false);

  const [data, setData] = useState<Stage5Data>({
    intensifiedScripts: [],
    completed: false
  });

  // Animate conversation messages
  useEffect(() => {
    if (currentStep === 1 && visibleMessages < mentorMessages.length && !messagesExiting) {
      const nextMessage = mentorMessages[visibleMessages];
      const delay = visibleMessages === 0 ? 500 : (nextMessage.delay - (mentorMessages[visibleMessages - 1]?.delay || 0)) * 1000;

      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (visibleMessages >= mentorMessages.length && !showBenefits && !messagesExiting) {
      const timer = setTimeout(() => {
        setMessagesExiting(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, visibleMessages, showBenefits, messagesExiting]);

  useEffect(() => {
    if (messagesExiting && !showBenefits) {
      const timer = setTimeout(() => {
        setShowBenefits(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [messagesExiting, showBenefits]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      setIsLoading(true);

      try {
        const { data: progressData } = await supabase
          .from('mentoring_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('stage_number', 5)
          .maybeSingle();

        const isStageCompleted = progressData?.completed;

        const { data: stage4Data } = await supabase
          .from('collected_data')
          .select('*')
          .eq('user_id', user.id)
          .eq('data_type', 'stage4_interview_experiences')
          .maybeSingle();

        let loadedScripts: KeywordScript[] = [];

        if (stage4Data?.data_content) {
          const scripts = (stage4Data.data_content as any).scripts as KeywordScript[];
          loadedScripts = scripts || [];
        }

        setStage4Scripts(loadedScripts);

        const { data: stage5 } = await supabase
          .from('collected_data')
          .select('*')
          .eq('user_id', user.id)
          .eq('data_type', 'stage5_data')
          .maybeSingle();

        if (stage5?.data_content) {
          const raw = stage5.data_content as any;
          const s5Data: Stage5Data = {
            intensifiedScripts: Array.isArray(raw?.intensifiedScripts) ? raw.intensifiedScripts : [],
            completed: Boolean(raw?.completed),
          };

          setData(s5Data);

          if (isStageCompleted) {
            setCurrentStep(1);
          } else if (s5Data.intensifiedScripts.some(s => s?.intensifiedHow?.trim())) {
            setCurrentStep(2);
          }
        } else if (loadedScripts.length > 0) {
          setCurrentStep(1);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (stage4Scripts.length > 0 && data.intensifiedScripts.length === 0) {
      const initialized: IntensifiedScript[] = stage4Scripts.map(script => ({
        keyword: script.keyword,
        originalScript: script.script,
        intensifiedHow: "",
        experience: script.experience || ""
      }));
      setData(prev => ({ ...prev, intensifiedScripts: initialized }));
    }
  }, [stage4Scripts, data.intensifiedScripts.length]);

  const scriptsByExperience = data.intensifiedScripts.reduce((acc, script) => {
    const expKey = script.experience || "Experiência não especificada";
    if (!acc[expKey]) {
      acc[expKey] = [];
    }
    acc[expKey].push(script);
    return acc;
  }, {} as Record<string, IntensifiedScript[]>);

  const saveProgress = async (newData: Stage5Data) => {
    if (!user?.id) return;

    try {
      await supabase.from('collected_data').upsert({
        user_id: user.id,
        data_type: 'stage5_data',
        data_content: newData as any,
        stage_number: 5,
      }, {
        onConflict: 'user_id,data_type',
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const updateScript = (keyword: string, value: string) => {
    const updated = data.intensifiedScripts.map(s =>
      s.keyword === keyword ? { ...s, intensifiedHow: value } : s
    );
    const newData = { ...data, intensifiedScripts: updated };
    setData(newData);
    saveProgress(newData);
  };

  const canProceed = () => {
    // Dev users can always proceed
    if (bypassValidation) return true;
    
    switch (currentStep) {
      case 1:
        // Dev users skip animation wait
        return skipAnimations || visibleMessages >= mentorMessages.length;
      case 2:
        return data.intensifiedScripts.some(s => s.intensifiedHow?.trim());
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 3 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetStage = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('collected_data')
        .delete()
        .eq('user_id', user.id)
        .eq('data_type', 'stage5_data');

      await supabase
        .from('mentoring_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('stage_number', 5);

      toast({
        title: "Etapa reiniciada!",
        description: "Você pode intensificar um novo roteiro para outra entrevista.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error resetting stage:', error);
      toast({
        title: "Erro ao reiniciar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const completeStage = async () => {
    const newData = { ...data, completed: true };
    await saveProgress(newData);

    if (user?.id) {
      await supabase.from('mentoring_progress').upsert({
        user_id: user.id,
        stage_number: 5,
        current_step: 3,
        completed: true,
        stage_data: {}
      }, {
        onConflict: 'user_id,stage_number',
      });
    }

    toast({
      title: "Parabéns! 🎉",
      description: "Você está pronto para impressionar o gestor!",
    });
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (stage4Scripts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-semibold text-lg">Etapa 5: Convencer Gestor</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-6 max-w-md text-center border-destructive/50 bg-destructive/5">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Faltam seus roteiros da Etapa 4</h2>
            <p className="text-muted-foreground mb-4">
              Complete primeiro a Etapa 4 e finalize os roteiros para cada palavra-chave.
            </p>
            <Button onClick={() => navigate('/etapa/4')} className="gap-2">
              Ir para Etapa 4 <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {!showBenefits && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {mentorMessages.slice(0, visibleMessages).map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                          opacity: messagesExiting ? 0 : 1,
                          y: messagesExiting ? -20 : 0,
                          scale: 1
                        }}
                        transition={{
                          duration: messagesExiting ? 0.4 : 0.4,
                          ease: "easeOut",
                          delay: messagesExiting ? idx * 0.05 : 0
                        }}
                        className="flex gap-3"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
                            <img
                              src={mentorPhoto}
                              alt="Mentor"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        <Card className={`p-4 flex-1 ${
                          msg.highlight
                            ? 'bg-gradient-to-r from-primary/20 to-amber-500/20 border-primary/40'
                            : msg.quote
                            ? 'bg-amber-500/10 border-amber-500/30 italic'
                            : 'bg-secondary/50'
                        }`}>
                          <p className={`text-sm leading-relaxed ${msg.highlight ? 'font-medium' : ''}`}>
                            {msg.text}
                          </p>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {visibleMessages < mentorMessages.length && !messagesExiting && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
                        <img src={mentorPhoto} alt="Mentor" className="w-full h-full object-cover" />
                      </div>
                      <Card className="p-4 bg-secondary/30">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                          />
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {showBenefits && (
                <motion.div
                  key="benefits"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mb-3"
                    >
                      <Trophy className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h3 className="font-display text-xl font-bold">Por que isso é TÃO poderoso?</h3>
                  </div>

                  <div className="grid gap-3">
                    {benefitsCards.map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.15, duration: 0.4 }}
                      >
                        <Card className="p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <div className="flex gap-3">
                            <div className={`flex-shrink-0 ${benefit.color}`}>
                              <benefit.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{benefit.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex justify-center pt-2"
                  >
                    <Button onClick={nextStep} size="lg" className="gap-2 px-8">
                      Bora intensificar! <Rocket className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center space-y-2 mb-6"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Intensifique o COMO</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Para cada roteiro, adicione mais detalhes técnicos: ferramentas, metodologias e métricas.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 bg-amber-500/10 border-amber-500/30 max-w-2xl mx-auto mb-6">
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-300">Dica para intensificar:</p>
                    <p className="text-muted-foreground mt-1">
                      Gestor quer ver MÉTODO. Ao invés de "automatizei processos", diga: <span className="font-medium">"Automatizei usando Python + Pandas, reduzindo 8h/semana de trabalho manual."</span>
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <div className="space-y-6 max-w-2xl mx-auto">
              {Object.entries(scriptsByExperience).map(([experience, scripts], expIdx) => (
                <motion.div
                  key={experience}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + expIdx * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-3 h-3 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {experience}
                    </h4>
                    <div className="flex-1 border-t border-border/50" />
                    <span className="text-xs text-muted-foreground">
                      {scripts.filter(s => s.intensifiedHow?.trim()).length}/{scripts.length} intensificados
                    </span>
                  </div>

                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    {scripts.map((script, idx) => (
                      <Card key={`${experience}-${script.keyword}`} className="overflow-hidden">
                        <button
                          onClick={() => setExpandedKeyword(
                            expandedKeyword === `${experience}-${script.keyword}` ? null : `${experience}-${script.keyword}`
                          )}
                          className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              script.intensifiedHow?.trim()
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {script.intensifiedHow?.trim() ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className="font-medium text-left">{script.keyword}</span>
                          </div>
                          {expandedKeyword === `${experience}-${script.keyword}` ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>

                        <AnimatePresence>
                          {expandedKeyword === `${experience}-${script.keyword}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-border"
                            >
                              <div className="p-4 space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Roteiro Original (Etapa 4):
                                  </label>
                                  <div className="mt-1 p-3 bg-secondary/50 rounded-lg text-sm italic">
                                    "{script.originalScript || "Nenhum roteiro encontrado"}"
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" />
                                    Intensifique o COMO:
                                  </label>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Adicione: ferramentas específicas, metodologias usadas, métricas de resultado.
                                  </p>
                                  <Textarea
                                    value={script.intensifiedHow}
                                    onChange={(e) => updateScript(script.keyword, e.target.value)}
                                    placeholder="Ex: Utilizei metodologia Scrum com sprints de 2 semanas, ferramenta Jira para gestão, alcançando 95% de entregas no prazo e redução de 30% no tempo de desenvolvimento."
                                    className="min-h-[120px]"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center space-y-2 mb-8"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Presentation className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Sua Apresentação Visual</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Uma apresentação visual te diferencia de 99% dos candidatos e mostra iniciativa.
              </p>
            </motion.div>

            <div className="max-w-xl mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary/20 flex items-center justify-center">
                      <Presentation className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold mb-2">Template no Canva</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Use o modelo pronto para criar sua apresentação profissional.
                        Basta duplicar e preencher com suas informações.
                      </p>
                    </div>
                    <Button
                      onClick={() => window.open(CANVA_TEMPLATE_URL, '_blank')}
                      className="gap-2 w-full"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir Template no Canva
                    </Button>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-4 bg-secondary/50">
                  <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Dica para apresentar:</p>
                      <p className="text-muted-foreground mt-1">
                        "Trouxe algo especial pra vocês. Preparei uma apresentação visual do meu trabalho para facilitar nossa conversa..."
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-4 flex flex-col gap-3"
              >
                <Button onClick={completeStage} className="gap-2 w-full">
                  <Check className="w-4 h-4" />
                  Finalizar Etapa 5
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Voltar ao Portal
                </Button>
              </motion.div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-semibold text-lg">Etapa 5: Convencer Gestor</h1>
            <p className="text-xs text-muted-foreground">Intensifique o COMO</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reiniciar</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reiniciar Etapa 5?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá apagar os dados de intensificação desta etapa.
                Você poderá criar um novo roteiro intensificado para outra entrevista com gestor.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={resetStage}>Reiniciar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-6 border-b border-border overflow-x-auto">
        <div className="flex items-center justify-center gap-2 min-w-max">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : isCompleted
                      ? 'text-primary hover:bg-primary/5 cursor-pointer'
                      : 'text-muted-foreground opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{step.title}</span>
                </button>

                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 rounded transition-colors ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* Footer Navigation - only for step 2 */}
      {currentStep === 2 && (
        <div className="p-4 border-t border-border flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="gap-2"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
