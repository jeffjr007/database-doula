import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  User,
  MapPin,
  Heart,
  Target,
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface AboutMeData {
  nome: string;
  idade: string;
  localizacao: string;
  estadoCivil: string;
  hobbies: string;
  metas: string;
}

interface AboutMeGeneratorProps {
  onComplete: (script: string) => void;
  initialData?: AboutMeData;
}

export const AboutMeGenerator = ({ onComplete, initialData }: AboutMeGeneratorProps) => {
  const [data, setData] = useState<AboutMeData>(initialData || {
    nome: "",
    idade: "",
    localizacao: "",
    estadoCivil: "",
    hobbies: "",
    metas: "",
  });
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const { toast } = useToast();

  const updateField = (field: keyof AboutMeData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      data.nome.trim() &&
      data.idade.trim() &&
      data.localizacao.trim() &&
      data.estadoCivil.trim() &&
      data.hobbies.trim() &&
      data.metas.trim()
    );
  };

  const generateScript = async () => {
    if (!isFormValid()) {
      toast({
        title: "Preencha todos os campos",
        description: "Todos os campos são necessários para gerar seu roteiro.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: response, error } = await supabase.functions.invoke('generate-about-me', {
        body: data,
      });

      if (error) throw error;

      if (response?.script) {
        setGeneratedScript(response.script);
        setShowForm(false);
        toast({
          title: "Roteiro gerado! ✨",
          description: "Revise e personalize conforme necessário.",
        });
      }
    } catch (error: any) {
      console.error('Error generating script:', error);
      
      if (error.message?.includes('429') || error.status === 429) {
        toast({
          title: "Muitas requisições",
          description: "Aguarde um momento e tente novamente.",
          variant: "destructive",
        });
      } else if (error.message?.includes('402') || error.status === 402) {
        toast({
          title: "Créditos esgotados",
          description: "Entre em contato com o suporte.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao gerar roteiro",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "Roteiro copiado para a área de transferência.",
    });
  };

  const handleComplete = () => {
    onComplete(generatedScript);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">
          "Me fale sobre você"
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Crie uma resposta autêntica que conecte seus hobbies e metas pessoais a características profissionais valorizadas por recrutadores.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Dica */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">O segredo dessa resposta:</p>
                  <p className="text-muted-foreground">
                    Mostre que seus hábitos pessoais (esportes, leitura, hobbies) refletem disciplina e foco — 
                    qualidades que você leva para o trabalho.
                  </p>
                </div>
              </div>
            </Card>

            {/* Formulário */}
            <div className="grid gap-4">
              {/* Nome e Idade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome Completo
                  </Label>
                  <Input
                    id="nome"
                    value={data.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                    placeholder="Ex: Lucas Silva"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade</Label>
                  <Input
                    id="idade"
                    value={data.idade}
                    onChange={(e) => updateField('idade', e.target.value)}
                    placeholder="Ex: 22 anos"
                    className="h-12"
                  />
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-2">
                <Label htmlFor="localizacao" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Localização
                </Label>
                <Input
                  id="localizacao"
                  value={data.localizacao}
                  onChange={(e) => updateField('localizacao', e.target.value)}
                  placeholder="Ex: Santo André, SP"
                  className="h-12"
                />
              </div>

              {/* Estado Civil */}
              <div className="space-y-2">
                <Label htmlFor="estadoCivil" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Estado Civil / Filhos
                </Label>
                <Input
                  id="estadoCivil"
                  value={data.estadoCivil}
                  onChange={(e) => updateField('estadoCivil', e.target.value)}
                  placeholder="Ex: Solteiro, sem filhos, moro com meus pais"
                  className="h-12"
                />
              </div>

              {/* Hobbies */}
              <div className="space-y-2">
                <Label htmlFor="hobbies" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Hobbies / Atividades
                </Label>
                <Textarea
                  id="hobbies"
                  value={data.hobbies}
                  onChange={(e) => updateField('hobbies', e.target.value)}
                  placeholder="Ex: Academia 5x por semana, corrida aos finais de semana, tocar violão..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Atividades que mostram disciplina, foco ou desenvolvimento pessoal
                </p>
              </div>

              {/* Metas */}
              <div className="space-y-2">
                <Label htmlFor="metas" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Metas Pessoais
                </Label>
                <Textarea
                  id="metas"
                  value={data.metas}
                  onChange={(e) => updateField('metas', e.target.value)}
                  placeholder="Ex: Ler 1 livro de finanças por mês, aprender inglês, fazer MBA..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Objetivos que demonstram vontade de crescer e aprender
                </p>
              </div>
            </div>

            {/* Botão Gerar */}
            <Button
              onClick={generateScript}
              disabled={!isFormValid() || isGenerating}
              className="w-full h-12 gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando seu roteiro...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Roteiro com IA
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Resultado */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">Seu Roteiro</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>

                <Textarea
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  className="min-h-[200px] text-base bg-background/50 border-border"
                />

                <p className="text-xs text-muted-foreground text-center">
                  ✏️ Você pode editar o texto acima para personalizar ainda mais
                </p>
              </div>
            </Card>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
                className="gap-2 flex-1"
              >
                <RefreshCw className="w-4 h-4" />
                Editar Dados
              </Button>
              <Button
                variant="outline"
                onClick={generateScript}
                disabled={isGenerating}
                className="gap-2 flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Gerar Novamente
              </Button>
              <Button
                onClick={handleComplete}
                className="gap-2 flex-1"
              >
                <Check className="w-4 h-4" />
                Salvar e Continuar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
