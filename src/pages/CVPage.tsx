import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CVForm, CVFormData } from "@/components/CVForm";
import { CVPreview } from "@/components/CVPreview";
import { CVData } from "@/types/cv";
import { ATSCVData } from "@/types/ats-cv";
import { CoverLetterData, CoverLetterFormData } from "@/types/cover-letter";
import { CVSelector } from "@/components/CVSelector";
import { ATSCVForm } from "@/components/ATSCVForm";
import { ATSCVPreview } from "@/components/ATSCVPreview";
import { CoverLetterForm } from "@/components/CoverLetterForm";
import { CoverLetterPreview } from "@/components/CoverLetterPreview";
import { SaveCVModal } from "@/components/SaveCVModal";
import { Zap, FolderOpen, LogIn, LogOut, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoAd from "@/assets/logo-ad.png";
import { motion, AnimatePresence } from "framer-motion";
import { SupportLink } from "@/components/SupportLink";

type CVType = "personalized" | "ats" | "cover-letter" | null;
type ViewState = "selector" | "form" | "preview";

const CVPage = () => {
  const [cvType, setCvType] = useState<CVType>(null);
  const [viewState, setViewState] = useState<ViewState>("selector");
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [atsCvData, setAtsCvData] = useState<ATSCVData | null>(null);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCoverLetterForm, setShowCoverLetterForm] = useState(false);
  const [savedCVs, setSavedCVs] = useState<any[]>([]);
  const [stage2Completed, setStage2Completed] = useState(false);
  const [completingStage, setCompletingStage] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.cvData) {
      setCvData(location.state.cvData);
      setCvType("personalized");
      setViewState("preview");
      window.history.replaceState({}, document.title);
    } else if (location.state?.atsCvData) {
      setAtsCvData(location.state.atsCvData);
      setCvType("ats");
      setViewState("preview");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch saved CVs and stage2 completion status
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch saved CVs
      const { data: cvsData } = await supabase
        .from('saved_cvs')
        .select('id, name, cv_data')
        .eq('user_id', user.id);

      if (cvsData) {
        setSavedCVs(cvsData);
      }

      // Fetch stage2 completion status
      const { data: profile } = await supabase
        .from('profiles')
        .select('stage2_completed')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setStage2Completed(profile.stage2_completed ?? false);
      }
    };

    fetchData();
  }, [user]);

  // Check if user has all document types
  // CV Personalizado has: sumario, sistemas, skills, competencias, realizacoes
  const hasPersonalizedCV = savedCVs.some(cv => {
    const data = cv.cv_data as any;
    return data?.sumario && data?.sistemas && data?.skills;
  });

  // CV ATS has: nacionalidade, idade, idiomas, localizacao (fields unique to ATS)
  const hasATSCV = savedCVs.some(cv => {
    const data = cv.cv_data as any;
    return data?.nacionalidade !== undefined || data?.idiomas !== undefined;
  });

  const hasAllDocuments = hasPersonalizedCV && hasATSCV;
  const canCompleteStage = hasAllDocuments && !stage2Completed;

  const handleCompleteStage2 = async () => {
    if (!user || !canCompleteStage) return;

    setCompletingStage(true);
    try {
      // Fetch user profile to get name and phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .single();

      // Update stage2_completed
      const { error } = await supabase
        .from('profiles')
        .update({ stage2_completed: true })
        .eq('user_id', user.id);

      if (error) throw error;

      // Send notification email to mentor
      try {
        await supabase.functions.invoke('notify-stage2-completed', {
          body: {
            menteeName: profile?.full_name || user.email,
            menteePhone: profile?.phone || 'Não informado',
          },
        });
        console.log('Stage 2 completion email sent');
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't block the completion if email fails
      }

      setStage2Completed(true);
      toast({
        title: "Etapa 2 concluída! 🎉",
        description: "Parabéns! Você já pode acessar a Etapa 3.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao concluir etapa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCompletingStage(false);
    }
  };

  useEffect(() => {
    if (user && location.state?.openSaveModal) {
      const pendingCV = localStorage.getItem('pending_cv');
      if (pendingCV) {
        try {
          const data = JSON.parse(pendingCV);
          setCvData(data);
          setCvType("personalized");
          setViewState("preview");
          setShowSaveModal(true);
          localStorage.removeItem('pending_cv');
        } catch (e) {
          console.error('Error restoring pending CV:', e);
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [user, location.state?.openSaveModal]);

  const handleSelectCVType = (type: CVType) => {
    setCvType(type);
    if (type === "cover-letter") {
      setShowCoverLetterForm(true);
    } else {
      setViewState("form");
    }
  };

  const handleGenerateCoverLetter = async (formData: CoverLetterFormData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
        body: { formData },
      });

      if (error) throw new Error(error.message || 'Erro ao gerar carta');
      if (data?.error) throw new Error(data.error);

      setCoverLetterData({
        formData,
        modelos: data.modelos,
      });
      setShowCoverLetterForm(false);
      setViewState("preview");
      toast({ title: "Cartas geradas! 🎉", description: "3 modelos de carta de apresentação prontos." });
    } catch (error: any) {
      toast({ title: "Erro ao gerar carta", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePersonalized = async (formData: CVFormData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cv', {
        body: {
          experiences: formData.experiences,
          jobDescription: formData.jobDescription,
          educacao: formData.educacao,
        },
      });

      if (error) throw new Error(error.message || 'Erro ao gerar CV');
      if (data?.error) throw new Error(data.error);

      const aiCV = data.cv;
      const fullCV: CVData = {
        nome: formData.nome || 'NOME COMPLETO',
        cargos: formData.cargos || 'Cargo 1 | Cargo 2 | Cargo 3',
        telefone: formData.telefone || 'telefone',
        email: formData.email || 'email',
        linkedin: formData.linkedin || 'linkedin',
        sumario: aiCV.sumario,
        sistemas: aiCV.sistemas,
        skills: aiCV.skills,
        competencias: aiCV.competencias,
        realizacoes: aiCV.realizacoes,
        educacao: aiCV.educacao || [],
        experiencias: aiCV.experiencias,
      };

      setCvData(fullCV);
      setViewState("preview");
      toast({ title: "Currículo gerado com sucesso! 🎉", description: "Seu currículo foi criado com IA." });
    } catch (error: any) {
      toast({ title: "Erro ao gerar currículo", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateATS = (data: ATSCVData) => {
    setAtsCvData(data);
    setViewState("preview");
    toast({ title: "Currículo ATS gerado! 🎉", description: "Seu currículo está formatado para sistemas ATS." });
  };

  const handleReset = () => {
    if (cvType === "ats") setAtsCvData(null);
    else if (cvType === "cover-letter") setCoverLetterData(null);
    else setCvData(null);
    setViewState("form");
  };

  const handleBackToSelector = () => {
    setCvType(null);
    setCvData(null);
    setAtsCvData(null);
    setCoverLetterData(null);
    setViewState("selector");
  };

  const handleBackFromCoverLetter = () => {
    setCoverLetterData(null);
    setCvType(null);
    setViewState("selector");
  };

  const handleUpdateCV = (updatedData: CVData) => setCvData(updatedData);

  const handleSaveCV = async (name: string) => {
    if (!user) { navigate('/auth'); return; }
    const dataToSave = cvType === "ats" ? atsCvData : cvData;
    if (!dataToSave) return;

    try {
      const { error } = await supabase.from('saved_cvs').insert({ user_id: user.id, name, cv_data: dataToSave as any });
      if (error) throw error;
      toast({ title: "Currículo salvo! 💾", description: `"${name}" foi salvo com sucesso.` });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const handleOpenSaveModal = () => {
    if (!user) {
      if (cvData) localStorage.setItem('pending_cv', JSON.stringify(cvData));
      toast({ title: "Faça login para salvar 🔐", description: "Você precisa de uma conta para salvar seus currículos." });
      window.location.href = '/auth';
      return;
    }
    setShowSaveModal(true);
  };

  const handleOpenSaveModalATS = () => {
    if (!user) {
      if (atsCvData) localStorage.setItem('pending_ats_cv', JSON.stringify(atsCvData));
      toast({ title: "Faça login para salvar 🔐", description: "Você precisa de uma conta para salvar seus currículos." });
      window.location.href = '/auth';
      return;
    }
    setShowSaveModal(true);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <nav className="flex items-center justify-between py-4 px-4 md:px-6 print:hidden animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={logoAd} alt="AD Logo" className="h-14 w-auto" />
          {user && (
            <Button variant="outline" size="sm" onClick={() => navigate('/meus-cvs')} className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Meus CVs</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SupportLink />
          {user ? (
            <>
              <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <User className="w-3 h-3" />{user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sair</span>
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'} className="gap-2">
              <LogIn className="w-4 h-4" />Entrar
            </Button>
          )}
        </div>
      </nav>

      <div className="relative z-10 container max-w-4xl py-6 px-4 print:py-0 print:max-w-full">
        <AnimatePresence mode="wait">
          {viewState !== "selector" && (
            <motion.header key={`header-${viewState}-${cvType}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center mb-10 print:hidden">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                {cvType === "ats" ? (
                  <><span className="text-foreground">Currículo para </span><span className="text-gradient">ATS</span></>
                ) : cvType === "cover-letter" ? (
                  <><span className="text-foreground">Carta de </span><span className="text-gradient">Apresentação</span></>
                ) : (
                  <><span className="text-foreground">Currículo </span><span className="text-gradient">Personalizado</span></>
                )}
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm">
                {cvType === "ats" ? "Formatação otimizada para sistemas de rastreamento" : cvType === "cover-letter" ? "Crie cartas impactantes para suas candidaturas" : "Transforme suas experiências em um currículo estratégico"} <Zap className="w-3 h-3 inline" />
              </p>
            </motion.header>
          )}
        </AnimatePresence>

        <main className="relative">
          <AnimatePresence mode="wait">
            {viewState === "selector" && (
              <motion.div key="selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CVSelector onSelect={handleSelectCVType} />
                
                {/* Stage 2 Completion Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <Card className={`p-6 ${stage2Completed ? 'bg-green-500/10 border-green-500/30' : 'bg-secondary/30 border-border/50'}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${stage2Completed ? 'bg-green-500/20' : 'bg-primary/10'}`}>
                          <CheckCircle2 className={`w-5 h-5 ${stage2Completed ? 'text-green-500' : 'text-primary'}`} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${stage2Completed ? 'text-green-500' : 'text-foreground'}`}>
                            {stage2Completed ? 'Etapa 2 Concluída!' : 'Concluir Etapa 2'}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage2Completed 
                              ? 'Você já pode acessar a Etapa 3 - Funil de Oportunidades'
                              : hasAllDocuments
                                ? 'Você criou todos os documentos! Clique para concluir.'
                                : `Crie seu ${!hasPersonalizedCV ? 'CV Personalizado' : ''} ${!hasPersonalizedCV && !hasATSCV ? 'e ' : ''} ${!hasATSCV ? 'CV ATS' : ''} para concluir.`
                            }
                          </p>
                        </div>
                      </div>
                      
                      {!stage2Completed && (
                        <Button
                          onClick={handleCompleteStage2}
                          disabled={!canCompleteStage || completingStage}
                          className="gap-2 whitespace-nowrap"
                        >
                          {completingStage ? (
                            <>
                              <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Concluído
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Document checklist */}
                    {!stage2Completed && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <p className="text-xs text-muted-foreground mb-2">Documentos criados:</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${hasPersonalizedCV ? 'bg-green-500/20 text-green-500' : 'bg-muted/50 text-muted-foreground'}`}>
                            {hasPersonalizedCV ? '✓' : '○'} CV Personalizado
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${hasATSCV ? 'bg-green-500/20 text-green-500' : 'bg-muted/50 text-muted-foreground'}`}>
                            {hasATSCV ? '✓' : '○'} CV ATS
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              </motion.div>
            )}
            {viewState === "form" && cvType === "personalized" && (<motion.div key="personalized-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-gradient-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-card"><Button variant="ghost" size="sm" onClick={handleBackToSelector} className="gap-2 -ml-2 mb-4"><ArrowLeft className="w-4 h-4" />Voltar</Button><CVForm onGenerate={handleGeneratePersonalized} isLoading={isLoading} /></motion.div>)}
            {viewState === "form" && cvType === "ats" && (<motion.div key="ats-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-gradient-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-card"><ATSCVForm onGenerate={handleGenerateATS} onBack={handleBackToSelector} /></motion.div>)}
            {viewState === "preview" && cvType === "personalized" && cvData && (<motion.div key="personalized-preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><CVPreview data={cvData} onReset={handleReset} onUpdate={handleUpdateCV} onSave={handleOpenSaveModal} /></motion.div>)}
            {viewState === "preview" && cvType === "ats" && atsCvData && (<motion.div key="ats-preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><ATSCVPreview data={atsCvData} onReset={handleReset} onSave={handleOpenSaveModalATS} /></motion.div>)}
            {viewState === "preview" && cvType === "cover-letter" && coverLetterData && (<motion.div key="cover-letter-preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><CoverLetterPreview data={coverLetterData} onBack={handleBackFromCoverLetter} /></motion.div>)}
          </AnimatePresence>
        </main>
      </div>

      <SaveCVModal open={showSaveModal} onOpenChange={setShowSaveModal} onSave={handleSaveCV} />
      <CoverLetterForm 
        open={showCoverLetterForm} 
        onOpenChange={(open) => {
          setShowCoverLetterForm(open);
          if (!open) setCvType(null);
        }} 
        onGenerate={handleGenerateCoverLetter} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default CVPage;
