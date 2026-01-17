import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeMentorModalProps {
  open: boolean;
  onComplete: () => void;
}

const mentorMessages = [
  "E aí, tudo certo? 👋",
  "Você acabou de dar o primeiro passo pra transformar sua carreira.",
  "A partir de agora, eu vou te guiar por cada etapa...",
  "Preparado pra mudar de patamar? Bora! 🚀"
];

const WelcomeMentorModal = ({ open, onComplete }: WelcomeMentorModalProps) => {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisibleMessages(0);
      setShowButton(false);
      return;
    }

    const timers: NodeJS.Timeout[] = [];
    mentorMessages.forEach((_, index) => {
      const timer = setTimeout(() => setVisibleMessages(index + 1), (index + 1) * 1000);
      timers.push(timer);
    });

    const buttonTimer = setTimeout(() => setShowButton(true), (mentorMessages.length + 1) * 1000);
    timers.push(buttonTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <div className="py-4 space-y-4">
          <AnimatePresence>
            {mentorMessages.slice(0, visibleMessages).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-primary/10 text-sm"
              >
                {msg}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {showButton && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button onClick={onComplete} className="w-full">Bora começar!</Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeMentorModal;
