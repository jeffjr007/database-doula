import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/MentorAvatar";

interface Stage4IntroductionProps {
  onStart: () => void;
}

const messages = [
  "Chegou a hora de arrasar nas entrevistas!",
  "Vou te ensinar um segredo: recrutadores buscam palavras-chave específicas. E a gente vai mapear todas elas.",
  "Depois, a IA vai criar roteiros personalizados conectando essas palavras com SUAS experiências reais.",
  "A estrutura mágica é: O QUE fez + COMO fez + RESULTADO. Simples assim!",
];

const STAGE4_INTRO_KEY = 'stage4_intro_seen';

export const Stage4Introduction = ({ onStart }: Stage4IntroductionProps) => {
  const hasSeenIntro = sessionStorage.getItem(STAGE4_INTRO_KEY) === 'true';
  
  const [visibleMessages, setVisibleMessages] = useState(hasSeenIntro ? messages.length : 0);
  const [showButton, setShowButton] = useState(hasSeenIntro);

  useEffect(() => {
    if (hasSeenIntro) return;

    if (visibleMessages < messages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowButton(true);
      }, 800);
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
        <MentorAvatar size="xxl" />

        {/* Messages */}
        <div className="w-full space-y-4">
          {messages.slice(0, visibleMessages).map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-4 rounded-xl bg-secondary/50 border border-border"
            >
              <p className="text-sm md:text-base text-foreground leading-relaxed">
                {message}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        {showButton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button onClick={handleContinue} className="gap-2">
              Começar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
