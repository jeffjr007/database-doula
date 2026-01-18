import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save, Sparkles, Loader2 } from 'lucide-react';

interface SaveCVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => Promise<void>;
  defaultName?: string;
}

export const SaveCVModal = ({
  open,
  onOpenChange,
  onSave,
  defaultName = ''
}: SaveCVModalProps) => {
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave(name.trim());
      setName('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-primary" />
            Salvar Currículo
          </DialogTitle>
          <DialogDescription>
            Dê um nome para identificar esse currículo depois!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cv-name">Nome do Currículo</Label>
              <Input
                id="cv-name"
                placeholder='Ex: "Diretor de Marketing - Google"'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/50"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Dica: Use o cargo e empresa para encontrar depois!
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
