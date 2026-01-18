import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Stage4Guide } from "@/components/Stage4Guide";
import { Stage5Guide } from "@/components/Stage5Guide";
import { Loader2 } from "lucide-react";

const StagePage = () => {
  const { stageNumber } = useParams<{ stageNumber: string }>();
  const { user, loading } = useAuth();
  const stage = parseInt(stageNumber || '0', 10);

  // Validate stage number - only 4 and 5 are handled here now
  // Stage 6 has its own page (Stage6Page)
  if (![4, 5].includes(stage)) {
    return <Navigate to="/" replace />;
  }

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

  // Stage 4 uses the interactive guide
  if (stage === 4) {
    return (
      <div className="h-screen bg-background">
        <Stage4Guide stageNumber={stage} />
      </div>
    );
  }

  // Stage 5 uses the presentation builder guide
  if (stage === 5) {
    return (
      <div className="h-screen bg-background">
        <Stage5Guide stageNumber={stage} />
      </div>
    );
  }

  // Fallback - redirect to home
  return <Navigate to="/" replace />;
};

export default StagePage;
