import { HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SupportLink = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/suporte')}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
    >
      <HelpCircle className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
      <span>Precisa de ajuda? Fale com o mentor</span>
    </button>
  );
};
