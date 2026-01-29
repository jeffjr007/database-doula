import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Target,
  User,
  Briefcase,
  Phone,
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export interface CVFormData {
  nome: string;
  cargos: string;
  telefone: string;
  email: string;
  linkedin: string;
  educacao: string;
  experiences: string;
  jobDescription: string;
}

interface CVFormProps {
  onGenerate: (data: CVFormData) => void;
  isLoading: boolean;
}

// Locked/readonly input style for auto-filled fields
const lockedInputClass = "w-full h-10 px-4 rounded-lg border border-muted-foreground/20 bg-muted/50 text-sm text-foreground cursor-default opacity-90";
const normalInputClass = "w-full h-10 px-4 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200";

export function CVForm({ onGenerate, isLoading }: CVFormProps) {
  const { personalData, isLoading: isLoadingProfile } = useUserProfile();
  const isMobile = useIsMobile();
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);
  
  const [formData, setFormData] = useState<CVFormData>({
    nome: "",
    cargos: "",
    telefone: "",
    email: "",
    linkedin: "",
    educacao: "",
    experiences: "",
    jobDescription: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionDone, setExtractionDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-fill personal data from profile
  useEffect(() => {
    if (!isLoadingProfile && personalData) {
      setFormData(prev => ({
        ...prev,
        nome: prev.nome || personalData.fullName,
        telefone: prev.telefone || personalData.phone,
        email: prev.email || personalData.email,
        linkedin: prev.linkedin || personalData.linkedinUrl,
      }));
    }
  }, [personalData, isLoadingProfile]);

  const resetPdfInput = () => {
    setPdfFile(null);
    setExtractionDone(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (field: keyof CVFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      });
      resetPdfInput();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O PDF deve ter no máximo 10MB.",
        variant: "destructive",
      });
      resetPdfInput();
      return;
    }

    setPdfFile(file);
    setExtractionDone(false);
    await extractPdfData(file);
  };

  const extractPdfData = async (file: File) => {
    setIsExtracting(true);

    try {
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke("extract-cv-pdf", {
        body: { pdfBase64: base64 },
      });

      if (error) throw new Error(error.message || "Erro ao processar PDF");
      if (data?.error) throw new Error(data.error);

      if (data?.experiencias || data?.educacao) {
        setFormData((prev) => ({
          ...prev,
          experiences: data.experiencias || prev.experiences,
          educacao: data.educacao || prev.educacao,
        }));

        setExtractionDone(true);
        toast({
          title: "CV analisado com sucesso!",
          description:
            "Experiências e educação extraídas. Verifique os dados e preencha a vaga alvo.",
        });
      } else {
        throw new Error("Não foi possível extrair dados do currículo");
      }
    } catch (error) {
      console.error("Error extracting PDF:", error);
      toast({
        title: "Erro ao analisar PDF",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente ou use outro arquivo.",
        variant: "destructive",
      });
      resetPdfInput();
    } finally {
      setIsExtracting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.experiences.trim() && formData.jobDescription.trim()) {
      onGenerate(formData);
    }
  };

  const isValid =
    formData.experiences.trim().length > 50 &&
    formData.jobDescription.trim().length > 50;

  // Show loading while profile is being fetched
  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  // Mobile input classes
  const mobileInputClass = "w-full h-12 px-4 rounded-xl border-transparent bg-muted/20 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200";
  const mobileLockedInputClass = "w-full h-12 px-4 rounded-xl border border-muted-foreground/20 bg-muted/50 text-base text-foreground cursor-default opacity-90";

  // Mobile Layout - 2 Steps
  if (isMobile) {
    return (
      <form onSubmit={handleSubmit} className="min-h-screen flex flex-col">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 py-4">
          <div className={`flex items-center gap-2 ${mobileStep === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${mobileStep === 1 ? 'bg-primary text-primary-foreground' : mobileStep > 1 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {mobileStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">Dados</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 ${mobileStep === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${mobileStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            <span className="text-sm font-medium">Currículo</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 px-1">
          <AnimatePresence mode="wait">
            {mobileStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="w-4 h-4 text-primary" />
                  Dados Pessoais
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Nome Completo
                    {formData.nome && personalData.fullName && <Lock className="w-3 h-3 text-muted-foreground/60" />}
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Seu nome completo"
                    readOnly={!!personalData.fullName}
                    className={personalData.fullName ? mobileLockedInputClass : mobileInputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="w-3 h-3" />
                    Cargos (separados por |)
                  </label>
                  <input
                    type="text"
                    value={formData.cargos}
                    onChange={(e) => handleChange("cargos", e.target.value)}
                    placeholder="Gerente | Especialista | Coordenador"
                    className={mobileInputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    Telefone
                    {formData.telefone && personalData.phone && <Lock className="w-3 h-3 text-muted-foreground/60" />}
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => handleChange("telefone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    readOnly={!!personalData.phone}
                    className={personalData.phone ? mobileLockedInputClass : mobileInputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Email
                    {formData.email && personalData.email && <Lock className="w-3 h-3 text-muted-foreground/60" />}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="seu@email.com"
                    readOnly={!!personalData.email}
                    className={personalData.email ? mobileLockedInputClass : mobileInputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    LinkedIn
                    {formData.linkedin && personalData.linkedinUrl && <Lock className="w-3 h-3 text-muted-foreground/60" />}
                  </label>
                  <input
                    type="text"
                    value={formData.linkedin}
                    onChange={(e) => handleChange("linkedin", e.target.value)}
                    placeholder="linkedin.com/in/seuperfil"
                    readOnly={!!personalData.linkedinUrl}
                    className={personalData.linkedinUrl ? mobileLockedInputClass : mobileInputClass}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    variant="glow"
                    className="w-full h-14 rounded-2xl text-base font-medium gap-2"
                    onClick={() => setMobileStep(2)}
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {mobileStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileStep(1)}
                  className="gap-2 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>

                {/* PDF Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="w-4 h-4 text-primary" />
                    Currículo em PDF
                  </div>

                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs text-primary font-medium">
                      📎 Anexe o <strong>Currículo ATS</strong> que você criou anteriormente
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => {
                      if (isExtracting) return;
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      fileInputRef.current?.click();
                    }}
                    className={`
                      relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                      transition-all duration-300
                      ${isExtracting ? "border-primary/50 bg-primary/5" : extractionDone ? "border-green-500/50 bg-green-500/5" : "border-border hover:border-primary/50 hover:bg-primary/5"}
                    `}
                  >
                    {isExtracting ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm font-medium">Analisando currículo...</p>
                      </div>
                    ) : extractionDone ? (
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <p className="text-sm font-medium">{pdfFile?.name}</p>
                        <p className="text-xs text-muted-foreground">Clique para trocar</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium">Toque para fazer upload</p>
                        <p className="text-xs text-muted-foreground">PDF até 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Target className="w-4 h-4 text-primary" />
                    Vaga Alvo
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Cole a descrição completa da vaga
                  </p>
                  <Textarea
                    value={formData.jobDescription}
                    onChange={(e) => handleChange("jobDescription", e.target.value)}
                    placeholder="Título da Vaga&#10;&#10;Responsabilidades:&#10;• Desenvolver e implementar...&#10;&#10;Requisitos:&#10;• Experiência em..."
                    className="min-h-[200px] bg-muted/20 border-transparent rounded-xl text-base"
                  />
                </div>

                <div className="pt-2 pb-6">
                  <Button
                    type="submit"
                    variant="glow"
                    className="w-full h-14 rounded-2xl text-base font-medium"
                    disabled={!isValid || isLoading || isExtracting}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gerando com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Gerar Currículo com IA
                      </>
                    )}
                  </Button>
                  {!isValid && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      {!extractionDone ? "Faça upload do seu currículo em PDF" : "Preencha a vaga alvo (mínimo 50 caracteres)"}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    );
  }

  // Desktop Layout - Original
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info Section */}
      <div className="space-y-4 animate-slide-up opacity-0 stagger-1">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="w-4 h-4 text-primary" />
          Dados Pessoais
        </div>

        <motion.div 
          className="space-y-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Nome Completo
            {formData.nome && personalData.fullName && <Lock className="w-3 h-3 text-muted-foreground/60" />}
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            placeholder="Seu nome completo"
            readOnly={!!personalData.fullName}
            className={personalData.fullName ? lockedInputClass : normalInputClass}
          />
        </motion.div>

        <motion.div 
          className="space-y-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Briefcase className="w-3 h-3" />
            Cargos (separados por |)
          </label>
          <input
            type="text"
            value={formData.cargos}
            onChange={(e) => handleChange("cargos", e.target.value)}
            placeholder="Gerente de Marketing | Especialista em Branding | Coordenador"
            className={normalInputClass}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div 
            className="space-y-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <label className="flex items-center gap-2 text-xs text-muted-foreground h-4">
              <Phone className="w-3 h-3" />
              Telefone
              {formData.telefone && personalData.phone && <Lock className="w-3 h-3 text-muted-foreground/60" />}
            </label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => handleChange("telefone", e.target.value)}
              placeholder="(11) 99999-9999"
              readOnly={!!personalData.phone}
              className={personalData.phone ? lockedInputClass : normalInputClass}
            />
          </motion.div>

          <motion.div 
            className="space-y-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground h-4">
              Email
              {formData.email && personalData.email && <Lock className="w-3 h-3 text-muted-foreground/60" />}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="seu@email.com"
              readOnly={!!personalData.email}
              className={personalData.email ? lockedInputClass : normalInputClass}
            />
          </motion.div>

          <motion.div 
            className="space-y-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground h-4">
              LinkedIn
              {formData.linkedin && personalData.linkedinUrl && <Lock className="w-3 h-3 text-muted-foreground/60" />}
            </label>
            <input
              type="text"
              value={formData.linkedin}
              onChange={(e) => handleChange("linkedin", e.target.value)}
              placeholder="linkedin.com/in/seuperfil"
              readOnly={!!personalData.linkedinUrl}
              className={personalData.linkedinUrl ? lockedInputClass : normalInputClass}
            />
          </motion.div>
        </div>
      </div>

      {/* PDF Upload Section */}
      <div className="space-y-3 animate-slide-up opacity-0 stagger-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="w-4 h-4 text-primary" />
          Currículo em PDF
        </div>

        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-primary font-medium">
            📎 Anexe o <strong>Currículo para ATS</strong> que você criou anteriormente
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            A IA irá extrair automaticamente suas experiências e formação para
            personalizar seu currículo.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => {
            if (isExtracting) return;
            if (fileInputRef.current) fileInputRef.current.value = "";
            fileInputRef.current?.click();
          }}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-all duration-300
            ${
              isExtracting
                ? "border-primary/50 bg-primary/5"
                : extractionDone
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
            }
          `}
        >
          {isExtracting ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Analisando currículo...
                </p>
                <p className="text-xs text-muted-foreground">
                  Extraindo experiências e educação com IA
                </p>
              </div>
            </div>
          ) : extractionDone ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-foreground">{pdfFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  Dados extraídos com sucesso! Clique para trocar o arquivo
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {pdfFile ? pdfFile.name : "Clique para fazer upload do Currículo ATS"}
                </p>
                <p className="text-xs text-muted-foreground">PDF até 10MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {extractionDone && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle className="w-4 h-4" />
              Dados extraídos do currículo com sucesso!
            </div>
          </div>
        </div>
      )}

      {/* Job Description Field */}
      <div className="space-y-2 animate-slide-up opacity-0 stagger-3">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Target className="w-4 h-4 text-primary" />
          Vaga Alvo
        </label>
        <p className="text-xs text-muted-foreground">
          Cole a descrição completa da vaga com requisitos e responsabilidades
        </p>
        <Textarea
          value={formData.jobDescription}
          onChange={(e) => handleChange("jobDescription", e.target.value)}
          placeholder="Título da Vaga\n\nResponsabilidades:\n• Desenvolver e implementar...\n\nRequisitos:\n• Experiência em...\n• Conhecimento em..."
          className="min-h-[180px] bg-card"
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="glow"
          size="lg"
          className="w-full"
          disabled={!isValid || isLoading || isExtracting}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Gerando com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Currículo com IA
            </>
          )}
        </Button>
        {!isValid && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {!extractionDone
              ? "Faça upload do seu currículo em PDF e preencha a vaga alvo"
              : "Preencha a vaga alvo (mínimo 50 caracteres)"}
          </p>
        )}
      </div>
    </form>
  );
}
