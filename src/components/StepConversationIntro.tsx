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

  const timerRef = useRef<number | null>(null);
  const visibleCountRef = useRef(0);
  const phaseRef = useRef<"idle" | "typing" | "show">("idle");

  useEffect(() => {
    // Reset when messages change
    visibleCountRef.current = 0;
    setVisibleCount(0);
    setShowTyping(false);
    setShowButton(false);
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
        setShowButton(true);
        phaseRef.current = "idle";
        return;
      }

      if (phaseRef.current === "idle") {
        phaseRef.current = "typing";
        setShowTyping(true);
        timerRef.current = window.setTimeout(() => step(), 650);
        return;
      }

      // typing -> show message
      phaseRef.current = "show";
      setShowTyping(false);
      visibleCountRef.current = visibleCountRef.current + 1;
      setVisibleCount(visibleCountRef.current);
      timerRef.current = window.setTimeout(() => {
        phaseRef.current = "idle";
        step();
      }, 250);
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
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-fade-in">
      {/* Mentor Avatar */}
      <div className="mb-6 animate-enter">
        <MentorAvatar size="md" />
      </div>

      {/* Messages Container */}
      <div className="w-full max-w-lg space-y-3 min-h-[180px]">
        {messages.slice(0, visibleCount).map((message, idx) => (
          <div
            key={`${idx}-${message.text.slice(0, 16)}`}
            className={`p-4 rounded-2xl animate-fade-in ${
              message.highlight
                ? "bg-primary/10 border border-primary/20"
                : "bg-secondary/50"
            }`}
          >
            <p
              className={`text-sm leading-relaxed ${
                message.highlight
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
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

      {/* Continue Button */}
      {showButton && (
        <div className="mt-6 animate-enter">
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
