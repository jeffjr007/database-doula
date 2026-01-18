import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { MentorAvatar } from "@/components/MentorAvatar";

interface WelcomeMentorModalProps {
  open: boolean;
  onComplete: () => void;
}

const mentorMessages = [
  "E aí, tudo certo? 👋",
  "Cara, você acabou de dar o primeiro passo pra transformar sua carreira.",
  "A partir de agora, eu vou te guiar por cada etapa desse processo...",
  "Só precisa confiar no método e fazer o que eu disser.",
  "Preparado pra mudar de patamar? Bora! 🚀"
];

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const WelcomeMentorModal = ({ open, onComplete }: WelcomeMentorModalProps) => {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [showButton, setShowButton] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisibleMessages(0);
      setShowButton(false);
      setIsExiting(false);
      setIsTyping(false);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Start with typing indicator
    setIsTyping(true);

    mentorMessages.forEach((_, index) => {
      // Show message and start typing for next
      const timer = setTimeout(() => {
        setVisibleMessages(index + 1);
        // Keep typing for next message, or stop if last
        if (index < mentorMessages.length - 1) {
          setIsTyping(true);
        } else {
          setIsTyping(false);
        }
      }, (index + 1) * 1200); // Slightly longer delay for typing effect
      timers.push(timer);
    });

    // Show typing before button
    const typingButtonTimer = setTimeout(() => {
      setIsTyping(true);
    }, mentorMessages.length * 1200 + 400);
    timers.push(typingButtonTimer);

    // Show button after all messages
    const buttonTimer = setTimeout(() => {
      setIsTyping(false);
      setShowButton(true);
    }, (mentorMessages.length + 1) * 1200);
    timers.push(buttonTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [open]);

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg p-0 border-0 bg-transparent shadow-none [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {!isExiting ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-2xl"
            >
              {/* Mentor Header */}
              <div className="flex items-center gap-4 mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <MentorAvatar size="xl" className="border-primary" />
                </motion.div>
                <div>
                  <motion.h3
                    className="font-semibold text-foreground text-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Duarte
                  </motion.h3>
                  <motion.p
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Seu mentor
                  </motion.p>
                </div>
              </div>

              {/* Messages container */}
              <div className="space-y-3 mb-6">
                <AnimatePresence>
                  {mentorMessages.slice(0, visibleMessages).map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]"
                    >
                      <p className="text-foreground text-sm leading-relaxed">
                        {message}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && !showButton && (
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

              {/* Button */}
              <AnimatePresence>
                {showButton && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      onClick={handleComplete}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl text-base"
                    >
                      Começar Jornada 🎯
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="exiting"
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-card border border-border rounded-2xl p-6 shadow-2xl"
            >
              {/* Same content for exit animation */}
              <div className="flex items-center gap-4 mb-6">
                <MentorAvatar size="xl" className="border-primary" />
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Duarte</h3>
                  <p className="text-sm text-muted-foreground">Seu mentor</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {mentorMessages.map((message, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]"
                  >
                    <p className="text-foreground text-sm leading-relaxed">{message}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-primary text-primary-foreground font-semibold py-6 rounded-xl text-base">
                Começar Jornada 🎯
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeMentorModal;
