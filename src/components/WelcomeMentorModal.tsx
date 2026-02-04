import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/MentorAvatar";
import { useIsMobile } from "@/hooks/use-mobile";

interface WelcomeMentorModalProps {
  open: boolean;
  onComplete: () => void;
}

const mentorMessages = [
  "E aí, tudo certo? 👋",
  "Você acabou de dar o primeiro passo pra transformar sua carreira.",
  "A partir de agora, eu vou te guiar por cada etapa desse processo...",
  "Agora começa a parte que separa quem tenta de quem realmente faz acontecer",
  "Preparado pra mudar de patamar?",
];

// Typing indicator component - CSS only
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
  </div>
);

// Message bubble - CSS animated
const MessageBubble = ({ message, delay }: { message: string; delay: number }) => (
  <div 
    className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] animate-mobile-slide-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <p className="text-foreground text-sm leading-relaxed">{message}</p>
  </div>
);

const WelcomeMentorModal = ({ open, onComplete }: WelcomeMentorModalProps) => {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [showButton, setShowButton] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isMobile = useIsMobile();

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
      const timer = setTimeout(
        () => {
          setVisibleMessages(index + 1);
          // Keep typing for next message, or stop if last
          if (index < mentorMessages.length - 1) {
            setIsTyping(true);
          } else {
            setIsTyping(false);
          }
        },
        (index + 1) * 1200,
      );
      timers.push(timer);
    });

    // Show typing before button
    const typingButtonTimer = setTimeout(
      () => {
        setIsTyping(true);
      },
      mentorMessages.length * 1200 + 400,
    );
    timers.push(typingButtonTimer);

    // Show button after all messages
    const buttonTimer = setTimeout(
      () => {
        setIsTyping(false);
        setShowButton(true);
      },
      (mentorMessages.length + 1) * 1200,
    );
    timers.push(buttonTimer);

    return () => timers.forEach((t) => clearTimeout(t));
  }, [open]);

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg p-0 border-0 bg-transparent shadow-none [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div
          className={`bg-card border border-border rounded-2xl p-6 shadow-2xl transition-all duration-300 ${
            isExiting ? 'opacity-0 translate-x-[100px]' : 'opacity-100 translate-x-0 animate-mobile-scale-in'
          }`}
        >
          {/* Mentor Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="animate-mobile-scale-in" style={{ animationDelay: '100ms' }}>
              <MentorAvatar size="xl" className="border-primary" />
            </div>
            <div>
              <h3 
                className="font-semibold text-foreground text-lg animate-mobile-slide-right"
                style={{ animationDelay: '150ms' }}
              >
                Duarte
              </h3>
              <p 
                className="text-sm text-muted-foreground animate-mobile-slide-right"
                style={{ animationDelay: '200ms' }}
              >
                Seu mentor
              </p>
            </div>
          </div>

          {/* Messages container */}
          <div className="space-y-3 mb-6 min-h-[200px]">
            {mentorMessages.slice(0, visibleMessages).map((message, index) => (
              <MessageBubble 
                key={index} 
                message={message} 
                delay={0}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && !showButton && (
              <div className="animate-mobile-fade-in">
                <TypingIndicator />
              </div>
            )}
          </div>

          {/* Button */}
          {showButton && (
            <div className="animate-mobile-slide-up">
              <Button
                onClick={handleComplete}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl text-base"
              >
                Começar Jornada
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeMentorModal;
