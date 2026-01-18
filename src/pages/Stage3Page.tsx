import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Target, FileText, ChevronRight, ExternalLink, FileDown, Sparkles, ArrowRight, CheckCircle2, Linkedin, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoAd from '@/assets/logo-ad.png';
import mentorPhoto from '@/assets/mentor-photo.png';

interface Funnel {
  id: string;
  content: any;
  title: string;
  notes: string | null;
  status: string;
  attachments: string[];
  pdf_url: string | null;
}

// Stage 3 conversational messages - different style
const mentorMessages = [
  {
    id: 1,
    text: "Agora é hora de colocar o seu novo Perfil do LinkedIn e CV em ação no mercado 🙏🏻",
    type: 'intro'
  },
  {
    id: 2,
    text: "Você vai acessar todos os sites listados no seu Funil de Oportunidades.",
    type: 'normal'
  },
  {
    id: 3,
    text: "Nos que já tem cadastro, atualize com:",
    type: 'normal'
  },
  {
    id: 4,
    items: [
      "Novo link do LinkedIn",
      "CV atualizado",
      "Carta de Apresentação (copie e cole no campo \"sobre você\" se o site não tiver espaço específico)"
    ],
    type: 'checklist'
  },
  {
    id: 5,
    text: "Nos sites novos, crie seu perfil com essas mesmas informações.",
    type: 'normal'
  },
  {
    id: 6,
    title: "Importante:",
    items: [
      "Após 1 semana aplicando o Funil, Recomendo avançar para a etapa Revisão da Gupy (Bônus).",
      "Após 2 semanas, pode avançar para a etapa de Esteira de Conteúdos"
    ],
    type: 'tips'
  }
];

const STAGE_3_SEEN_KEY = 'stage3_animation_seen';

const Stage3Page = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if animation was already seen
  const hasSeenAnimation = useCallback(() => {
    if (!user?.id) return false;
    return localStorage.getItem(`${STAGE_3_SEEN_KEY}_${user.id}`) === 'true';
  }, [user?.id]);

  // Conversation state
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showFunnel, setShowFunnel] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchFunnel();
    }
  }, [user, authLoading, navigate]);

  const fetchFunnel = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunity_funnels')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      setFunnel(data);

      // If no funnel, this page shouldn't be accessible - redirect to portal
      // (Portal should prevent navigation here if no funnel)
      if (!data) {
        navigate('/');
        return;
      }

      // If already seen animation, skip to funnel view immediately
      if (hasSeenAnimation()) {
        setShowFunnel(true);
        setVisibleMessages(mentorMessages.length);
      }
    } catch (error) {
      console.error('Error fetching funnel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark animation as seen when funnel is shown
  useEffect(() => {
    if (showFunnel && user?.id) {
      localStorage.setItem(`${STAGE_3_SEEN_KEY}_${user.id}`, 'true');
    }
  }, [showFunnel, user?.id]);

  // Animate conversation messages (only if not seen before)
  useEffect(() => {
    if (!funnel || hasSeenAnimation()) return;

    if (visibleMessages < mentorMessages.length && !showFunnel) {
      const delay = visibleMessages === 0 ? 600 : 1200;

      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (visibleMessages >= mentorMessages.length && !showFunnel) {
      // Wait and show funnel
      const timer = setTimeout(() => {
        setShowFunnel(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages, showFunnel, funnel, hasSeenAnimation]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects - different gradient for stage 3 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-accent/10 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-semibold text-sm">Etapa 3</h1>
                <p className="text-xs text-muted-foreground">Funil de Oportunidades</p>
              </div>
            </div>
          </div>
          <img src={logoAd} alt="Logo" className="h-8" />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {!funnel ? (
          // No funnel - redirect back to portal (the warning is in the modal)
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center min-h-[50vh]"
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Redirecionando...</p>
            </div>
          </motion.div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Creative conversational layout - horizontal cards */}
            <AnimatePresence>
              {!showFunnel && (
                <motion.div
                  key="conversation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Mentor header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-6"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent/50 shadow-lg">
                      <img src={mentorPhoto} alt="Mentor" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Duarte</p>
                      <p className="text-xs text-muted-foreground">Seu mentor</p>
                    </div>
                  </motion.div>

                  {mentorMessages.slice(0, visibleMessages).map((msg: any, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      {msg.type === 'intro' && (
                        <Card className="p-5 bg-gradient-to-r from-accent/20 via-accent/10 to-transparent border-accent/30">
                          <p className="text-lg font-medium text-foreground">{msg.text}</p>
                        </Card>
                      )}

                      {msg.type === 'normal' && (
                        <Card className="p-4 bg-secondary/40 border-border/50">
                          <p className="text-sm text-foreground/90">{msg.text}</p>
                        </Card>
                      )}

                      {msg.type === 'checklist' && msg.items && (
                        <Card className="p-5 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
                          <div className="space-y-3">
                            {msg.items.map((item: string, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.15 }}
                                className="flex items-start gap-3"
                              >
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-sm text-foreground">{item}</p>
                              </motion.div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {msg.type === 'tips' && msg.items && (
                        <Card className="p-5 bg-amber-500/10 border-amber-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-foreground">{msg.title}</span>
                          </div>
                          <div className="space-y-2">
                            {msg.items.map((item: string, i: number) => (
                              <div key={i} className="flex items-start gap-2">
                                <RefreshCw className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-foreground/80">{item}</p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {visibleMessages < mentorMessages.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 pl-2"
                    >
                      <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Funnel content */}
            <AnimatePresence>
              {showFunnel && (
                <motion.div
                  key="funnel"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                      <Sparkles className="w-4 h-4" />
                      Seu Funil Personalizado
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {funnel.title}
                    </h2>
                  </motion.div>

                  {/* PDF Preview */}
                  {funnel.pdf_url && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="overflow-hidden border-border/50 bg-secondary/20">
                        <div className="aspect-[4/3] w-full bg-muted/20">
                          <iframe
                            src={`${funnel.pdf_url}#toolbar=0&navpanes=0`}
                            className="w-full h-full"
                            title="Funil de Oportunidades"
                          />
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {/* Download buttons */}
                  {funnel.pdf_url && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <Button
                        className="gap-2"
                        asChild
                      >
                        <a href={funnel.pdf_url} download target="_blank" rel="noopener noreferrer">
                          <FileDown className="w-4 h-4" />
                          Baixar PDF
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        asChild
                      >
                        <a href={funnel.pdf_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Abrir em nova aba
                        </a>
                      </Button>
                    </motion.div>
                  )}

                  {/* Notes */}
                  {funnel.notes && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="p-4 bg-amber-500/10 border-amber-500/30">
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {funnel.notes}
                        </p>
                      </Card>
                    </motion.div>
                  )}

                  {/* Action cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    <Card className="p-4 bg-gradient-to-br from-[#0077B5]/10 to-transparent border-[#0077B5]/30 hover:border-[#0077B5]/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Linkedin className="w-5 h-5 text-[#0077B5]" />
                        <span className="font-semibold text-sm">LinkedIn</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Atualize seu perfil com as melhorias do diagnóstico
                      </p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30 hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-sm">CV Atualizado</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use o CV gerado na Etapa 2 em todos os cadastros
                      </p>
                    </Card>
                  </motion.div>

                  {/* Next step CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card className="p-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <ArrowRight className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            Próximo passo
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Após aplicar em todas as vagas, siga para a Etapa 4 - Convencer o Recrutador.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4 gap-2"
                        onClick={() => navigate('/etapa/4')}
                      >
                        Ir para Etapa 4
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Stage3Page;
