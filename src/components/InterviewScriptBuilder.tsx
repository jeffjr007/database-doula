import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  User,
  Briefcase
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

interface ManualExperience {
  id: string;
  company: string;
  role: string;
}

interface KeywordMapping {
  keyword: string;
  experienceId: string | null;
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
  "Primeiro, atribua cada palavra-chave à experiência mais relevante.",
  "Depois a IA vai criar roteiros personalizados para cada uma!",
];

const makeExperienceLabel = (exp: Pick<ManualExperience, 'role' | 'company'>) =>
  `${exp.role.trim()} — ${exp.company.trim()}`;

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
  // Check if we have scripts from the start (either from props or cache)
  const hasScripts = (initialScripts?.length ?? 0) > 0;
  
  const [conversationStep, setConversationStep] = useState(hasScripts ? mentorMessages.length : 0);
  const [showBuilder, setShowBuilder] = useState(hasScripts);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [generatedScripts, setGeneratedScripts] = useState<KeywordScript[]>(initialScripts || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [careerIntro, setCareerIntro] = useState<CareerIntro | null>(null);
  const [isLoadingIntro, setIsLoadingIntro] = useState(false);
  const [introAlreadyLoaded, setIntroAlreadyLoaded] = useState(hasScripts);
  
  // Mapping state
  const [manualExperiences, setManualExperiences] = useState<ManualExperience[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [keywordMappings, setKeywordMappings] = useState<KeywordMapping[]>([]);

  const persistTimerRef = useRef<number | null>(null);
  const hasHydratedRef = useRef(hasScripts);

  // Initialize + keep mappings in sync with keywords (no auto-assign)
  useEffect(() => {
    setKeywordMappings((prev) => {
      const prevByKeyword = new Map(prev.map((m) => [m.keyword, m] as const));
      return keywords.map((kw) => prevByKeyword.get(kw) ?? { keyword: kw, experienceId: null });
    });
  }, [keywords.join('|')]);

  // Hydrate from initialScripts when they arrive (async from DB)
  useEffect(() => {
    if (hasHydratedRef.current) return;
    if (initialScripts && initialScripts.length > 0) {
      setGeneratedScripts(initialScripts);
      setConversationStep(mentorMessages.length);
      setShowBuilder(true);
      setIntroAlreadyLoaded(true);
      hasHydratedRef.current = true;
    }
  }, [initialScripts]);

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
    if (hasHydratedRef.current) return;
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
    if (hasHydratedRef.current) return;
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

  const updateMapping = (keyword: string, experienceId: string) => {
    setKeywordMappings(prev => 
      prev.map(m => m.keyword === keyword ? { ...m, experienceId } : m)
    );
  };

  const addManualExperience = () => {
    const company = newCompany.trim();
    const role = newRole.trim();
    if (!company || !role) {
      toast.error("Preencha empresa e cargo para adicionar.");
      return;
    }
    const id = `manual-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setManualExperiences((prev) => [...prev, { id, company, role }]);
    setNewCompany('');
    setNewRole('');
  };

  const removeManualExperience = (id: string) => {
    setManualExperiences((prev) => prev.filter((e) => e.id !== id));
    setKeywordMappings((prev) => prev.map((m) => (m.experienceId === id ? { ...m, experienceId: null } : m)));
  };

  const getMappedCount = () => {
    return keywordMappings.filter(m => m.experienceId !== null).length;
  };

  const generateScriptsWithAI = async () => {
    const mappedKeywords = keywordMappings.filter(m => m.experienceId !== null);
    
    if (mappedKeywords.length === 0) {
      toast.error("Atribua pelo menos uma palavra-chave a uma experiência.");
      return;
    }

    setIsGeneratingScripts(true);
    
    try {
      // Build the mapping data for the AI
      const mappingData = mappedKeywords.map(m => {
        const exp = manualExperiences.find(e => e.id === m.experienceId);
        return {
          keyword: m.keyword,
          company: exp?.company || '',
          role: exp?.role || ''
        };
      });

      const { data: result, error } = await supabase.functions.invoke('generate-interview-scripts', {
        body: {
          keywords: mappedKeywords.map(m => m.keyword),
          keywordMappings: mappingData,
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
            {/* Show mapping interface only if no scripts yet */}
            {generatedScripts.length === 0 && (
              <>
                {/* Manual experiences (user-provided). We DO NOT infer or display experiences from the experiences text. */}
                <Card className="p-5 bg-secondary/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        Seus cargos (você cadastra)
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {manualExperiences.length} cadastrado{manualExperiences.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Adicione aqui apenas as empresas e cargos que você quer usar para atribuir as palavras‑chave.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Empresa</label>
                        <Input
                          value={newCompany}
                          onChange={(e) => setNewCompany(e.target.value)}
                          placeholder="Ex: Nubank"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Cargo</label>
                        <Input
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          placeholder="Ex: Product Manager"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" variant="secondary" onClick={addManualExperience} className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Adicionar cargo
                      </Button>
                    </div>

                    {manualExperiences.length > 0 && (
                      <div className="space-y-2">
                        {manualExperiences.map((exp) => (
                          <div
                            key={exp.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 px-3 py-2"
                          >
                            <p className="text-sm font-medium truncate">{makeExperienceLabel(exp)}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeManualExperience(exp.id)}
                              className="h-8 px-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Keyword Mapping Section - Mobile Optimized */}
                <Card className="p-4 sm:p-5 bg-secondary/30">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                        <Target className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="leading-tight">Atribuir Palavras-Chave</span>
                      </h4>
                      <span className="text-xs text-muted-foreground pl-6 sm:pl-0">
                        {getMappedCount()}/{keywords.length} atribuídas
                      </span>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Para cada palavra-chave, selecione a experiência onde você mais demonstrou essa competência.
                    </p>

                    <div className="space-y-2 sm:space-y-3 max-h-[50vh] sm:max-h-[400px] overflow-y-auto overscroll-contain -mx-1 px-1">
                      {keywordMappings.map((mapping, idx) => {
                        const selectedExp = manualExperiences.find(e => e.id === mapping.experienceId);
                        return (
                          <motion.div
                            key={mapping.keyword}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="p-3 rounded-xl bg-background/50 border border-border/50 space-y-2.5"
                          >
                            {/* Keyword Badge + Check */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-block px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 truncate max-w-[85%]">
                                {mapping.keyword}
                              </span>
                              {selectedExp && (
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            
                            {/* Select - Full width */}
                            <Select
                              value={mapping.experienceId || ''}
                              onValueChange={(value) => updateMapping(mapping.keyword, value)}
                              disabled={manualExperiences.length === 0}
                            >
                              <SelectTrigger className="w-full h-10 text-sm">
                                <SelectValue
                                  placeholder={manualExperiences.length === 0 ? "Adicione cargos acima" : "Selecione o cargo..."}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {manualExperiences.map((exp) => (
                                  <SelectItem key={exp.id} value={exp.id}>
                                    {makeExperienceLabel(exp)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Generate Button */}
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
                          {getMappedCount() > 0 
                            ? `${getMappedCount()} palavra${getMappedCount() > 1 ? 's' : ''}-chave atribuída${getMappedCount() > 1 ? 's' : ''} e pronta${getMappedCount() > 1 ? 's' : ''} para gerar roteiros`
                            : 'Atribua as palavras-chave acima para continuar'}
                        </p>
                      </div>
                      <Button
                        onClick={generateScriptsWithAI}
                        disabled={isGeneratingScripts || getMappedCount() === 0}
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
                            Gerar {getMappedCount()} Roteiros
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </>
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
                      onClick={() => setGeneratedScripts([])}
                      className="gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Refazer Mapeamento
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
                          <span className="text-sm text-muted-foreground">
                            ({scripts.length} roteiro{scripts.length > 1 ? 's' : ''})
                          </span>
                        </div>

                        {/* Scripts for this company */}
                        <div className="space-y-3 pl-2">
                          {scripts.map((script) => {
                            const globalIndex = generatedScripts.findIndex(
                              s => s.keyword === script.keyword && s.company === script.company
                            );
                            const isEditing = editingIndex === globalIndex;

                            return (
                              <Card 
                                key={`${script.keyword}-${script.company}`} 
                                className="p-4 bg-background/50 border-border/50"
                              >
                                <div className="space-y-3">
                                  {/* Keyword + Role Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                        {script.keyword}
                                      </span>
                                      {script.role && (
                                        <span className="text-xs text-muted-foreground">
                                          • {script.role}
                                        </span>
                                      )}
                                    </div>
                                    {!isEditing ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEditing(globalIndex)}
                                        className="h-7 px-2"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </Button>
                                    ) : (
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={saveEdit}
                                          className="h-7 px-2 text-primary"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={cancelEdit}
                                          className="h-7 px-2"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Script Content */}
                                  {isEditing ? (
                                    <Textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="min-h-[100px] text-sm"
                                      placeholder="Edite seu roteiro..."
                                    />
                                  ) : (
                                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                      {script.script}
                                    </p>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>

                {/* Complete Button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleComplete} size="lg" className="gap-2">
                    <Check className="w-5 h-5" />
                    Concluir Roteiros
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
