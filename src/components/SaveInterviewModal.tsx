import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { KeywordScript } from "./InterviewScriptBuilder";

interface StepData {
  companyName: string;
  companyLinkedin: string;
  jobDescription: string;
  linkedinAbout: string;
  experiences: string;
  keywords: string[];
  aboutMeScript?: string;
}

interface SaveInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: StepData;
  savedScripts: KeywordScript[];
  onSaveComplete: () => void;
}

export const SaveInterviewModal = ({
  open,
  onOpenChange,
  data,
  savedScripts,
  onSaveComplete,
}: SaveInterviewModalProps) => {
  const [name, setName] = useState(`Entrevista para ${data.companyName}`);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user?.id || !name.trim()) return;

    setIsSaving(true);
    try {
      const interviewData = {
        user_id: user.id,
        name: name.trim(),
        company_name: data.companyName,
        job_title: null as string | null,
        data_content: {
          ...data,
          savedScripts,
        } as unknown as import("@/integrations/supabase/types").Json,
      };

      const { error } = await supabase.from('interview_history').insert(interviewData);

      if (error) throw error;

      toast({
        title: "Entrevista salva!",
        description: "Você pode acessar esse histórico quando quiser.",
      });

      onSaveComplete();
    } catch (error) {
      console.error('Error saving interview:', error);
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
            <Save className="w-5 h-5 text-primary" />
            Salvar Preparação
          </DialogTitle>
          <DialogDescription>
            Dê um nome para essa preparação de entrevista. Você poderá acessá-la depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="interview-name">Nome da entrevista</Label>
            <Input
              id="interview-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Entrevista para Google"
              className="h-12"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Empresa: <span className="font-medium text-foreground">{data.companyName}</span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
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
