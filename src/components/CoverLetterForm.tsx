import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Upload, FileText, Sparkles, Loader2, Info } from "lucide-react";
import { CoverLetterFormData } from "@/types/cover-letter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CoverLetterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (formData: CoverLetterFormData) => void;
  isLoading: boolean;
}

export function CoverLetterForm({ open, onOpenChange, onGenerate, isLoading }: CoverLetterFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractingCV, setExtractingCV] = useState(false);
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

  const handleChange = (field: keyof CoverLetterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo PDF.",
        variant: "destructive",
      });
      return;
    }

    setExtractingCV(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('extract-cv-pdf', {
          body: { pdfBase64: base64 }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        // Format extracted data as text
        const cvText = formatExtractedCV(data);
        handleChange('cvAnalysis', cvText);
        
        toast({
          title: "CV extraído! ✓",
          description: "Os dados do currículo foram extraídos com sucesso.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error extracting CV:', error);
      toast({
        title: "Erro ao extrair CV",
        description: error.message || "Tente novamente ou preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setExtractingCV(false);
    }
  };

  const formatExtractedCV = (data: any): string => {
    let text = "";
    
    if (data.experiencias?.length) {
      text += "EXPERIÊNCIAS PROFISSIONAIS:\n";
      data.experiencias.forEach((exp: any) => {
        text += `\n${exp.cargo} - ${exp.empresa} (${exp.periodo})\n`;
        exp.bullets?.forEach((bullet: string) => {
          text += `• ${bullet}\n`;
        });
      });
    }

    if (data.educacao?.length) {
      text += "\n\nEDUCAÇÃO:\n";
      data.educacao.forEach((edu: any) => {
        text += `• ${edu.curso} - ${edu.instituicao}\n`;
      });
    }

    return text.trim();
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

        <div className="space-y-6 py-4">
          {/* Row 1: Nome e Idade */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label htmlFor="idade">Idade</Label>
              <Input
                id="idade"
                value={formData.idade}
                onChange={(e) => handleChange('idade', e.target.value)}
                placeholder="Ex: 28 anos"
              />
            </div>
            <div>
              <Label htmlFor="estadoCivil">Estado Civil</Label>
              <Input
                id="estadoCivil"
                value={formData.estadoCivil}
                onChange={(e) => handleChange('estadoCivil', e.target.value)}
                placeholder="Ex: Solteiro(a)"
              />
            </div>
          </div>

          {/* Row 2: Localização e Profissão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                value={formData.localizacao}
                onChange={(e) => handleChange('localizacao', e.target.value)}
                placeholder="Cidade, Estado"
              />
            </div>
            <div>
              <Label htmlFor="profissao">Profissão *</Label>
              <Input
                id="profissao"
                value={formData.profissao}
                onChange={(e) => handleChange('profissao', e.target.value)}
                placeholder="Sua área de atuação"
              />
            </div>
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

          {/* Row 6: CV Upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Análise do Currículo *</Label>
              <span className="text-xs text-muted-foreground">(Anexe seu CV ATS)</span>
            </div>
            
            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={extractingCV}
                className="gap-2"
              >
                {extractingCV ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extraindo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Anexar CV (PDF)
                  </>
                )}
              </Button>
              {formData.cvAnalysis && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <FileText className="w-4 h-4" />
                  CV extraído
                </div>
              )}
            </div>

            <Textarea
              value={formData.cvAnalysis}
              onChange={(e) => handleChange('cvAnalysis', e.target.value)}
              placeholder="O conteúdo do seu CV aparecerá aqui após o upload, ou você pode colar/digitar manualmente..."
              className="min-h-[120px] text-sm"
            />
          </div>
        </div>

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
