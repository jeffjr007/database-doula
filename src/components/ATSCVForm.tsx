import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Phone,
  MapPin,
  Sparkles,
  GraduationCap,
  Briefcase,
  Languages,
  Plus,
  Trash2,
  ArrowLeft,
  Linkedin,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ATSCVData, IdiomaItem } from "@/types/ats-cv";
import { motion, AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ATSCVFormProps {
  onGenerate: (data: ATSCVData) => void;
  onBack: () => void;
}

interface FormData {
  nome: string;
  telefone: string;
  localizacao: string;
  email: string;
  linkedin: string;
  nacionalidade: string;
  idade: string;
  experiencias: string;
  educacao: string;
  idiomas: IdiomaItem[];
}

// Locked/readonly input style for auto-filled fields
const lockedInputClass = "h-11 md:h-10 text-sm rounded-lg bg-muted/50 border-muted-foreground/20 cursor-default opacity-90";

// Mobile-optimized collapsible section component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isMobile: boolean;
  hasContent?: boolean;
}

function CollapsibleSection({ 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  children, 
  isMobile,
  hasContent = false 
}: CollapsibleSectionProps) {
  if (!isMobile) {
    // Desktop: always show content, no collapse
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {title}
        </div>
        {children}
      </div>
    );
  }

  // Mobile: collapsible
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between py-3 px-1 border-b border-border/30 active:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
            {icon}
            {title}
            {hasContent && !isOpen && (
              <span className="text-xs text-primary/70 ml-1">✓</span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-3 pb-2 space-y-3"
        >
          {children}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ATSCVForm({ onGenerate, onBack }: ATSCVFormProps) {
  const { personalData, isLoading: isLoadingProfile } = useUserProfile();
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    telefone: "",
    localizacao: "",
    email: "",
    linkedin: "",
    nacionalidade: "",
    idade: "",
    experiencias: "",
    educacao: "",
    idiomas: [{ idioma: "", nivel: "" }],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const { toast } = useToast();

  // Mobile collapsible section states - only one open at a time
  const [openSection, setOpenSection] = useState<'experiencias' | 'educacao' | 'idiomas' | null>('experiencias');

  const handleSectionToggle = (section: 'experiencias' | 'educacao' | 'idiomas') => {
    setOpenSection(prev => prev === section ? null : section);
  };

  // Auto-fill personal data from profile
  useEffect(() => {
    if (!isLoadingProfile && personalData) {
      setFormData(prev => ({
        ...prev,
        nome: prev.nome || personalData.fullName.toUpperCase(),
        telefone: prev.telefone || personalData.phone,
        localizacao: prev.localizacao || personalData.location,
        email: prev.email || personalData.email,
        linkedin: prev.linkedin || personalData.linkedinUrl,
        idade: prev.idade || personalData.age,
      }));
      // Mark profile as loaded after a brief delay for smooth animation
      setTimeout(() => setIsProfileLoaded(true), 300);
    }
  }, [personalData, isLoadingProfile]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIdiomaChange = (index: number, field: keyof IdiomaItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      idiomas: prev.idiomas.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addIdioma = () => {
    setFormData(prev => ({
      ...prev,
      idiomas: [...prev.idiomas, { idioma: "", nivel: "" }],
    }));
  };

  const removeIdioma = (index: number) => {
    if (formData.idiomas.length > 1) {
      setFormData(prev => ({
        ...prev,
        idiomas: prev.idiomas.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.experiencias.trim() || !formData.educacao.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Preencha as seções de experiências e educação.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ats-cv', {
        body: {
          nome: formData.nome,
          telefone: formData.telefone,
          localizacao: formData.localizacao,
          email: formData.email,
          linkedin: formData.linkedin,
          nacionalidade: formData.nacionalidade,
          idade: formData.idade,
          experiencias: formData.experiencias,
          educacao: formData.educacao,
          idiomas: formData.idiomas.filter(i => i.idioma.trim()),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onGenerate(data.cv);
    } catch (error: any) {
      console.error('Error generating ATS CV:', error);
      toast({
        title: "Erro ao gerar currículo",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = formData.experiencias.trim().length > 50 && formData.educacao.trim().length > 10;

  // Show loading while profile is being fetched
  if (isLoadingProfile) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 -ml-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2 text-sm h-9"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      {/* Personal Info Section - Always visible, more compact on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="w-4 h-4 text-primary" />
          Dados Pessoais
        </div>

        {/* Nome - Locked field */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Nome Completo
            {formData.nome && <Lock className="w-3 h-3 text-muted-foreground/60" />}
          </label>
          <Input
            value={formData.nome}
            onChange={(e) => handleChange("nome", e.target.value.toUpperCase())}
            placeholder="LUCIANO DUARTE"
            readOnly={!!personalData.fullName}
            className={personalData.fullName ? lockedInputClass : "h-11 md:h-10 text-sm rounded-lg"}
          />
        </div>

        {/* Contact Row - Telefone and Localização are locked */}
        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              Telefone
              {formData.telefone && <Lock className="w-3 h-3 text-muted-foreground/60" />}
            </label>
            <Input
              value={formData.telefone}
              onChange={(e) => handleChange("telefone", e.target.value)}
              placeholder="+55 11 98601-0599"
              readOnly={!!personalData.phone}
              className={personalData.phone ? lockedInputClass : "h-11 md:h-10 text-sm rounded-lg"}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              Localização
              {formData.localizacao && <Lock className="w-3 h-3 text-muted-foreground/60" />}
            </label>
            <Input
              value={formData.localizacao}
              onChange={(e) => handleChange("localizacao", e.target.value)}
              placeholder="São Paulo, Brasil"
              readOnly={!!personalData.location}
              className={personalData.location ? lockedInputClass : "h-11 md:h-10 text-sm rounded-lg"}
            />
          </div>
        </div>

        {/* Email - Full width on mobile for better readability */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            E-mail
            {formData.email && <Lock className="w-3 h-3 text-muted-foreground/60" />}
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="seu@email.com"
            readOnly={!!personalData.email}
            className={personalData.email ? lockedInputClass : "h-11 md:h-10 text-sm rounded-lg"}
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            LinkedIn
            {formData.linkedin && <Lock className="w-3 h-3 text-muted-foreground/60" />}
          </label>
          <Input
            value={formData.linkedin}
            onChange={(e) => handleChange("linkedin", e.target.value)}
            placeholder="linkedin.com/in/seuperfil"
            readOnly={!!personalData.linkedinUrl}
            className={personalData.linkedinUrl ? lockedInputClass : "h-11 md:h-10 text-sm rounded-lg"}
          />
        </div>

        {/* Nacionalidade and Idade */}
        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Nacionalidade</label>
            <Input
              value={formData.nacionalidade}
              onChange={(e) => handleChange("nacionalidade", e.target.value.toUpperCase())}
              placeholder="BRASILEIRO"
              className="h-11 md:h-10 text-sm rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Idade
              {formData.idade && <Lock className="w-3 h-3 text-muted-foreground/60" />}
            </label>
            <Input
              value={formData.idade}
              onChange={(e) => handleChange("idade", e.target.value)}
              placeholder="30 ANOS"
              readOnly={!!personalData.age}
              className={personalData.age ? lockedInputClass : "h-11 md:h-10 text-sm rounded-lg"}
            />
          </div>
        </div>
      </motion.div>

      {/* Divider for mobile */}
      {isMobile && <div className="border-t border-border/50 pt-2" />}

      {/* Experiences Section - Collapsible on mobile */}
      <CollapsibleSection
        title="Experiências Profissionais"
        icon={<Briefcase className="w-4 h-4 text-primary" />}
        isOpen={openSection === 'experiencias'}
        onToggle={() => handleSectionToggle('experiencias')}
        isMobile={isMobile}
        hasContent={formData.experiencias.trim().length > 0}
      >
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Linkedin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-500/90">
              <p className="font-medium mb-1">Como copiar do LinkedIn:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-500/70">
                <li>Acesse seu perfil do LinkedIn</li>
                <li>Selecione e copie as experiências</li>
                <li>Cole abaixo (Ctrl+V)</li>
              </ol>
            </div>
          </div>
        </div>

        <Textarea
          value={formData.experiencias}
          onChange={(e) => handleChange("experiencias", e.target.value)}
          placeholder={`Cole aqui suas experiências do LinkedIn...

Exemplo:
Gerente de Projetos
Empresa ABC
jan de 2020 - presente`}
          className="min-h-[140px] md:min-h-[200px] text-sm rounded-lg p-3"
        />
        <p className="text-xs text-muted-foreground/70">
          A IA organiza exatamente como você escreveu.
        </p>
      </CollapsibleSection>

      {/* Education Section - Collapsible on mobile */}
      <CollapsibleSection
        title="Formação e Certificados"
        icon={<GraduationCap className="w-4 h-4 text-primary" />}
        isOpen={openSection === 'educacao'}
        onToggle={() => handleSectionToggle('educacao')}
        isMobile={isMobile}
        hasContent={formData.educacao.trim().length > 0}
      >
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Linkedin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-500/70">
              Copie de "Formação acadêmica" e "Certificados"
            </p>
          </div>
        </div>

        <Textarea
          value={formData.educacao}
          onChange={(e) => handleChange("educacao", e.target.value)}
          placeholder={`Cole sua formação e certificados...

Exemplo:
MBA em Gestão de Projetos
FGV - 2018 a 2020`}
          className="min-h-[120px] md:min-h-[150px] text-sm rounded-lg p-3"
        />
        <p className="text-xs text-muted-foreground/70">
          A IA organiza exatamente como você escreveu.
        </p>
      </CollapsibleSection>

      {/* Languages Section - Collapsible on mobile */}
      <CollapsibleSection
        title="Idiomas"
        icon={<Languages className="w-4 h-4 text-primary" />}
        isOpen={openSection === 'idiomas'}
        onToggle={() => handleSectionToggle('idiomas')}
        isMobile={isMobile}
        hasContent={formData.idiomas.some(i => i.idioma.trim().length > 0)}
      >
        <div className="flex justify-end mb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addIdioma}
            className="gap-1 text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-2">
          {formData.idiomas.map((idioma, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={idioma.idioma}
                onChange={(e) => handleIdiomaChange(index, "idioma", e.target.value)}
                placeholder="Inglês"
                className="flex-1 h-11 md:h-10 text-sm rounded-lg"
              />
              <Input
                value={idioma.nivel}
                onChange={(e) => handleIdiomaChange(index, "nivel", e.target.value.toUpperCase())}
                placeholder="FLUENTE"
                className="flex-1 h-11 md:h-10 text-sm rounded-lg"
              />
              {formData.idiomas.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIdioma(index)}
                  className="shrink-0 w-10 h-10"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Submit Button - Sticky on mobile for easy thumb access */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-3 md:pt-0"
      >
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full gap-2 h-12 text-sm rounded-xl"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Gerando currículo...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Gerar Currículo ATS
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}
