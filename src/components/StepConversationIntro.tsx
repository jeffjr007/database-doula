import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { MentorAvatar } from "./MentorAvatar";
import type { LucideIcon } from "lucide-react";

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
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  const timerRef = useRef<number | null>(null);
  const visibleCountRef = useRef(0);
  const phaseRef = useRef<"idle" | "typing" | "show">("idle");

  useEffect(() => {
    // Reset when messages change
    visibleCountRef.current = 0;
    setVisibleCount(0);
    setShowTyping(false);
    setShowButton(false);
    setButtonVisible(false);
    phaseRef.current = "idle";

    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const step = () => {
      clearTimer();

      if (visibleCountRef.current >= messages.length) {
        setShowTyping(false);
        // Wait 1 second before showing button
        timerRef.current = window.setTimeout(() => {
          setShowButton(true);
          // Small delay for animation trigger
          window.setTimeout(() => setButtonVisible(true), 50);
        }, 1000);
        phaseRef.current = "idle";
        return;
      }

      if (phaseRef.current === "idle") {
        phaseRef.current = "typing";
        setShowTyping(true);
        // Slower typing indicator (1.2s)
        timerRef.current = window.setTimeout(() => step(), 1200);
        return;
      }

      // typing -> show message
      phaseRef.current = "show";
      setShowTyping(false);
      visibleCountRef.current = visibleCountRef.current + 1;
      setVisibleCount(visibleCountRef.current);
      // Longer pause between messages (800ms)
      timerRef.current = window.setTimeout(() => {
        phaseRef.current = "idle";
        step();
      }, 800);
    };

    // small delay before starting
    timerRef.current = window.setTimeout(() => step(), 250);

    return () => {
      clearTimer();
    };
    // Intentionally depend on the texts, not only length.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(messages)]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
      {/* Mentor Avatar */}
      <div className="mb-6">
        <MentorAvatar size="md" />
      </div>

      {/* Messages Container */}
      <div className="w-full max-w-2xl space-y-4 min-h-[240px]">
        {messages.slice(0, visibleCount).map((message, idx) => (
          <div
            key={`${idx}-${message.text.slice(0, 16)}`}
            className={`px-6 py-5 rounded-2xl opacity-0 animate-slide-up ${
              message.highlight
                ? "bg-primary/10 border border-primary/20"
                : "bg-secondary/50"
            }`}
            style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'forwards' }}
          >
            <p
              className={`text-base leading-relaxed ${
                message.highlight
                  ? "text-foreground font-medium"
                  : "text-foreground/80"
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}

        {/* Typing Indicator */}
        {showTyping && visibleCount < messages.length && (
          <div className="flex items-center gap-1 px-4 py-3 animate-fade-in">
            <span
              className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
      </div>

      {/* Continue Button with slide-up animation */}
      {showButton && (
        <div 
          className={`mt-8 transition-all duration-300 ease-out opacity-0 animate-slide-up ${
            buttonVisible 
              ? "" 
              : ""
          }`}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <Button
            onClick={onContinue}
            variant="ghost"
            className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
