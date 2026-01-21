import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Target,
  Lightbulb,
  MessageSquare,
  Building2,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Quote,
  Wand2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mentorPhoto from "@/assets/mentor-photo.png";

// Cada palavra-chave tem seu próprio roteiro
export interface KeywordScript {
  keyword: string;
  experience: string; // qual experiência usou (empresa/cargo)
  script: string; // roteiro completo: O QUE + COMO + RESULTADO
}

// Experiência com múltiplas palavras-chave, cada uma com seu roteiro
interface Experience {
  id: string;
  company: string;
  role: string;
  selectedKeywords: string[];
  keywordScripts: { [keyword: string]: string }; // roteiro para cada palavra-chave
  transition: string;
}

interface InterviewScriptBuilderProps {
  keywords: string[];
  companyName: string;
  jobDescription: string;
  linkedinAbout: string;
  experiences: string;
  onComplete: (scripts: KeywordScript[]) => void | Promise<void>;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const mentorMessages = [
  "Agora vem a parte mais importante: montar seu ROTEIRO. 🎯",
  "Para CADA palavra-chave, você vai criar uma fala específica. Assim você nunca fica sem saber o que dizer.",
  "A estrutura mágica é: [O QUE fez] + [COMO fez] + [RESULTADO]. Isso mostra AÇÃO, MÉTODO e IMPACTO.",
];

export const InterviewScriptBuilder = ({
  keywords,
  companyName,
  jobDescription,
  linkedinAbout,
  experiences: userExperiences,
  onComplete
}: InterviewScriptBuilderProps) => {
  const [experiences, setExperiences] = useState<Experience[]>([
    { id: '1', company: '', role: '', selectedKeywords: [], keywordScripts: {}, transition: '' }
  ]);
  const [expandedExp, setExpandedExp] = useState<string | null>('1');
  const [conversationStep, setConversationStep] = useState(0);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);

  // Animate conversation
  useEffect(() => {
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

  const addExperience = () => {
    if (experiences.length < 5) {
      const newExp: Experience = {
        id: Date.now().toString(),
        company: '',
        role: '',
        selectedKeywords: [],
        keywordScripts: {},
        transition: ''
      };
      setExperiences([...experiences, newExp]);
      setExpandedExp(newExp.id);
    }
  };

  const removeExperience = (id: string) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(e => e.id !== id));
    }
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(experiences.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const toggleKeyword = (expId: string, keyword: string) => {
    const exp = experiences.find(e => e.id === expId);
    if (!exp) return;

    const currentKeywords = exp.selectedKeywords;
    let newKeywords: string[];
    let newScripts = { ...exp.keywordScripts };

    if (currentKeywords.includes(keyword)) {
      newKeywords = currentKeywords.filter(k => k !== keyword);
      delete newScripts[keyword];
    } else if (currentKeywords.length < 5) {
      newKeywords = [...currentKeywords, keyword];
      newScripts[keyword] = '';
    } else {
      return;
    }

    setExperiences(experiences.map(e =>
      e.id === expId
        ? { ...e, selectedKeywords: newKeywords, keywordScripts: newScripts }
        : e
    ));
  };

  const updateKeywordScript = (expId: string, keyword: string, script: string) => {
    setExperiences(experiences.map(e => {
      if (e.id !== expId) return e;
      return {
        ...e,
        keywordScripts: { ...e.keywordScripts, [keyword]: script }
      };
    }));
  };

  const getUsedKeywords = () => {
    return experiences.flatMap(e => e.selectedKeywords);
  };

  const getTotalScriptsCount = () => {
    return experiences.reduce((acc, exp) => {
      const filledScripts = Object.values(exp.keywordScripts).filter(s => s.trim()).length;
      return acc + filledScripts;
    }, 0);
  };

  const getTotalKeywordsCount = () => {
    return experiences.reduce((acc, exp) => acc + exp.selectedKeywords.length, 0);
  };

  const canComplete = () => {
    return getTotalScriptsCount() > 0;
  };

  const canGenerateWithAI = () => {
    // Precisa ter pelo menos uma experiência com empresa, cargo e keywords selecionadas
    return experiences.some(exp => 
      exp.company.trim() && 
      exp.role.trim() && 
      exp.selectedKeywords.length > 0
    );
  };

  const generateScriptsWithAI = async () => {
    if (!canGenerateWithAI()) {
      toast.error("Preencha empresa, cargo e selecione palavras-chave em pelo menos uma experiência.");
      return;
    }

    setIsGeneratingScripts(true);
    
    try {
      // Formata as experiências para enviar para a IA
      const experiencesForAI = experiences
        .filter(exp => exp.company.trim() && exp.role.trim() && exp.selectedKeywords.length > 0)
        .map(exp => ({
          company: exp.company,
          role: exp.role,
          keywords: exp.selectedKeywords
        }));

      const keywordsToGenerate = experiencesForAI.flatMap(exp => 
        exp.keywords.map(kw => ({ keyword: kw, company: exp.company, role: exp.role }))
      );

      const { data: result, error } = await supabase.functions.invoke('generate-interview-scripts', {
        body: {
          keywords: keywordsToGenerate.map(k => k.keyword),
          experiences: userExperiences,
          linkedinAbout,
          companyName,
          jobDescription,
          experiencesMapping: keywordsToGenerate
        }
      });

      if (error) throw error;

      if (result?.scripts && result.scripts.length > 0) {
        // Atualiza os scripts nas experiências
        const newExperiences = [...experiences];
        
        result.scripts.forEach((generatedScript: { keyword: string; script: string; experience?: string }) => {
          // Encontra em qual experiência está essa keyword
          const expIndex = newExperiences.findIndex(exp => 
            exp.selectedKeywords.includes(generatedScript.keyword)
          );
          
          if (expIndex !== -1) {
            newExperiences[expIndex].keywordScripts[generatedScript.keyword] = generatedScript.script;
          }
        });
        
        setExperiences(newExperiences);
        toast.success(`${result.scripts.length} roteiros gerados com sucesso!`);
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

  const handleComplete = () => {
    // Converte para o formato KeywordScript[]
    const allScripts: KeywordScript[] = [];

    experiences.forEach(exp => {
      exp.selectedKeywords.forEach(keyword => {
        const script = exp.keywordScripts[keyword];
        if (script?.trim()) {
          allScripts.push({
            keyword,
            experience: `${exp.role} na ${exp.company}`,
            script
          });
        }
      });
    });

    onComplete(allScripts);
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

        {/* Typing indicator */}
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
            {/* Progress Card */}
            <Card className="p-4 bg-gradient-to-r from-primary/10 to-amber-500/10 border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-medium">Roteiros Criados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{getTotalScriptsCount()}</span>
                  <span className="text-muted-foreground">/ {getTotalKeywordsCount()} selecionadas</span>
                </div>
              </div>
              {getTotalKeywordsCount() > 0 && (
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(getTotalScriptsCount() / getTotalKeywordsCount()) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </Card>

            {/* Keywords Overview */}
            <Card className="p-4 bg-secondary/30">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Suas {keywords.length} Palavras-Chave da Vaga
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => {
                  const isUsed = getUsedKeywords().includes(keyword);
                  return (
                    <span
                      key={keyword}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isUsed
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {keyword} {isUsed && <Check className="w-3 h-3 inline ml-1" />}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {getUsedKeywords().length} de {keywords.length} palavras distribuídas nas experiências
              </p>
            </Card>

            {/* Experiences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Suas Experiências (máx. 5)
                </h3>
                {experiences.length < 5 && (
                  <Button variant="outline" size="sm" onClick={addExperience} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                )}
              </div>

              {experiences.map((exp, index) => (
                <motion.div
                  key={exp.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  {/* Experience Header */}
                  <div
                    className="p-4 bg-secondary/30 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedExp(expandedExp === exp.id ? null : exp.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        placeholder="Nome da Empresa"
                        className="bg-background/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Input
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                        placeholder="Seu Cargo"
                        className="bg-background/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {exp.selectedKeywords.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {Object.values(exp.keywordScripts).filter(s => s.trim()).length}/{exp.selectedKeywords.length}
                        </span>
                      )}
                      {experiences.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeExperience(exp.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {expandedExp === exp.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedExp === exp.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-6 border-t border-border">
                          {/* Keywords Selection */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Selecione as palavras-chave que você usou nesta experiência:
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {keywords.map((keyword) => {
                                const isSelected = exp.selectedKeywords.includes(keyword);
                                const isUsedElsewhere = !isSelected && getUsedKeywords().includes(keyword);

                                return (
                                  <button
                                    key={keyword}
                                    onClick={() => toggleKeyword(exp.id, keyword)}
                                    disabled={isUsedElsewhere}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                      isSelected
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : isUsedElsewhere
                                        ? 'bg-muted/30 text-muted-foreground border-muted cursor-not-allowed opacity-40'
                                        : 'bg-secondary text-foreground border-border hover:border-primary hover:text-primary'
                                    }`}
                                  >
                                    {keyword}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Script for EACH selected keyword */}
                          {exp.selectedKeywords.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">
                                  Monte um roteiro para CADA palavra-chave:
                                </span>
                              </div>

                              <Card className="p-3 bg-primary/5 border-primary/20">
                                <p className="text-sm">
                                  <span className="text-blue-400 font-medium">[O que foi feito]</span> +
                                  <span className="text-amber-400 font-medium"> [Como foi feito]</span> +
                                  <span className="text-green-400 font-medium"> [Resultado obtido]</span>
                                </p>
                              </Card>

                              {exp.selectedKeywords.map((keyword, kwIdx) => (
                                <motion.div
                                  key={keyword}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: kwIdx * 0.1 }}
                                  className="space-y-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                      exp.keywordScripts[keyword]?.trim()
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-primary/20 text-primary'
                                    }`}>
                                      {exp.keywordScripts[keyword]?.trim() ? <Check className="w-3 h-3" /> : kwIdx + 1}
                                    </div>
                                    <span className="font-medium text-primary">{keyword}</span>
                                  </div>
                                  <Textarea
                                    value={exp.keywordScripts[keyword] || ''}
                                    onChange={(e) => updateKeywordScript(exp.id, keyword, e.target.value)}
                                    placeholder={`Ex: "Na ${exp.company || 'empresa'}, eu apliquei ${keyword.toLowerCase()} quando [O QUE FEZ]. Para isso, [COMO FEZ]. Como resultado, [RESULTADO OBTIDO]."`}
                                    className="min-h-[100px] border-primary/30 focus:border-primary"
                                  />
                                </motion.div>
                              ))}
                            </div>
                          )}

                          {/* Transition */}
                          {index < experiences.length - 1 && exp.selectedKeywords.length > 0 && (
                            <div className="space-y-2 pt-4 border-t border-border">
                              <div className="flex items-center gap-2">
                                <Quote className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium">Transição para próxima experiência:</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Isso responde indiretamente "por que saiu da empresa" e mostra propósito.
                              </p>
                              <Textarea
                                value={exp.transition}
                                onChange={(e) => updateExperience(exp.id, 'transition', e.target.value)}
                                placeholder={`Ex: "Depois de X tempo na ${exp.company || 'empresa'}, percebi que era o momento de aprimorar minhas habilidades em [área]. Foi aí que surgiu a oportunidade na próxima empresa."`}
                                className="min-h-[80px]"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* AI Generate Button */}
            {getTotalKeywordsCount() > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6"
              >
                <Card className="p-5 bg-gradient-to-r from-primary/5 via-amber-500/5 to-primary/5 border-primary/20">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-medium flex items-center gap-2 justify-center sm:justify-start">
                        <Wand2 className="w-5 h-5 text-primary" />
                        Gerar Roteiros com IA
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        A IA criará roteiros personalizados para cada palavra-chave selecionada, 
                        baseados nas suas experiências reais.
                      </p>
                    </div>
                    <Button
                      onClick={generateScriptsWithAI}
                      disabled={isGeneratingScripts || !canGenerateWithAI()}
                      className="gap-2 bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
                    >
                      {isGeneratingScripts ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar Roteiros
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Closing Questions */}
            <Card className="p-4 bg-secondary/50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Perguntas de Fechamento
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground italic">
                  "Com base no que conversamos, você enxerga algum ponto que eu poderia desenvolver?"
                </p>
                <p className="text-muted-foreground italic">
                  "Quais são os próximos passos do processo seletivo?"
                </p>
              </div>
            </Card>

            {/* Complete Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-4 pt-4"
            >
              <Button
                size="lg"
                onClick={handleComplete}
                disabled={!canComplete()}
                className="gap-2"
              >
                <Check className="w-5 h-5" />
                Concluir Roteiros para {companyName}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
