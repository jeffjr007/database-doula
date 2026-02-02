import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CoverLetterData } from '@/types/cover-letter';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
  Mail,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedCoverLetter {
  id: string;
  name: string;
  cover_letter_data: CoverLetterData;
  created_at: string;
  updated_at: string;
}

const MinhasCartas = () => {
  const [coverLetters, setCoverLetters] = useState<SavedCoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCoverLetters();
    }
  }, [user]);

  const fetchCoverLetters = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_cover_letters')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCoverLetters((data || []).map(item => ({
        ...item,
        cover_letter_data: item.cover_letter_data as unknown as CoverLetterData
      })));
    } catch (error: any) {
      console.error('Error fetching cover letters:', error);
      toast({
        title: "Erro ao carregar cartas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_cover_letters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCoverLetters(coverLetters.filter(cl => cl.id !== id));
      toast({
        title: "Carta excluída",
        description: "A carta de apresentação foi removida com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = (coverLetter: SavedCoverLetter) => {
    navigate('/cv', { state: { coverLetterData: coverLetter.cover_letter_data } });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative z-10 container max-w-4xl py-6 md:py-10 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <header className="text-center mb-8 md:mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Suas Cartas
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">
            <span className="text-foreground">Minhas </span>
            <span className="text-primary">Cartas de Apresentação</span>
          </h1>

          <p className="text-muted-foreground max-w-md mx-auto text-sm px-2">
            Todas as suas cartas de apresentação em um só lugar. Visualize ou exclua quando quiser!
          </p>
        </header>

        {/* Cover Letters Grid */}
        {coverLetters.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 border border-border shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <FileText className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhuma carta salva ainda
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Crie sua primeira carta de apresentação e salve aqui!
            </p>
            <Button onClick={() => navigate('/cv')} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar minha primeira carta
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {coverLetters.map((coverLetter, index) => (
              <div
                key={coverLetter.id}
                className="bg-card rounded-xl p-4 md:p-5 border border-border shadow-sm hover:border-primary/30 transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Mobile: Stack layout */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  {/* Info Section */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">
                          {coverLetter.name}
                        </h3>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                          Carta
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">Atualizado em {formatDate(coverLetter.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Always visible, responsive sizing */}
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleView(coverLetter)}
                      className="h-9 w-9 sm:h-10 sm:w-auto sm:px-3 sm:gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Visualizar</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Carta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{coverLetter.name}"?
                            Essa ação não pode ser desfeita!
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(coverLetter.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create new button */}
        {coverLetters.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/cv')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Criar nova carta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinhasCartas;