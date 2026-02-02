import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";
import logoAD from "@/assets/logo-ad.png";

interface LogoutModalProps {
  open: boolean;
  onComplete: () => void;
}

const LogoutModal = ({ open, onComplete }: LogoutModalProps) => {
  const [phase, setPhase] = useState<'greeting' | 'exiting'>('greeting');

  useEffect(() => {
    if (open) {
      setPhase('greeting');
      
      // After showing the greeting, start exit animation
      const exitTimer = setTimeout(() => {
        setPhase('exiting');
      }, 1500);

      // Complete and redirect after exit animation
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [open, onComplete]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Modal Content */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={
                phase === 'greeting'
                  ? { opacity: 1, scale: 1, y: 0 }
                  : { opacity: 0, scale: 0.9, y: -50 }
              }
              transition={{ 
                duration: phase === 'greeting' ? 0.5 : 0.4,
                ease: phase === 'greeting' ? "easeOut" : "easeIn"
              }}
            >
              {/* Logo with glow */}
              <motion.div 
                className="relative mx-auto mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-primary/30 rounded-2xl blur-xl" />
                <img 
                  src={logoAD} 
                  alt="AD" 
                  className="relative w-20 h-20 mx-auto rounded-2xl shadow-2xl"
                />
              </motion.div>

              {/* Greeting text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  Até breve! 👋
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Continue sua jornada rumo ao sucesso
                </p>
              </motion.div>

              {/* Decorative crown */}
              <motion.div
                className="mt-6 flex justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
              </motion.div>

              {/* Loading dots - CSS animation for better mobile performance */}
              <div className="mt-6 flex justify-center gap-1.5 animate-fade-in [animation-delay:600ms]">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LogoutModal;
