import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, BookOpen, Target, Rocket, ExternalLink, ArrowLeft, CheckCircle2, Circle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import logoAD from '@/assets/logo-ad.png';
import mentorPhoto from '@/assets/mentor-photo.png';

// ============ TYPES ============
interface Course {
  name: string;
  platform: string;
  url: string;
  completed?: boolean;
}

interface Module {
  id: number;
  title: string;
  focus: string;
  courses: Course[];
}

// ============ PLATFORM DETECTION ============
const getPlatformInfo = (url: string): { name: string; color: string } => {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('linkedin.com/learning')) {
    return { name: 'LinkedIn Learning', color: 'bg-[#0077B5]' };
  }
  if (lowerUrl.includes('coursera.org')) {
    return { name: 'Coursera', color: 'bg-[#0056D2]' };
  }
  if (lowerUrl.includes('udemy.com')) {
    return { name: 'Udemy', color: 'bg-[#A435F0]' };
  }
  if (lowerUrl.includes('alura.com')) {
    return { name: 'Alura', color: 'bg-[#0B6CFF]' };
  }
  if (lowerUrl.includes('dio.me')) {
    return { name: 'DIO', color: 'bg-[#1A1A2E]' };
  }
  if (lowerUrl.includes('sebrae.com')) {
    return { name: 'Sebrae', color: 'bg-[#004B87]' };
  }
  if (lowerUrl.includes('ev.org.br')) {
    return { name: 'Fundação Bradesco', color: 'bg-[#CC092F]' };
  }
  if (lowerUrl.includes('fgv.br') || lowerUrl.includes('educacao-executiva.fgv')) {
    return { name: 'FGV', color: 'bg-[#003366]' };
  }
  if (lowerUrl.includes('microsoft.com') || lowerUrl.includes('learn.microsoft')) {
    return { name: 'Microsoft Learn', color: 'bg-[#00A4EF]' };
  }
  if (lowerUrl.includes('fiap.com') || lowerUrl.includes('on.fiap')) {
    return { name: 'FIAP', color: 'bg-[#ED145B]' };
  }
  if (lowerUrl.includes('skillshop') || lowerUrl.includes('google.com')) {
    return { name: 'Google', color: 'bg-[#4285F4]' };
  }
  if (lowerUrl.includes('mundosenai') || lowerUrl.includes('senai.')) {
    return { name: 'SENAI', color: 'bg-[#E30613]' };
  }
  if (lowerUrl.includes('youtube.com')) {
    return { name: 'YouTube', color: 'bg-[#FF0000]' };
  }
  
  return { name: 'Curso Online', color: 'bg-primary' };
};

// ============ TEXT PARSER (No AI) ============
const parseRawLearningPath = (rawText: string): Module[] => {
  if (!rawText || rawText.trim() === '') return [];
  
  const modules: Module[] = [];
  
  // Split by module markers (🔹 MÓDULO or similar patterns)
  const moduleRegex = /🔹\s*MÓDULO\s*(\d+)\s*[–-]\s*(.+?)(?=\n|$)/gi;
  const focusRegex = /Foco:\s*(.+?)(?=\n|$)/gi;
  const courseRegex = /📚\s*(.+?)(?=\n|$)/gi;
  const platformRegex = /Plataforma:\s*(.+?)(?=\n|$)/gi;
  const urlRegex = /Buscar em:\s*(https?:\/\/[^\s<>"]+)/gi;
  
  // Split text into module sections
  const moduleSections = rawText.split(/(?=🔹\s*MÓDULO)/i).filter(s => s.trim());
  
  moduleSections.forEach((section, index) => {
    // Extract module title
    const titleMatch = section.match(/🔹\s*MÓDULO\s*\d+\s*[–-]\s*(.+?)(?=\n|$)/i);
    if (!titleMatch) return;
    
    const moduleTitle = titleMatch[1].trim();
    
    // Extract focus
    const focusMatch = section.match(/Foco:\s*(.+?)(?=\n|$)/i);
    const moduleFocus = focusMatch ? focusMatch[1].trim() : '';
    
    // Extract courses
    const courses: Course[] = [];
    const lines = section.split('\n');
    
    let currentCourse: Partial<Course> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for course name
      if (line.startsWith('📚')) {
        // Save previous course if exists
        if (currentCourse.name && currentCourse.url) {
          courses.push({
            name: currentCourse.name,
            platform: currentCourse.platform || 'Curso Online',
            url: currentCourse.url,
            completed: false
          });
        }
        currentCourse = { name: line.replace('📚', '').trim() };
      }
      
      // Check for platform
      if (line.toLowerCase().startsWith('plataforma:')) {
        currentCourse.platform = line.replace(/plataforma:/i, '').trim();
      }
      
      // Check for URL - extract from href or plain text
      const urlMatch = line.match(/https?:\/\/[^\s<>"]+/);
      if (urlMatch) {
        currentCourse.url = urlMatch[0];
      }
    }
    
    // Don't forget the last course
    if (currentCourse.name && currentCourse.url) {
      courses.push({
        name: currentCourse.name,
        platform: currentCourse.platform || 'Curso Online',
        url: currentCourse.url,
        completed: false
      });
    }
    
    if (courses.length > 0) {
      modules.push({
        id: index + 1,
        title: moduleTitle,
        focus: moduleFocus,
        courses
      });
    }
  });
  
  return modules;
};

// ============ MAIN COMPONENT ============
const GiftPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<'loading' | 'intro' | 'explanation' | 'reveal'>('loading');
  const [modules, setModules] = useState<Module[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [activeModule, setActiveModule] = useState<number>(0);

  // Load completed courses from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`learning_progress_${user.id}`);
      if (saved) {
        setCompletedCourses(new Set(JSON.parse(saved)));
      }
    }
  }, [user]);

  // Save progress to localStorage
  const toggleCourseCompletion = (courseKey: string) => {
    setCompletedCourses(prev => {
      const updated = new Set(prev);
      if (updated.has(courseKey)) {
        updated.delete(courseKey);
      } else {
        updated.add(courseKey);
      }
      if (user) {
        localStorage.setItem(`learning_progress_${user.id}`, JSON.stringify([...updated]));
      }
      return updated;
    });
  };

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
    const directFromSidebar = navState?.direct === true;
    const fromActivation = navState?.fromActivation === true;

    const { data: profile } = await supabase
      .from('profiles')
      .select('learning_path')
      .eq('user_id', user.id)
      .single();

    if (profile?.learning_path) {
      // Parse the raw text directly (no AI)
      const parsedModules = parseRawLearningPath(profile.learning_path);
      setModules(parsedModules);

      const seenKey = `gift_seen_${user.id}`;
      const seen = localStorage.getItem(seenKey);

      if (fromActivation) {
        setStep('intro');
        return;
      }

      if (directFromSidebar) {
        localStorage.setItem(seenKey, 'true');
        setStep('reveal');
        return;
      }

      if (seen) {
        setStep('reveal');
      } else {
        setStep('intro');
      }
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleOpenGift = () => {
    setStep('explanation');
  };

  const handleContinue = () => {
    setStep('reveal');
    if (user) {
      localStorage.setItem(`gift_seen_${user.id}`, 'true');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Calculate progress
  const totalCourses = modules.reduce((acc, m) => acc + m.courses.length, 0);
  const completedCount = completedCourses.size;
  const progressPercent = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

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
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30">
                    <img src={mentorPhoto} alt="Duarte" className="w-full h-full object-cover grayscale" />
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
                  animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
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
                    { icon: BookOpen, title: "Cursos Gratuitos", description: "Selecionados especialmente para você", delay: 0.3 },
                    { icon: Target, title: "Foco na Área", description: "Conteúdos alinhados com seu objetivo", delay: 0.4 },
                    { icon: Rocket, title: "Acelere sua Carreira", description: "Diferencial competitivo garantido", delay: 0.5 }
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
                      <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
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

            {/* Step 3: Reveal Learning Path - Roadmap Style */}
            {step === 'reveal' && (
              <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* Header with Progress */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-3 mb-4"
                  >
                    <GraduationCap className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                      Sua Trilha de Desenvolvimento
                    </h1>
                  </motion.div>
                  
                  {/* Progress Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-md mx-auto"
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-primary font-medium">{completedCount}/{totalCourses} cursos</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {progressPercent}% concluído
                    </p>
                  </motion.div>
                </div>

                {/* Roadmap Stepper */}
                {modules.length > 0 ? (
                  <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-border" />

                    <div className="space-y-6">
                      {modules.map((module, moduleIndex) => {
                        const moduleCourseKeys = module.courses.map((c, i) => `${module.id}-${i}`);
                        const moduleCompletedCount = moduleCourseKeys.filter(k => completedCourses.has(k)).length;
                        const isModuleComplete = moduleCompletedCount === module.courses.length;
                        const isExpanded = activeModule === moduleIndex;

                        return (
                          <motion.div
                            key={module.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: moduleIndex * 0.1 }}
                            className="relative pl-14 md:pl-20"
                          >
                            {/* Step Indicator */}
                            <button
                              onClick={() => setActiveModule(isExpanded ? -1 : moduleIndex)}
                              className={`absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                isModuleComplete
                                  ? 'bg-green-500/20 border-2 border-green-500'
                                  : isExpanded
                                  ? 'bg-primary/20 border-2 border-primary'
                                  : 'bg-secondary border-2 border-border hover:border-primary/50'
                              }`}
                            >
                              {isModuleComplete ? (
                                <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-green-500" />
                              ) : (
                                <span className="text-lg md:text-xl font-bold text-primary">{module.id}</span>
                              )}
                            </button>

                            {/* Module Card */}
                            <div
                              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                                isExpanded
                                  ? 'bg-secondary/50 border-primary/30 shadow-lg shadow-primary/10'
                                  : 'bg-secondary/30 border-border/50 hover:border-primary/20'
                              }`}
                            >
                              {/* Module Header */}
                              <button
                                onClick={() => setActiveModule(isExpanded ? -1 : moduleIndex)}
                                className="w-full p-4 md:p-6 text-left"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-lg md:text-xl font-display font-bold text-foreground">
                                        {module.title}
                                      </h3>
                                      <Badge variant={isModuleComplete ? "default" : "secondary"} className="text-xs">
                                        {moduleCompletedCount}/{module.courses.length}
                                      </Badge>
                                    </div>
                                    {module.focus && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {module.focus}
                                      </p>
                                    )}
                                  </div>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <svg
                                      className="w-5 h-5 text-muted-foreground"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </motion.div>
                                </div>
                              </button>

                              {/* Courses List */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3">
                                      {module.courses.map((course, courseIndex) => {
                                        const courseKey = `${module.id}-${courseIndex}`;
                                        const isCompleted = completedCourses.has(courseKey);
                                        const platform = getPlatformInfo(course.url);

                                        return (
                                          <motion.div
                                            key={courseIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: courseIndex * 0.05 }}
                                            className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                              isCompleted
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : 'bg-background/50 border-border/50 hover:border-primary/30'
                                            }`}
                                          >
                                            {/* Completion Toggle */}
                                            <button
                                              onClick={() => toggleCourseCompletion(courseKey)}
                                              className="flex-shrink-0"
                                            >
                                              {isCompleted ? (
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                              ) : (
                                                <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                                              )}
                                            </button>

                                            {/* Course Info */}
                                            <div className="flex-1 min-w-0">
                                              <p className={`text-sm md:text-base font-medium ${
                                                isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                                              }`}>
                                                {course.name}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-block w-2 h-2 rounded-full ${platform.color}`} />
                                                <span className="text-xs text-muted-foreground">{platform.name}</span>
                                              </div>
                                            </div>

                                            {/* External Link */}
                                            <a
                                              href={course.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex-shrink-0 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ExternalLink className="w-4 h-4 text-primary" />
                                            </a>
                                          </motion.div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Nenhuma trilha de desenvolvimento encontrada.
                    </p>
                  </div>
                )}

                {/* Back Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center pt-8"
                >
                  <Button variant="outline" size="lg" onClick={handleBack} className="rounded-xl">
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
