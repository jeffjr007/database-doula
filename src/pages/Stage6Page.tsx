import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GupyGuide } from "@/components/GupyGuide";
import { Loader2 } from "lucide-react";

const Stage6Page = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <GupyGuide />;
};

export default Stage6Page;
