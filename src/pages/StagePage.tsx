import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const StagePage = () => {
  const { stageNumber } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageNumber || '0', 10);

  if (![4, 5, 6].includes(stage)) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-display font-bold text-gradient mb-4">Etapa {stage}</h1>
        <p className="text-muted-foreground">Esta página será implementada em breve.</p>
      </div>
    </div>
  );
};

export default StagePage;
