import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Sparkles, 
  MessageSquare, 
  Brain, 
  Mic, 
  Rocket, 
  ChevronRight,
  Lightbulb,
  CheckCircle,
  Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/MentorAvatar";

interface Stage4IntroductionProps {
  onStart: () => void;
}

const mentorMessages = [
  { text: "Chegou a hora de arrasar nas entrevistas! 🎯", icon: Target },
  { text: "Vou te ensinar um segredo: recrutadores buscam palavras-chave específicas. E a gente vai mapear todas elas.", icon: Brain },
  { text: "Depois, a IA vai criar roteiros personalizados conectando essas palavras com SUAS experiências reais.", icon: Sparkles },
  { text: "A estrutura mágica é: O QUE fez + COMO fez + RESULTADO. Simples assim!", icon: Lightbulb },
];

const features = [
  {
    icon: Target,
    title: "Análise de Palavras-Chave",
    description: "A IA identifica o que a vaga realmente busca",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    icon: Brain,
    title: "Conexão com Experiências",
    description: "Ligamos cada palavra-chave às suas vivências",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    icon: Mic,
    title: "Roteiros Prontos",
    description: "Respostas estruturadas para usar na entrevista",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
  },
];

const STAGE4_INTRO_KEY = 'stage4_intro_seen';

export const Stage4Introduction = ({ onStart }: Stage4IntroductionProps) => {
  const hasSeenIntroThisSession = sessionStorage.getItem(STAGE4_INTRO_KEY) === 'true';
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(hasSeenIntroThisSession ? mentorMessages.length : 0);
  const [showFeatures, setShowFeatures] = useState(hasSeenIntroThisSession);
  const [messagesComplete, setMessagesComplete] = useState(hasSeenIntroThisSession);

  useEffect(() => {
    if (hasSeenIntroThisSession) return;
    
    if (currentMessageIndex < mentorMessages.length) {
      const timer = setTimeout(() => {
        if (currentMessageIndex === mentorMessages.length - 1) {
          setMessagesComplete(true);
          sessionStorage.setItem(STAGE4_INTRO_KEY, 'true');
          setTimeout(() => setShowFeatures(true), 600);
        } else {
          setCurrentMessageIndex(prev => prev + 1);
        }
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, hasSeenIntroThisSession]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-8 px-4">
      <AnimatePresence mode="wait">
        {!showFeatures && (
          <motion.div
            key="mentor-intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 max-w-2xl mx-auto text-center"
          >
            {/* Mentor Photo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <MentorAvatar size="xxl" />
              <motion.div 
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Mic className="w-4 h-4 text-primary-foreground" />
              </motion.div>
            </motion.div>

            {/* Messages Container - Fixed height to prevent jumping */}
            <div className="min-h-[180px] flex flex-col justify-center space-y-3">
              <AnimatePresence mode="popLayout">
                {mentorMessages.slice(0, currentMessageIndex + 1).map((message, index) => {
                  const IconComponent = message.icon;
                  const isLatest = index === currentMessageIndex;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                        isLatest 
                          ? "bg-primary/10 border border-primary/20" 
                          : "bg-secondary/30"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isLatest ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <IconComponent className={`w-4 h-4 ${
                          isLatest ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      <p className={`text-left text-sm md:text-base leading-relaxed ${
                        isLatest ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {message.text}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Typing indicator */}
            {!messagesComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm text-muted-foreground">digitando</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {showFeatures && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto"
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Rocket className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Etapa 4</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
                Preparação para <span className="text-gradient">Entrevistas</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
                Vamos criar roteiros personalizados que conectam as palavras-chave da vaga com suas experiências reais.
              </p>
            </motion.div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card className={`p-5 bg-gradient-to-br ${feature.color} ${feature.borderColor} hover:scale-[1.02] transition-all h-full`}>
                      <div className="flex flex-col gap-3">
                        <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-base mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Process Steps */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <Card className="p-4 bg-secondary/30 border-border/50">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <span className="text-muted-foreground">Empresa & Vaga</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <span className="text-muted-foreground">Seu Perfil</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <span className="text-muted-foreground">IA Analisa</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="font-medium text-foreground">Roteiros Prontos!</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <Button
                onClick={onStart}
                size="lg"
                className="gap-2 px-8"
              >
                <Zap className="w-5 h-5" />
                Começar Preparação
                <ChevronRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Tempo estimado: 10-15 minutos
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
