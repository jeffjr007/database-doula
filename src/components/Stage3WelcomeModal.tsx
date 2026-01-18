import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, Clock, ArrowRight } from 'lucide-react';
import mentorPhoto from '@/assets/mentor-photo.png';

interface Stage3WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasFunnel: boolean;
  onContinue: () => void;
}

const welcomeMessages = [
  {
    id: 1,
    text: "Parabéns por concluir a Etapa 2! 🎉",
    delay: 0
  },
  {
    id: 2,
    text: "Agora vem a parte mais IMPORTANTE de toda a mentoria...",
    delay: 1200
  },
  {
    id: 3,
    text: "Na Etapa 3 você vai colocar tudo em prática usando o seu Funil de Oportunidades personalizado!",
    delay: 2400
  }
];

export const Stage3WelcomeModal = ({ 
  open, 
  onOpenChange, 
  hasFunnel,
  onContinue 
}: Stage3WelcomeModalProps) => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showAction, setShowAction] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisibleMessages(0);
      setShowAction(false);
      return;
    }

    // Animate messages one by one
    const timers: NodeJS.Timeout[] = [];
    
    welcomeMessages.forEach((msg, idx) => {
      const timer = setTimeout(() => {
        setVisibleMessages(idx + 1);
      }, msg.delay);
      timers.push(timer);
    });

    // Show action after all messages
    const actionTimer = setTimeout(() => {
      setShowAction(true);
    }, 3600);
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
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent/50 shadow-lg">
              <img src={mentorPhoto} alt="Mentor" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Duarte</p>
              <p className="text-xs text-muted-foreground">Seu mentor</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6 space-y-4 min-h-[200px]">
          <AnimatePresence>
            {welcomeMessages.slice(0, visibleMessages).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
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
          {visibleMessages < welcomeMessages.length && (
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
        </div>

        {/* Action section */}
        <AnimatePresence>
          {showAction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-6 pt-0 space-y-4"
            >
              {!hasFunnel ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        Seu Funil está sendo preparado! ⏳
                      </p>
                      <p className="text-sm text-muted-foreground">
                        O seu Funil de Oportunidades personalizado será disponibilizado em até 48h. Fique de olho!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        Seu Funil está pronto! 🚀
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Clique em continuar para acessá-lo.
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
                {hasFunnel ? 'Ver meu Funil de Oportunidades' : 'Entendi, vou aguardar'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
