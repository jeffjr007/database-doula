import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface StageWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'linkedin-cv' | 'linkedin-gupy';
}

const warningContent = {
  'linkedin-cv': {
    title: 'LinkedIn Ajustado?',
    description: 'É fundamental que seu LinkedIn esteja 100% ajustado antes de prosseguir.',
    confirmText: 'Entendi, continuar',
  },
  'linkedin-gupy': {
    title: 'LinkedIn Pronto?',
    description: 'Para utilizar as estratégias da Gupy de forma eficaz, seu LinkedIn precisa estar completo.',
    confirmText: 'Entendi, continuar',
  },
};

export const StageWarningModal = ({ open, onClose, onConfirm, type }: StageWarningModalProps) => {
  const content = warningContent[type];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
          <p className="text-muted-foreground text-sm mb-6">{content.description}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>Voltar</Button>
            <Button onClick={onConfirm} className="gap-2">
              {content.confirmText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
