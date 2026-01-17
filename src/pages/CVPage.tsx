import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CVPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-display font-bold text-gradient mb-4">Gerador de CV</h1>
        <p className="text-muted-foreground">Esta página será implementada em breve.</p>
      </div>
    </div>
  );
};

export default CVPage;
