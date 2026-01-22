import { useState, useEffect, useMemo, useRef } from 'react';
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

const normalizeLearningPathText = (input: string) => {
  // Some legacy content may contain HTML-ish fragments (e.g. target="_blank" ... class="...")
  // Normalize to plain text so formatting + caching is stable and rendering never becomes “invisible”.
  return input
    .replace(/<[^>]*>/g, ' ') // strip tags
    .replace(/\s+/g, ' ')
    .replace(/\s+\n/g, '\n')
    .trim();
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
      if (currentModule) {
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
        const name = line.replace(url || '', '').trim();
        
        let platform: string | null = null;
        if (url) {
          if (url.includes('udemy')) platform = 'Udemy';
          else if (url.includes('coursera')) platform = 'Coursera';
          else if (url.includes('linkedin')) platform = 'LinkedIn Learning';
          else if (url.includes('alura')) platform = 'Alura';
          else if (url.includes('youtube')) platform = 'YouTube';
        }
        
        if (!name && currentModule.courses.length > 0) {
          currentModule.courses[currentModule.courses.length - 1].url = url;
          currentModule.courses[currentModule.courses.length - 1].platform = platform;
        } else {
          currentModule.courses.push({ name, url, platform, duration: null });
        }
      }
    }
    else if (currentModule && line.trim() && !line.startsWith('Foco:')) {
      const name = line.replace(/➤.*/, '').trim();
      
      if (name && !name.toLowerCase().includes('módulo')) {
        currentModule.courses.push({ name, url: null, platform: null, duration: null });
      }
    }
  }
  
  if (currentModule) {
    modules.push(currentModule);
  }
  
  return {
    modules,
    totalCourses: modules.reduce((acc, m) => acc + m.courses.length, 0),
    estimatedHours: null
  };
};

const MinhaTrilhaPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [learningPath, setLearningPath] = useState<string | null>(null);
  const [formattedPath, setFormattedPath] = useState<FormattedLearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const hasFormattedRef = useRef(false);

  const cleanedLearningPath = useMemo(() => {
    if (!learningPath) return null;
    return normalizeLearningPathText(learningPath);
  }, [learningPath]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchLearningPath = async () => {
      if (!user?.id) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('learning_path')
        .eq('user_id', user.id)
        .single();

      if (profile?.learning_path) {
        setLearningPath(profile.learning_path);
      } else {
        setIsLoading(false);
      }
    };

    fetchLearningPath();
  }, [user?.id]);

  useEffect(() => {
    if (learningPath && !hasFormattedRef.current) {
      loadOrFormatLearningPath();
    }
  }, [learningPath]);

  const getCacheKey = () => {
    if (!user?.id || !cleanedLearningPath) return null;
    const hash = cleanedLearningPath.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `formatted_learning_path_${user.id}_${hash}`;
  };

  const loadOrFormatLearningPath = async () => {
    const cacheKey = getCacheKey();
    
    if (cacheKey) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as FormattedLearningPath;
          if (parsed.modules && parsed.modules.length > 0) {
            setFormattedPath(parsed);
            setIsLoading(false);
            hasFormattedRef.current = true;
            return;
          }
        }
      } catch (e) {
        console.error('Error reading cached learning path:', e);
      }
    }

    await formatLearningPath(cacheKey);
  };

  const formatLearningPath = async (cacheKey: string | null) => {
    setIsLoading(true);
    try {
      if (!cleanedLearningPath) {
        setFormattedPath(null);
        return;
      }
      const { data, error } = await supabase.functions.invoke('format-learning-path', {
        body: { learningPath: cleanedLearningPath }
      });

      if (error) throw error;
      
      setFormattedPath(data);
      hasFormattedRef.current = true;

      if (cacheKey && data) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.error('Error caching learning path:', e);
        }
      }
    } catch (error) {
      console.error('Error formatting learning path with AI:', error);
      const fallback = fallbackParseLearningPath(cleanedLearningPath || learningPath || '');
      setFormattedPath(fallback);
      hasFormattedRef.current = true;

      if (cacheKey && fallback) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(fallback));
        } catch (e) {
          console.error('Error caching fallback learning path:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                <span className="text-sm font-medium">{formattedPath.modules.length} Módulos</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                <Target className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">{formattedPath.totalCourses} Cursos</span>
              </div>
              {formattedPath.estimatedHours && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">~{formattedPath.estimatedHours}h</span>
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
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                          <Globe className="w-3 h-3" />
                                          {course.platform}
                                        </span>
                                      )}
                                      {course.duration && (
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                          <Clock className="w-3 h-3" />
                                          {course.duration}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                </a>
                              ) : (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-border/20">
                                  <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-muted-foreground line-clamp-2">
                                      {course.name}
                                    </p>
                                    {course.duration && (
                                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
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

            {/* Footer */}
            <motion.div 
              variants={fadeInUp}
              className="pt-8 pb-4"
            >
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao Portal
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          // Fallback: show raw learning path when formatting fails
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
            
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full gap-2"
            >
              <Home className="w-4 h-4" />
              Voltar ao Portal
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MinhaTrilhaPage;
