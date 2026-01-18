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

    // Show action after all messages (slower)
    const actionTimer = setTimeout(() => {
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
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent/50 shadow-lg">
              <img src={mentorPhoto} alt="Mentor" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Duarte</p>
              <p className="text-xs text-muted-foreground">Seu mentor</p>
            </div>
          </div>
        </div>

        {/* Messages - fixed height container */}
        <div className="p-6 space-y-4 h-[200px]">
          {welcomeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-xl ${
                msg.id === 2 
                  ? 'bg-gradient-to-r from-accent/20 to-primary/10 border border-accent/30' 
                  : 'bg-secondary/40 border border-border/30'
              }`}
              style={{ visibility: msg.id <= visibleMessages ? 'visible' : 'hidden' }}
            >
              {msg.id <= visibleMessages ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`${msg.id === 2 ? 'font-semibold text-accent' : 'text-foreground/90'}`}
                >
                  {msg.text}
                </motion.p>
              ) : (
                <p className={`${msg.id === 2 ? 'font-semibold text-accent' : 'text-foreground/90'} opacity-0`}>
                  {msg.text}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Action section - fixed height */}
        <div className="p-6 pt-0 space-y-4 h-[140px]">
          {!hasFunnel && (
            <div 
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
              style={{ visibility: showAction ? 'visible' : 'hidden' }}
            >
              {showAction ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Funil em preparação ⏳
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Disponível em até 48h.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-start gap-3 opacity-0">
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
              )}
            </div>
          )}

          {hasFunnel && (
            <div 
              className="p-4 rounded-xl bg-primary/10 border border-primary/30"
              style={{ visibility: showAction ? 'visible' : 'hidden' }}
            >
              {showAction ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">
                      Seu Funil está pronto! 🚀
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-start gap-3 opacity-0">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">
                      Seu Funil está pronto! 🚀
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleContinue}
            className="w-full gap-2"
            style={{ visibility: showAction ? 'visible' : 'hidden' }}
          >
            {showAction ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                {hasFunnel ? 'Ver meu Funil' : 'Entendi, vou aguardar'}
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            ) : (
              <span className="flex items-center gap-2 opacity-0">
                <Target className="w-4 h-4" />
                {hasFunnel ? 'Ver meu Funil' : 'Entendi, vou aguardar'}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
