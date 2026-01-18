import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CVData } from '@/types/cv';
import { ATSCVData } from '@/types/ats-cv';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
  FolderOpen,
  ArrowLeft,
  Loader2,
  Bot,
  UserCircle
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

interface SavedCV {
  id: string;
  name: string;
  cv_data: CVData | ATSCVData;
  created_at: string;
  updated_at: string;
}

// Helper to detect if CV is ATS type (has experiencias with bullets array, no sumario)
const isATSCV = (data: CVData | ATSCVData): data is ATSCVData => {
  return 'experiencias' in data &&
         Array.isArray((data as ATSCVData).experiencias) &&
         (data as ATSCVData).experiencias.length > 0 &&
         'bullets' in (data as ATSCVData).experiencias[0] &&
         !('sumario' in data);
};

const MeusCVs = () => {
  const [cvs, setCvs] = useState<SavedCV[]>([]);
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
      fetchCVs();
    }
  }, [user]);

  const fetchCVs = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_cvs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCvs((data || []).map(item => ({
        ...item,
        cv_data: item.cv_data as unknown as CVData
      })));
    } catch (error: any) {
      console.error('Error fetching CVs:', error);
      toast({
        title: "Erro ao carregar CVs",
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
        .from('saved_cvs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCvs(cvs.filter(cv => cv.id !== id));
      toast({
        title: "CV excluído",
        description: "O currículo foi removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = (cv: SavedCV) => {
    if (isATSCV(cv.cv_data)) {
      navigate('/cv', { state: { atsCvData: cv.cv_data } });
    } else {
      navigate('/cv', { state: { cvData: cv.cv_data } });
    }
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

      <div className="relative z-10 container max-w-4xl py-10 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Seus Currículos
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">Meus </span>
            <span className="text-primary">CVs Salvos</span>
          </h1>

          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Todos os seus currículos em um só lugar. Visualize, edite ou exclua quando quiser!
          </p>
        </header>

        {/* CVs Grid */}
        {cvs.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 border border-border shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <FileText className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum CV salvo ainda
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Crie seu primeiro currículo e salve aqui para acessar depois!
            </p>
            <Button onClick={() => navigate('/cv')} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar meu primeiro CV
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {cvs.map((cv, index) => (
              <div
                key={cv.id}
                className="bg-card rounded-xl p-5 border border-border shadow-sm hover:border-primary/30 transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-lg transition-colors ${
                      isATSCV(cv.cv_data)
                        ? 'bg-blue-500/10 group-hover:bg-blue-500/20'
                        : 'bg-primary/10 group-hover:bg-primary/20'
                    }`}>
                      {isATSCV(cv.cv_data) ? (
                        <Bot className="w-6 h-6 text-blue-500" />
                      ) : (
                        <UserCircle className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {cv.name}
                        </h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isATSCV(cv.cv_data)
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {isATSCV(cv.cv_data) ? 'ATS' : 'Personalizado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Atualizado em {formatDate(cv.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleView(cv)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Visualizar</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir CV?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{cv.name}"?
                            Essa ação não pode ser desfeita!
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cv.id)}
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
        {cvs.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/cv')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Criar novo CV
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusCVs;
