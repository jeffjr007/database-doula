import { useState, useEffect } from "react";
import { ArrowRight, Target, Brain, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/MentorAvatar";

interface Stage4IntroductionProps {
  onStart: () => void;
}

const messages = [
  { 
    text: "Vamos te preparar para as perguntas mais comuns das entrevistas!", 
    icon: Target,
    highlight: false 
  },
  { 
    text: "Você vai aprender a responder com confiança: 'Me fale sobre você', 'Fale sobre suas experiências' e muito mais.", 
    icon: Brain,
    highlight: true 
  },
  { 
    text: "A IA vai criar roteiros personalizados para cada pergunta, usando SUAS histórias e conquistas reais.", 
    icon: Sparkles,
    highlight: true 
  },
  { 
    text: "No final, você terá scripts prontos para estudar e arrasar na entrevista!", 
    icon: Lightbulb,
    highlight: true 
  },
];

const STAGE4_INTRO_KEY = 'stage4_intro_seen';

export const Stage4Introduction = ({ onStart }: Stage4IntroductionProps) => {
  const hasSeenIntro = sessionStorage.getItem(STAGE4_INTRO_KEY) === 'true';
  
  const [visibleMessages, setVisibleMessages] = useState(hasSeenIntro ? messages.length : 0);
  const [isTyping, setIsTyping] = useState(!hasSeenIntro);
  const [showButton, setShowButton] = useState(hasSeenIntro);

  useEffect(() => {
    if (hasSeenIntro) return;

    if (visibleMessages < messages.length) {
      // Show typing indicator
      setIsTyping(true);
      
      const timer = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages(prev => prev + 1);
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      const timer = setTimeout(() => {
        setShowButton(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages, hasSeenIntro]);

  const handleContinue = () => {
    sessionStorage.setItem(STAGE4_INTRO_KEY, 'true');
    onStart();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-8">
        
        {/* Mentor Avatar */}
        <div className="opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
          <MentorAvatar size="xxl" />
        </div>

        {/* Messages */}
        <div className="w-full space-y-3">
          {messages.slice(0, visibleMessages).map((message, index) => {
            const Icon = message.icon;
            const isLast = index === visibleMessages - 1;
            
            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-xl border opacity-0 animate-slide-up ${
                  message.highlight && isLast
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/40 border-border/50"
                }`}
                style={{ animationDelay: `${100 + index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.highlight && isLast
                    ? "bg-primary/20"
                    : "bg-muted/50"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    message.highlight && isLast
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`} />
                </div>
                <p className={`text-sm md:text-base leading-relaxed ${
                  isLast ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {message.text}
                </p>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && visibleMessages < messages.length && (
            <div className="flex items-center gap-3 p-4 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              <span className="text-sm text-muted-foreground">digitando...</span>
            </div>
          )}
        </div>

        {/* Continue Button */}
        {showButton && (
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <Button onClick={handleContinue} size="lg" className="gap-2">
              Começar Preparação
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
