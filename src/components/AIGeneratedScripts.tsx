import { useState, useEffect } from "react";
import { useGenerationAbort } from "@/hooks/useGenerationAbort";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Loader2,
  Check,
  Edit3,
  RefreshCcw,
  Target,
  ChevronDown,
  ChevronUp,
  Save,
  Quote,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import mentorPhoto from "@/assets/mentor-photo.png";

export interface KeywordScript {
  keyword: string;
  experience: string;
  script: string;
}

interface AIGeneratedScriptsProps {
  keywords: string[];
  experiences: string;
  linkedinAbout: string;
  companyName: string;
  jobDescription: string;
  onComplete: (scripts: KeywordScript[]) => void | Promise<void>;
}

const mentorMessages = [
  "Agora vou criar seus roteiros de entrevista personalizados! 🎯",
  "Vou analisar suas experiências e conectar cada palavra-chave com momentos reais da sua carreira.",
  "Lembre-se: a estrutura mágica é [O QUE fez] + [COMO fez] + [RESULTADO]. Isso mostra AÇÃO, MÉTODO e IMPACTO.",
];

export const AIGeneratedScripts = ({
  keywords,
  experiences,
  linkedinAbout,
  companyName,
  jobDescription,
  onComplete
}: AIGeneratedScriptsProps) => {
  const [scripts, setScripts] = useState<KeywordScript[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [conversationStep, setConversationStep] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { startGeneration, endGeneration, isMounted } = useGenerationAbort();

  // Animate conversation intro
  useEffect(() => {
    if (conversationStep < mentorMessages.length) {
      const timer = setTimeout(() => {
        setConversationStep(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (!showContent) {
      const timer = setTimeout(() => setShowContent(true), 500);
      return () => clearTimeout(timer);
    }
  }, [conversationStep, showContent]);

  const generateScripts = async () => {
    startGeneration();
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-interview-scripts', {
        body: {
          keywords,
          experiences,
          linkedinAbout,
          companyName,
          jobDescription,
        },
      });

      if (!isMounted()) return;
      if (fnError) throw fnError;

      if (data?.scripts && data.scripts.length > 0) {
        setScripts(data.scripts);
        setHasGenerated(true);
        setExpandedIndex(0);
        
        toast({
          title: "Roteiros gerados! ✨",
          description: `${data.scripts.length} roteiros personalizados criados para você.`,
        });
      } else {
        throw new Error("Não foi possível gerar os roteiros. Tente novamente.");
      }
    } catch (err: any) {
      if (isMounted()) {
        console.error('Error generating scripts:', err);
        setError(err.message || "Erro ao gerar roteiros. Tente novamente.");
        toast({
          title: "Erro ao gerar roteiros",
          description: err.message || "Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      endGeneration();
      if (isMounted()) {
        setIsGenerating(false);
      }
    }
  };

  const updateScript = (index: number, newScript: string) => {
    setScripts(prev => prev.map((s, i) => 
      i === index ? { ...s, script: newScript } : s
    ));
  };

  const handleComplete = () => {
    if (scripts.length === 0) {
      toast({
        title: "Gere os roteiros primeiro",
        description: "Clique em 'Gerar Roteiros com IA' para começar.",
        variant: "destructive",
      });
      return;
    }
    onComplete(scripts);
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

      {/* Main Content */}
      <AnimatePresence>
        {showContent && (
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
                {keywords.map((keyword, idx) => {
                  const hasScript = scripts.some(s => s.keyword === keyword);
                  return (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        hasScript
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {keyword} {hasScript && <Check className="w-3 h-3 inline ml-1" />}
                    </span>
                  );
                })}
              </div>
            </Card>

            {/* Generate Button or Error */}
            {!hasGenerated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {error && (
                  <Card className="p-4 bg-destructive/10 border-destructive/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-destructive font-medium">Erro ao gerar roteiros</p>
                        <p className="text-sm text-destructive/80">{error}</p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-2">
                        Pronto para criar seus roteiros?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        A IA vai analisar suas experiências e criar roteiros personalizados para cada palavra-chave da vaga.
                      </p>
                    </div>
                    <Button
                      onClick={generateScripts}
                      disabled={isGenerating}
                      className="gap-2"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Gerando roteiros...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Gerar Roteiros com IA
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Como funciona?</p>
                      <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                        <li>A IA analisa seu perfil e experiências</li>
                        <li>Conecta cada palavra-chave com suas vivências reais</li>
                        <li>Cria roteiros na estrutura: O QUE + COMO + RESULTADO</li>
                        <li>Você pode editar e personalizar cada roteiro</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Generated Scripts */}
            {hasGenerated && scripts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Progress Card */}
                <Card className="p-4 bg-gradient-to-r from-green-500/10 to-primary/10 border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Roteiros Gerados!</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary">{scripts.length}</span>
                      <span className="text-muted-foreground">roteiros prontos</span>
                    </div>
                  </div>
                </Card>

                {/* Regenerate button */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateScripts}
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-4 h-4" />
                    )}
                    Gerar Novamente
                  </Button>
                </div>

                {/* Scripts List */}
                <div className="space-y-3">
                  {scripts.map((script, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden border-border hover:border-primary/30 transition-all">
                        {/* Script Header */}
                        <div
                          className="p-4 bg-secondary/30 flex items-center gap-4 cursor-pointer"
                          onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{script.keyword}</h4>
                            <p className="text-xs text-muted-foreground">{script.experience}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingIndex(editingIndex === index ? null : index);
                                setExpandedIndex(index);
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            {expandedIndex === index ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {expandedIndex === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 border-t border-border space-y-4">
                                {editingIndex === index ? (
                                  <div className="space-y-3">
                                    <Textarea
                                      value={script.script}
                                      onChange={(e) => updateScript(index, e.target.value)}
                                      className="min-h-[120px] text-sm"
                                      placeholder="Edite seu roteiro aqui..."
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingIndex(null)}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setEditingIndex(null);
                                          toast({
                                            title: "Roteiro salvo!",
                                            description: "Suas alterações foram aplicadas.",
                                          });
                                        }}
                                        className="gap-2"
                                      >
                                        <Save className="w-4 h-4" />
                                        Salvar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative p-4 bg-background rounded-lg border border-border">
                                    <Quote className="w-4 h-4 text-primary/30 absolute top-2 left-2" />
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed pl-4">
                                      {script.script}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Complete Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleComplete}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Check className="w-5 h-5" />
                    Salvar e Continuar
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
