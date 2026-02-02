import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

interface GupyInfoBoxProps {
  steps: { num: string; text: string }[];
}

export const GupyInfoBox = ({ steps }: GupyInfoBoxProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-4 md:p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 overflow-hidden relative">
        <div className="flex items-start gap-3 md:gap-4 relative">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground mb-2 md:mb-3 text-sm">Como usar na Gupy:</p>
            {/* Mobile: Simple numbered list */}
            <div className="md:hidden space-y-1.5">
              {steps.map((item) => (
                <div
                  key={item.num}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                    {item.num}
                  </span>
                  <span className="leading-tight">{item.text}</span>
                </div>
              ))}
            </div>
            {/* Desktop: Grid layout */}
            <div className="hidden md:grid grid-cols-2 gap-2">
              {steps.map((item) => (
                <div
                  key={item.num}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium flex-shrink-0">
                    {item.num}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
