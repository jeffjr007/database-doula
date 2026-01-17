import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";

const ActivatePlatform = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold text-gradient mb-4">Ativar Plataforma</h1>
        <p className="text-muted-foreground mb-6">Você precisa de um código de convite para acessar.</p>
        <Button variant="outline" onClick={() => navigate("/auth")}>Voltar ao Login</Button>
      </div>
    </div>
  );
};

export default ActivatePlatform;
