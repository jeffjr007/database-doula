import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Link2,
  FileText,
  User,
  Briefcase,
  Sparkles,
  Loader2,
  Check,
  Copy,
  ChevronDown,
  Target,
  Lightbulb,
  MessageSquare,
  Mic
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { InterviewScriptBuilder, KeywordScript } from "./InterviewScriptBuilder";
import { AboutMeGenerator } from "./AboutMeGenerator";
import { HelpCircle } from 'lucide-react';
import { Stage4Introduction } from "./Stage4Introduction";
import { StepConversationIntro } from "./StepConversationIntro";
import { InterviewSimulator } from "./InterviewSimulator";
import { SaveInterviewModal } from "./SaveInterviewModal";
import { InterviewHistoryList } from "./InterviewHistoryList";
import { MentorAvatar } from "./MentorAvatar";
import { Stage4ExitConfirmModal } from "./Stage4ExitConfirmModal";

interface Stage4GuideProps {
  stageNumber: number;
}

interface StepData {
  companyName: string;
  companyLinkedin: string;
  jobDescription: string;
  linkedinAbout: string;
  experiences: string;
  keywords: string[];
  aboutMeScript?: string;
}

const STEPS = [
  { id: 1, title: "Empresa", icon: Building2, description: "Informações da empresa" },
  { id: 2, title: "Vaga", icon: FileText, description: "Descrição da vaga" },
  { id: 3, title: "Seu Perfil", icon: User, description: "Sobre você no LinkedIn" },
  { id: 4, title: "Experiências", icon: Briefcase, description: "Suas experiências" },
  { id: 5, title: "Sobre Você", icon: MessageSquare, description: "Me fale sobre você" },
  { id: 6, title: "Palavras-Chave", icon: Target, description: "Análise da IA" },
  { id: 7, title: "Roteiro", icon: Sparkles, description: "Roteiros de experiências" },
  { id: 8, title: "Simulador", icon: Mic, description: "Treine sua entrevista" },
  { id: 9, title: "Resumo", icon: Check, description: "Seus roteiros prontos" },
];

const STAGE4_STARTED_KEY = 'stage4_started';
const STAGE4_DATA_CACHE_KEY = 'stage4_data_cache_v1';
const STAGE4_SCRIPTS_CACHE_KEY = 'stage4_scripts_cache_v1';

// Messages for "Sobre Você" intro
const ABOUT_ME_INTRO_MESSAGES = [
  { text: "Agora vamos preparar você para uma das perguntas mais comuns em entrevistas...", highlight: false },
  { text: "\"Me fale sobre você\" parece simples, mas é onde muitos candidatos tropeçam.", highlight: true },
  { text: "Vou te ajudar a criar um roteiro natural que conecta quem você é com o que a empresa busca. Nada de respostas decoradas!", highlight: false },
];

// Messages for "Palavras-Chave" intro
const KEYWORDS_INTRO_MESSAGES = [
  { text: "Ótimo! Agora vamos preparar você para outra pergunta clássica das entrevistas...", highlight: false },
  { text: "\"Me fale sobre suas experiências\" é aqui que você mostra que sabe fazer acontecer.", highlight: true },
  { text: "Vamos montar roteiros usando a estrutura: O QUE fez + COMO fez + RESULTADO. Simples e poderosa!", highlight: false },
  { text: "Primeiro, preciso identificar as palavras-chave da vaga para conectar suas experiências com o que a empresa busca.", highlight: false },
];

export const Stage4Guide = ({ stageNumber }: Stage4GuideProps) => {
  const hasStartedBefore = sessionStorage.getItem(STAGE4_STARTED_KEY) === 'true';
  
  const [showIntroduction, setShowIntroduction] = useState(!hasStartedBefore);
  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedScripts, setSavedScripts] = useState<KeywordScript[]>([]);
  const [showAboutMeIntro, setShowAboutMeIntro] = useState(true);
  const [showKeywordsIntro, setShowKeywordsIntro] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [hasSavedToHistory, setHasSavedToHistory] = useState(false);
  const [data, setData] = useState<StepData>({
    companyName: "",
    companyLinkedin: "",
    jobDescription: "",
    linkedinAbout: "",
    experiences: "",
    keywords: [],
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const hasInitializedRef = useRef(false);
  const hasUserNavigatedRef = useRef(false);

  // Check if there's unsaved progress (any data filled but not saved to history)
  const hasUnsavedProgress = useCallback(() => {
    if (hasSavedToHistory) return false;
    return (
      data.companyName.trim().length > 0 ||
      data.jobDescription.trim().length > 0 ||
      data.linkedinAbout.trim().length > 0 ||
      data.experiences.trim().length > 0 ||
      data.keywords.length > 0 ||
      savedScripts.length > 0 ||
      !!data.aboutMeScript
    );
  }, [data, savedScripts, hasSavedToHistory]);

  // Handle browser back/refresh with beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedProgress()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedProgress]);

  // Wrapper for navigate that checks for unsaved progress
  const safeNavigate = (path: string) => {
    if (hasUnsavedProgress()) {
      setShowExitConfirm(true);
      setPendingNavigation(() => () => {
        window.location.href = path;
      });
    } else {
      navigate(path);
    }
  };

  const mergeStepData = (db: StepData, local: StepData): StepData => {
    const pick = (a: string, b: string) => (a?.trim()?.length ? a : b);
    return {
      companyName: pick(local.companyName, db.companyName),
      companyLinkedin: pick(local.companyLinkedin, db.companyLinkedin),
      jobDescription: pick(local.jobDescription, db.jobDescription),
      linkedinAbout: pick(local.linkedinAbout, db.linkedinAbout),
      experiences: pick(local.experiences, db.experiences),
      keywords: (local.keywords?.length ? local.keywords : db.keywords) || [],
      aboutMeScript: local.aboutMeScript?.trim() ? local.aboutMeScript : db.aboutMeScript,
    };
  };

  const persistLocalCache = (newData: StepData, scripts: KeywordScript[]) => {
    try {
      sessionStorage.setItem(STAGE4_DATA_CACHE_KEY, JSON.stringify(newData));
      sessionStorage.setItem(STAGE4_SCRIPTS_CACHE_KEY, JSON.stringify(scripts));
    } catch {
      // ignore
    }
  };

  // Hydrate from local cache immediately (prevents "data disappears" during fast navigation)
  useEffect(() => {
    try {
      const cachedDataRaw = sessionStorage.getItem(STAGE4_DATA_CACHE_KEY);
      const cachedScriptsRaw = sessionStorage.getItem(STAGE4_SCRIPTS_CACHE_KEY);
      if (cachedDataRaw) {
        const cached = JSON.parse(cachedDataRaw) as StepData;
        setData(prev => mergeStepData(prev, cached));
        setShowIntroduction(false);
      }
      if (cachedScriptsRaw) {
        const cachedScripts = JSON.parse(cachedScriptsRaw) as KeywordScript[];
        if (Array.isArray(cachedScripts) && cachedScripts.length > 0) {
          setSavedScripts(cachedScripts);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) return;

      try {
        const { data: progressData } = await supabase
          .from('mentoring_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('stage_number', 4)
          .maybeSingle();

        const isStageCompleted = progressData?.completed;

        const { data: progress } = await supabase
          .from('collected_data')
          .select('*')
          .eq('user_id', user.id)
          .eq('data_type', 'stage4_data')
          .maybeSingle();

        if (progress?.data_content) {
          const savedData = progress.data_content as unknown as StepData;
          setData((prev) => mergeStepData(savedData, prev));
          
          // Hide introduction if user has saved progress
          setShowIntroduction(false);
          sessionStorage.setItem(STAGE4_STARTED_KEY, 'true');

          // Only decide initial step once, and never override user's navigation
          if (!hasInitializedRef.current && !hasUserNavigatedRef.current) {
            if (isStageCompleted) {
              setCurrentStep(1);
            } else {
              if (savedData.keywords.length > 0) setCurrentStep(7);
              else if (savedData.aboutMeScript) setCurrentStep(6);
              else if (savedData.experiences) setCurrentStep(5);
              else if (savedData.linkedinAbout) setCurrentStep(4);
              else if (savedData.jobDescription) setCurrentStep(3);
              else if (savedData.companyName) setCurrentStep(2);
            }
          }
        }

        const { data: expData } = await supabase
          .from('collected_data')
          .select('*')
          .eq('user_id', user.id)
          .eq('data_type', 'stage4_interview_experiences')
          .maybeSingle();

        if (expData?.data_content) {
          const scripts = (expData.data_content as any).scripts as KeywordScript[];
          if (scripts && scripts.length > 0) {
            setSavedScripts(scripts);
            try {
              sessionStorage.setItem(STAGE4_SCRIPTS_CACHE_KEY, JSON.stringify(scripts));
            } catch {
              // ignore
            }
          }
        }
        hasInitializedRef.current = true;
      } catch (error) {
        // No saved data, start fresh
        hasInitializedRef.current = true;
      }
    };

    loadProgress();
  }, [user?.id]);

  // Track highest step reached and update intro visibility
  useEffect(() => {
    if (currentStep > highestStepReached) {
      setHighestStepReached(currentStep);
    }
    
    // If user reaches step 5 for the first time, show intro; on revisit, skip
    if (currentStep === 5 && highestStepReached >= 5) {
      setShowAboutMeIntro(false);
    }
    // If user reaches step 6 for the first time, show intro; on revisit, skip
    if (currentStep === 6 && highestStepReached >= 6) {
      setShowKeywordsIntro(false);
    }
  }, [currentStep, highestStepReached]);

  const saveProgress = async (newData: StepData) => {
    if (!user?.id) return;

    // Always keep a local cache (fast, resilient)
    persistLocalCache(newData, savedScripts);

    try {
      await supabase.from('collected_data').upsert({
        user_id: user.id,
        data_type: 'stage4_data',
        data_content: newData as any,
        stage_number: 4,
      }, {
        onConflict: 'user_id,data_type',
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const updateData = (field: keyof StepData, value: string | string[]) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    saveProgress(newData);
  };

  const persistScripts = async (scripts: KeywordScript[]) => {
    setSavedScripts(scripts);
    try {
      sessionStorage.setItem(STAGE4_SCRIPTS_CACHE_KEY, JSON.stringify(scripts));
    } catch {
      // ignore
    }
    if (user?.id) {
      try {
        await supabase.from('collected_data').upsert({
          user_id: user.id,
          data_type: 'stage4_interview_experiences',
          stage_number: 4,
          data_content: { scripts } as any,
        }, {
          onConflict: 'user_id,data_type',
        });
      } catch (error) {
        console.error('Error saving scripts:', error);
      }
    }
  };

  const analyzeKeywords = async () => {
    setIsAnalyzing(true);

    try {
      const { data: response, error } = await supabase.functions.invoke('analyze-job-keywords', {
        body: {
          jobDescription: data.jobDescription,
          linkedinAbout: data.linkedinAbout,
          experiences: data.experiences,
        },
      });

      if (error) throw error;

      if (response?.keywords) {
        const newData = { ...data, keywords: response.keywords };
        setData(newData);
        await saveProgress(newData);
        setCurrentStep(7);
      }
    } catch (error: any) {
      console.error('Error analyzing keywords:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar as palavras-chave. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyPrompt = () => {
    const prompt = `Faça uma análise dessa vaga:

${data.jobDescription}

Esse é o meu perfil e minhas experiências:

${data.linkedinAbout}

${data.experiences}

Liste todas as palavras-chave da vaga para que eu possa criar o meu roteiro de entrevista. Não faça sugestão de roteiro, apenas liste as palavras-chave que eu deva conectar com minhas experiências profissionais e perfil.`;

    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "Prompt copiado!",
      description: "Cole no ChatGPT ou Claude para obter suas palavras-chave.",
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.companyName.trim().length > 0;
      case 2: return data.jobDescription.trim().length > 0;
      case 3: return data.linkedinAbout.trim().length > 0;
      case 4: return data.experiences.trim().length > 0;
      case 5: return !!data.aboutMeScript;
      case 6: return data.keywords.length > 0;
      case 7: return savedScripts.length > 0;
      default: return true;
    }
  };

  // Check if a step has been completed (data saved/validated)
  // Steps 8 and 9 are only "completed" if the user has actually visited them
  const isStepCompleted = (stepId: number): boolean => {
    switch (stepId) {
      case 1: return data.companyName.trim().length > 0;
      case 2: return data.jobDescription.trim().length > 0;
      case 3: return data.linkedinAbout.trim().length > 0;
      case 4: return data.experiences.trim().length > 0;
      case 5: return !!data.aboutMeScript;
      case 6: return data.keywords.length > 0;
      case 7: return savedScripts.length > 0;
      // Steps 8 and 9: only completed if user has moved PAST them
      case 8: return currentStep > 8;
      case 9: return currentStep > 9;
      default: return false;
    }
  };

  // Safe navigation that saves progress before moving
  // Allows going BACK to any visited step, but FORWARD only if current step is completed
  const navigateToStep = async (targetStep: number) => {
    // Going backward or to same step: always allowed
    if (targetStep <= currentStep) {
      hasUserNavigatedRef.current = true;
      await saveProgress(data);
      setCurrentStep(targetStep);
      return;
    }

    // Going forward: only if current step is completed AND target is the next one
    // OR if target step was already reached (allowing re-visit of completed steps)
    const canGoForward = isStepCompleted(currentStep) && (targetStep === currentStep + 1 || targetStep <= highestStepReached);
    
    if (canGoForward) {
      hasUserNavigatedRef.current = true;
      await saveProgress(data);
      setCurrentStep(targetStep);
    } else {
      toast({
        title: "Complete o passo atual",
        description: "Preencha os dados obrigatórios antes de avançar.",
        variant: "destructive",
      });
    }
  };

  const nextStep = async () => {
    if (currentStep < 9 && canProceed()) {
      hasUserNavigatedRef.current = true;
      await saveProgress(data);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = async () => {
    if (currentStep > 1) {
      hasUserNavigatedRef.current = true;
      await saveProgress(data);
      setCurrentStep(prev => prev - 1);
    }
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Qual empresa você vai entrevistar?</h2>
              <p className="text-muted-foreground">Vamos começar identificando a empresa alvo</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Empresa</label>
                <Input
                  value={data.companyName}
                  onChange={(e) => updateData('companyName', e.target.value)}
                  placeholder="Ex: Magazine Luiza, Nubank, Ambev..."
                  className="h-12 text-lg"
                  disabled={isReviewMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  LinkedIn da Empresa (opcional)
                </label>
                <Input
                  value={data.companyLinkedin}
                  onChange={(e) => updateData('companyLinkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="h-12"
                  disabled={isReviewMode}
                />
              </div>
            </div>

            {/* Interview History Section */}
            <div className="max-w-md mx-auto pt-6">
              <InterviewHistoryList
                onLoadInterview={(loadedData) => {
                  setData({
                    companyName: loadedData.companyName || "",
                    companyLinkedin: loadedData.companyLinkedin || "",
                    jobDescription: loadedData.jobDescription || "",
                    linkedinAbout: loadedData.linkedinAbout || "",
                    experiences: loadedData.experiences || "",
                    keywords: loadedData.keywords || [],
                    aboutMeScript: loadedData.aboutMeScript,
                  });
                  if (loadedData.savedScripts) {
                    setSavedScripts(loadedData.savedScripts);
                  }
                  setIsReviewMode(true);
                  setCurrentStep(9);
                }}
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Cole a descrição da vaga</h2>
              <p className="text-muted-foreground">
                Copie toda a descrição da vaga do LinkedIn ou site da empresa
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Textarea
                value={data.jobDescription}
                onChange={(e) => updateData('jobDescription', e.target.value)}
                placeholder="Cole aqui a descrição completa da vaga...

Exemplo:
- Responsabilidades
- Requisitos
- Qualificações desejadas
- Benefícios
- Sobre a empresa"
                className="min-h-[300px] text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {data.jobDescription.length} caracteres
              </p>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Cole seu "Sobre" do LinkedIn</h2>
              <p className="text-muted-foreground">
                Acesse seu perfil do LinkedIn e copie a seção "Sobre"
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="p-4 bg-secondary/50 border-primary/20 mb-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Dica:</p>
                    <p>Vá no seu LinkedIn → clique em "Sobre" → copie todo o texto.</p>
                  </div>
                </div>
              </Card>

              <Textarea
                value={data.linkedinAbout}
                onChange={(e) => updateData('linkedinAbout', e.target.value)}
                placeholder="Cole aqui o texto do seu 'Sobre' do LinkedIn..."
                className="min-h-[200px] text-base"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Cole suas experiências</h2>
              <p className="text-muted-foreground">
                Copie suas experiências do LinkedIn ou seu CV completo
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="p-4 bg-secondary/50 border-primary/20 mb-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">O que incluir:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Cargo e empresa</li>
                      <li>Período trabalhado</li>
                      <li>Principais responsabilidades</li>
                      <li>Conquistas e resultados</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Textarea
                value={data.experiences}
                onChange={(e) => updateData('experiences', e.target.value)}
                placeholder="Cole aqui suas experiências profissionais..."
                className="min-h-[300px] text-base"
              />
            </div>
          </motion.div>
        );

      case 5:
        // Show intro only if no script yet and first time on step 5
        if (showAboutMeIntro && !data.aboutMeScript && highestStepReached < 5) {
          return (
            <motion.div
              key="step-5-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepConversationIntro
                messages={ABOUT_ME_INTRO_MESSAGES}
                buttonText="Começar"
                onContinue={() => setShowAboutMeIntro(false)}
              />
            </motion.div>
          );
        }
        return (
          <motion.div
            key="step-5-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AboutMeGenerator
              onComplete={async (script) => {
                const newData = { ...data, aboutMeScript: script };
                setData(newData);
                await saveProgress(newData);
                setShowKeywordsIntro(true);
                setCurrentStep(6);
              }}
            />
          </motion.div>
        );

      case 6:
        // Show intro only if no keywords yet and first time on step 6
        if (showKeywordsIntro && data.keywords.length === 0 && highestStepReached < 6) {
          return (
            <motion.div
              key="step-6-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepConversationIntro
                messages={KEYWORDS_INTRO_MESSAGES}
                buttonText="Analisar Palavras-Chave"
                onContinue={() => setShowKeywordsIntro(false)}
              />
            </motion.div>
          );
        }
        return (
          <motion.div
            key="step-6-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Análise de Palavras-Chave</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                A IA vai identificar as competências mais importantes da vaga
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              {data.keywords.length === 0 ? (
                <Card 
                  className={`p-8 border-border/50 transition-all ${
                    isAnalyzing 
                      ? 'bg-secondary/30' 
                      : 'bg-secondary/20 hover:bg-secondary/30 cursor-pointer hover:border-primary/30'
                  }`}
                  onClick={!isAnalyzing ? analyzeKeywords : undefined}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                      isAnalyzing ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      {isAnalyzing ? (
                        <Loader2 className="w-7 h-7 text-primary animate-spin" />
                      ) : (
                        <Sparkles className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">
                        {isAnalyzing ? 'Analisando...' : 'Iniciar Análise com IA'}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {isAnalyzing 
                          ? 'Extraindo palavras-chave da vaga e do seu perfil'
                          : 'Clique para extrair automaticamente as palavras-chave mais relevantes da vaga'
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 bg-secondary/20 border-border/50">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Palavras-chave encontradas</h3>
                          <p className="text-xs text-muted-foreground">{data.keywords.length} competências identificadas</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={analyzeKeywords}
                        disabled={isAnalyzing}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Reanalisar'
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {data.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg border border-primary/20"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2">
                      <Button onClick={() => setCurrentStep(7)} className="w-full gap-2">
                        Continuar para Roteiros
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            key="step-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <InterviewScriptBuilder
              keywords={data.keywords}
              companyName={data.companyName}
              jobDescription={data.jobDescription}
              linkedinAbout={data.linkedinAbout}
              experiences={data.experiences}
              initialScripts={savedScripts}
              onScriptsChange={(scripts) => {
                // Persist continuously to avoid loss when navigating away
                void persistScripts(scripts);
              }}
              onComplete={async (scripts) => {
                await persistScripts(scripts);
                setCurrentStep(8);
              }}
            />
          </motion.div>
        );

      case 8:
        return (
          <motion.div
            key="step-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <InterviewSimulator
              aboutMeScript={data.aboutMeScript || ''}
              experienceScripts={savedScripts}
              onComplete={() => setCurrentStep(9)}
            />
          </motion.div>
        );

      case 9:
        // Show intro only on first visit to step 9 in this session
        const step9IntroKey = 'stage4_step9_intro_seen';
        const hasSeenStep9Intro = sessionStorage.getItem(step9IntroKey) === 'true';
        
        if (!hasSeenStep9Intro && highestStepReached < 9) {
          // Mark as seen immediately to avoid re-showing
          sessionStorage.setItem(step9IntroKey, 'true');
          
          return (
            <motion.div
              key="step-9-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4"
            >
              <MentorAvatar size="xxl" />
              <div className="text-center space-y-3 max-w-md">
                <h2 className="font-display text-2xl font-bold">Parabéns! 🎉</h2>
                <p className="text-muted-foreground">
                  Você completou a preparação! Seus roteiros estão prontos para você revisar e praticar.
                </p>
              </div>
              <Button onClick={() => setHighestStepReached(9)} className="gap-2">
                Ver Meus Roteiros
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          );
        }
        
        return (
          <motion.div
            key="step-9"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold">Seus Roteiros Prontos!</h2>
              <p className="text-muted-foreground">
                Revise seus roteiros abaixo. Eles serão usados na Etapa 5 para impressionar gestores.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Roteiro "Me fale sobre você" */}
              {data.aboutMeScript && (
                <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">"Me fale sobre você"</h3>
                        <p className="text-sm text-muted-foreground">Resposta pessoal</p>
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg text-sm whitespace-pre-wrap border border-border">
                      "{data.aboutMeScript}"
                    </div>
                  </div>
                </Card>
              )}

              {/* Roteiros de palavras-chave */}
              {savedScripts.map((script, index) => (
                <Card key={script.keyword} className="p-4 bg-secondary/30">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{script.keyword}</h3>
                        {script.experience && (
                          <p className="text-sm text-muted-foreground">{script.experience}</p>
                        )}
                      </div>
                    </div>

                    {script.script && (
                      <div className="p-3 bg-background rounded-lg text-sm whitespace-pre-wrap border border-border">
                        "{script.script}"
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="max-w-2xl mx-auto pt-4 flex flex-col gap-3">
              {isReviewMode ? (
                <Button
                  onClick={() => {
                    setIsReviewMode(false);
                    setData({
                      companyName: "",
                      companyLinkedin: "",
                      jobDescription: "",
                      linkedinAbout: "",
                      experiences: "",
                      keywords: [],
                    });
                    setSavedScripts([]);
                    setCurrentStep(1);
                  }}
                  className="gap-2 w-full"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Início
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setShowSaveModal(true)}
                    className="gap-2 w-full"
                  >
                    <Check className="w-4 h-4" />
                    Finalizar Etapa 4
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(5)}
                    className="w-full"
                  >
                    Voltar e Editar "Sobre Você"
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const handleStartFromIntro = () => {
    setShowIntroduction(false);
    sessionStorage.setItem(STAGE4_STARTED_KEY, 'true');
  };

  // Show introduction first if user hasn't started
  if (showIntroduction) {
    return (
      <div className="min-h-screen bg-background">
        <Stage4Introduction onStart={handleStartFromIntro} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <h1 className="font-display font-semibold text-lg">
            Etapa 4: Convencer Recrutador
          </h1>
          <p className="text-xs text-muted-foreground">
            Guia interativo de preparação
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/suporte')}
            className="text-muted-foreground hover:text-primary"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-6 border-b border-border overflow-x-auto">
        <div className="flex items-center justify-center gap-2 min-w-max">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            // A step shows CHECKMARK only if user is PAST it in the current flow
            // This ensures going back doesn't keep future steps marked as complete
            const isPast = currentStep > step.id;
            const hasValidData = isStepCompleted(step.id);
            
            // Show checkmark ONLY for steps we've passed (not just visited)
            const showCheckmark = isPast && hasValidData;
            
            // Step is accessible (clickable) if:
            // - It's a previous step (going back is always allowed)
            // - It's the current step
            // - It's the next step and current is completed
            // - It was reached before with valid data (allows revisiting)
            const wasReached = step.id <= highestStepReached;
            const canNavigate = step.id < currentStep || 
                               (step.id === currentStep) || 
                               (step.id === currentStep + 1 && canProceed()) ||
                               (wasReached && hasValidData && step.id < currentStep);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => canNavigate && navigateToStep(step.id)}
                  disabled={!canNavigate}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : showCheckmark
                      ? 'text-primary hover:bg-primary/5 cursor-pointer'
                      : canNavigate
                      ? 'text-muted-foreground hover:bg-muted/50 cursor-pointer'
                      : 'text-muted-foreground opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : showCheckmark
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {showCheckmark ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">
                    {step.title}
                  </span>
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

      {/* Footer Navigation - Fixed at bottom */}
      {currentStep < 5 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex justify-between z-10">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
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

      {currentStep === 6 && data.keywords.length === 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex justify-start z-10">
          <Button
            variant="outline"
            onClick={prevStep}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      )}

      {/* Bottom padding to account for fixed footer */}
      {(currentStep < 5 || (currentStep === 6 && data.keywords.length === 0)) && (
        <div className="h-20" />
      )}

      {/* Save Interview Modal */}
      <SaveInterviewModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        data={data}
        savedScripts={savedScripts}
        onSaveComplete={async () => {
          if (user?.id) {
            await supabase.from('mentoring_progress').upsert({
              user_id: user.id,
              stage_number: stageNumber,
              current_step: 9,
              completed: true,
              stage_data: {},
            }, {
              onConflict: 'user_id,stage_number',
            });
          }
          setHasSavedToHistory(true);
          setShowSaveModal(false);
          toast({
            title: "Parabéns! 🎉",
            description: "Etapa 4 concluída. Agora avance para a Etapa 5!",
          });
          navigate('/');
        }}
      />

      {/* Exit Confirmation Modal */}
      <Stage4ExitConfirmModal
        open={showExitConfirm}
        onConfirm={() => {
          setShowExitConfirm(false);
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        }}
        onCancel={() => {
          setShowExitConfirm(false);
          setPendingNavigation(null);
        }}
      />
    </div>
  );
};
