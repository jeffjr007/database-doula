import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, Clock, ArrowRight } from 'lucide-react';
import { MentorAvatar } from '@/components/MentorAvatar';

interface Stage3WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasFunnel: boolean;
  onContinue: () => void;
}

const welcomeMessages = [
  {
    id: 1,
    text: "Parabéns! Etapa 2 concluída 🎉",
    delay: 0
  },
  {
    id: 2,
    text: "Agora vem a parte mais IMPORTANTE...",
    delay: 1800
  },
  {
    id: 3,
    text: "Na Etapa 3, você coloca tudo em prática com seu Funil de Oportunidades.",
    delay: 3600
  }
];

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export const Stage3WelcomeModal = ({ 
  open, 
  onOpenChange, 
  hasFunnel,
  onContinue 
}: Stage3WelcomeModalProps) => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showAction, setShowAction] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisibleMessages(0);
      setShowAction(false);
      setIsTyping(false);
      return;
    }

    const timers: NodeJS.Timeout[] = [];
    
    // Show typing indicator first
    setIsTyping(true);
    
    welcomeMessages.forEach((msg, idx) => {
      // Show message
      const showTimer = setTimeout(() => {
        setVisibleMessages(idx + 1);
        // Start typing for next message if not the last
        if (idx < welcomeMessages.length - 1) {
          setIsTyping(true);
        } else {
          setIsTyping(false);
        }
      }, msg.delay + 800); // Add 800ms for typing animation
      timers.push(showTimer);
    });

    // Show action after all messages
    const actionTypingTimer = setTimeout(() => {
      setIsTyping(true);
    }, 4400);
    timers.push(actionTypingTimer);

    const actionTimer = setTimeout(() => {
      setIsTyping(false);
      setShowAction(true);
    }, 5400);
    timers.push(actionTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [open]);

  const handleContinue = () => {
    onOpenChange(false);
    onContinue();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-accent/30 bg-gradient-to-b from-background to-secondary/20 p-0 overflow-hidden">
        {/* Header with mentor */}
        <div className="p-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <MentorAvatar size="lg" className="border-accent/50" />
            <div>
              <p className="font-semibold text-foreground">Duarte</p>
              <p className="text-xs text-muted-foreground">Seu mentor</p>
            </div>
          </div>
        </div>

        {/* Messages container */}
        <div className="p-6 pb-2 space-y-3">
          <AnimatePresence>
            {welcomeMessages.slice(0, visibleMessages).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-xl ${
                  msg.id === 2 
                    ? 'bg-gradient-to-r from-accent/20 to-primary/10 border border-accent/30' 
                    : 'bg-secondary/40 border border-border/30'
                }`}
              >
                <p className={`${msg.id === 2 ? 'font-semibold text-accent' : 'text-foreground/90'}`}>
                  {msg.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && !showAction && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action section */}
        <AnimatePresence>
          {showAction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 pt-2 space-y-4"
            >
              {!hasFunnel && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        Funil em preparação ⏳
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Disponível em até 48h.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hasFunnel && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        Seu Funil está pronto! 🚀
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleContinue}
                className="w-full gap-2"
              >
                <Target className="w-4 h-4" />
                {hasFunnel ? 'Ver meu Funil' : 'Entendi, vou aguardar'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
