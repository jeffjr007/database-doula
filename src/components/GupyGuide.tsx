import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Languages,
  Award,
  Lightbulb,
  FileText,
  Check,
  Plus,
  Trash2,
  Loader2,
  X,
  Sparkles,
  Copy,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SupportLink } from "./SupportLink";

interface GupyData {
  cursos: { nome: string; status: string }[];
  experiencias: { empresa: string; cargo: string; descricao: string }[];
  experienciasFormatadas?: { empresa: string; cargo: string; descricao_formatada: string }[];
  idiomas: { idioma: string; nivel: string }[];
  certificados: { tipo: string; titulo: string }[];
  habilidades: string[];
  sobre: string;
}

interface FormattedExperience {
  empresa: string;
  cargo: string;
  descricao_formatada: string;
}

const initialData: GupyData = {
  cursos: [{ nome: "", status: "Concluído" }],
  experiencias: [{ empresa: "", cargo: "", descricao: "" }],
  idiomas: [{ idioma: "", nivel: "Intermediário" }],
  certificados: [{ tipo: "Curso", titulo: "" }],
  habilidades: [],
  sobre: "",
};

const STEPS = [
  { id: 1, title: "Cursos", icon: GraduationCap, description: "Experiência Acadêmica" },
  { id: 2, title: "Experiências", icon: Briefcase, description: "Experiência Profissional" },
  { id: 3, title: "Formatadas", icon: Sparkles, description: "Experiências Formatadas" },
  { id: 4, title: "Idiomas", icon: Languages, description: "Idiomas" },
  { id: 5, title: "Certificados", icon: Award, description: "Conquistas e Certificados" },
  { id: 6, title: "Habilidades", icon: Lightbulb, description: "30 competências" },
  { id: 7, title: "Sobre", icon: FileText, description: "Personalizar Candidatura" },
  { id: 8, title: "Concluído", icon: Check, description: "Revisão final" },
];

export const GupyGuide = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [newHabilidade, setNewHabilidade] = useState("");
  const [data, setData] = useState<GupyData>(initialData);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) return;

      try {
        const { data: progress } = await supabase
          .from("collected_data")
          .select("data_content")
          .eq("user_id", user.id)
          .eq("data_type", "gupy_cv")
          .maybeSingle();

        if (progress?.data_content) {
          setData(progress.data_content as unknown as GupyData);
        }
      } catch (error) {
        console.error("Error loading progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user?.id]);

  const saveProgress = async (newData: GupyData) => {
    if (!user?.id) return;
    setIsSaving(true);

    try {
      const { data: existing } = await supabase
        .from("collected_data")
        .select("id")
        .eq("user_id", user.id)
        .eq("data_type", "gupy_cv")
        .maybeSingle();

      const jsonData = JSON.parse(JSON.stringify(newData));

      if (existing) {
        await supabase
          .from("collected_data")
          .update({ data_content: jsonData, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("collected_data").insert([{
          user_id: user.id,
          data_type: "gupy_cv",
          data_content: jsonData,
          stage_number: 6,
        }]);
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateData = (newData: GupyData) => {
    setData(newData);
    saveProgress(newData);
  };

  const addItem = (field: "cursos" | "experiencias" | "idiomas" | "certificados") => {
    const templates = {
      cursos: { nome: "", status: "Concluído" },
      experiencias: { empresa: "", cargo: "", descricao: "" },
      idiomas: { idioma: "", nivel: "Intermediário" },
      certificados: { tipo: "Curso", titulo: "" },
    };
    updateData({ ...data, [field]: [...data[field], templates[field]] });
  };

  const removeItem = (field: "cursos" | "experiencias" | "idiomas" | "certificados", index: number) => {
    const arr = [...data[field]];
    arr.splice(index, 1);
    updateData({ ...data, [field]: arr.length ? arr : [{ ...arr[0] }] });
  };

  const updateItem = (field: keyof GupyData, index: number, key: string, value: string) => {
    const arr = [...(data[field] as any[])];
    arr[index] = { ...arr[index], [key]: value };
    updateData({ ...data, [field]: arr });
  };

  const addHabilidade = () => {
    if (newHabilidade.trim() && data.habilidades.length < 30) {
      updateData({ ...data, habilidades: [...data.habilidades, newHabilidade.trim()] });
      setNewHabilidade("");
    }
  };

  const removeHabilidade = (index: number) => {
    const arr = [...data.habilidades];
    arr.splice(index, 1);
    updateData({ ...data, habilidades: arr });
  };

  const nextStep = () => {
    if (currentStep < 8) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const formatExperiences = async () => {
    const validExperiences = data.experiencias.filter(e => e.empresa && e.descricao);
    if (validExperiences.length === 0) {
      toast({ 
        title: "Preencha as experiências", 
        description: "Adicione pelo menos uma experiência com descrição.",
        variant: "destructive"
      });
      return;
    }

    setShowExplanationModal(true);
  };

  const confirmAndFormat = async () => {
    setShowExplanationModal(false);
    setIsFormatting(true);

    try {
      const validExperiences = data.experiencias.filter(e => e.empresa && e.descricao);
      
      const response = await supabase.functions.invoke('format-gupy-experiences', {
        body: { experiencias: validExperiences }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { formatted_experiences } = response.data;
      
      updateData({ ...data, experienciasFormatadas: formatted_experiences });
      setCurrentStep(3); // Go to formatted experiences step
      
      toast({ 
        title: "Experiências formatadas!", 
        description: "Revise e copie para a Gupy."
      });
    } catch (error) {
      console.error("Error formatting:", error);
      toast({ 
        title: "Erro ao formatar", 
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado para a área de transferência.` });
  };

  const completeStage = async () => {
    if (!user?.id) return;

    try {
      const { data: existing } = await supabase
        .from("mentoring_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("stage_number", 6)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("mentoring_progress")
          .update({ completed: true, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("mentoring_progress").insert([{
          user_id: user.id,
          stage_number: 6,
          current_step: 7,
          completed: true,
        }]);
      }

      toast({ title: "Etapa 6 concluída!", description: "Parabéns! Seu currículo da Gupy está otimizado." });
      navigate("/");
    } catch (error) {
      console.error("Error completing stage:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Experiência Acadêmica</h2>
              <p className="text-muted-foreground">Simplifique os nomes dos cursos para o ATS</p>
            </div>

            <Card className="p-4 bg-primary/5 border-primary/20 max-w-xl mx-auto">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> "MBA em Big Data para Negócios" → "Inteligência Artificial". 
                Remova vírgulas, hífens e textos longos.
              </p>
            </Card>

            <div className="space-y-3 max-w-xl mx-auto">
              {data.cursos.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nome do curso simplificado"
                    value={item.nome}
                    onChange={(e) => updateItem("cursos", i, "nome", e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={item.status}
                    onChange={(e) => updateItem("cursos", i, "status", e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option>Concluído</option>
                    <option>Em andamento</option>
                    <option>Trancado</option>
                  </select>
                  {data.cursos.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem("cursos", i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem("cursos")} className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar curso
              </Button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Experiência Profissional</h2>
              <p className="text-muted-foreground">Cole suas experiências diretamente do LinkedIn</p>
            </div>

            <Card className="p-4 bg-primary/5 border-primary/20 max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Cole tudo aqui!</strong> Empresa, cargo e descrição exatamente como está no LinkedIn. 
                A IA vai formatar automaticamente para a Gupy.
              </p>
            </Card>

            <div className="space-y-4 max-w-2xl mx-auto">
              {data.experiencias.map((item, i) => (
                <Card key={i} className="p-4 space-y-3 bg-card border-border/50">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Empresa"
                      value={item.empresa}
                      onChange={(e) => updateItem("experiencias", i, "empresa", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Cargo"
                      value={item.cargo}
                      onChange={(e) => updateItem("experiencias", i, "cargo", e.target.value)}
                      className="flex-1"
                    />
                    {data.experiencias.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem("experiencias", i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Cole aqui a descrição das atividades do LinkedIn (pode ter bullets, emojis, % — a IA vai formatar)"
                    value={item.descricao}
                    onChange={(e) => updateItem("experiencias", i, "descricao", e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                </Card>
              ))}
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addItem("experiencias")} className="gap-2">
                  <Plus className="w-4 h-4" /> Adicionar experiência
                </Button>
              </div>

              {data.experiencias.some(e => e.empresa && e.descricao) && (
                <div className="pt-4 border-t border-border">
                  <Button 
                    onClick={formatExperiences} 
                    disabled={isFormatting}
                    className="w-full gap-2 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90"
                    size="lg"
                  >
                    {isFormatting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Formatando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Formatar para a Gupy
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-display text-2xl font-bold">Experiências Formatadas</h2>
              <p className="text-muted-foreground">Copie cada descrição e cole na Gupy</p>
            </div>

            {data.experienciasFormatadas && data.experienciasFormatadas.length > 0 ? (
              <div className="space-y-4 max-w-2xl mx-auto">
                {data.experienciasFormatadas.map((exp, i) => (
                  <Card key={i} className="p-4 space-y-3 bg-card border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{exp.empresa}</h3>
                        <p className="text-sm text-muted-foreground">{exp.cargo}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(exp.descricao_formatada, exp.empresa)}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar
                      </Button>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                      {exp.descricao_formatada}
                    </div>
                  </Card>
                ))}

                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Como usar na Gupy:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Acesse seu perfil na Gupy</li>
                        <li>Vá em "Experiências Profissionais"</li>
                        <li>Edite cada experiência</li>
                        <li>Cole a descrição formatada</li>
                      </ol>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 max-w-xl mx-auto">
                <p className="text-muted-foreground mb-4">
                  Você ainda não formatou suas experiências.
                </p>
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para Experiências
                </Button>
              </div>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Languages className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Idiomas</h2>
              <p className="text-muted-foreground">Adicione todos os idiomas que você domina</p>
            </div>

            <Card className="p-4 bg-primary/5 border-primary/20 max-w-xl mx-auto">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Seja honesto com o nível — você pode ser testado na entrevista.
              </p>
            </Card>

            <div className="space-y-3 max-w-xl mx-auto">
              {data.idiomas.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Idioma"
                    value={item.idioma}
                    onChange={(e) => updateItem("idiomas", i, "idioma", e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={item.nivel}
                    onChange={(e) => updateItem("idiomas", i, "nivel", e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option>Básico</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                    <option>Fluente</option>
                    <option>Nativo</option>
                  </select>
                  {data.idiomas.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem("idiomas", i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem("idiomas")} className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar idioma
              </Button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Conquistas e Certificados</h2>
              <p className="text-muted-foreground">Inclua cursos online, certificações AWS, Google, etc.</p>
            </div>

            <div className="space-y-3 max-w-xl mx-auto">
              {data.certificados.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={item.tipo}
                    onChange={(e) => updateItem("certificados", i, "tipo", e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm w-32"
                  >
                    <option>Curso</option>
                    <option>Certificação</option>
                    <option>Voluntário</option>
                    <option>Prêmio</option>
                  </select>
                  <Input
                    placeholder="Título simplificado"
                    value={item.titulo}
                    onChange={(e) => updateItem("certificados", i, "titulo", e.target.value)}
                    className="flex-1"
                  />
                  {data.certificados.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem("certificados", i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem("certificados")} className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar certificado
              </Button>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Habilidades</h2>
              <p className="text-muted-foreground">Adicione as 30 competências do seu LinkedIn</p>
            </div>

            <Card className="p-4 bg-primary/5 border-primary/20 max-w-xl mx-auto">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Vá no LinkedIn → Competências → copie cada uma e cole aqui.
              </p>
            </Card>

            <div className="space-y-4 max-w-xl mx-auto">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma habilidade e pressione Enter"
                  value={newHabilidade}
                  onChange={(e) => setNewHabilidade(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHabilidade())}
                  className="flex-1"
                />
                <Button onClick={addHabilidade} disabled={data.habilidades.length >= 30 || !newHabilidade.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{data.habilidades.length}/30 habilidades</span>
                {data.habilidades.length >= 20 && (
                  <span className="text-green-500 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Bom progresso!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {data.habilidades.map((hab, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm border border-primary/20"
                  >
                    {hab}
                    <button
                      onClick={() => removeHabilidade(i)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Personalizar Candidatura</h2>
              <p className="text-muted-foreground">Cole seu texto "Sobre" do LinkedIn</p>
            </div>

            <Card className="p-4 bg-primary/5 border-primary/20 max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Após se candidatar na Gupy, aparece "Personalizar candidatura". 
                Cole este texto lá para se destacar!
              </p>
            </Card>

            <div className="max-w-2xl mx-auto">
              <Textarea
                placeholder="Cole aqui o texto 'Sobre' do seu LinkedIn que você vai usar para personalizar suas candidaturas na Gupy..."
                value={data.sobre}
                onChange={(e) => updateData({ ...data, sobre: e.target.value })}
                rows={8}
                className="text-base"
              />
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="font-display text-2xl font-bold">Parabéns! 🎉</h2>
              <p className="text-muted-foreground">
                Seu currículo da Gupy está pronto para passar no ATS!
              </p>
            </div>

            <Card className="p-6 max-w-xl mx-auto space-y-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <h3 className="font-semibold">Resumo do que você preencheu:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cursos</span>
                  <span className="font-medium">{data.cursos.filter(c => c.nome).length} adicionado(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experiências</span>
                  <span className="font-medium">{data.experiencias.filter(e => e.empresa).length} adicionada(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Idiomas</span>
                  <span className="font-medium">{data.idiomas.filter(i => i.idioma).length} adicionado(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Certificados</span>
                  <span className="font-medium">{data.certificados.filter(c => c.titulo).length} adicionado(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Habilidades</span>
                  <span className="font-medium">{data.habilidades.length}/30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Texto "Sobre"</span>
                  <span className="font-medium">{data.sobre ? "✓ Pronto" : "Não preenchido"}</span>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-3 max-w-xl mx-auto">
              <Button onClick={completeStage} size="lg" className="gap-2">
                <Check className="w-5 h-5" />
                Finalizar Etapa 6
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Revisar e Editar
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-semibold text-lg">Etapa 6: Estratégias Gupy</h1>
            <p className="text-xs text-muted-foreground">Otimização para ATS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <SupportLink />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-4 border-b border-border overflow-x-auto">
        <div className="flex items-center justify-center gap-1 min-w-max">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : isCompleted
                      ? "text-primary hover:bg-primary/5"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-medium whitespace-nowrap">{step.title}</span>
                </button>

                {index < STEPS.length - 1 && (
                  <div
                    className={`w-4 h-0.5 mx-0.5 rounded transition-colors ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {currentStep < 8 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex justify-between z-10">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button onClick={nextStep} className="gap-2">
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Bottom padding for fixed footer */}
      {currentStep < 8 && <div className="h-20" />}

      {/* Explanation Modal */}
      <Dialog open={showExplanationModal} onOpenChange={setShowExplanationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Por que formatar?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                O ATS da Gupy <strong>não reconhece caracteres especiais</strong> como bullets (•), 
                emojis e símbolos de porcentagem (%).
              </p>
              <p>
                Quando você envia um currículo com esses caracteres, o sistema pode interpretar 
                errado ou simplesmente ignorar partes do seu texto.
              </p>
              <p className="text-foreground font-medium">
                A IA vai apenas remover esses caracteres e converter porcentagens para texto 
                (ex: 36% → trinta e seis por cento), mantendo todo o resto intacto.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowExplanationModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmAndFormat} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Formatar agora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GupyGuide;
