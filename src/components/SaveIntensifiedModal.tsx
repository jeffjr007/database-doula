import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface IntensifiedScript {
  keyword: string;
  originalScript: string;
  intensifiedHow: string;
  experience: string;
}

interface SaveIntensifiedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewId: string;
  interviewName: string;
  companyName: string;
  intensifiedScripts: IntensifiedScript[];
  onSaveComplete: () => void;
}

export const SaveIntensifiedModal = ({
  open,
  onOpenChange,
  interviewId,
  interviewName,
  companyName,
  intensifiedScripts,
  onSaveComplete,
}: SaveIntensifiedModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user?.id || !interviewId) return;

    setIsSaving(true);
    try {
      // Get the current interview data
      const { data: currentInterview, error: fetchError } = await supabase
        .from('interview_history')
        .select('data_content')
        .eq('id', interviewId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Merge intensified scripts with existing data
      const existingContent = (currentInterview.data_content || {}) as Record<string, unknown>;
      const updatedContent = {
        ...existingContent,
        intensifiedScripts,
        stage5Completed: true,
        stage5CompletedAt: new Date().toISOString(),
      };

      // Update the interview record
      const { error: updateError } = await supabase
        .from('interview_history')
        .update({
          data_content: updatedContent as unknown as import("@/integrations/supabase/types").Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', interviewId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Roteiros intensificados salvos!",
        description: "Sua preparação está completa e pronta para consulta.",
      });

      onSaveComplete();
    } catch (error) {
      console.error('Error saving intensified scripts:', error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Salvar Roteiros Intensificados
          </DialogTitle>
          <DialogDescription>
            Os roteiros intensificados serão salvos junto com a entrevista selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
            <p className="text-sm text-muted-foreground">Entrevista:</p>
            <p className="font-medium">{interviewName}</p>
            <p className="text-sm text-muted-foreground">
              Empresa: <span className="text-foreground">{companyName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Save className="w-4 h-4" />
            <span>{intensifiedScripts.length} roteiros intensificados serão salvos</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar e Finalizar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
