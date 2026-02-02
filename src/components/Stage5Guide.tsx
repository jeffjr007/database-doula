import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  RotateCcw,
  Building2,
  Clock,
  FileText,
  Image,
  MessageSquare,
  BarChart3,
  Quote,
  RefreshCw
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import mentorPhoto from "@/assets/mentor-photo.png";
import { KeywordScript } from "./InterviewScriptBuilder";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Stage5GuideProps {
  stageNumber: number;
}

interface InterviewHistory {
  id: string;
  name: string;
  company_name: string;
  job_title?: string;
  created_at: string;
  data_content: {
    savedScripts?: KeywordScript[];
    [key: string]: any;
  };
}

interface IntensifiedScript {
  keyword: string;
  originalScript: string;
  intensifiedHow: string;
  experience: string;
}

interface Stage5Data {
  selectedInterviewId: string | null;
  intensifiedScripts: IntensifiedScript[];
  completed: boolean;
}

const STEPS = [
  { id: 1, title: "Escolher Entrevista", icon: FileText, description: "Selecionar roteiro" },
  { id: 2, title: "Introdução", icon: Users, description: "Por que gestores?" },
  { id: 3, title: "Intensificar", icon: Zap, description: "O COMO" },
  { id: 4, title: "Apresentação", icon: Presentation, description: "Template" },
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

// Presentation template slides structure
const presentationSlides = [
  {
    number: 1,
    title: "Capa",
    icon: Image,
    description: "Sua primeira impressão",
    items: [
      "Frase impactante que resuma você",
      "Sua foto profissional",
      "Seu nome completo"
    ],
    tip: 'Ex: "Transformando dados em decisões estratégicas"'
  },
  {
    number: 2,
    title: "Apresentação",
    icon: Users,
    description: "Match com a vaga",
    items: [
      "3 atividades + resultados alinhados à vaga",
      'Texto "demos match" para mostrar conexão',
      "Use ícones visuais para cada atividade"
    ],
    tip: "Mostre que suas experiências são exatamente o que eles procuram"
  },
  {
    number: "3-6",
    title: "Diagnóstico",
    icon: Target,
    description: "Desafios e soluções",
    items: [
      "Problema/desafio que você enfrentou",
      "Sua solução (pode ser print, vídeo, gráfico)",
      "Resultados obtidos com métricas",
      "Use 1 slide por experiência relevante"
    ],
    tip: "Aqui você mostra o COMO - metodologias, ferramentas, processos"
  },
  {
    number: "7-8",
    title: "Resultados",
    icon: BarChart3,
    description: "Impacto consolidado",
    items: [
      "Tabela com áreas/ações realizadas",
      "O que foi feito + como foi feito",
      "Métricas e números de impacto"
    ],
    tip: "Gestores AMAM números. Seja específico: %, R$, tempo economizado"
  },
  {
    number: 9,
    title: "Fechamento",
    icon: Quote,
    description: "Encerramento memorável",
    items: [
      "Sua foto novamente",
      "Frase de fechamento impactante",
      "Opcional: contatos ou QR code do LinkedIn"
    ],
    tip: 'Ex: "Pronto para transformar desafios em resultados"'
  }
];

export const Stage5Guide = ({ stageNumber }: Stage5GuideProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [interviews, setInterviews] = useState<InterviewHistory[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewHistory | null>(null);
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showBenefits, setShowBenefits] = useState(false);
  const [messagesExiting, setMessagesExiting] = useState(false);
  const [isIntensifying, setIsIntensifying] = useState(false);
  const [expandedSlide, setExpandedSlide] = useState<number | string | null>(null);
  const hasIntensifiedRef = useRef(false);

  const [data, setData] = useState<Stage5Data>({
    selectedInterviewId: null,
    intensifiedScripts: [],
    completed: false
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load saved interviews and existing progress
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      setIsLoading(true);

      try {
        // Load interviews and stage 5 data in parallel
        const [interviewsResult, stage5Result, progressResult] = await Promise.all([
          supabase
            .from('interview_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('collected_data')
            .select('*')
            .eq('user_id', user.id)
            .eq('data_type', 'stage5_data')
            .maybeSingle(),
          supabase
            .from('mentoring_progress')
            .select('completed')
            .eq('user_id', user.id)
            .eq('stage_number', 5)
            .maybeSingle()
        ]);

        const loadedInterviews = (interviewsResult.data || []) as InterviewHistory[];
        setInterviews(loadedInterviews);

        const isStageCompleted = progressResult.data?.completed;

        if (stage5Result.data?.data_content) {
          const raw = stage5Result.data.data_content as any;
          const s5Data: Stage5Data = {
            selectedInterviewId: raw?.selectedInterviewId || null,
            intensifiedScripts: Array.isArray(raw?.intensifiedScripts) ? raw.intensifiedScripts : [],
            completed: Boolean(raw?.completed),
          };

          setData(s5Data);

          // Check if we already have intensified scripts
          const hasIntensified = s5Data.intensifiedScripts.some(s => s?.intensifiedHow?.trim());
          if (hasIntensified) {
            hasIntensifiedRef.current = true;
          }

          // If there's a selected interview, find it
          if (s5Data.selectedInterviewId) {
            const found = loadedInterviews.find(i => i.id === s5Data.selectedInterviewId);
            if (found) {
              setSelectedInterview(found);
              // Determine which step to show
              if (isStageCompleted || hasIntensified) {
                setCurrentStep(3); // Show intensified results
              } else {
                setCurrentStep(2); // Show intro
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Animate conversation messages
  useEffect(() => {
    if (currentStep === 2 && visibleMessages < mentorMessages.length && !messagesExiting) {
      const nextMessage = mentorMessages[visibleMessages];
      const delay = visibleMessages === 0 ? 500 : (nextMessage.delay - (mentorMessages[visibleMessages - 1]?.delay || 0)) * 1000;

      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (visibleMessages >= mentorMessages.length && !showBenefits && !messagesExiting && currentStep === 2) {
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

  // Auto-intensify scripts when entering step 3
  useEffect(() => {
    if (currentStep === 3 && selectedInterview && !hasIntensifiedRef.current && !isIntensifying) {
      const scripts = selectedInterview.data_content?.savedScripts || [];
      if (scripts.length > 0 && data.intensifiedScripts.every(s => !s.intensifiedHow?.trim())) {
        intensifyScriptsWithAI();
      }
    }
  }, [currentStep, selectedInterview]);

  const intensifyScriptsWithAI = async () => {
    if (!selectedInterview || isIntensifying || hasIntensifiedRef.current) return;

    const scripts = selectedInterview.data_content?.savedScripts || [];
    if (scripts.length === 0) return;

    setIsIntensifying(true);

    try {
      const scriptsToIntensify = scripts.map((s: KeywordScript) => ({
        keyword: s.keyword,
        originalScript: s.script,
        experience: s.experience || `${s.role} — ${s.company}`
      }));

      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intensify-scripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          scripts: scriptsToIntensify,
          companyName: selectedInterview.company_name,
          jobTitle: selectedInterview.job_title || selectedInterview.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao intensificar roteiros');
      }

      const result = await response.json();
      
      if (result.intensifiedScripts && result.intensifiedScripts.length > 0) {
        // Merge intensified results with existing data
        const updatedScripts: IntensifiedScript[] = scripts.map((s: KeywordScript) => {
          const intensified = result.intensifiedScripts.find((i: any) => i.keyword === s.keyword);
          return {
            keyword: s.keyword,
            originalScript: s.script,
            intensifiedHow: intensified?.intensifiedHow || '',
            experience: s.experience || `${s.role} — ${s.company}`
          };
        });

        const newData: Stage5Data = {
          ...data,
          intensifiedScripts: updatedScripts
        };

        setData(newData);
        await saveProgress(newData);
        hasIntensifiedRef.current = true;

        toast({
          title: "Roteiros intensificados! 🚀",
          description: "A IA adicionou detalhes técnicos aos seus roteiros.",
        });
      }
    } catch (error) {
      console.error('Error intensifying scripts:', error);
      toast({
        title: "Erro ao intensificar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });

      // Initialize scripts without intensification so user can continue
      const scripts = selectedInterview.data_content?.savedScripts || [];
      const initialized: IntensifiedScript[] = scripts.map((s: KeywordScript) => ({
        keyword: s.keyword,
        originalScript: s.script,
        intensifiedHow: "",
        experience: s.experience || `${s.role} — ${s.company}`
      }));
      setData(prev => ({ ...prev, intensifiedScripts: initialized }));
    } finally {
      setIsIntensifying(false);
    }
  };

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

  const selectInterview = async (interview: InterviewHistory) => {
    setSelectedInterview(interview);
    
    const scripts = interview.data_content?.savedScripts || [];
    const initialized: IntensifiedScript[] = scripts.map((script: KeywordScript) => ({
      keyword: script.keyword,
      originalScript: script.script,
      intensifiedHow: "",
      experience: script.experience || `${script.role} — ${script.company}`
    }));
    
    const newData: Stage5Data = {
      selectedInterviewId: interview.id,
      intensifiedScripts: initialized,
      completed: false
    };
    
    setData(newData);
    hasIntensifiedRef.current = false;
    await saveProgress(newData);
    setCurrentStep(2);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedInterview !== null;
      case 2:
        return visibleMessages >= mentorMessages.length;
      case 3:
        return data.intensifiedScripts.some(s => s.intensifiedHow?.trim());
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && canProceed()) {
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
        description: "Você pode escolher outra entrevista para intensificar.",
      });

      // Reset local state
      setData({
        selectedInterviewId: null,
        intensifiedScripts: [],
        completed: false
      });
      setSelectedInterview(null);
      setCurrentStep(1);
      setVisibleMessages(0);
      setShowBenefits(false);
      setMessagesExiting(false);
      hasIntensifiedRef.current = false;
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
        current_step: 4,
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

  if (interviews.length === 0) {
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
            <h2 className="font-display text-xl font-bold mb-2">Nenhuma entrevista salva</h2>
            <p className="text-muted-foreground mb-4">
              Complete primeiro a Etapa 4 e salve pelo menos uma entrevista para continuar.
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Escolha a Entrevista</h2>
              <p className="text-muted-foreground">
                Selecione qual entrevista você quer intensificar para impressionar o gestor.
              </p>
            </div>

            <div className="space-y-3">
              {interviews.map((interview, index) => (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                      selectedInterview?.id === interview.id 
                        ? 'border-primary bg-primary/5' 
                        : ''
                    }`}
                    onClick={() => setSelectedInterview(interview)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedInterview?.id === interview.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10'
                      }`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{interview.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{interview.company_name}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(interview.created_at), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        {interview.data_content?.savedScripts && (
                          <Badge variant="secondary" className="mt-1">
                            {interview.data_content.savedScripts.length} roteiros
                          </Badge>
                        )}
                      </div>
                      {selectedInterview?.id === interview.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {selectedInterview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center pt-4"
              >
                <Button onClick={() => selectInterview(selectedInterview)} size="lg" className="gap-2 px-8">
                  Continuar com esta entrevista <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
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
              className="text-center space-y-2 mb-6"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Roteiros Intensificados</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                A IA adicionou detalhes técnicos sobre o COMO: ferramentas, metodologias e métricas.
              </p>
              {selectedInterview && (
                <Badge variant="outline" className="mt-2">
                  {selectedInterview.name} • {selectedInterview.company_name}
                </Badge>
              )}
            </motion.div>

            {isIntensifying && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Intensificando roteiros...</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  A IA está adicionando detalhes técnicos sobre ferramentas, metodologias e métricas aos seus roteiros.
                </p>
              </motion.div>
            )}

            {!isIntensifying && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-4 bg-green-500/10 border-green-500/30 max-w-2xl mx-auto mb-6">
                    <div className="flex gap-3">
                      <Sparkles className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-700 dark:text-green-300">Roteiros intensificados pela IA</p>
                        <p className="text-muted-foreground mt-1">
                          Cada roteiro agora inclui detalhes técnicos que mostram seu MÉTODO ao gestor.
                          Use essas informações na sua apresentação!
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
                          <Building2 className="w-3 h-3 text-primary" />
                        </div>
                        <h4 className="font-medium text-sm text-muted-foreground">
                          {experience}
                        </h4>
                        <div className="flex-1 border-t border-border/50" />
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

                                    {script.intensifiedHow && (
                                      <div>
                                        <label className="text-sm font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
                                          <Zap className="w-4 h-4" />
                                          Intensificação (O COMO):
                                        </label>
                                        <div className="mt-1 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                                          {script.intensifiedHow}
                                        </div>
                                      </div>
                                    )}
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

                {!data.intensifiedScripts.some(s => s.intensifiedHow?.trim()) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center pt-4"
                  >
                    <Button 
                      onClick={intensifyScriptsWithAI} 
                      disabled={isIntensifying}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Tentar intensificar novamente
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        );

      case 4:
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
              <h2 className="font-display text-2xl font-bold">Monte Sua Apresentação</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Use o template pronto e siga a estrutura abaixo para criar uma apresentação que vai impressionar o gestor.
              </p>
            </motion.div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Template Button */}
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
                        Duplique o modelo e preencha com suas informações seguindo a estrutura abaixo.
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

              {/* Structure Guide */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Estrutura da Apresentação
                </h3>

                {presentationSlides.map((slide, idx) => (
                  <motion.div
                    key={slide.number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + idx * 0.08 }}
                  >
                    <Card className="overflow-hidden">
                      <button
                        onClick={() => setExpandedSlide(expandedSlide === slide.number ? null : slide.number)}
                        className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <slide.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Slide {slide.number}
                              </Badge>
                              <span className="font-medium">{slide.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{slide.description}</p>
                          </div>
                        </div>
                        {expandedSlide === slide.number ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedSlide === slide.number && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border"
                          >
                            <div className="p-4 space-y-3">
                              <div className="space-y-2">
                                {slide.items.map((item, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <div className="flex gap-2">
                                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-muted-foreground">{slide.tip}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* How to present */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-4 bg-secondary/50">
                  <div className="flex gap-3">
                    <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Como introduzir a apresentação:</p>
                      <p className="text-muted-foreground mt-1 italic">
                        "Trouxe algo especial pra vocês. Preparei uma apresentação visual do meu trabalho para facilitar nossa conversa e mostrar na prática como trabalho..."
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Complete Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
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

        {currentStep > 1 && (
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
                  Você poderá escolher outra entrevista para intensificar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={resetStage}>Reiniciar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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

      {/* Footer Navigation - only for step 3 */}
      {currentStep === 3 && !isIntensifying && (
        <div className="p-4 border-t border-border bg-background">
          <div className="flex justify-between max-w-2xl mx-auto">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button 
              onClick={nextStep} 
              disabled={!canProceed()}
              className="gap-2"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
