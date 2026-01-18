import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Save, FileText, Target, CheckCircle, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MenteeDetailProps {
  menteeId: string;
  menteeName: string;
  onBack: () => void;
}

interface LinkedInDiagnostic {
  id: string;
  pdf_url: string | null;
  title: string;
  notes: string | null;
  status: string;
}

interface OpportunityFunnel {
  id: string;
  content: any;
  title: string;
  notes: string | null;
  status: string;
  pdf_url: string | null;
}

export const MenteeDetail = ({ menteeId, menteeName, onBack }: MenteeDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [diagnostic, setDiagnostic] = useState<LinkedInDiagnostic | null>(null);
  const [funnel, setFunnel] = useState<OpportunityFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDiagnostic, setUploadingDiagnostic] = useState(false);
  const [uploadingFunnel, setUploadingFunnel] = useState(false);
  const [savingDiagnostic, setSavingDiagnostic] = useState(false);
  const [savingFunnel, setSavingFunnel] = useState(false);

  // Form states
  const [diagnosticTitle, setDiagnosticTitle] = useState('Diagnóstico LinkedIn');
  const [diagnosticNotes, setDiagnosticNotes] = useState('');
  const [funnelTitle, setFunnelTitle] = useState('Funil de Oportunidades');
  const [funnelNotes, setFunnelNotes] = useState('');
  const [funnelContent, setFunnelContent] = useState('');

  useEffect(() => {
    fetchData();
  }, [menteeId]);

  const fetchData = async () => {
    try {
      const [diagnosticResult, funnelResult] = await Promise.all([
        supabase
          .from('linkedin_diagnostics')
          .select('*')
          .eq('user_id', menteeId)
          .maybeSingle(),
        supabase
          .from('opportunity_funnels')
          .select('*')
          .eq('user_id', menteeId)
          .maybeSingle(),
      ]);

      if (diagnosticResult.data) {
        setDiagnostic(diagnosticResult.data);
        setDiagnosticTitle(diagnosticResult.data.title);
        setDiagnosticNotes(diagnosticResult.data.notes || '');
      }

      if (funnelResult.data) {
        setFunnel(funnelResult.data);
        setFunnelTitle(funnelResult.data.title);
        setFunnelNotes(funnelResult.data.notes || '');
        setFunnelContent(
          typeof funnelResult.data.content === 'string'
            ? funnelResult.data.content
            : JSON.stringify(funnelResult.data.content, null, 2)
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiagnostic = async (publish: boolean = false) => {
    if (!user) return;

    setSavingDiagnostic(true);
    try {
      const data = {
        title: diagnosticTitle,
        notes: diagnosticNotes,
        status: publish ? 'published' : 'draft',
      };

      if (diagnostic) {
        await supabase
          .from('linkedin_diagnostics')
          .update(data)
          .eq('id', diagnostic.id);
      } else {
        await supabase
          .from('linkedin_diagnostics')
          .insert({
            ...data,
            user_id: menteeId,
            created_by: user.id,
          });
      }

      toast({
        title: publish ? "Diagnóstico publicado!" : "Diagnóstico salvo!",
        description: publish
          ? "O mentorado agora pode ver o diagnóstico."
          : "Rascunho salvo com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingDiagnostic(false);
    }
  };

  const handleSaveFunnel = async (publish: boolean = false) => {
    if (!user) return;

    setSavingFunnel(true);
    try {
      let parsedContent;
      try {
        parsedContent = JSON.parse(funnelContent);
      } catch {
        parsedContent = { text: funnelContent };
      }

      const data = {
        title: funnelTitle,
        notes: funnelNotes,
        content: parsedContent,
        status: publish ? 'published' : 'draft',
      };

      if (funnel) {
        await supabase
          .from('opportunity_funnels')
          .update(data)
          .eq('id', funnel.id);
      } else {
        await supabase
          .from('opportunity_funnels')
          .insert({
            ...data,
            user_id: menteeId,
            created_by: user.id,
          });
      }

      toast({
        title: publish ? "Funil publicado!" : "Funil salvo!",
        description: publish
          ? "O mentorado agora pode ver o funil."
          : "Rascunho salvo com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingFunnel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            {menteeName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerenciar entregáveis
          </p>
        </div>
      </div>

      {/* LinkedIn Diagnostic Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0077B5]/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0077B5]" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Etapa 1: Diagnóstico LinkedIn
            </h3>
            <p className="text-xs text-muted-foreground">
              {diagnostic?.status === 'published' ? (
                <span className="text-primary flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Publicado
                </span>
              ) : diagnostic ? (
                <span className="text-amber-500">Rascunho</span>
              ) : (
                <span>Não iniciado</span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={diagnosticTitle}
              onChange={(e) => setDiagnosticTitle(e.target.value)}
              className="bg-secondary/30"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas / Observações</Label>
            <Textarea
              value={diagnosticNotes}
              onChange={(e) => setDiagnosticNotes(e.target.value)}
              placeholder="Adicione notas sobre o diagnóstico..."
              className="bg-secondary/30 min-h-[100px]"
            />
          </div>

          {diagnostic?.pdf_url && (
            <div className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PDF anexado</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(diagnostic.pdf_url!, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSaveDiagnostic(false)}
              disabled={savingDiagnostic}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              variant="glow"
              onClick={() => handleSaveDiagnostic(true)}
              disabled={savingDiagnostic}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Opportunity Funnel Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Etapa 3: Funil de Oportunidades
            </h3>
            <p className="text-xs text-muted-foreground">
              {funnel?.status === 'published' ? (
                <span className="text-primary flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Publicado
                </span>
              ) : funnel ? (
                <span className="text-amber-500">Rascunho</span>
              ) : (
                <span>Não iniciado</span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={funnelTitle}
              onChange={(e) => setFunnelTitle(e.target.value)}
              className="bg-secondary/30"
            />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo do Funil</Label>
            <Textarea
              value={funnelContent}
              onChange={(e) => setFunnelContent(e.target.value)}
              placeholder="Adicione o conteúdo do funil..."
              className="bg-secondary/30 min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas / Observações</Label>
            <Textarea
              value={funnelNotes}
              onChange={(e) => setFunnelNotes(e.target.value)}
              placeholder="Adicione notas sobre o funil..."
              className="bg-secondary/30 min-h-[100px]"
            />
          </div>

          {funnel?.pdf_url && (
            <div className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PDF anexado</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(funnel.pdf_url!, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSaveFunnel(false)}
              disabled={savingFunnel}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              variant="glow"
              onClick={() => handleSaveFunnel(true)}
              disabled={savingFunnel}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
