import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MentorAvatar } from "./MentorAvatar";
import { LucideIcon } from "lucide-react";

interface Message {
  text: string;
  highlight?: boolean;
}

interface StepConversationIntroProps {
  messages: Message[];
  buttonText: string;
  onContinue: () => void;
  icon?: LucideIcon;
}

export const StepConversationIntro = ({
  messages,
  buttonText,
  onContinue,
}: StepConversationIntroProps) => {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(true);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let messageIndex = 0;

    const showNextMessage = () => {
      if (messageIndex < messages.length) {
        setShowTyping(true);
        
        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages(prev => [...prev, messageIndex]);
          messageIndex++;
          
          if (messageIndex < messages.length) {
            setTimeout(showNextMessage, 400);
          } else {
            setTimeout(() => setShowButton(true), 300);
          }
        }, 800);
      }
    };

    const startTimer = setTimeout(showNextMessage, 300);
    return () => clearTimeout(startTimer);
  }, [messages.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-8 px-4"
    >
      {/* Mentor Avatar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <MentorAvatar size="md" />
      </motion.div>

      {/* Messages Container */}
      <div className="w-full max-w-lg space-y-3 min-h-[180px]">
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((index) => {
            const message = messages[index];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-2xl ${
                  message.highlight
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-secondary/50"
                }`}
              >
                <p className={`text-sm leading-relaxed ${
                  message.highlight ? "text-foreground font-medium" : "text-muted-foreground"
                }`}>
                  {message.text}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {showTyping && visibleMessages.length < messages.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 px-4 py-3"
            >
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue Button */}
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <Button
              onClick={onContinue}
              variant="ghost"
              className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
            >
              {buttonText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
