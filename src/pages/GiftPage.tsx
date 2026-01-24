import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, BookOpen, Target, Rocket, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import logoAD from '@/assets/logo-ad.png';
import mentorPhoto from '@/assets/mentor-photo.png';

interface Course {
  name: string;
  url: string;
}

interface Module {
  title: string;
  focus: string;
  courses: Course[];
}

interface FormattedPath {
  modules: Module[];
}

// Extract platform/company name from course URL
const getPlatformFromUrl = (url: string): { name: string; color: string } => {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('linkedin.com/learning')) {
    return { name: 'LinkedIn Learning', color: 'from-[#0077B5] to-[#0077B5]/70' };
  }
  if (lowerUrl.includes('coursera.org')) {
    return { name: 'Coursera', color: 'from-[#0056D2] to-[#0056D2]/70' };
  }
  if (lowerUrl.includes('udemy.com')) {
    return { name: 'Udemy', color: 'from-[#A435F0] to-[#A435F0]/70' };
  }
  if (lowerUrl.includes('alura.com')) {
    return { name: 'Alura', color: 'from-[#0B6CFF] to-[#0B6CFF]/70' };
  }
  if (lowerUrl.includes('rocketseat.com')) {
    return { name: 'Rocketseat', color: 'from-[#8257E5] to-[#8257E5]/70' };
  }
  if (lowerUrl.includes('google.com') || lowerUrl.includes('grow.google')) {
    return { name: 'Google', color: 'from-[#4285F4] to-[#34A853]' };
  }
  if (lowerUrl.includes('microsoft.com') || lowerUrl.includes('learn.microsoft')) {
    return { name: 'Microsoft Learn', color: 'from-[#00A4EF] to-[#7FBA00]' };
  }
  if (lowerUrl.includes('edx.org')) {
    return { name: 'edX', color: 'from-[#02262B] to-[#02262B]/70' };
  }
  if (lowerUrl.includes('youtube.com')) {
    return { name: 'YouTube', color: 'from-[#FF0000] to-[#FF0000]/70' };
  }
  if (lowerUrl.includes('dio.me')) {
    return { name: 'DIO', color: 'from-[#1A1A2E] to-[#1A1A2E]/70' };
  }
  if (lowerUrl.includes('sebrae.com')) {
    return { name: 'Sebrae', color: 'from-[#004B87] to-[#004B87]/70' };
  }
  if (lowerUrl.includes('ev.org.br') || lowerUrl.includes('fgv.br')) {
    return { name: 'FGV', color: 'from-[#003366] to-[#003366]/70' };
  }
  
  // Default
  return { name: 'Curso Online', color: 'from-primary to-accent' };
};

const GiftPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<'loading' | 'intro' | 'explanation' | 'reveal'>('loading');
  const [formattedPath, setFormattedPath] = useState<FormattedPath | null>(null);
  const [loadingPath, setLoadingPath] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchLearningPath();
    }
  }, [user, authLoading, navigate]);

  const fetchLearningPath = async () => {
    if (!user) return;

    const navState = location.state as { direct?: boolean; fromActivation?: boolean } | null;
    
    // When the user comes from the Portal sidebar, we want a direct reveal (no gift animation).
    const directFromSidebar = navState?.direct === true;
    
    // When user comes from activation flow, ALWAYS show animation
    const fromActivation = navState?.fromActivation === true;

    const { data: profile } = await supabase
      .from('profiles')
      .select('learning_path')
      .eq('user_id', user.id)
      .single();

    if (profile?.learning_path) {
      const seenKey = `gift_seen_${user.id}`;
      const seen = localStorage.getItem(seenKey);

      // If user came from activation (Começar Jornada), ALWAYS show intro animation
      if (fromActivation) {
        setStep('intro');
        return;
      }

      // If user came from sidebar, skip intro/explanation entirely.
      if (directFromSidebar) {
        localStorage.setItem(seenKey, 'true');
        setStep('reveal');
        loadFormattedPath();
        return;
      }

      // Normal flow: show animation only on the first time.
      if (seen) {
        setStep('reveal');
        loadFormattedPath();
      } else {
        setStep('intro');
      }
    } else {
      // No gift available, redirect back
      navigate('/');
    }
  };

  const loadFormattedPath = async () => {
    if (!user) return;
    
    setLoadingPath(true);

    try {
      // Load pre-formatted path from database (formatted by admin on save)
      const { data: savedPath } = await supabase
        .from('learning_paths')
        .select('formatted_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (savedPath?.formatted_data) {
        console.log('[GiftPage] Loading pre-formatted path from database');
        const formatted = savedPath.formatted_data as unknown as FormattedPath;
        if (formatted?.modules && formatted.modules.length > 0) {
          setFormattedPath(formatted);
        } else {
          console.warn('[GiftPage] Formatted data exists but has no modules');
        }
      } else {
        console.warn('[GiftPage] No pre-formatted path found - admin needs to save the learning path');
      }
    } catch (error) {
      console.error('Error loading formatted path:', error);
    } finally {
      setLoadingPath(false);
    }
  };


  const handleOpenGift = () => {
    setStep('explanation');
  };

  const handleContinue = () => {
    setStep('reveal');
    loadFormattedPath();
    // Mark as seen
    if (user) {
      localStorage.setItem(`gift_seen_${user.id}`, 'true');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (authLoading || step === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm">Carregando sua trilha...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar ao Portal</span>
          </button>
          <img src={logoAD} alt="AD" className="w-10 h-10 rounded-xl" />
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Gift Box Intro */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                {/* Mentor avatar - primeiro (topo) */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30">
                    <img 
                      src={mentorPhoto} 
                      alt="Duarte" 
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Mensagem de</p>
                    <p className="font-display font-bold text-foreground">Duarte</p>
                  </div>
                </div>

                {/* Texto - segundo (entre duarte e presente) */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl md:text-2xl text-foreground mb-2"
                >
                  Eu tenho um <span className="text-primary font-semibold">presente</span> para você!
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-8"
                >
                  Preparei algo especial pensando na sua carreira.
                </motion.p>

                {/* Caixa de presente - terceiro */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative mb-8"
                >
                  <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20">
                    <Gift className="w-20 h-20 text-primary" />
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-8 h-8 text-accent" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    size="lg"
                    onClick={handleOpenGift}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground px-8 py-6 text-lg rounded-2xl shadow-lg shadow-primary/30"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    Abrir Presente
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Explanation */}
            {step === 'explanation' && (
              <motion.div
                key="explanation"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4"
                >
                  Sua Trilha de Desenvolvimento
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-muted-foreground max-w-lg mb-12"
                >
                  Uma trilha personalizada pensada exclusivamente para sua área de atuação
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-2xl">
                  {[
                    {
                      icon: BookOpen,
                      title: "Cursos Gratuitos",
                      description: "Selecionados especialmente para você",
                      delay: 0.3
                    },
                    {
                      icon: Target,
                      title: "Foco na Área",
                      description: "Conteúdos alinhados com seu objetivo",
                      delay: 0.4
                    },
                    {
                      icon: Rocket,
                      title: "Acelere sua Carreira",
                      description: "Diferencial competitivo garantido",
                      delay: 0.5
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: item.delay }}
                      className="glass-card rounded-2xl p-6 text-center"
                    >
                      <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                        <item.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    size="lg"
                    onClick={handleContinue}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground px-8 py-6 text-lg rounded-2xl shadow-lg shadow-primary/30"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Ver Minha Trilha
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Reveal Learning Path */}
            {step === 'reveal' && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2"
                  >
                    🎁 Sua Trilha de Desenvolvimento
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-muted-foreground"
                  >
                    Cursos selecionados especialmente para você
                  </motion.p>
                </div>

                {loadingPath ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <Gift className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-6 text-muted-foreground animate-pulse">
                      Carregando seu presente...
                    </p>
                  </div>
                ) : formattedPath?.modules && formattedPath.modules.length > 0 ? (
                  <div className="space-y-6">
                    {formattedPath.modules.map((module, moduleIndex) => (
                      <motion.div
                        key={moduleIndex}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: moduleIndex * 0.1 }}
                        className="glass-card rounded-2xl p-6 md:p-8"
                      >
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-primary">
                              {moduleIndex + 1}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-display font-bold text-foreground">
                              {module.title}
                            </h3>
                            {module.focus && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {module.focus}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 pl-0 md:pl-16">
                          {module.courses.map((course, courseIndex) => {
                            const platform = getPlatformFromUrl(course.url);
                            return (
                              <motion.a
                                key={courseIndex}
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: moduleIndex * 0.1 + courseIndex * 0.05 }}
                                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all group"
                              >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                  <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-sm md:text-base text-foreground group-hover:text-primary transition-colors truncate">
                                    {course.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {platform.name}
                                  </span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                              </motion.a>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Não foi possível carregar a trilha. Tente novamente.
                    </p>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center pt-8"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleBack}
                    className="rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Portal
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default GiftPage;
