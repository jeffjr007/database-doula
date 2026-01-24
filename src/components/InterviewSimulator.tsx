import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Mic, 
  Square, 
  Loader2, 
  User, 
  MessageSquare,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface KeywordScript {
  keyword: string;
  experience: string;
  script: string;
}

interface InterviewSimulatorProps {
  aboutMeScript: string;
  experienceScripts: KeywordScript[];
  onComplete: () => void;
}

type SimulatorPhase = 
  | 'intro'
  | 'question1'
  | 'recording1'
  | 'transition'
  | 'question2'
  | 'recording2'
  | 'analyzing'
  | 'feedback';

export const InterviewSimulator = ({ 
  aboutMeScript, 
  experienceScripts, 
  onComplete 
}: InterviewSimulatorProps) => {
  const [phase, setPhase] = useState<SimulatorPhase>('intro');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript1, setTranscript1] = useState('');
  const [transcript2, setTranscript2] = useState('');
  const [feedback, setFeedback] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [showTyping, setShowTyping] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  const currentQuestionRef = useRef<1 | 2>(1);
  const { toast } = useToast();

  const {
    transcript,
    isListening,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: 'pt-BR',
    continuous: true,
    interimResults: true,
    onResult: (text) => {
      setLiveTranscript(text);
    },
  });

  const combinedExperienceScript = experienceScripts
    .map(s => `${s.keyword}: ${s.script}`)
    .join('\n\n');

  const showMessage = (message: string, delay: number = 1500): Promise<void> => {
    return new Promise((resolve) => {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        setCurrentMessage(message);
        resolve();
      }, delay);
    });
  };

  const startIntro = async () => {
    await showMessage("Olá! Meu nome é Ana e serei a recrutadora responsável por conversar com você hoje.", 2000);
    await new Promise(r => setTimeout(r, 1500));
    await showMessage("Vamos começar... Me fale sobre você.", 1800);
    setPhase('question1');
  };

  const startTransition = async () => {
    setPhase('transition');
    await showMessage("Muito bom! Gostei de conhecer um pouco mais sobre você.", 2000);
    await new Promise(r => setTimeout(r, 1500));
    await showMessage("Agora me fale sobre suas experiências profissionais.", 1800);
    setPhase('question2');
  };

  useEffect(() => {
    if (phase === 'intro') {
      startIntro();
    }
  }, []);

  // Show speech recognition errors
  useEffect(() => {
    if (speechError) {
      toast({
        title: "Erro no reconhecimento de voz",
        description: speechError,
        variant: "destructive",
      });
    }
  }, [speechError, toast]);

  const startRecording = async () => {
    if (!isSupported) {
      toast({
        title: "Navegador não suportado",
        description: "Seu navegador não suporta reconhecimento de voz. Tente usar o Chrome.",
        variant: "destructive",
      });
      return;
    }

    const questionNumber = phase === 'question1' || phase === 'recording1' ? 1 : 2;
    currentQuestionRef.current = questionNumber;

    resetTranscript();
    setLiveTranscript('');
    startListening();
    setIsRecording(true);
    
    if (phase === 'question1') {
      setPhase('recording1');
    } else if (phase === 'question2') {
      setPhase('recording2');
    }
  };

  const stopRecording = () => {
    stopListening();
    setIsRecording(false);

    // Save the transcript
    const finalText = transcript || liveTranscript;
    
    if (currentQuestionRef.current === 1) {
      setTranscript1(finalText);
      startTransition();
    } else {
      setTranscript2(finalText);
      analyzePerformance(transcript1, finalText);
    }
  };

  const analyzePerformance = async (t1: string, t2: string) => {
    setPhase('analyzing');
    setIsAnalyzing(true);
    setCurrentMessage("Analisando seu desempenho com base nas suas respostas...");
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-interview-performance', {
        body: {
          aboutMeScript,
          experienceScripts: combinedExperienceScript,
          spokenAboutMe: t1,
          spokenExperiences: t2,
          hasAudio1: !!t1,
          hasAudio2: !!t2,
        },
      });

      if (error) throw error;

      setFeedback(data.feedback || 'Parabéns por completar o simulador! Continue praticando seus roteiros.');
      setPhase('feedback');
    } catch (error) {
      console.error('Error analyzing performance:', error);
      setFeedback(
        "Parabéns por completar a simulação! Você praticou as duas perguntas mais importantes de uma entrevista.\n\n" +
        "**Dicas gerais:**\n" +
        "• Mantenha contato visual (mesmo com a câmera)\n" +
        "• Fale com calma e clareza\n" +
        "• Use exemplos concretos das suas experiências\n" +
        "• Pratique mais vezes até se sentir confiante"
      );
      setPhase('feedback');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isQuestionPhase = phase === 'question1' || phase === 'question2' || phase === 'recording1' || phase === 'recording2';
  const showAboutScript = phase === 'question1' || phase === 'recording1';
  const showExperienceScript = phase === 'question2' || phase === 'recording2';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MessageSquare className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Simulador de Entrevista</h2>
        <p className="text-muted-foreground text-sm">
          Pratique suas respostas com a recrutadora virtual
        </p>
      </motion.div>

      {/* Browser Support Warning */}
      {!isSupported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">Navegador não suportado</p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Para usar a transcrição de voz, utilize o Google Chrome ou Microsoft Edge.
            </p>
          </div>
        </motion.div>
      )}

      {/* Single Unified Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 md:p-8 space-y-6">
          
          {/* Recruiter Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">Ana</p>
                <p className="text-xs text-muted-foreground">Recrutadora Virtual</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {showTyping ? (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-muted/50 rounded-2xl rounded-tl-sm px-5 py-4 inline-block"
                >
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="message"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-muted/50 rounded-2xl rounded-tl-sm px-5 py-4 max-w-xl"
                >
                  <p className="text-foreground">{currentMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* User response confirmation */}
            <AnimatePresence>
              {transcript1 && (phase !== 'question1' && phase !== 'recording1' && phase !== 'intro') && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-end"
                >
                  <div className="bg-primary/10 border border-primary/20 text-primary rounded-2xl rounded-tr-sm px-4 py-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Sobre você ✓</span>
                  </div>
                </motion.div>
              )}
              {transcript2 && (phase === 'analyzing' || phase === 'feedback') && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-end"
                >
                  <div className="bg-primary/10 border border-primary/20 text-primary rounded-2xl rounded-tr-sm px-4 py-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Experiências ✓</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          {isQuestionPhase && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              className="border-t border-dashed border-border/60"
            />
          )}

          {/* Script Reference Section */}
          <AnimatePresence mode="wait">
            {isQuestionPhase && (
              <motion.div
                key={showAboutScript ? 'about' : 'experience'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Material de Apoio</span>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {showAboutScript ? 'Sobre Você' : 'Experiências'}
                  </span>
                </div>

                <div className="bg-secondary/30 border border-border/50 rounded-xl p-5">
                  {showAboutScript ? (
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {aboutMeScript}
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {experienceScripts.map((script, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={idx > 0 ? "pt-5 border-t border-border/40" : ""}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wide">
                              {script.keyword}
                            </span>
                            <span className="px-3 py-1 bg-accent/80 text-accent-foreground rounded-lg text-xs font-semibold">
                              {script.experience}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/85">
                            {script.script}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Transcription Display */}
                <AnimatePresence>
                  {isRecording && liveTranscript && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-primary">Transcrição ao vivo</span>
                      </div>
                      <p className="text-sm text-foreground/80 italic">
                        "{liveTranscript}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recording Controls */}
                <div className="pt-2">
                  {isRecording ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3 py-3">
                        <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                        <span className="text-destructive font-medium">Gravando sua resposta...</span>
                      </div>
                      <Button 
                        onClick={stopRecording} 
                        variant="destructive"
                        size="lg"
                        className="w-full gap-2"
                      >
                        <Square className="w-4 h-4" />
                        Parar e Enviar Resposta
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={startRecording} 
                      size="lg"
                      className="w-full gap-2"
                      disabled={showTyping || !isSupported}
                    >
                      <Mic className="w-4 h-4" />
                      Gravar Resposta
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Analyzing Phase */}
            {phase === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center space-y-4"
              >
                <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
                <div className="space-y-1">
                  <p className="text-muted-foreground">Analisando seu desempenho...</p>
                  <p className="text-xs text-muted-foreground/70">A IA está avaliando sua resposta falada</p>
                </div>
              </motion.div>
            )}

            {/* Feedback Phase */}
            {phase === 'feedback' && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="p-5 bg-gradient-to-br from-primary/15 via-primary/10 to-accent/10 rounded-xl border border-primary/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-primary">Análise de Desempenho</h3>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {feedback}
                  </div>
                </div>

                <Button onClick={onComplete} size="lg" className="w-full gap-2">
                  Finalizar Simulação
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};
