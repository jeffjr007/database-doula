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
  ChevronRight,
  Check,
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

// Locked/readonly input style for auto-filled fields - softer on mobile
const lockedInputClass = "h-10 text-sm rounded-lg bg-muted/30 border-border/40 cursor-default";

// Mobile-optimized collapsible section component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isMobile: boolean;
  hasContent?: boolean;
  stepNumber?: number;
}

function CollapsibleSection({ 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  children, 
  isMobile,
  hasContent = false,
  stepNumber
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

  // Mobile: collapsible with guided step indicator
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`w-full flex items-center justify-between py-3.5 transition-colors rounded-lg ${
            isOpen 
              ? 'bg-primary/5' 
              : 'active:bg-muted/20'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              hasContent 
                ? 'bg-primary/20 text-primary' 
                : isOpen 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-muted-foreground'
            }`}>
              {hasContent ? <Check className="w-3.5 h-3.5" /> : stepNumber}
            </div>
            <span className={`text-sm font-medium transition-colors ${
              isOpen ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {title}
            </span>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground/60 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`} />
        </button>
      </CollapsibleTrigger>
      <AnimatePresence>
        {isOpen && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-1 pl-10 space-y-3">
                {children}
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
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
          className="gap-2 text-sm h-9"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  // Compact input class for mobile
  const inputClass = "h-10 text-sm rounded-lg border-border/50 focus:border-primary/50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {/* Back Button - subtle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 -ml-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar
      </Button>

      {/* Personal Info Section - Always visible, streamlined */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2.5"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <User className="w-4 h-4 text-primary" />
          Seus Dados
        </div>

        {/* Nome */}
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wide">
            Nome
            {formData.nome && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
          </label>
          <Input
            value={formData.nome}
            onChange={(e) => handleChange("nome", e.target.value.toUpperCase())}
            placeholder="LUCIANO DUARTE"
            readOnly={!!personalData.fullName}
            className={personalData.fullName ? lockedInputClass : inputClass}
          />
        </div>

        {/* Telefone + Localização - compact grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wide">
              Telefone
              {formData.telefone && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
            </label>
            <Input
              value={formData.telefone}
              onChange={(e) => handleChange("telefone", e.target.value)}
              placeholder="(11) 99999-9999"
              readOnly={!!personalData.phone}
              className={personalData.phone ? lockedInputClass : inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wide">
              Cidade
              {formData.localizacao && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
            </label>
            <Input
              value={formData.localizacao}
              onChange={(e) => handleChange("localizacao", e.target.value)}
              placeholder="São Paulo, SP"
              readOnly={!!personalData.location}
              className={personalData.location ? lockedInputClass : inputClass}
            />
          </div>
        </div>

        {/* Email - full width for readability */}
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wide">
            E-mail
            {formData.email && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="seu@email.com"
            readOnly={!!personalData.email}
            className={personalData.email ? lockedInputClass : inputClass}
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wide">
            LinkedIn
            {formData.linkedin && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
          </label>
          <Input
            value={formData.linkedin}
            onChange={(e) => handleChange("linkedin", e.target.value)}
            placeholder="linkedin.com/in/seuperfil"
            readOnly={!!personalData.linkedinUrl}
            className={personalData.linkedinUrl ? lockedInputClass : inputClass}
          />
        </div>

        {/* Nacionalidade + Idade - compact */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Nacionalidade
            </label>
            <Input
              value={formData.nacionalidade}
              onChange={(e) => handleChange("nacionalidade", e.target.value.toUpperCase())}
              placeholder="BRASILEIRO"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wide">
              Idade
              {formData.idade && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
            </label>
            <Input
              value={formData.idade}
              onChange={(e) => handleChange("idade", e.target.value)}
              placeholder="30 ANOS"
              readOnly={!!personalData.age}
              className={personalData.age ? lockedInputClass : inputClass}
            />
          </div>
        </div>
      </motion.div>

      {/* Divider - subtle on mobile */}
      {isMobile && (
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border/30" />
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Cole do LinkedIn</span>
          <div className="flex-1 h-px bg-border/30" />
        </div>
      )}

      {/* Experiences Section - Collapsible on mobile */}
      <CollapsibleSection
        title="Experiências"
        icon={<Briefcase className="w-4 h-4 text-primary" />}
        isOpen={openSection === 'experiencias'}
        onToggle={() => handleSectionToggle('experiencias')}
        isMobile={isMobile}
        hasContent={formData.experiencias.trim().length > 0}
        stepNumber={1}
      >
        {/* Tip box - more subtle */}
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/30 border border-border/30">
          <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Copie suas experiências do LinkedIn e cole aqui
          </p>
        </div>

        <Textarea
          value={formData.experiencias}
          onChange={(e) => handleChange("experiencias", e.target.value)}
          placeholder="Cole aqui suas experiências..."
          className="min-h-[120px] md:min-h-[180px] text-sm rounded-lg p-3 border-border/50 resize-none"
        />
      </CollapsibleSection>

      {/* Education Section - Collapsible on mobile */}
      <CollapsibleSection
        title="Formação"
        icon={<GraduationCap className="w-4 h-4 text-primary" />}
        isOpen={openSection === 'educacao'}
        onToggle={() => handleSectionToggle('educacao')}
        isMobile={isMobile}
        hasContent={formData.educacao.trim().length > 0}
        stepNumber={2}
      >
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/30 border border-border/30">
          <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Copie sua formação acadêmica e certificados
          </p>
        </div>

        <Textarea
          value={formData.educacao}
          onChange={(e) => handleChange("educacao", e.target.value)}
          placeholder="Cole sua formação..."
          className="min-h-[100px] md:min-h-[140px] text-sm rounded-lg p-3 border-border/50 resize-none"
        />
      </CollapsibleSection>

      {/* Languages Section - Collapsible on mobile */}
      <CollapsibleSection
        title="Idiomas"
        icon={<Languages className="w-4 h-4 text-primary" />}
        isOpen={openSection === 'idiomas'}
        onToggle={() => handleSectionToggle('idiomas')}
        isMobile={isMobile}
        hasContent={formData.idiomas.some(i => i.idioma.trim().length > 0)}
        stepNumber={3}
      >
        <div className="space-y-2">
          {formData.idiomas.map((idioma, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={idioma.idioma}
                onChange={(e) => handleIdiomaChange(index, "idioma", e.target.value)}
                placeholder="Inglês"
                className={`flex-1 ${inputClass}`}
              />
              <Input
                value={idioma.nivel}
                onChange={(e) => handleIdiomaChange(index, "nivel", e.target.value.toUpperCase())}
                placeholder="FLUENTE"
                className={`flex-1 ${inputClass}`}
              />
              {formData.idiomas.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIdioma(index)}
                  className="shrink-0 w-9 h-9 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addIdioma}
            className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground w-full justify-center border border-dashed border-border/50 hover:border-border"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar idioma
          </Button>
        </div>
      </CollapsibleSection>

      {/* Submit Button - prominent, with breathing room */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="pt-4 md:pt-2 pb-2"
      >
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full gap-2.5 h-12 text-sm font-medium rounded-xl shadow-lg shadow-primary/20 disabled:shadow-none transition-shadow"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Gerar Currículo ATS
            </>
          )}
        </Button>
        {!isValid && (
          <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
            Preencha experiências e formação para continuar
          </p>
        )}
      </motion.div>
    </form>
  );
}
