import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Sparkles, Loader2, Info, Lock, CheckCircle2, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { CoverLetterFormData } from "@/types/cover-letter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoverLetterFormProps {
  onGenerate: (formData: CoverLetterFormData) => void;
  isLoading: boolean;
  onBack?: () => void;
}

export function CoverLetterForm({ onGenerate, isLoading, onBack }: CoverLetterFormProps) {
  const { toast } = useToast();
  const { personalData, isLoading: isLoadingProfile } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);
  const [extractingCV, setExtractingCV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [formData, setFormData] = useState<CoverLetterFormData>({
    nome: "",
    idade: "",
    localizacao: "",
    profissao: "",
    estadoCivil: "",
    interesses: "",
    softSkills: "",
    hardSkills: "",
    ultimoCargo: "",
    cargosInteresse: "",
    cvAnalysis: "",
  });

  // Scroll to top when advancing steps
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-fill personal data from profile
  useEffect(() => {
    if (!isLoadingProfile && personalData) {
      setFormData(prev => ({
        ...prev,
        nome: prev.nome || personalData.fullName,
        idade: prev.idade || personalData.age,
        localizacao: prev.localizacao || personalData.location,
      }));
    }
  }, [personalData, isLoadingProfile]);

  const handleChange = (field: keyof CoverLetterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo PDF.",
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${MAX_SIZE_MB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setExtractingCV(true);
    setUploadedFileName(file.name);
    
    toast({
      title: "Processando CV...",
      description: "Isso pode levar até 2 minutos dependendo do tamanho do arquivo.",
    });
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        
        const { data, error } = await supabase.functions.invoke('extract-cv-pdf', {
          body: { pdfBase64: base64 }
        });
        
        clearTimeout(timeoutId);

        if (error) {
          if (error.message?.includes('connection') || error.message?.includes('timeout')) {
            throw new Error('A extração demorou muito. Tente com um PDF menor ou mais simples.');
          }
          throw error;
        }
        if (data?.error) throw new Error(data.error);

        const cvText = formatExtractedCV(data);
        handleChange('cvAnalysis', cvText);
        
        toast({
          title: "CV extraído! ✓",
          description: "Os dados do currículo foram extraídos com sucesso.",
        });
      } catch (error: any) {
        console.error('Error extracting CV:', error);
        setUploadedFileName(null);
        
        let errorMessage = "Tente novamente.";
        if (error.message?.includes('timeout') || error.message?.includes('demorou')) {
          errorMessage = "A extração demorou muito. Tente com um PDF menor.";
        } else if (error.message?.includes('connection')) {
          errorMessage = "Conexão perdida. Verifique sua internet e tente novamente.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Erro ao extrair CV",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setExtractingCV(false);
      }
    };
    reader.onerror = () => {
      setExtractingCV(false);
      setUploadedFileName(null);
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o arquivo PDF.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const formatExtractedCV = (data: any): string => {
    let text = "";
    
    const experiencias = typeof data.experiencias === 'string' ? data.experiencias.trim() : '';
    const educacao = typeof data.educacao === 'string' ? data.educacao.trim() : '';
    
    if (experiencias) {
      text += "EXPERIÊNCIAS PROFISSIONAIS:\n" + experiencias;
    }

    if (educacao) {
      text += "\n\nEDUCAÇÃO:\n" + educacao;
    }

    return text.trim() || "Dados do CV extraídos.";
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.profissao || !formData.cvAnalysis) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos Nome, Profissão e anexe seu CV.",
        variant: "destructive",
      });
      return;
    }
    onGenerate(formData);
  };

  const isFormValid = formData.nome && formData.profissao && formData.cvAnalysis;
  const isStep1Valid = formData.nome.trim().length > 0;

  // Show loading while profile is being fetched
  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando seus dados...</p>
      </div>
    );
  }

  // Mobile input classes - matches ATS CV pattern
  const mobileInputClass = "w-full h-12 px-4 rounded-xl bg-muted/20 border-transparent text-base text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200";

  // Mobile Layout - 2 Steps (matches ATS CV and Custom CV)
  if (isMobile) {
    return (
      <div className="flex flex-col">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={mobileStep === 1 ? onBack : () => { setMobileStep(1); scrollToTop(); }}
            className="gap-1.5 text-sm text-muted-foreground hover:text-foreground h-9 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {mobileStep === 1 ? 'Voltar' : 'Anterior'}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary">
              Etapa {mobileStep} de 2
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Dados Pessoais */}
          {mobileStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Dados Pessoais</h2>
                <p className="text-sm text-muted-foreground mt-1">Informações básicas para sua carta</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Nome completo *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Seu nome completo"
                    readOnly={!!personalData.fullName}
                    className={personalData.fullName ? `${mobileInputClass} opacity-70` : mobileInputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Idade</label>
                    <input
                      type="text"
                      value={formData.idade}
                      onChange={(e) => handleChange('idade', e.target.value)}
                      placeholder="Ex: 28 anos"
                      readOnly={!!personalData.age}
                      className={personalData.age ? `${mobileInputClass} opacity-70` : mobileInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Estado Civil</label>
                    <input
                      type="text"
                      value={formData.estadoCivil}
                      onChange={(e) => handleChange('estadoCivil', e.target.value)}
                      placeholder="Solteiro(a)"
                      className={mobileInputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Localização</label>
                  <input
                    type="text"
                    value={formData.localizacao}
                    onChange={(e) => handleChange('localizacao', e.target.value)}
                    placeholder="Cidade, Estado"
                    readOnly={!!personalData.location}
                    className={personalData.location ? `${mobileInputClass} opacity-70` : mobileInputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Profissão *</label>
                  <input
                    type="text"
                    value={formData.profissao}
                    onChange={(e) => handleChange('profissao', e.target.value)}
                    placeholder="Sua área de atuação"
                    className={mobileInputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Último Cargo</label>
                    <input
                      type="text"
                      value={formData.ultimoCargo}
                      onChange={(e) => handleChange('ultimoCargo', e.target.value)}
                      placeholder="Cargo atual"
                      className={mobileInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Cargo de Interesse</label>
                    <input
                      type="text"
                      value={formData.cargosInteresse}
                      onChange={(e) => handleChange('cargosInteresse', e.target.value)}
                      placeholder="Cargo desejado"
                      className={mobileInputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="button"
                  onClick={() => { setMobileStep(2); scrollToTop(); }}
                  disabled={!isStep1Valid}
                  className="w-full gap-2 h-14 text-base font-medium rounded-2xl"
                >
                  Continuar
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Experiência Profissional */}
          {mobileStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Experiência e Habilidades</h2>
                <p className="text-sm text-muted-foreground mt-1">Informações profissionais para sua carta</p>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Soft Skills</label>
                  <Textarea
                    value={formData.softSkills}
                    onChange={(e) => handleChange('softSkills', e.target.value)}
                    placeholder="Ex: Comunicação, Liderança, Resolução de problemas..."
                    className="min-h-[80px] bg-muted/20 border-transparent rounded-xl text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Hard Skills</label>
                  <Textarea
                    value={formData.hardSkills}
                    onChange={(e) => handleChange('hardSkills', e.target.value)}
                    placeholder="Ex: Excel avançado, SAP, Python, Scrum..."
                    className="min-h-[80px] bg-muted/20 border-transparent rounded-xl text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Interesses Profissionais</label>
                  <Textarea
                    value={formData.interesses}
                    onChange={(e) => handleChange('interesses', e.target.value)}
                    placeholder="Áreas, setores ou tipos de projetos que te interessam..."
                    className="min-h-[80px] bg-muted/20 border-transparent rounded-xl text-base"
                  />
                </div>
              </div>

              {/* CV Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <label className="text-base font-medium text-foreground">Anexar CV ATS *</label>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf"
                  className="hidden"
                />

                {!formData.cvAnalysis && !extractingCV ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center
                      transition-all duration-200 ease-out
                      ${isDragging 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 rounded-full bg-muted">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium">Toque para selecionar</p>
                        <p className="text-xs text-muted-foreground">PDF • Máximo 5MB</p>
                      </div>
                    </div>
                  </div>
                ) : extractingCV ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm text-primary font-medium">Extraindo dados do CV...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{uploadedFileName}</p>
                      <p className="text-xs text-muted-foreground">CV extraído com sucesso</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 pb-6">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  variant="glow"
                  className="w-full h-14 rounded-2xl text-base font-medium"
                  disabled={!isFormValid || isLoading || extractingCV}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Gerando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Gerar Cartas com IA
                    </>
                  )}
                </Button>
                {!isFormValid && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Preencha Nome, Profissão e anexe seu CV
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop Layout - Original dialog content (without Dialog wrapper)
  return (
    <div className="space-y-6 py-4">
      {/* Row 1: Nome e Idade */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          className="col-span-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
            Nome Completo *
            {formData.nome && personalData.fullName && <Lock className="w-3 h-3 text-muted-foreground/60" />}
          </label>
          <Input
            value={formData.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            placeholder="Seu nome completo"
            readOnly={!!personalData.fullName}
            className={personalData.fullName ? "opacity-70" : undefined}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
            Idade
            {formData.idade && personalData.age && <Lock className="w-3 h-3 text-muted-foreground/60" />}
          </label>
          <Input
            value={formData.idade}
            onChange={(e) => handleChange('idade', e.target.value)}
            placeholder="Ex: 28 anos"
            readOnly={!!personalData.age}
            className={personalData.age ? "opacity-70" : undefined}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-sm font-medium mb-2 block">Estado Civil</label>
          <Input
            value={formData.estadoCivil}
            onChange={(e) => handleChange('estadoCivil', e.target.value)}
            placeholder="Ex: Solteiro(a)"
          />
        </motion.div>
      </div>

      {/* Row 2: Localização e Profissão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
            Localização
            {formData.localizacao && personalData.location && <Lock className="w-3 h-3 text-muted-foreground/60" />}
          </label>
          <Input
            value={formData.localizacao}
            onChange={(e) => handleChange('localizacao', e.target.value)}
            placeholder="Cidade, Estado"
            readOnly={!!personalData.location}
            className={personalData.location ? "opacity-70" : undefined}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <label className="text-sm font-medium mb-2 block">Profissão *</label>
          <Input
            value={formData.profissao}
            onChange={(e) => handleChange('profissao', e.target.value)}
            placeholder="Sua área de atuação"
          />
        </motion.div>
      </div>

      {/* Row 3: Cargos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Seu Último Cargo</label>
          <Input
            value={formData.ultimoCargo}
            onChange={(e) => handleChange('ultimoCargo', e.target.value)}
            placeholder="Cargo atual ou mais recente"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Cargos de Interesse</label>
          <Input
            value={formData.cargosInteresse}
            onChange={(e) => handleChange('cargosInteresse', e.target.value)}
            placeholder="Cargos que você busca"
          />
        </div>
      </div>

      {/* Row 4: Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Soft Skills</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Habilidades comportamentais: comunicação, liderança, trabalho em equipe, adaptabilidade, etc.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            value={formData.softSkills}
            onChange={(e) => handleChange('softSkills', e.target.value)}
            placeholder="Ex: Comunicação, Liderança, Resolução de problemas..."
            className="min-h-[60px]"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Hard Skills</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Habilidades técnicas: ferramentas, sistemas, metodologias, certificações, etc.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            value={formData.hardSkills}
            onChange={(e) => handleChange('hardSkills', e.target.value)}
            placeholder="Ex: Excel avançado, SAP, Python, Scrum..."
            className="min-h-[60px]"
          />
        </div>
      </div>

      {/* Row 5: Interesses */}
      <div>
        <label className="text-sm font-medium mb-2 block">Interesses Profissionais</label>
        <Textarea
          value={formData.interesses}
          onChange={(e) => handleChange('interesses', e.target.value)}
          placeholder="Áreas, setores ou tipos de projetos que te interessam..."
          className="min-h-[60px]"
        />
      </div>

      {/* Row 6: CV Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          Análise do Currículo *
          <span className="text-xs text-muted-foreground font-normal">(Anexe seu CV ATS)</span>
        </label>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf"
          className="hidden"
        />
        
        {!formData.cvAnalysis && !extractingCV ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed 
              transition-all duration-200 ease-out
              ${isDragging 
                ? 'border-primary bg-primary/5 scale-[1.01]' 
                : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
              }
            `}
          >
            <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
              <div className={`
                p-3 rounded-full transition-colors duration-200
                ${isDragging ? 'bg-primary/20' : 'bg-muted'}
              `}>
                <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste seu CV aqui ou clique para selecionar'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Apenas PDF • Máximo 5MB
                </p>
              </div>
            </div>
          </div>
        ) : extractingCV ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-pulse">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-primary font-medium">Extraindo dados do currículo...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{uploadedFileName}</p>
              <p className="text-xs text-muted-foreground">Dados extraídos com sucesso</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading || extractingCV}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando cartas...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Gerar 3 Modelos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
