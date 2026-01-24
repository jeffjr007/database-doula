import { useDevUser } from '@/hooks/useDevUser';
import { Bug, Zap, Eye, Save, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Floating indicator that shows when dev mode is active.
 * Only visible to dev users - invisible to normal users.
 */
const DevModeIndicator = () => {
  const { isDevUser, bypassValidation, skipAnimations, forceShowRewards, autoSave, freeNavigation } = useDevUser();

  if (!isDevUser) return null;

  const features = [
    { icon: Zap, label: 'Bypass Validation', active: bypassValidation },
    { icon: Eye, label: 'Show Rewards', active: forceShowRewards },
    { icon: Save, label: 'Auto Save', active: autoSave },
    { icon: Navigation, label: 'Free Navigation', active: freeNavigation },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-[9999] pointer-events-none"
      >
        <div className="bg-yellow-500/90 backdrop-blur-sm text-yellow-950 px-4 py-2 rounded-xl shadow-lg border border-yellow-400">
          <div className="flex items-center gap-2 mb-1">
            <Bug className="w-4 h-4" />
            <span className="font-bold text-sm">DEV MODE</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {features.map(({ icon: Icon, label, active }) => (
              <span
                key={label}
                className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  active ? 'bg-yellow-600/50' : 'bg-yellow-800/30 opacity-50'
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DevModeIndicator;
