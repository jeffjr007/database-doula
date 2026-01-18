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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SupportLink } from "./SupportLink";

interface GupyData {
  cursos: { nome: string; status: string }[];
  experiencias: { empresa: string; cargo: string; descricao: string }[];
  idiomas: { idioma: string; nivel: string }[];
  certificados: { tipo: string; titulo: string }[];
  habilidades: string[];
  sobre: string;
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
  { id: 3, title: "Idiomas", icon: Languages, description: "Idiomas" },
  { id: 4, title: "Certificados", icon: Award, description: "Conquistas e Certificados" },
  { id: 5, title: "Habilidades", icon: Lightbulb, description: "30 competências" },
  { id: 6, title: "Sobre", icon: FileText, description: "Personalizar Candidatura" },
  { id: 7, title: "Concluído", icon: Check, description: "Revisão final" },
];

export const GupyGuide = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
    if (currentStep < 7) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
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
              <p className="text-muted-foreground">Copie do LinkedIn sem caracteres especiais</p>
            </div>

            <Card className="p-4 bg-primary/5 border-primary/20 max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Atenção:</strong> Sem bolinhas (•), sem sinal de maior (&gt;), sem emojis. 
                Porcentagem por extenso: "36%" → "trinta e seis por cento".
              </p>
            </Card>

            <div className="space-y-4 max-w-2xl mx-auto">
              {data.experiencias.map((item, i) => (
                <Card key={i} className="p-4 space-y-3 bg-card">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Empresa"
                      value={item.empresa}
                      onChange={(e) => updateItem("experiencias", i, "empresa", e.target.value)}
                    />
                    <Input
                      placeholder="Cargo"
                      value={item.cargo}
                      onChange={(e) => updateItem("experiencias", i, "cargo", e.target.value)}
                    />
                    {data.experiencias.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem("experiencias", i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Descrição das atividades (sem caracteres especiais)"
                    value={item.descricao}
                    onChange={(e) => updateItem("experiencias", i, "descricao", e.target.value)}
                    rows={3}
                  />
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem("experiencias")} className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar experiência
              </Button>
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

      case 7:
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
      {currentStep < 7 && (
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
      {currentStep < 7 && <div className="h-20" />}
    </div>
  );
};

export default GupyGuide;
