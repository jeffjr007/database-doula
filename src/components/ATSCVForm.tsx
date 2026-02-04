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
import { motion } from "framer-motion";
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

// Locked/readonly input style for auto-filled fields - consistent loose style
const lockedInputClass = "h-11 text-sm rounded-xl bg-muted/30 border-transparent cursor-default opacity-80";

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
      <CollapsibleContent>
        <div 
          className={`overflow-hidden transition-all duration-200 ease-out ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="pt-2 pb-1 pl-10 space-y-3">
            {children}
          </div>
        </div>
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

  // Mobile step navigation: 1 = Dados Pessoais, 2 = Seu LinkedIn
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);

  // Scroll to top when advancing steps
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        nacionalidade: prev.nacionalidade || personalData.nacionalidade.toUpperCase(),
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

  // Consistent loose input styles for both mobile and desktop
  const inputClass = isMobile 
    ? "h-12 text-base rounded-xl bg-muted/20 border-transparent focus:border-primary/40 focus:bg-muted/30 placeholder:text-muted-foreground/40" 
    : "h-11 text-sm rounded-xl bg-muted/20 border-transparent focus:border-primary/30 focus:bg-muted/30 placeholder:text-muted-foreground/50";

  const textareaClass = isMobile
    ? "text-base rounded-xl bg-muted/20 border-transparent focus:border-primary/40 focus:bg-muted/30 placeholder:text-muted-foreground/40 resize-none"
    : "text-sm rounded-xl bg-muted/20 border-transparent focus:border-primary/30 focus:bg-muted/30 placeholder:text-muted-foreground/50 resize-none";

  // Check if step 1 is complete (has name and email at minimum)
  const isStep1Valid = formData.nome.trim().length > 0 && formData.email.trim().length > 0;

  // MOBILE LAYOUT - 2 Steps: Dados Pessoais + Seu LinkedIn
  if (isMobile) {
    return (
      <form onSubmit={handleSubmit}>
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={mobileStep === 1 ? onBack : () => setMobileStep(1)}
            className="gap-1.5 text-sm text-muted-foreground hover:text-foreground h-9 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {mobileStep === 1 ? 'Voltar' : 'Anterior'}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${mobileStep === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              Etapa {mobileStep} de 2
            </span>
          </div>
        </div>

        <div className="relative">
          {/* Step 1: Dados Pessoais */}
          <div 
            className={`transition-all duration-200 ease-out ${
              mobileStep === 1 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-4 absolute inset-0 pointer-events-none'
            }`}
          >
            {mobileStep === 1 && (
              <div className="space-y-5 animate-mobile-fade-in">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Dados Pessoais</h2>
                  <p className="text-sm text-muted-foreground mt-1">Informações básicas do seu currículo</p>
                </div>

                {/* All fields full width, stacked */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Nome completo</label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => handleChange("nome", e.target.value.toUpperCase())}
                      placeholder="SEU NOME COMPLETO"
                      readOnly={!!personalData.fullName}
                      className={personalData.fullName ? `${inputClass} opacity-70` : inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">E-mail</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="seu@email.com"
                      readOnly={!!personalData.email}
                      className={personalData.email ? `${inputClass} opacity-70` : inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Telefone</label>
                    <Input
                      value={formData.telefone}
                      onChange={(e) => handleChange("telefone", e.target.value)}
                      placeholder="(11) 99999-9999"
                      readOnly={!!personalData.phone}
                      className={personalData.phone ? `${inputClass} opacity-70` : inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Cidade</label>
                    <Input
                      value={formData.localizacao}
                      onChange={(e) => handleChange("localizacao", e.target.value)}
                      placeholder="São Paulo, SP"
                      readOnly={!!personalData.location}
                      className={personalData.location ? `${inputClass} opacity-70` : inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">LinkedIn</label>
                    <Input
                      value={formData.linkedin}
                      onChange={(e) => handleChange("linkedin", e.target.value)}
                      placeholder="linkedin.com/in/seuperfil"
                      readOnly={!!personalData.linkedinUrl}
                      className={personalData.linkedinUrl ? `${inputClass} opacity-70` : inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Nacionalidade</label>
                    <Input
                      value={formData.nacionalidade}
                      onChange={(e) => handleChange("nacionalidade", e.target.value.toUpperCase())}
                      placeholder="BRASILEIRO"
                      readOnly={!!personalData.nacionalidade}
                      className={personalData.nacionalidade ? `${inputClass} opacity-70` : inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Idade</label>
                    <Input
                      value={formData.idade}
                      onChange={(e) => handleChange("idade", e.target.value)}
                      placeholder="30 ANOS"
                      readOnly={!!personalData.age}
                      className={personalData.age ? `${inputClass} opacity-70` : inputClass}
                    />
                  </div>
                </div>

                {/* Next button */}
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
              </div>
            )}
          </div>

          {/* Step 2: Seu LinkedIn */}
          <div 
            className={`transition-all duration-200 ease-out ${
              mobileStep === 2 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-4 absolute inset-0 pointer-events-none'
            }`}
          >
            {mobileStep === 2 && (
              <div className="space-y-6 animate-mobile-fade-in">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Seu LinkedIn</h2>
                  <p className="text-sm text-muted-foreground mt-1">Cole suas informações do LinkedIn</p>
                </div>

                {/* Experiências - sempre visível */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <label className="text-base font-medium text-foreground">Experiências Profissionais</label>
                  </div>
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-muted/20">
                    <Linkedin className="w-4 h-4 text-[#0A66C2] mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Copie do LinkedIn e cole aqui
                    </p>
                  </div>
                  <Textarea
                    value={formData.experiencias}
                    onChange={(e) => handleChange("experiencias", e.target.value)}
                    placeholder="Cole aqui suas experiências profissionais..."
                    className={`min-h-[160px] p-4 ${textareaClass}`}
                  />
                </div>

                {/* Formação - sempre visível */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <label className="text-base font-medium text-foreground">Formação Acadêmica</label>
                  </div>
                  <Textarea
                    value={formData.educacao}
                    onChange={(e) => handleChange("educacao", e.target.value)}
                    placeholder="Cole aqui sua formação e certificados..."
                    className={`min-h-[120px] p-4 ${textareaClass}`}
                  />
                </div>

                {/* Idiomas - sempre visível */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-primary" />
                    <label className="text-base font-medium text-foreground">Idiomas</label>
                  </div>
                  <div className="space-y-3">
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
                            className="shrink-0 w-11 h-11 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addIdioma}
                      className="gap-2 text-sm h-11 text-muted-foreground hover:text-foreground w-full justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar idioma
                    </Button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 pb-4">
                  <Button
                    type="submit"
                    disabled={!isValid || isLoading}
                    className="w-full gap-2.5 h-14 text-base font-medium rounded-2xl shadow-lg shadow-primary/25 disabled:shadow-none transition-all"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Gerar Currículo ATS
                      </>
                    )}
                  </Button>
                  {!isValid && (
                    <p className="text-sm text-muted-foreground/60 text-center mt-3">
                      Preencha experiências e formação para continuar
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    );
  }

  // DESKTOP LAYOUT - Original structure preserved
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
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

      {/* Personal Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <User className="w-4 h-4 text-primary" />
          Seus Dados
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
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

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
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

        <div className="space-y-1.5">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
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

        <div className="space-y-1.5">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              Nacionalidade
              {formData.nacionalidade && personalData.nacionalidade && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
            </label>
            <Input
              value={formData.nacionalidade}
              onChange={(e) => handleChange("nacionalidade", e.target.value.toUpperCase())}
              placeholder="BRASILEIRO"
              readOnly={!!personalData.nacionalidade}
              className={personalData.nacionalidade ? lockedInputClass : inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
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

      {/* Experiences Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Briefcase className="w-4 h-4 text-primary" />
          Experiências Profissionais
        </div>
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/20 border-transparent">
          <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Copie suas experiências do LinkedIn e cole aqui
          </p>
        </div>
        <Textarea
          value={formData.experiencias}
          onChange={(e) => handleChange("experiencias", e.target.value)}
          placeholder="Cole aqui suas experiências..."
          className={`min-h-[180px] p-4 ${textareaClass}`}
        />
      </div>

      {/* Education Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <GraduationCap className="w-4 h-4 text-primary" />
          Formação Acadêmica
        </div>
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/20 border-transparent">
          <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Copie sua formação acadêmica e certificados
          </p>
        </div>
        <Textarea
          value={formData.educacao}
          onChange={(e) => handleChange("educacao", e.target.value)}
          placeholder="Cole sua formação..."
          className={`min-h-[140px] p-4 ${textareaClass}`}
        />
      </div>

      {/* Languages Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Languages className="w-4 h-4 text-primary" />
          Idiomas
        </div>
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
            className="gap-1.5 text-xs h-9 text-muted-foreground hover:text-foreground w-full justify-center rounded-xl bg-muted/10 hover:bg-muted/20 border-transparent"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar idioma
          </Button>
        </div>
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="pt-2 pb-2"
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
