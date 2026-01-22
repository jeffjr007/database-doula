import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, Target, Clock, ExternalLink, 
  GraduationCap, ChevronDown, ChevronUp, Globe, Loader2,
  Home, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import logoAD from '@/assets/logo-ad.png';

interface Course {
  name: string;
  url: string | null;
  platform: string | null;
  duration: string | null;
}

interface Module {
  title: string;
  emoji: string;
  focus: string;
  courses: Course[];
}

interface FormattedLearningPath {
  modules: Module[];
  totalCourses: number;
  estimatedHours: number | null;
}

// Normalize text to prevent invisible characters / HTML fragments
const normalizeLearningPathText = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+\n/g, '\n')
    .trim();
};

// Simple hash function for comparing text changes
const computeHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
};

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

// Fallback parser for when AI is unavailable
const fallbackParseLearningPath = (text: string): FormattedLearningPath => {
  const modules: Module[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentModule: Module | null = null;
  
  for (const line of lines) {
    if (line.includes('MÓDULO') || line.match(/^[🔹🔸🔷🔶]/)) {
      if (currentModule && currentModule.courses.length > 0) {
        modules.push(currentModule);
      }
      
      const titleMatch = line.match(/MÓDULO\s*\d+\s*[–-]\s*(.+)/);
      const emoji = line.match(/^([🔹🔸🔷🔶])/)?.[1] || '🎯';
      
      currentModule = {
        title: titleMatch ? titleMatch[1].trim() : line.replace(/^[🔹🔸🔷🔶]\s*/, '').trim(),
        emoji,
        focus: '',
        courses: [],
      };
    } 
    else if (line.toLowerCase().startsWith('foco:')) {
      if (currentModule) {
        currentModule.focus = line.replace(/^foco:\s*/i, '').trim();
      }
    }
    else if (line.includes('http')) {
      if (currentModule) {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
        const url = urlMatch ? urlMatch[1] : null;
        const name = line.replace(url || '', '').replace(/[-–•]\s*/, '').trim();
        
        let platform: string | null = null;
        if (url) {
          if (url.includes('udemy')) platform = 'Udemy';
          else if (url.includes('coursera')) platform = 'Coursera';
          else if (url.includes('linkedin')) platform = 'LinkedIn Learning';
          else if (url.includes('alura')) platform = 'Alura';
          else if (url.includes('youtube')) platform = 'YouTube';
        }
        
        if (name) {
          currentModule.courses.push({ name, url, platform, duration: null });
        } else if (currentModule.courses.length > 0) {
          // URL on its own line - attach to previous course
          currentModule.courses[currentModule.courses.length - 1].url = url;
          currentModule.courses[currentModule.courses.length - 1].platform = platform;
        }
      }
    }
    else if (currentModule && line.trim() && !line.startsWith('Foco:')) {
      const name = line.replace(/^[-–•➤]\s*/, '').trim();
      
      if (name && !name.toLowerCase().includes('módulo') && name.length > 3) {
        currentModule.courses.push({ name, url: null, platform: null, duration: null });
      }
    }
  }
  
  if (currentModule && currentModule.courses.length > 0) {
    modules.push(currentModule);
  }
  
  return {
    modules,
    totalCourses: modules.reduce((acc, m) => acc + m.courses.length, 0),
    estimatedHours: null
  };
};

// Filter out empty/invalid courses and modules
const sanitizeFormattedPath = (path: FormattedLearningPath): FormattedLearningPath => {
  const validModules = path.modules
    .map(module => ({
      ...module,
      courses: module.courses.filter(c => c.name && c.name.trim().length > 0)
    }))
    .filter(module => module.courses.length > 0);

  return {
    modules: validModules,
    totalCourses: validModules.reduce((acc, m) => acc + m.courses.length, 0),
    estimatedHours: path.estimatedHours
  };
};

const MinhaTrilhaPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [learningPath, setLearningPath] = useState<string | null>(null);
  const [formattedPath, setFormattedPath] = useState<FormattedLearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);

  const cleanedLearningPath = useMemo(() => {
    if (!learningPath) return null;
    return normalizeLearningPathText(learningPath);
  }, [learningPath]);

  // Clear old localStorage cache on mount
  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('formatted_learning_path_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Main data fetching effect
  useEffect(() => {
    const fetchAndProcessLearningPath = async () => {
      if (!user?.id) return;

      setIsLoading(true);

      try {
        // 1. Fetch raw learning path from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('learning_path')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile?.learning_path) {
          setLearningPath(null);
          setFormattedPath(null);
          setIsLoading(false);
          return;
        }

        const rawText = profile.learning_path;
        setLearningPath(rawText);

        const normalizedText = normalizeLearningPathText(rawText);
        const currentHash = computeHash(normalizedText);

        // 2. Check if we already have a saved formatted path with matching hash
        const { data: savedPath } = await supabase
          .from('learning_paths')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (savedPath && savedPath.raw_hash === currentHash) {
          // Hash matches - use saved data
          const savedData = savedPath.formatted_data as unknown as FormattedLearningPath;
          const sanitized = sanitizeFormattedPath(savedData);
          if (sanitized.modules.length > 0) {
            setFormattedPath(sanitized);
            setIsLoading(false);
            return;
          }
        }

        // 3. Need to format (first time or mentor changed the path)
        console.log('Formatting learning path with AI...');
        
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('format-learning-path', {
          body: { learningPath: normalizedText }
        });

        let finalPath: FormattedLearningPath;

        if (aiError || !aiResult?.modules) {
          console.error('AI formatting failed, using fallback:', aiError);
          finalPath = fallbackParseLearningPath(normalizedText);
        } else {
          finalPath = sanitizeFormattedPath(aiResult);
        }

        // If AI result is empty, try fallback
        if (finalPath.modules.length === 0) {
          finalPath = fallbackParseLearningPath(normalizedText);
        }

        setFormattedPath(finalPath);

        // 4. Save to database (upsert)
        if (finalPath.modules.length > 0) {
          const dataToSave = JSON.parse(JSON.stringify(finalPath));
          
          if (savedPath) {
            await supabase
              .from('learning_paths')
              .update({
                raw_hash: currentHash,
                formatted_data: dataToSave
              })
              .eq('user_id', user.id);
          } else {
            await supabase
              .from('learning_paths')
              .insert([{
                user_id: user.id,
                raw_hash: currentHash,
                formatted_data: dataToSave
              }]);
          }
        }

      } catch (error) {
        console.error('Error processing learning path:', error);
        // Try fallback with raw text
        if (learningPath) {
          const fallback = fallbackParseLearningPath(normalizeLearningPathText(learningPath));
          setFormattedPath(fallback);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchAndProcessLearningPath();
    }
  }, [user?.id]);

  const toggleModule = (index: number) => {
    setExpandedModules(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const moduleColors = [
    'from-primary/20 to-primary/5 border-primary/30',
    'from-accent/20 to-accent/5 border-accent/30',
    'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    'from-rose-500/20 to-rose-500/5 border-rose-500/30',
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  // No learning path available
  if (!isLoading && !learningPath) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">
            Nenhuma trilha disponível
          </h1>
          <p className="text-muted-foreground mb-6">
            Sua trilha de desenvolvimento ainda não foi configurada. Entre em contato com seu mentor.
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Voltar ao Portal
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logoAD} alt="Logo" className="w-10 h-10 rounded-xl" />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Seu presente</p>
            <p className="text-sm font-semibold text-foreground">Trilha de Desenvolvimento</p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                Carregando seu presente...
              </h2>
              <p className="text-sm text-muted-foreground">
                Organizando sua trilha personalizada
              </p>
            </div>
          </motion.div>
        ) : formattedPath && formattedPath.modules && formattedPath.modules.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Hero Section */}
            <motion.div 
              variants={fadeInUp}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Presente Exclusivo</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                Sua Trilha de Desenvolvimento
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Cursos selecionados exclusivamente para acelerar sua jornada profissional
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="flex justify-center gap-4 flex-wrap mb-8"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{formattedPath.modules.length} Módulos</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                <Target className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-foreground">{formattedPath.totalCourses} Cursos</span>
              </div>
              {formattedPath.estimatedHours && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">~{formattedPath.estimatedHours}h</span>
                </div>
              )}
            </motion.div>

            {/* Modules */}
            <div className="space-y-4">
              {formattedPath.modules.map((module, moduleIndex) => (
                <motion.div
                  key={moduleIndex}
                  variants={staggerItem}
                  className={`rounded-2xl border bg-gradient-to-br ${moduleColors[moduleIndex % moduleColors.length]} overflow-hidden`}
                >
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(moduleIndex)}
                    className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center text-xl">
                        {module.emoji}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Módulo {moduleIndex + 1}
                        </p>
                        <h3 className="font-display font-semibold text-foreground text-lg">
                          {module.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-card/50 border border-border/30">
                        {module.courses.length} {module.courses.length === 1 ? 'curso' : 'cursos'}
                      </span>
                      {expandedModules.includes(moduleIndex) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Focus description */}
                  {module.focus && expandedModules.includes(moduleIndex) && (
                    <div className="px-5 pb-2">
                      <p className="text-sm text-muted-foreground bg-card/30 rounded-lg p-3">
                        <strong className="text-foreground">Foco:</strong> {module.focus}
                      </p>
                    </div>
                  )}

                  {/* Courses */}
                  <AnimatePresence>
                    {expandedModules.includes(moduleIndex) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-2 space-y-3">
                          {module.courses.map((course, courseIndex) => (
                            <motion.div
                              key={courseIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: courseIndex * 0.05 }}
                            >
                              {course.url ? (
                                <a
                                  href={course.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 hover:border-primary/30 transition-all group"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                      {course.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {course.platform && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Globe className="w-3 h-3" />
                                          {course.platform}
                                        </span>
                                      )}
                                      {course.duration && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {course.duration}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                </a>
                              ) : (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-border/20">
                                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground line-clamp-2">
                                      {course.name}
                                    </p>
                                    {course.duration && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {course.duration}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Footer CTA */}
            <motion.div 
              variants={fadeInUp}
              className="text-center pt-8"
            >
              <p className="text-sm text-muted-foreground mb-4">
                Explore sua trilha no seu ritmo 💜
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao Portal
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          // Fallback: show raw text if formatting failed completely
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Presente Exclusivo</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                Sua Trilha de Desenvolvimento
              </h1>
            </div>
            
            <div className="rounded-2xl border border-border bg-card p-6">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                {cleanedLearningPath || learningPath || 'Sua trilha ainda está sendo preparada.'}
              </pre>
            </div>
            
            <div className="text-center pt-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao Portal
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MinhaTrilhaPage;
