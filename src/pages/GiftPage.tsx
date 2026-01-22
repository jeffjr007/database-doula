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

// Simple hash function for comparing content
const hashContent = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const GiftPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<'loading' | 'intro' | 'explanation' | 'reveal'>('loading');
  const [learningPath, setLearningPath] = useState<string | null>(null);
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

    // When the user comes from the Portal sidebar, we want a direct reveal (no gift animation).
    const directFromSidebar =
      (location.state as { direct?: boolean } | null)?.direct === true;

    const { data: profile } = await supabase
      .from('profiles')
      .select('learning_path')
      .eq('user_id', user.id)
      .single();

    if (profile?.learning_path) {
      setLearningPath(profile.learning_path);
      
      const seenKey = `gift_seen_${user.id}`;
      const seen = localStorage.getItem(seenKey);

      // If user came from sidebar, skip intro/explanation entirely.
      if (directFromSidebar) {
        localStorage.setItem(seenKey, 'true');
        setStep('reveal');
        loadFormattedPath(profile.learning_path);
        return;
      }

      // Normal flow: show animation only on the first time.
      if (seen) {
        setStep('reveal');
        loadFormattedPath(profile.learning_path);
      } else {
        setStep('intro');
      }
    } else {
      // No gift available, redirect back
      navigate('/');
    }
  };

  const loadFormattedPath = async (rawContent: string) => {
    if (!user) return;
    
    setLoadingPath(true);
    const currentHash = hashContent(rawContent);

    try {
      // First, check if we have a saved formatted path in the database
      const { data: savedPath } = await supabase
        .from('learning_paths')
        .select('formatted_data, raw_hash')
        .eq('user_id', user.id)
        .maybeSingle();

      // If we have a saved path and the hash matches, use it
      if (savedPath && savedPath.raw_hash === currentHash) {
        console.log('[GiftPage] Using cached formatted path from database');
        const formatted = savedPath.formatted_data as unknown as FormattedPath;
        if (formatted?.modules && formatted.modules.length > 0) {
          setFormattedPath(formatted);
          setLoadingPath(false);
          return;
        }
      }

      // Otherwise, format via AI and save
      console.log('[GiftPage] Formatting via AI and saving to database');
      await formatAndSaveLearningPath(rawContent, currentHash);
    } catch (error) {
      console.error('Error loading formatted path:', error);
      // Fallback to AI formatting
      await formatAndSaveLearningPath(rawContent, currentHash);
    }
  };

  const formatAndSaveLearningPath = async (content: string, contentHash: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('format-learning-path', {
        body: { rawContent: content }
      });

      if (error) throw error;

      if (data?.formattedPath) {
        const formatted = data.formattedPath as FormattedPath;
        setFormattedPath(formatted);

        // Save to database
        const { error: upsertError } = await supabase
          .from('learning_paths')
          .upsert({
            user_id: user.id,
            raw_hash: contentHash,
            formatted_data: formatted as any
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          console.error('Error saving formatted path:', upsertError);
        } else {
          console.log('[GiftPage] Formatted path saved to database');
        }
      }
    } catch (error) {
      console.error('Error formatting learning path:', error);
      // Fallback: try to parse manually
      const fallback = parseManually(content);
      setFormattedPath(fallback);
      
      // Still try to save the fallback
      try {
        await supabase
          .from('learning_paths')
          .upsert({
            user_id: user.id,
            raw_hash: contentHash,
            formatted_data: fallback as any
          }, {
            onConflict: 'user_id'
          });
      } catch (saveError) {
        console.error('Error saving fallback path:', saveError);
      }
    } finally {
      setLoadingPath(false);
    }
  };

  const parseManually = (content: string): FormattedPath => {
    const modules: Module[] = [];
    const moduleRegex = /🔹\s*MÓDULO\s*\d+\s*[–-]\s*([^\n]+)/gi;
    const sections = content.split(moduleRegex);
    
    for (let i = 1; i < sections.length; i += 2) {
      const title = sections[i]?.trim() || `Módulo ${Math.ceil(i/2)}`;
      const sectionContent = sections[i + 1] || '';
      
      const focusMatch = sectionContent.match(/Foco:\s*([^\n]+)/i);
      const focus = focusMatch?.[1]?.trim() || '';
      
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const nameRegex = /([^\n]+)\s*\n\s*https?:\/\/[^\s]+/g;
      
      const courses: Course[] = [];
      let match;
      
      while ((match = nameRegex.exec(sectionContent)) !== null) {
        const name = match[1].replace(/^[–-]\s*/, '').trim();
        const urlMatch = match[0].match(urlRegex);
        if (urlMatch && name) {
          courses.push({ name, url: urlMatch[0] });
        }
      }
      
      if (title) {
        modules.push({ title, focus, courses });
      }
    }
    
    return { modules };
  };

  const handleOpenGift = () => {
    setStep('explanation');
  };

  const handleContinue = () => {
    setStep('reveal');
    if (learningPath) {
      loadFormattedPath(learningPath);
      // Mark as seen
      if (user) {
        localStorage.setItem(`gift_seen_${user.id}`, 'true');
      }
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

                <div className="flex items-center gap-4 mb-6">
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
                          {module.courses.map((course, courseIndex) => (
                            <motion.a
                              key={courseIndex}
                              href={course.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: moduleIndex * 0.1 + courseIndex * 0.05 }}
                              className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                <BookOpen className="w-4 h-4 text-primary" />
                              </div>
                              <span className="flex-1 text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                                {course.name}
                              </span>
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </motion.a>
                          ))}
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
