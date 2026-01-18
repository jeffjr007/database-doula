import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

interface GupyInfoBoxProps {
  steps: { num: string; text: string }[];
}

export const GupyInfoBox = ({ steps }: GupyInfoBoxProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto"
    >
      <Card className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 backdrop-blur-sm overflow-hidden relative">
        <motion.div 
          className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <div className="flex items-start gap-4 relative">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Info className="w-5 h-5 text-primary" />
          </motion.div>
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <p className="font-semibold text-foreground mb-3 text-sm">Como usar na Gupy:</p>
            <div className="grid grid-cols-2 gap-2">
              {steps.map((item, i) => (
                <motion.div
                  key={item.num}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
                >
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium flex-shrink-0">
                    {item.num}
                  </span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};
