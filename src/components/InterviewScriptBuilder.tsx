import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Target,
  Building2,
  Sparkles,
  Check,
  Wand2,
  Loader2,
  Edit3,
  Save,
  X,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mentorPhoto from "@/assets/mentor-photo.png";

export interface KeywordScript {
  keyword: string;
  experience: string;
  company: string;
  role: string;
  script: string;
}

interface CareerIntro {
  careerStartAge: string | null;
  education: string | null;
  yearsOfExperience: string | null;
  mainField: string | null;
  introText: string | null;
}

interface InterviewScriptBuilderProps {
  keywords: string[];
  companyName: string;
  jobDescription: string;
  linkedinAbout: string;
  experiences: string;
  onComplete: (scripts: KeywordScript[]) => void | Promise<void>;
  initialScripts?: KeywordScript[];
  onScriptsChange?: (scripts: KeywordScript[]) => void;
}

const mentorMessages = [
  "Agora vem a parte mais importante: seus ROTEIROS. 🎯",
  "A IA vai analisar TODAS as suas experiências e criar roteiros personalizados para CADA palavra-chave.",
  "Clique no botão abaixo e deixe a mágica acontecer!",
];

export const InterviewScriptBuilder = ({
  keywords,
  companyName,
  jobDescription,
  linkedinAbout,
  experiences: userExperiences,
  onComplete,
  initialScripts,
  onScriptsChange,
}: InterviewScriptBuilderProps) => {
  const hasInitialScriptsRef = useRef((initialScripts?.length ?? 0) > 0);
  
  const [conversationStep, setConversationStep] = useState(hasInitialScriptsRef.current ? mentorMessages.length : 0);
  const [showBuilder, setShowBuilder] = useState(hasInitialScriptsRef.current);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [generatedScripts, setGeneratedScripts] = useState<KeywordScript[]>(initialScripts || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [careerIntro, setCareerIntro] = useState<CareerIntro | null>(null);
  const [isLoadingIntro, setIsLoadingIntro] = useState(false);
  const [introAlreadyLoaded, setIntroAlreadyLoaded] = useState(false);

  const persistTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialScripts && initialScripts.length > 0) {
      setGeneratedScripts(initialScripts);
      setConversationStep(mentorMessages.length);
      setShowBuilder(true);
      hasInitialScriptsRef.current = true;
    }
  }, [JSON.stringify(initialScripts || [])]);

  useEffect(() => {
    if (!onScriptsChange) return;
    if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      onScriptsChange(generatedScripts);
    }, 250);
    return () => {
      if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    };
  }, [generatedScripts, onScriptsChange]);

  useEffect(() => {
    if (hasInitialScriptsRef.current) return;
    if (introAlreadyLoaded) return;
    
    const loadCareerIntro = async () => {
      if (!linkedinAbout || linkedinAbout.trim().length < 50) return;
      
      setIntroAlreadyLoaded(true);
      setIsLoadingIntro(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-career-intro', {
          body: { linkedinAbout }
        });
        
        if (error) throw error;
        if (data?.introText) {
          setCareerIntro(data);
        }
      } catch (error) {
        console.error("Error loading career intro:", error);
      } finally {
        setIsLoadingIntro(false);
      }
    };

    loadCareerIntro();
  }, [linkedinAbout, introAlreadyLoaded]);

  useEffect(() => {
    if (hasInitialScriptsRef.current) return;
    if (conversationStep < mentorMessages.length) {
      const timer = setTimeout(() => {
        setConversationStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (!showBuilder) {
      const timer = setTimeout(() => setShowBuilder(true), 500);
      return () => clearTimeout(timer);
    }
  }, [conversationStep, showBuilder]);

  const generateScriptsWithAI = async () => {
    if (!keywords || keywords.length === 0) {
      toast.error("Nenhuma palavra-chave disponível para gerar roteiros.");
      return;
    }

    setIsGeneratingScripts(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-interview-scripts', {
        body: {
          keywords,
          experiences: userExperiences,
          linkedinAbout,
          companyName,
          jobDescription,
        }
      });

      if (error) throw error;

      if (result?.scripts && result.scripts.length > 0) {
        const formattedScripts: KeywordScript[] = result.scripts.map((s: any) => ({
          keyword: s.keyword,
          experience: s.experience || `${s.role} — ${s.company}`,
          company: s.company || '',
          role: s.role || '',
          script: s.script
        }));
        
        setGeneratedScripts(formattedScripts);
        toast.success(`${formattedScripts.length} roteiros gerados com sucesso!`);
      } else {
        throw new Error("Nenhum roteiro foi gerado");
      }
    } catch (error) {
      console.error("Erro ao gerar roteiros:", error);
      toast.error("Erro ao gerar roteiros. Tente novamente.");
    } finally {
      setIsGeneratingScripts(false);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(generatedScripts[index].script);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const newScripts = [...generatedScripts];
      newScripts[editingIndex].script = editValue;
      setGeneratedScripts(newScripts);
      setEditingIndex(null);
      setEditValue('');
      toast.success("Roteiro atualizado!");
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleComplete = () => {
    if (generatedScripts.length === 0) {
      toast.error("Gere os roteiros com IA primeiro.");
      return;
    }
    onComplete(generatedScripts);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Conversational Introduction */}
      <div className="space-y-4">
        <AnimatePresence>
          {mentorMessages.slice(0, conversationStep).map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
                  <img src={mentorPhoto} alt="Mentor" className="w-full h-full object-cover" />
                </div>
              </div>
              <Card className="p-4 bg-secondary/50 flex-1">
                <p className="text-sm">{msg}</p>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {conversationStep < mentorMessages.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
      </div>

      {/* Main Builder */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Keywords Overview */}
            <Card className="p-4 bg-secondary/30">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Suas {keywords.length} Palavras-Chave da Vaga
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => {
                  const hasScript = generatedScripts.some(s => s.keyword === keyword);
                  return (
                    <span
                      key={keyword}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        hasScript
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {keyword} {hasScript && <Check className="w-3 h-3 inline ml-1" />}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {generatedScripts.length > 0 
                  ? `${generatedScripts.length} roteiros gerados`
                  : `${keywords.length} palavras prontas para gerar roteiros`}
              </p>
            </Card>

            {/* AI Generate Button - Only show if no scripts yet */}
            {generatedScripts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-6 bg-gradient-to-br from-primary/10 via-secondary/50 to-primary/5 border-primary/30">
                  <div className="text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Wand2 className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-1">
                        Gerar Roteiros com IA
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        A IA vai analisar suas experiências e criar um roteiro<br />
                        personalizado para cada palavra-chave automaticamente.
                      </p>
                    </div>
                    <Button
                      onClick={generateScriptsWithAI}
                      disabled={isGeneratingScripts || keywords.length === 0}
                      size="lg"
                      className="gap-2"
                    >
                      {isGeneratingScripts ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Gerando roteiros...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Gerar {keywords.length} Roteiros
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Generated Scripts Display */}
            {generatedScripts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Success Header */}
                <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/30 border-primary/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Roteiros Gerados!</h4>
                        <p className="text-sm text-muted-foreground">Clique em editar para personalizar cada roteiro</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateScriptsWithAI}
                      disabled={isGeneratingScripts}
                      className="gap-2"
                    >
                      {isGeneratingScripts ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Gerar Novamente
                    </Button>
                  </div>
                </Card>

                {/* Career Introduction Block */}
                {(careerIntro?.introText || isLoadingIntro) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="p-6 bg-secondary/20 border-border/50">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">Sua Introdução</h4>
                            <p className="text-xs text-muted-foreground">Comece sua apresentação assim</p>
                          </div>
                        </div>
                        
                        {isLoadingIntro ? (
                          <div className="flex items-center gap-2 py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Gerando introdução...</span>
                          </div>
                        ) : (
                          <>
                            <div className="pl-12">
                              <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                                {careerIntro?.introText}
                              </p>
                            </div>
                            
                            <div className="pl-12 pt-2">
                              <p className="text-xs text-muted-foreground/70 italic">
                                Após essa introdução, comece a falar sobre suas experiências usando os roteiros abaixo.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Scripts List - Grouped by Company */}
                <div className="space-y-8">
                  {(() => {
                    const scriptsByCompany: Record<string, KeywordScript[]> = {};
                    generatedScripts.forEach((script) => {
                      const companyKey = script.company || 'Outras Experiências';
                      if (!scriptsByCompany[companyKey]) {
                        scriptsByCompany[companyKey] = [];
                      }
                      scriptsByCompany[companyKey].push(script);
                    });

                    return Object.entries(scriptsByCompany).map(([company, scripts], groupIndex) => (
                      <motion.div
                        key={company}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
                        className="space-y-4"
                      >
                        {/* Company Header */}
                        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="text-xl font-display font-semibold text-foreground">
                            {company}
                          </h3>
                        </div>

                        {/* Scripts for this company */}
                        <div className="space-y-3 pl-2">
                          {scripts.map((script) => {
                            const originalIndex = generatedScripts.findIndex(
                              s => s.keyword === script.keyword && s.company === script.company
                            );
                            return (
                              <motion.div
                                key={`${script.company}-${script.keyword}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 }}
                              >
                                <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all">
                                  <div className="p-4">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                      <div className="space-y-1">
                                        <span className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold">
                                          {script.keyword}
                                        </span>
                                        {script.role && (
                                          <p className="text-xs text-muted-foreground pl-1">
                                            {script.role}
                                          </p>
                                        )}
                                      </div>
                                      {editingIndex !== originalIndex && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => startEditing(originalIndex)}
                                          className="gap-2 text-muted-foreground hover:text-foreground h-8"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          Editar
                                        </Button>
                                      )}
                                    </div>

                                    {editingIndex === originalIndex ? (
                                      <div className="space-y-3">
                                        <Textarea
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="min-h-[120px] text-sm"
                                          placeholder="Edite seu roteiro aqui..."
                                        />
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={cancelEdit}
                                            className="gap-2"
                                          >
                                            <X className="w-4 h-4" />
                                            Cancelar
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={saveEdit}
                                            className="gap-2"
                                          >
                                            <Save className="w-4 h-4" />
                                            Salvar
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm leading-relaxed text-foreground/90">
                                        {script.script}
                                      </p>
                                    )}
                                  </div>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>

                {/* Complete Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center pt-4"
                >
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    className="gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Concluir Roteiros para {companyName}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
