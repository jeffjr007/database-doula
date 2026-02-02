import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Pencil,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/hooks/useUserProfile";

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
  const { personalData, isLoading: isLoadingProfile } = useUserProfile();
  
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
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Auto-fill personal data from profile (only if no initialData)
  useEffect(() => {
    if (!initialData && !isLoadingProfile && personalData) {
      setData(prev => ({
        ...prev,
        nome: prev.nome || personalData.fullName,
        idade: prev.idade || personalData.age,
        localizacao: prev.localizacao || personalData.location,
      }));
    }
  }, [personalData, isLoadingProfile, initialData]);

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
        setIsEditing(false);
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

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-6">
      {/* Header Minimalista */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold">
          "Me fale sobre você"
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Conecte seus hábitos pessoais a características profissionais valorizadas.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-xl mx-auto space-y-5"
          >
            {/* Dica Minimalista */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Mostre que seus hábitos pessoais refletem disciplina e foco — qualidades que você leva para o trabalho.
              </p>
            </div>

            {/* Formulário Minimalista */}
            <div className="grid gap-4">
              {/* Nome e Idade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    Nome Completo
                  </Label>
                  <Input
                    id="nome"
                    value={data.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                    placeholder="Ex: Lucas Silva"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="idade" className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    Idade
                  </Label>
                  <Input
                    id="idade"
                    value={data.idade}
                    onChange={(e) => updateField('idade', e.target.value)}
                    placeholder="Ex: 22 anos"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-1.5">
                <Label htmlFor="localizacao" className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  Localização
                </Label>
                <Input
                  id="localizacao"
                  value={data.localizacao}
                  onChange={(e) => updateField('localizacao', e.target.value)}
                  placeholder="Ex: Santo André, SP"
                  className="h-10"
                />
              </div>

              {/* Estado Civil */}
              <div className="space-y-1.5">
                <Label htmlFor="estadoCivil" className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Heart className="w-3.5 h-3.5" />
                  Estado Civil / Filhos
                </Label>
                <Input
                  id="estadoCivil"
                  value={data.estadoCivil}
                  onChange={(e) => updateField('estadoCivil', e.target.value)}
                  placeholder="Ex: Solteiro, sem filhos, moro com meus pais"
                  className="h-10"
                />
              </div>

              {/* Hobbies */}
              <div className="space-y-1.5">
                <Label htmlFor="hobbies" className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  Hobbies / Atividades
                </Label>
                <Textarea
                  id="hobbies"
                  value={data.hobbies}
                  onChange={(e) => updateField('hobbies', e.target.value)}
                  placeholder="Ex: Academia 5x por semana, corrida, tocar violão..."
                  className="min-h-[70px] resize-none"
                />
              </div>

              {/* Metas */}
              <div className="space-y-1.5">
                <Label htmlFor="metas" className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Target className="w-3.5 h-3.5" />
                  Metas Pessoais
                </Label>
                <Textarea
                  id="metas"
                  value={data.metas}
                  onChange={(e) => updateField('metas', e.target.value)}
                  placeholder="Ex: Ler 1 livro por mês, aprender inglês..."
                  className="min-h-[70px] resize-none"
                />
              </div>
            </div>

            {/* Botão Gerar */}
            <Button
              onClick={generateScript}
              disabled={!isFormValid() || isGenerating}
              className="w-full h-11 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Roteiro
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
            className="max-w-xl mx-auto space-y-4"
          >
            {/* Resultado Minimalista */}
            <div className="space-y-3">
              {/* Header com ações */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Seu Roteiro</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleEditMode}
                    className="h-8 w-8 p-0"
                    title={isEditing ? "Sair do modo edição" : "Editar roteiro"}
                  >
                    {isEditing ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Pencil className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 w-8 p-0"
                    title="Copiar roteiro"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Campo de texto - Mobile otimizado */}
              <div className="relative">
                <Textarea
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  readOnly={!isEditing}
                  className={`min-h-[200px] sm:min-h-[280px] text-sm leading-relaxed resize-none transition-colors ${
                    isEditing 
                      ? "bg-background border-primary/50 focus:border-primary" 
                      : "bg-muted/30 border-border/50"
                  }`}
                />
                {isEditing && (
                  <div className="absolute bottom-2 right-2">
                    <span className="text-[10px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
                      Modo edição
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações - Layout mobile otimizado */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
                className="gap-1.5 h-10 sm:flex-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Editar Dados
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateScript}
                disabled={isGenerating}
                className="gap-1.5 h-10 sm:flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Regenerar
              </Button>
              <Button
                size="sm"
                onClick={handleComplete}
                className="gap-1.5 h-10 sm:flex-1"
              >
                <Check className="w-3.5 h-3.5" />
                Continuar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};