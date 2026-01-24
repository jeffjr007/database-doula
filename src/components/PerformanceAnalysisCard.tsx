import { CheckCircle2, Target, Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface PerformanceFeedback {
  introduction: string;
  strengths: string[];
  improvements: string[];
  practicalTip: string;
  closing: string;
}

interface PerformanceAnalysisCardProps {
  feedback: PerformanceFeedback;
}

export const PerformanceAnalysisCard = ({ feedback }: PerformanceAnalysisCardProps) => {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm leading-relaxed text-foreground/90"
      >
        {feedback.introduction}
      </motion.p>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <h4 className="font-semibold text-green-500">O que você fez muito bem</h4>
          </div>
          <ul className="space-y-2 pl-1">
            {feedback.strengths.map((strength, idx) => (
              <motion.li 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                className="flex gap-3 text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 mt-2 flex-shrink-0" />
                <span className="text-foreground/85 leading-relaxed">{strength}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Improvements */}
      {feedback.improvements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 rounded-lg">
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <h4 className="font-semibold text-amber-500">Oportunidades de melhoria</h4>
          </div>
          <ul className="space-y-2 pl-1">
            {feedback.improvements.map((improvement, idx) => (
              <motion.li 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + idx * 0.05 }}
                className="flex gap-3 text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-2 flex-shrink-0" />
                <span className="text-foreground/85 leading-relaxed">{improvement}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Practical Tip */}
      {feedback.practicalTip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-primary/10 border border-primary/20 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-primary/20 rounded-lg flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-primary text-sm">Dica Prática da Ana</h4>
              <p className="text-sm text-foreground/85 leading-relaxed">{feedback.practicalTip}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Closing */}
      {feedback.closing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-2 border-t border-border/30"
        >
          <p className="text-sm text-foreground/80 italic leading-relaxed">
            {feedback.closing}
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Fallback component for non-structured feedback
export const PerformanceAnalysisFallback = ({ text }: { text: string }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-500/80">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs">Análise em formato simplificado</span>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
};
