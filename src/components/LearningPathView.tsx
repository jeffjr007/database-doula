import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ExternalLink, 
  BookOpen, 
  Target, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  X,
  Clock,
  Loader2,
  Globe
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LearningPathViewProps {
  open: boolean;
  onClose: () => void;
  learningPath: string;
}

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
        
        // Infer platform from URL
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

const LearningPathView = ({ open, onClose, learningPath }: LearningPathViewProps) => {
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [formattedPath, setFormattedPath] = useState<FormattedLearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && learningPath) {
      formatLearningPath();
    }
  }, [open, learningPath]);

  const formatLearningPath = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('format-learning-path', {
        body: { learningPath }
      });

      if (error) throw error;
      
      setFormattedPath(data);
    } catch (error) {
      console.error('Error formatting learning path with AI:', error);
      // Use fallback parser
      const fallback = fallbackParseLearningPath(learningPath);
      setFormattedPath(fallback);
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

  const moduleIconColors = [
    'text-primary',
    'text-accent',
    'text-emerald-500',
    'text-amber-500',
    'text-rose-500',
  ];

  const getPlatformIcon = (platform: string | null) => {
    return <Globe className="w-3 h-3" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 border-0 bg-transparent shadow-none [&>button]:hidden overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">
                  Sua Trilha de Desenvolvimento
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cursos selecionados exclusivamente para você
                </p>
              </div>
            </div>

            {/* Stats */}
            {formattedPath && !isLoading && (
              <div className="flex gap-3 mt-4 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">{formattedPath.modules.length} Módulos</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                  <Target className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-accent">
                    {formattedPath.totalCourses} Cursos
                  </span>
                </div>
                {formattedPath.estimatedHours && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      ~{formattedPath.estimatedHours}h estimadas
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[60vh]">
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Organizando sua trilha...</p>
                </div>
              ) : formattedPath?.modules.map((module, moduleIndex) => (
                <motion.div
                  key={moduleIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: moduleIndex * 0.1 }}
                  className={`rounded-xl border bg-gradient-to-br ${moduleColors[moduleIndex % moduleColors.length]} overflow-hidden`}
                >
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(moduleIndex)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center text-lg`}>
                        {module.emoji}
                      </div>
                      <div className="text-left">
                        <h3 className="font-display font-semibold text-foreground text-sm">
                          Módulo {moduleIndex + 1}
                        </h3>
                        <p className="text-xs text-muted-foreground">{module.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-card/50">
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
                    <div className="px-4 pb-2">
                      <p className="text-xs text-muted-foreground italic bg-card/30 rounded-lg p-2">
                        <strong>Foco:</strong> {module.focus}
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
                        <div className="p-4 pt-2 space-y-2">
                          {module.courses.map((course, courseIndex) => (
                            <motion.div
                              key={courseIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: courseIndex * 0.05 }}
                              className="group"
                            >
                              {course.url ? (
                                <a
                                  href={course.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30 hover:bg-card/80 hover:border-primary/30 transition-all group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                      {course.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {course.platform && (
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                          {getPlatformIcon(course.platform)}
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
                                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                </a>
                              ) : (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-border/20">
                                  <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
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
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/20">
            <Button onClick={onClose} className="w-full" variant="outline">
              Fechar e Continuar
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LearningPathView;
