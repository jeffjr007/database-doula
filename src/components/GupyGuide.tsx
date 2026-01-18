import { useState, useEffect, useRef } from "react";
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

// Animation variants for reuse
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

interface GupyData {
  cursos: { nome: string; status: string }[];
  experiencias: { empresa: string; cargo: string; descricao: string }[];
  experienciasFormatadas?: { empresa: string; cargo: string; descricao_formatada: string }[];
  idiomas: { idioma: string; nivel: string }[];
  certificados: { tipo: string; titulo: string }[];
  conquistasDescricoes?: { titulo_original: string; descricao: string }[];
  titulosLinkedin?: string;
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
  titulosLinkedin: "",
};

const STEPS = [
  { id: 1, title: "Cursos", icon: GraduationCap, description: "Experiência Acadêmica" },
  { id: 2, title: "Experiências", icon: Briefcase, description: "Experiência Profissional" },
  { id: 3, title: "Formatadas", icon: Sparkles, description: "Experiências Formatadas" },
  { id: 4, title: "Idiomas", icon: Languages, description: "Idiomas" },
  { id: 5, title: "Conquistas", icon: Award, description: "Conquistas e Certificados" },
  { id: 6, title: "Descrições", icon: Sparkles, description: "Descrições Geradas" },
  { id: 7, title: "Habilidades", icon: Lightbulb, description: "30 competências" },
  { id: 8, title: "Sobre", icon: FileText, description: "Personalizar Candidatura" },
  { id: 9, title: "Concluído", icon: Check, description: "Revisão final" },
];

export const GupyGuide = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newHabilidade, setNewHabilidade] = useState("");
  const [data, setData] = useState<GupyData>(initialData);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Scroll to top when step changes or after AI generation
  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToTop();
  }, [currentStep]);

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
    if (currentStep < 9) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // Generate achievement descriptions with AI
  const generateAchievementDescriptions = async () => {
    const validCertificados = data.certificados.filter(c => c.titulo);
    const validExperiencias = data.experiencias.filter(e => e.empresa && e.descricao);

    if (!data.titulosLinkedin?.trim()) {
      toast({ 
        title: "Preencha os títulos", 
        description: "Informe seus objetivos de cargo do LinkedIn.",
        variant: "destructive"
      });
      return;
    }

    if (validExperiencias.length === 0) {
      toast({ 
        title: "Adicione experiências", 
        description: "Volte à etapa 2 e adicione suas experiências profissionais.",
        variant: "destructive"
      });
      return;
    }

    if (validCertificados.length === 0) {
      toast({ 
        title: "Adicione conquistas", 
        description: "Adicione pelo menos uma conquista ou certificado.",
        variant: "destructive"
      });
      return;
    }

    setShowAchievementModal(true);
  };

  const confirmAndGenerateDescriptions = async () => {
    setShowAchievementModal(false);
    setIsGeneratingDescriptions(true);

    try {
      const validCertificados = data.certificados.filter(c => c.titulo);
      const validExperiencias = data.experiencias.filter(e => e.empresa && e.descricao);

      const response = await supabase.functions.invoke('generate-achievement-descriptions', {
        body: { 
          titulos_linkedin: data.titulosLinkedin,
          experiencias: validExperiencias.slice(0, 3),
          conquistas: validCertificados
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { descricoes } = response.data;
      
      updateData({ ...data, conquistasDescricoes: descricoes });
      setCurrentStep(6); // Go to descriptions step
      setTimeout(scrollToTop, 100); // Scroll to top after step change
      
      toast({ 
        title: "Descrições geradas!", 
        description: "Revise e copie para a Gupy."
      });
    } catch (error) {
      console.error("Error generating descriptions:", error);
      toast({ 
        title: "Erro ao gerar descrições", 
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDescriptions(false);
    }
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
      setTimeout(scrollToTop, 100); // Scroll to top after step change
      
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
            key="step-1"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <GraduationCap className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Experiência Acadêmica
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Simplifique os nomes dos cursos para o ATS
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="p-4 bg-primary/5 border-primary/20 max-w-xl mx-auto">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Dica:</strong> "MBA em Big Data para Negócios" → "Inteligência Artificial". 
                  Remova vírgulas, hífens e textos longos.
                </p>
              </Card>
            </motion.div>

            <motion.div 
              className="space-y-3 max-w-xl mx-auto"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {data.cursos.map((item, i) => (
                  <motion.div 
                    key={`curso-${i}`} 
                    className="flex gap-2 items-center"
                    variants={staggerItem}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                    transition={{ duration: 0.3 }}
                  >
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
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        <Button variant="ghost" size="icon" onClick={() => removeItem("cursos", i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button variant="outline" size="sm" onClick={() => addItem("cursos")} className="gap-2">
                  <Plus className="w-4 h-4" /> Adicionar curso
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step-2"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Briefcase className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Experiência Profissional
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Cole suas experiências diretamente do LinkedIn
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="p-4 bg-primary/5 border-primary/20 max-w-2xl mx-auto">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Cole tudo aqui!</strong> Empresa, cargo e descrição exatamente como está no LinkedIn. 
                  A IA vai formatar automaticamente para a Gupy.
                </p>
              </Card>
            </motion.div>

            <motion.div 
              className="space-y-4 max-w-2xl mx-auto"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {data.experiencias.map((item, i) => (
                  <motion.div
                    key={`exp-${i}`}
                    variants={staggerItem}
                    layout
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-4 space-y-3 bg-card border-border/50">
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
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                          >
                            <Button variant="ghost" size="icon" onClick={() => removeItem("experiencias", i)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </motion.div>
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
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <motion.div 
                className="flex gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button variant="outline" size="sm" onClick={() => addItem("experiencias")} className="gap-2">
                  <Plus className="w-4 h-4" /> Adicionar experiência
                </Button>
              </motion.div>

              <AnimatePresence>
                {data.experiencias.some(e => e.empresa && e.descricao) && (
                  <motion.div 
                    className="pt-4 border-t border-border"
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step-3"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Sparkles className="w-8 h-8 text-green-500" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Experiências Formatadas
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Copie cada descrição e cole na Gupy
              </motion.p>
            </motion.div>

            {data.experienciasFormatadas && data.experienciasFormatadas.length > 0 ? (
              <motion.div 
                className="space-y-4 max-w-2xl mx-auto"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {data.experienciasFormatadas.map((exp, i) => (
                  <motion.div
                    key={`formatted-${i}`}
                    variants={staggerItem}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <Card className="p-4 space-y-3 bg-card border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{exp.empresa}</h3>
                          <p className="text-sm text-muted-foreground">{exp.cargo}</p>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(exp.descricao_formatada, exp.empresa)}
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar
                          </Button>
                        </motion.div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                        {exp.descricao_formatada}
                      </div>
                    </Card>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
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
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                className="text-center py-8 max-w-xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-muted-foreground mb-4">
                  Você ainda não formatou suas experiências.
                </p>
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para Experiências
                </Button>
              </motion.div>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step-4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Languages className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Idiomas
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Adicione todos os idiomas que você domina
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="p-4 bg-primary/5 border-primary/20 max-w-xl mx-auto">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Dica:</strong> Seja honesto com o nível — você pode ser testado na entrevista.
                </p>
              </Card>
            </motion.div>

            <motion.div 
              className="space-y-3 max-w-xl mx-auto"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {data.idiomas.map((item, i) => (
                  <motion.div 
                    key={`idioma-${i}`} 
                    className="flex gap-2 items-center"
                    variants={staggerItem}
                    layout
                    transition={{ duration: 0.3 }}
                  >
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
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        <Button variant="ghost" size="icon" onClick={() => removeItem("idiomas", i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button variant="outline" size="sm" onClick={() => addItem("idiomas")} className="gap-2">
                  <Plus className="w-4 h-4" /> Adicionar idioma
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step-5"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Award className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Conquistas e Certificados
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                A IA vai criar descrições otimizadas para a Gupy
              </motion.p>
            </motion.div>

            <motion.div 
              className="space-y-6 max-w-2xl mx-auto"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Títulos do LinkedIn */}
              <motion.div className="space-y-2" variants={staggerItem}>
                <label className="text-sm font-medium flex items-center gap-2">
                  <motion.span 
                    className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    1
                  </motion.span>
                  Títulos do LinkedIn (seus objetivos de cargo)
                </label>
                <Textarea
                  placeholder="Ex: Gerente de Projetos | Product Manager | Scrum Master"
                  value={data.titulosLinkedin || ""}
                  onChange={(e) => updateData({ ...data, titulosLinkedin: e.target.value })}
                  rows={2}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Copie e cole o título do seu LinkedIn (onde ficam seus objetivos de cargo)
                </p>
              </motion.div>

              {/* Últimas 3 experiências */}
              <motion.div className="space-y-2" variants={staggerItem}>
                <label className="text-sm font-medium flex items-center gap-2">
                  <motion.span 
                    className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    2
                  </motion.span>
                  Últimas 3 experiências profissionais
                </label>
                <Card className="p-3 bg-muted/30 border-border/50">
                  {data.experiencias.filter(e => e.empresa).length > 0 ? (
                    <div className="space-y-2">
                      {data.experiencias.slice(0, 3).filter(e => e.empresa).map((exp, i) => (
                        <motion.div 
                          key={i} 
                          className="text-sm"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <span className="font-medium">{exp.cargo}</span>
                          <span className="text-muted-foreground"> na {exp.empresa}</span>
                        </motion.div>
                      ))}
                      <motion.p 
                        className="text-xs text-green-500 flex items-center gap-1 mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <Check className="w-3 h-3" /> Experiências carregadas da Etapa 2
                      </motion.p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">Nenhuma experiência encontrada</p>
                      <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                        Ir para Experiências
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Conquistas e Certificados */}
              <motion.div className="space-y-3" variants={staggerItem}>
                <label className="text-sm font-medium flex items-center gap-2">
                  <motion.span 
                    className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    3
                  </motion.span>
                  Suas conquistas e certificados
                </label>
                
                <AnimatePresence mode="popLayout">
                  {data.certificados.map((item, i) => (
                    <motion.div
                      key={`cert-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <Card className="p-3 bg-card border-border/50">
                        <div className="flex gap-2 items-center">
                          <select
                            value={item.tipo}
                            onChange={(e) => updateItem("certificados", i, "tipo", e.target.value)}
                            className="h-9 px-2 rounded-md border border-input bg-background text-sm"
                          >
                            <option>Curso</option>
                            <option>Certificação</option>
                            <option>Voluntário</option>
                            <option>Prêmio</option>
                            <option>Projeto</option>
                          </select>
                          <Input
                            placeholder="Nome do curso, certificação ou conquista"
                            value={item.titulo}
                            onChange={(e) => updateItem("certificados", i, "titulo", e.target.value)}
                            className="flex-1"
                          />
                          {data.certificados.length > 1 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <Button variant="ghost" size="icon" onClick={() => removeItem("certificados", i)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button variant="outline" size="sm" onClick={() => addItem("certificados")} className="gap-2">
                    <Plus className="w-4 h-4" /> Adicionar conquista
                  </Button>
                </motion.div>
              </motion.div>

              {/* Botão Gerar Descrições */}
              <AnimatePresence>
                {data.certificados.some(c => c.titulo) && data.titulosLinkedin?.trim() && (
                  <motion.div 
                    className="pt-4 border-t border-border"
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={generateAchievementDescriptions} 
                        disabled={isGeneratingDescriptions}
                        className="w-full gap-2 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90"
                        size="lg"
                      >
                        {isGeneratingDescriptions ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Gerando descrições...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Gerar Descrições com IA
                          </>
                        )}
                      </Button>
                    </motion.div>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      A IA vai criar descrições otimizadas com palavras-chave dos seus cargos-objetivo
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="step-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Sparkles className="w-8 h-8 text-green-500" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Descrições Geradas
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Copie cada descrição e cole na Gupy
              </motion.p>
            </motion.div>

            {data.conquistasDescricoes && data.conquistasDescricoes.length > 0 ? (
              <motion.div 
                className="space-y-4 max-w-2xl mx-auto"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {data.conquistasDescricoes.map((item, i) => (
                  <motion.div
                    key={`desc-${i}`}
                    variants={staggerItem}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <Card className="p-4 space-y-3 bg-card border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{item.titulo_original}</h3>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(item.descricao, item.titulo_original)}
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar
                          </Button>
                        </motion.div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm">
                        {item.descricao}
                      </div>
                    </Card>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Como usar na Gupy:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Acesse seu perfil na Gupy</li>
                          <li>Vá em "Conquistas e Certificados"</li>
                          <li>Edite cada item</li>
                          <li>Cole a descrição correspondente</li>
                        </ol>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(5)} 
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Editar conquistas
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                className="text-center py-8 max-w-xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-muted-foreground mb-4">
                  Você ainda não gerou as descrições das suas conquistas.
                </p>
                <Button variant="outline" onClick={() => setCurrentStep(5)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para Conquistas
                </Button>
              </motion.div>
            )}
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            key="step-7"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Lightbulb className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Habilidades
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Adicione as 30 competências do seu LinkedIn
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="p-4 bg-primary/5 border-primary/20 max-w-xl mx-auto">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Dica:</strong> Vá no LinkedIn → Competências → copie cada uma e cole aqui.
                </p>
              </Card>
            </motion.div>

            <motion.div 
              className="space-y-4 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma habilidade e pressione Enter"
                  value={newHabilidade}
                  onChange={(e) => setNewHabilidade(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHabilidade())}
                  className="flex-1"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={addHabilidade} disabled={data.habilidades.length >= 30 || !newHabilidade.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>

              <motion.div 
                className="flex items-center justify-between text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-muted-foreground">{data.habilidades.length}/30 habilidades</span>
                <AnimatePresence>
                  {data.habilidades.length >= 20 && (
                    <motion.span 
                      className="text-green-500 flex items-center gap-1"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <Check className="w-4 h-4" /> Bom progresso!
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {data.habilidades.map((hab, i) => (
                    <motion.span
                      key={`hab-${hab}-${i}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm border border-primary/20"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      layout
                      transition={{ duration: 0.2 }}
                    >
                      {hab}
                      <button
                        onClick={() => removeHabilidade(i)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div
            key="step-8"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <FileText className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Personalizar Candidatura
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Cole seu texto "Sobre" do LinkedIn
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="p-4 bg-primary/5 border-primary/20 max-w-2xl mx-auto">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Dica:</strong> Após se candidatar na Gupy, aparece "Personalizar candidatura". 
                  Cole este texto lá para se destacar!
                </p>
              </Card>
            </motion.div>

            <motion.div 
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Textarea
                placeholder="Cole aqui o texto 'Sobre' do seu LinkedIn que você vai usar para personalizar suas candidaturas na Gupy..."
                value={data.sobre}
                onChange={(e) => updateData({ ...data, sobre: e.target.value })}
                rows={8}
                className="text-base"
              />
            </motion.div>
          </motion.div>
        );

      case 9:
        return (
          <motion.div
            key="step-9"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="w-20 h-20 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center mb-4"
                initial={{ scale: 0, rotate: -360 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 150 }}
              >
                <Check className="w-10 h-10 text-green-500" />
              </motion.div>
              <motion.h2 
                className="font-display text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Parabéns! 🎉
              </motion.h2>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                Seu currículo da Gupy está pronto para passar no ATS!
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="p-6 max-w-xl mx-auto space-y-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <h3 className="font-semibold">Resumo do que você preencheu:</h3>
                <motion.div 
                  className="space-y-2 text-sm"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {[
                    { label: "Cursos", value: `${data.cursos.filter(c => c.nome).length} adicionado(s)` },
                    { label: "Experiências", value: `${data.experiencias.filter(e => e.empresa).length} adicionada(s)` },
                    { label: "Idiomas", value: `${data.idiomas.filter(i => i.idioma).length} adicionado(s)` },
                    { label: "Conquistas", value: `${data.certificados.filter(c => c.titulo).length} adicionado(s)` },
                    { label: "Descrições geradas", value: `${data.conquistasDescricoes?.length || 0} descrição(ões)` },
                    { label: "Habilidades", value: `${data.habilidades.length}/30` },
                    { label: 'Texto "Sobre"', value: data.sobre ? "✓ Pronto" : "Não preenchido" },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.label}
                      className="flex justify-between"
                      variants={staggerItem}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </Card>
            </motion.div>

            <motion.div 
              className="flex flex-col gap-3 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={completeStage} size="lg" className="gap-2 w-full">
                  <Check className="w-5 h-5" />
                  Finalizar Etapa 6
                </Button>
              </motion.div>
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Revisar e Editar
              </Button>
            </motion.div>
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
      <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {currentStep < 9 && (
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
      {currentStep < 9 && <div className="h-20" />}

      {/* Explanation Modal - Experience Formatting */}
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

      {/* Achievement Modal - Description Generation */}
      <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Gerar descrições otimizadas
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                A IA vai criar <strong>descrições personalizadas</strong> para cada uma das suas 
                conquistas e certificados.
              </p>
              <p>
                Ela vai analisar seus <strong>cargos-objetivo</strong> e suas <strong>experiências</strong> para 
                inserir palavras-chave relevantes que aumentam suas chances de passar no ATS.
              </p>
              <p className="text-foreground font-medium">
                Não se preocupe — a IA não vai inventar nada. Ela apenas vai otimizar a forma 
                como suas conquistas são apresentadas.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAchievementModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmAndGenerateDescriptions} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Gerar descrições
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GupyGuide;
