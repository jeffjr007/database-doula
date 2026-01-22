import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, ChevronRight, GraduationCap, BookOpen, Target, Rocket } from "lucide-react";
import { MentorAvatar } from "@/components/MentorAvatar";

interface GiftModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

const GiftModal = ({ open, onClose, userId }: GiftModalProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'announce' | 'explain'>('announce');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleOpenGift = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep('explain');
      setIsTransitioning(false);
    }, 400);
  };

  const handleViewTrack = () => {
    // Mark gift as seen
    if (userId) {
      localStorage.setItem(`gift_seen_${userId}`, 'true');
    }
    onClose();
    navigate('/minha-trilha');
  };

  const handleClose = () => {
    if (userId) {
      localStorage.setItem(`gift_seen_${userId}`, 'true');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:hidden overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {step === 'announce' && !isTransitioning && (
            <motion.div
              key="announce"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Subtle background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                
                {/* Sparkle effects */}
                <div className="absolute -inset-4 pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${10 + Math.random() * 80}%`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 0.6, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-primary/60" />
                    </motion.div>
                  ))}
                </div>
                
                <div className="relative z-10 text-center">
                  {/* Gift icon */}
                  <motion.div
                    className="mx-auto mb-6 w-16 h-16 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 flex items-center justify-center"
                    animate={{ 
                      y: [0, -5, 0],
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Gift className="w-8 h-8 text-primary" />
                  </motion.div>

                  {/* Mentor info */}
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <MentorAvatar size="sm" />
                    <span className="text-sm text-muted-foreground">Duarte preparou algo especial</span>
                  </div>

                  {/* Title */}
                  <motion.h2
                    className="text-2xl font-display font-bold text-foreground mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Você tem um presente! 🎁
                  </motion.h2>

                  <motion.p
                    className="text-muted-foreground text-sm mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Um presente exclusivo está esperando por você.
                  </motion.p>

                  {/* Open button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      onClick={handleOpenGift}
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold py-6 rounded-xl text-base"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Abrir Presente
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'explain' && !isTransitioning && (
            <motion.div
              key="explain"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <motion.div 
                    className="text-center mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Presente Desbloqueado</span>
                    </div>
                    <h2 className="text-xl font-display font-bold text-foreground mb-2">
                      Sua Trilha de Desenvolvimento
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Uma jornada personalizada para sua evolução profissional
                    </p>
                  </motion.div>

                  {/* Features */}
                  <motion.div 
                    className="space-y-3 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {[
                      { icon: BookOpen, text: "Cursos selecionados para seu perfil", color: "text-primary" },
                      { icon: Target, text: "Módulos organizados por prioridade", color: "text-accent" },
                      { icon: Rocket, text: "Acelere sua recolocação", color: "text-emerald-500" },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-sm text-foreground">{item.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      onClick={handleViewTrack}
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold py-6 rounded-xl text-base group"
                    >
                      Ver Minha Trilha
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {isTransitioning && (
            <motion.div
              key="transitioning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <Gift className="w-12 h-12 text-primary" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default GiftModal;
