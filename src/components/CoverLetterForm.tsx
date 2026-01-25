import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Upload, FileText, Sparkles, Loader2, Info, Lock, X, CheckCircle2 } from "lucide-react";
import { CoverLetterFormData } from "@/types/cover-letter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion } from "framer-motion";

interface CoverLetterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (formData: CoverLetterFormData) => void;
  isLoading: boolean;
}

// Locked/readonly input style for auto-filled fields
const lockedInputClass = "flex h-10 w-full rounded-md border border-muted-foreground/20 bg-muted/50 px-3 py-2 text-sm cursor-default opacity-90";

export function CoverLetterForm({ open, onOpenChange, onGenerate, isLoading }: CoverLetterFormProps) {
  const { toast } = useToast();
  const { personalData, isLoading: isLoadingProfile } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    // Limit file size to 5MB to avoid timeout issues
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
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        
        // Create AbortController with longer timeout (3 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        
        const { data, error } = await supabase.functions.invoke('extract-cv-pdf', {
          body: { pdfBase64: base64 }
        });
        
        clearTimeout(timeoutId);

        if (error) {
          // Check if it's a timeout/connection error
          if (error.message?.includes('connection') || error.message?.includes('timeout')) {
            throw new Error('A extração demorou muito. Tente com um PDF menor ou mais simples.');
          }
          throw error;
        }
        if (data?.error) throw new Error(data.error);

        // Format extracted data as text
        const cvText = formatExtractedCV(data);
        handleChange('cvAnalysis', cvText);
        
        toast({
          title: "CV extraído! ✓",
          description: "Os dados do currículo foram extraídos com sucesso.",
        });
      } catch (error: any) {
        console.error('Error extracting CV:', error);
        setUploadedFileName(null);
        
        // Provide more specific error messages
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

  const handleRemoveFile = () => {
    setUploadedFileName(null);
    handleChange('cvAnalysis', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatExtractedCV = (data: any): string => {
    let text = "";
    
    // A edge function retorna strings, não arrays
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
    // Validate required fields
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Carta de Apresentação
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para gerar 3 modelos personalizados de carta de apresentação.
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {isLoadingProfile ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando seus dados...</p>
          </div>
        ) : (
        <div className="space-y-6 py-4">
          {/* Row 1: Nome e Idade */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              className="col-span-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Label htmlFor="nome" className="flex items-center gap-1.5">
                Nome Completo *
                {formData.nome && personalData.fullName && <Lock className="w-3 h-3 text-muted-foreground/60" />}
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Seu nome completo"
                readOnly={!!personalData.fullName}
                className={personalData.fullName ? lockedInputClass : undefined}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="idade" className="flex items-center gap-1.5">
                Idade
                {formData.idade && personalData.age && <Lock className="w-3 h-3 text-muted-foreground/60" />}
              </Label>
              <Input
                id="idade"
                value={formData.idade}
                onChange={(e) => handleChange('idade', e.target.value)}
                placeholder="Ex: 28 anos"
                readOnly={!!personalData.age}
                className={personalData.age ? lockedInputClass : undefined}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Label htmlFor="estadoCivil">Estado Civil</Label>
              <Input
                id="estadoCivil"
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
              <Label htmlFor="localizacao" className="flex items-center gap-1.5">
                Localização
                {formData.localizacao && personalData.location && <Lock className="w-3 h-3 text-muted-foreground/60" />}
              </Label>
              <Input
                id="localizacao"
                value={formData.localizacao}
                onChange={(e) => handleChange('localizacao', e.target.value)}
                placeholder="Cidade, Estado"
                readOnly={!!personalData.location}
                className={personalData.location ? lockedInputClass : undefined}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <Label htmlFor="profissao">Profissão *</Label>
              <Input
                id="profissao"
                value={formData.profissao}
                onChange={(e) => handleChange('profissao', e.target.value)}
                placeholder="Sua área de atuação"
              />
            </motion.div>
          </div>

          {/* Row 3: Cargos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ultimoCargo">Seu Último Cargo</Label>
              <Input
                id="ultimoCargo"
                value={formData.ultimoCargo}
                onChange={(e) => handleChange('ultimoCargo', e.target.value)}
                placeholder="Cargo atual ou mais recente"
              />
            </div>
            <div>
              <Label htmlFor="cargosInteresse">Cargos de Interesse</Label>
              <Input
                id="cargosInteresse"
                value={formData.cargosInteresse}
                onChange={(e) => handleChange('cargosInteresse', e.target.value)}
                placeholder="Cargos que você busca"
              />
            </div>
          </div>

          {/* Row 4: Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Label htmlFor="softSkills">Soft Skills</Label>
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
                id="softSkills"
                value={formData.softSkills}
                onChange={(e) => handleChange('softSkills', e.target.value)}
                placeholder="Ex: Comunicação, Liderança, Resolução de problemas..."
                className="min-h-[60px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Label htmlFor="hardSkills">Hard Skills</Label>
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
                id="hardSkills"
                value={formData.hardSkills}
                onChange={(e) => handleChange('hardSkills', e.target.value)}
                placeholder="Ex: Excel avançado, SAP, Python, Scrum..."
                className="min-h-[60px]"
              />
            </div>
          </div>

          {/* Row 5: Interesses */}
          <div>
            <Label htmlFor="interesses">Interesses Profissionais</Label>
            <Textarea
              id="interesses"
              value={formData.interesses}
              onChange={(e) => handleChange('interesses', e.target.value)}
              placeholder="Áreas, setores ou tipos de projetos que te interessam..."
              className="min-h-[60px]"
            />
          </div>

          {/* Row 6: CV Upload - Modern Dropzone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Análise do Currículo *
              <span className="text-xs text-muted-foreground font-normal">(Anexe seu CV ATS)</span>
            </Label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
            />
            
            {/* Dropzone Area */}
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
              /* Loading State */
              <div className="rounded-xl border border-primary/30 bg-primary/5 py-6 px-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <FileText className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-primary">Analisando seu currículo...</p>
                    <p className="text-xs text-muted-foreground">{uploadedFileName}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Success State */
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 py-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-green-500">CV analisado com sucesso</p>
                      <p className="text-xs text-muted-foreground">{uploadedFileName || 'Documento anexado'}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-border/50">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || isLoading}
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
      </DialogContent>
    </Dialog>
  );
}
