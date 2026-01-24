import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Linkedin, Sparkles, ArrowRight, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoAd from '@/assets/logo-ad.png';
import { MentorAvatar } from '@/components/MentorAvatar';
import { HelpCircle } from 'lucide-react';
import { StageCompleteButton } from '@/components/StageCompleteButton';

interface Diagnostic {
  id: string;
  pdf_url: string | null;
  word_url: string | null;
  title: string;
  notes: string | null;
  status: string;
}

// Mensagens conversacionais do mentor
const mentorMessages = [
  {
    id: 1,
    text: "Chegou a hora de começarmos oficialmente a Fase 1 da Mentoria Perfil Glorioso. ✅",
    delay: 0
  },
  {
    id: 2,
    text: "Acabei de preparar um diagnóstico completo e personalizado. Ele vai ser o seu guia daqui pra frente: mostra o que precisa ser feito, como executar cada ajuste e, mais importante, por que cada item é essencial para atrair oportunidades de forma ativa e estratégica.",
    delay: 2.5
  },
  {
    id: 3,
    text: "Você vai encontrar dois arquivos:",
    delay: 5.5
  },
  {
    id: 4,
    text: "→ Um PDF, para você visualizar a estrutura final com clareza.\n\n→ Um Word, editável, para facilitar suas anotações e preenchimentos.",
    delay: 7,
    highlight: true
  },
  {
    id: 5,
    text: "Essa etapa é fundamental para construirmos um perfil de alto impacto, e eu estou com você em cada detalhe.",
    delay: 10
  },
  {
    id: 6,
    text: "Assim que concluir, me avisa e marcamos uma reunião para revisar juntos e alinhar os próximos passos.",
    delay: 12.5
  },
  {
    id: 7,
    text: "Vamos com tudo. Esse é só o começo da sua virada de chave. 🚀",
    delay: 15,
    highlight: true
  }
];

const STAGE_1_SEEN_KEY = 'stage1_animation_seen';

const Stage1Page = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { downloadFile, loading: downloadLoading } = useSignedUrl();
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if animation was already seen
  const hasSeenAnimation = useCallback(() => {
    if (!user?.id) return false;
    return localStorage.getItem(`${STAGE_1_SEEN_KEY}_${user.id}`) === 'true';
  }, [user?.id]);

  // Conversation state
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [messagesExiting, setMessagesExiting] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchDiagnostic();
    }
  }, [user, authLoading, navigate]);

  const fetchDiagnostic = async () => {
    try {
      const { data, error } = await supabase
        .from('linkedin_diagnostics')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      setDiagnostic(data);

      // If already seen, skip to diagnostic view immediately
      if (data && hasSeenAnimation()) {
        setShowDiagnostic(true);
        setVisibleMessages(mentorMessages.length);
      }
    } catch (error) {
      console.error('Error fetching diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark animation as seen when diagnostic is shown
  useEffect(() => {
    if (showDiagnostic && user?.id) {
      localStorage.setItem(`${STAGE_1_SEEN_KEY}_${user.id}`, 'true');
    }
  }, [showDiagnostic, user?.id]);

  // Animate conversation messages (only if not seen before)
  useEffect(() => {
    if (!diagnostic || hasSeenAnimation()) return;

    if (visibleMessages < mentorMessages.length && !messagesExiting) {
      const nextMessage = mentorMessages[visibleMessages];
      const prevDelay = visibleMessages > 0 ? mentorMessages[visibleMessages - 1].delay : 0;
      const delay = visibleMessages === 0 ? 800 : (nextMessage.delay - prevDelay) * 1000;

      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (visibleMessages >= mentorMessages.length && !showDiagnostic && !messagesExiting) {
      // Wait 2s and then start exit animation
      const timer = setTimeout(() => {
        setMessagesExiting(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages, showDiagnostic, messagesExiting, diagnostic, hasSeenAnimation]);

  // After messages exit, show diagnostic
  useEffect(() => {
    if (messagesExiting && !showDiagnostic) {
      const timer = setTimeout(() => {
        setShowDiagnostic(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [messagesExiting, showDiagnostic]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0077B5]/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0077B5]/20 flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-[#0077B5]" />
              </div>
              <div>
                <h1 className="font-semibold text-sm">Etapa 1</h1>
                <p className="text-xs text-muted-foreground">Diagnóstico LinkedIn</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/suporte')}
            className="text-muted-foreground hover:text-primary"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {!diagnostic ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto"
          >
            <Card className="p-10 text-center bg-secondary/30 border-border/50">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Diagnóstico em preparação
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Seu diagnóstico do LinkedIn está sendo preparado pelo seu mentor.
                Você será notificado assim que estiver pronto!
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>
                Voltar ao Portal
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="max-w-xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Conversation phase */}
              {!showDiagnostic && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {mentorMessages.slice(0, visibleMessages).map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                          opacity: messagesExiting ? 0 : 1,
                          y: messagesExiting ? -20 : 0,
                          scale: 1
                        }}
                        transition={{
                          duration: messagesExiting ? 0.4 : 0.4,
                          ease: "easeOut",
                          delay: messagesExiting ? idx * 0.05 : 0
                        }}
                        className="flex gap-3"
                      >
                        {/* Mentor avatar */}
                        <div className="flex-shrink-0">
                          <MentorAvatar size="md" />
                        </div>

                        {/* Message bubble */}
                        <Card className={`p-4 flex-1 ${
                          msg.highlight
                            ? 'bg-gradient-to-r from-primary/20 to-[#0077B5]/20 border-primary/40'
                            : 'bg-secondary/50'
                        }`}>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.highlight ? 'font-medium' : ''}`}>
                            {msg.text}
                          </p>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {visibleMessages < mentorMessages.length && !messagesExiting && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3"
                    >
                      <MentorAvatar size="md" className="flex-shrink-0" />
                      <Card className="p-4 bg-secondary/50 inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </Card>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Diagnostic preview phase */}
              {showDiagnostic && (
                <motion.div
                  key="diagnostic"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* Title card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                  >
                    <h2 className="text-2xl font-bold text-foreground">
                      Aqui está seu novo perfil do LinkedIn
                    </h2>
                  </motion.div>

                  {/* Secure Download Buttons - No iframe preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="p-6 bg-secondary/20 border-border/50">
                      <div className="text-center mb-4">
                        <FileText className="w-12 h-12 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Seu diagnóstico está pronto para download
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Download buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Main downloads grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {diagnostic.pdf_url && (
                        <Button
                          className="gap-2"
                          onClick={() => downloadFile(diagnostic.pdf_url, `${diagnostic.title}.pdf`)}
                          disabled={downloadLoading}
                        >
                          <FileDown className="w-4 h-4" />
                          {downloadLoading ? 'Carregando...' : 'Baixar PDF'}
                        </Button>
                      )}
                      {diagnostic.word_url && (
                        <Button
                          variant="outline"
                          className="gap-2 border-accent/50 hover:bg-accent/10"
                          onClick={() => downloadFile(diagnostic.word_url, `${diagnostic.title}.docx`)}
                          disabled={downloadLoading}
                        >
                          <FileText className="w-4 h-4" />
                          {downloadLoading ? 'Carregando...' : 'Baixar Word (Editável)'}
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  {/* Notes section if exists */}
                  {diagnostic.notes && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="p-4 bg-amber-500/10 border-amber-500/30">
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {diagnostic.notes}
                        </p>
                      </Card>
                    </motion.div>
                  )}

                  {/* WhatsApp CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="p-6 bg-gradient-to-r from-[#25D366]/10 to-primary/10 border-[#25D366]/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            Finalizou o LinkedIn?
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Me avise pelo WhatsApp para eu validar e liberar a Etapa 2.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4 gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                        asChild
                      >
                        <a 
                          href="https://wa.me/551151944092?text=Ol%C3%A1%21%20Finalizei%20o%20meu%20LinkedIn%20conforme%20o%20diagn%C3%B3stico.%20Pode%20validar%20para%20liberar%20a%20Etapa%202%3F"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Avisar pelo WhatsApp
                        </a>
                      </Button>
                    </Card>
                  </motion.div>

                  {/* Complete Stage Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center pt-4"
                  >
                    <StageCompleteButton stageNumber={1} />
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

export default Stage1Page;
