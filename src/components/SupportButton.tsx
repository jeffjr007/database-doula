import { HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export const SupportButton = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
    >
      <Button
        onClick={() => navigate('/suporte')}
        className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-br from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 border-0 p-0"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
      
      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/30"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  );
};
