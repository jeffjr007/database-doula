import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mic, 
  Square, 
  Loader2, 
  User, 
  MessageSquare,
  Play,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MentorAvatar } from "./MentorAvatar";

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
  const [audioBlob1, setAudioBlob1] = useState<Blob | null>(null);
  const [audioBlob2, setAudioBlob2] = useState<Blob | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recruiterMessages, setRecruiterMessages] = useState<string[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Combine experience scripts into one coherent text
  const combinedExperienceScript = experienceScripts
    .map(s => `${s.keyword}: ${s.script}`)
    .join('\n\n');

  const addRecruiterMessage = (message: string, delay: number = 0) => {
    return new Promise<void>((resolve) => {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        setRecruiterMessages(prev => [...prev, message]);
        resolve();
      }, delay);
    });
  };

  const startIntro = async () => {
    setRecruiterMessages([]);
    await addRecruiterMessage("Olá, seja bem-vindo à nossa entrevista.", 1500);
    await addRecruiterMessage("Meu nome é Ana e serei a recrutadora responsável por conversar com você hoje.", 2000);
    await addRecruiterMessage("Vamos começar com uma pergunta clássica...", 1500);
    setPhase('question1');
    await addRecruiterMessage("Me fale sobre você.", 1500);
  };

  const startTransition = async () => {
    await addRecruiterMessage("Muito bom! Gostei de conhecer um pouco mais sobre você.", 2000);
    await addRecruiterMessage("Agora, vamos para a próxima pergunta...", 1500);
    setPhase('question2');
    await addRecruiterMessage("Me fale sobre suas experiências profissionais.", 1800);
  };

  useEffect(() => {
    if (phase === 'intro') {
      startIntro();
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (phase === 'recording1') {
          setAudioBlob1(audioBlob);
          startTransition();
        } else if (phase === 'recording2') {
          setAudioBlob2(audioBlob);
          analyzePerformance();
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      if (phase === 'question1') {
        setPhase('recording1');
      } else if (phase === 'question2') {
        setPhase('recording2');
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Erro ao acessar microfone",
        description: "Verifique se você permitiu o acesso ao microfone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzePerformance = async () => {
    setPhase('analyzing');
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-interview-performance', {
        body: {
          aboutMeScript,
          experienceScripts: combinedExperienceScript,
          hasAudio1: !!audioBlob1,
          hasAudio2: !!audioBlob2,
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

  const getCurrentScript = () => {
    if (phase === 'question1' || phase === 'recording1') {
      return aboutMeScript;
    }
    return combinedExperienceScript;
  };

  const getCurrentScriptTitle = () => {
    if (phase === 'question1' || phase === 'recording1') {
      return '"Me fale sobre você"';
    }
    return '"Me fale sobre suas experiências"';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Simulador de Entrevista</h2>
        <p className="text-muted-foreground">
          Pratique suas respostas com nosso recrutador virtual
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        {/* Left: Chat with recruiter */}
        <Card className="p-4 flex flex-col h-[500px]">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Ana</p>
              <p className="text-xs text-muted-foreground">Recrutadora</p>
            </div>
          </div>

          <ScrollArea className="flex-1 py-4">
            <div className="space-y-4">
              <AnimatePresence>
                {recruiterMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3"
                  >
                    <MentorAvatar className="w-8 h-8 flex-shrink-0" />
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm">{message}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {showTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <MentorAvatar className="w-8 h-8 flex-shrink-0" />
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* User responses */}
              {audioBlob1 && (phase === 'transition' || phase === 'question2' || phase === 'recording2' || phase === 'analyzing' || phase === 'feedback') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-end"
                >
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Resposta gravada</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {audioBlob2 && (phase === 'analyzing' || phase === 'feedback') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-end"
                >
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Resposta gravada</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Recording controls */}
          {(phase === 'question1' || phase === 'question2' || phase === 'recording1' || phase === 'recording2') && (
            <div className="pt-4 border-t border-border">
              {!isRecording ? (
                <Button 
                  onClick={startRecording} 
                  className="w-full gap-2"
                  disabled={showTyping}
                >
                  <Mic className="w-4 h-4" />
                  Iniciar Gravação
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording} 
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <Square className="w-4 h-4" />
                  Parar Gravação
                </Button>
              )}
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analisando seu desempenho...</span>
              </div>
            </div>
          )}
        </Card>

        {/* Right: Script reference */}
        <Card className="p-4 flex flex-col h-[500px]">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Seu Roteiro</p>
              <p className="text-xs text-muted-foreground">
                {phase === 'feedback' ? 'Feedback da IA' : getCurrentScriptTitle()}
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 py-4">
            {phase === 'feedback' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                  <h3 className="font-medium text-primary mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Análise de Desempenho
                  </h3>
                  <div className="text-sm whitespace-pre-wrap text-foreground/80">
                    {feedback}
                  </div>
                </div>

                <Button onClick={onComplete} className="w-full gap-2">
                  Finalizar Simulação
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : phase === 'intro' ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Aguarde o recrutador iniciar...
              </div>
            ) : (
              <motion.div
                key={phase}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Use como referência:
                  </p>
                  <div className="text-sm whitespace-pre-wrap">
                    {getCurrentScript()}
                  </div>
                </div>

                {isRecording && (
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Gravando...</span>
                  </div>
                )}
              </motion.div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};
