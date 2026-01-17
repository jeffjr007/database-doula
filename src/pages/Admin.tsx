import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold text-gradient mb-4">Painel Admin</h1>
        <p className="text-muted-foreground">Área administrativa</p>
      </div>
    </div>
  );
};

export default Admin;
