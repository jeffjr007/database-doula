import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Save, FileText, Target, CheckCircle, Eye, Unlock, Lock, Gift, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface MenteeDetailProps {
  menteeId: string;
  menteeName: string;
  onBack: () => void;
}

interface LinkedInDiagnostic {
  id: string;
  pdf_url: string | null;
  word_url: string | null;
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
  word_url: string | null;
}

export const MenteeDetail = ({ menteeId, menteeName, onBack }: MenteeDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [diagnostic, setDiagnostic] = useState<LinkedInDiagnostic | null>(null);
  const [funnel, setFunnel] = useState<OpportunityFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDiagnosticPdf, setUploadingDiagnosticPdf] = useState(false);
  const [uploadingDiagnosticWord, setUploadingDiagnosticWord] = useState(false);
  const [uploadingFunnelPdf, setUploadingFunnelPdf] = useState(false);
  const [uploadingFunnelWord, setUploadingFunnelWord] = useState(false);
  const [savingDiagnostic, setSavingDiagnostic] = useState(false);
  const [savingFunnel, setSavingFunnel] = useState(false);
  const [stage2Unlocked, setStage2Unlocked] = useState(false);
  const [togglingStage2, setTogglingStage2] = useState(false);
  const [learningPath, setLearningPath] = useState('');
  const [savingLearningPath, setSavingLearningPath] = useState(false);

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
      const [diagnosticResult, funnelResult, profileResult] = await Promise.all([
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
        supabase
          .from('profiles')
          .select('stage2_unlocked, learning_path')
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

      if (profileResult.data) {
        setStage2Unlocked(profileResult.data.stage2_unlocked ?? false);
        setLearningPath(profileResult.data.learning_path ?? '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosticFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'word') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const setUploading = type === 'pdf' ? setUploadingDiagnosticPdf : setUploadingDiagnosticWord;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${menteeId}/linkedin-diagnostic-${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('mentee-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mentee-files')
        .getPublicUrl(fileName);

      const updateData = type === 'pdf' 
        ? { pdf_url: publicUrl, title: diagnosticTitle, notes: diagnosticNotes }
        : { word_url: publicUrl, title: diagnosticTitle, notes: diagnosticNotes };

      // Create or update diagnostic
      if (diagnostic) {
        await supabase
          .from('linkedin_diagnostics')
          .update(updateData)
          .eq('id', diagnostic.id);
      } else {
        await supabase
          .from('linkedin_diagnostics')
          .insert({
            user_id: menteeId,
            ...updateData,
            created_by: user.id,
          });
      }

      toast({
        title: `${type === 'pdf' ? 'PDF' : 'Word'} enviado!`,
        description: "O arquivo foi salvo com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFunnelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'word') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const setUploading = type === 'pdf' ? setUploadingFunnelPdf : setUploadingFunnelWord;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${menteeId}/opportunity-funnel-${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('mentee-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mentee-files')
        .getPublicUrl(fileName);

      const updateData = type === 'pdf'
        ? { pdf_url: publicUrl, title: funnelTitle, notes: funnelNotes }
        : { word_url: publicUrl, title: funnelTitle, notes: funnelNotes };

      // Create or update funnel
      if (funnel) {
        await supabase
          .from('opportunity_funnels')
          .update(updateData)
          .eq('id', funnel.id);
      } else {
        await supabase
          .from('opportunity_funnels')
          .insert({
            user_id: menteeId,
            ...updateData,
            content: { text: '' },
            created_by: user.id,
          });
      }

      toast({
        title: `${type === 'pdf' ? 'PDF' : 'Word'} enviado!`,
        description: "O arquivo foi salvo com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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

  const handleSaveLearningPath = async () => {
    setSavingLearningPath(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ learning_path: learningPath || null })
        .eq('user_id', menteeId);

      if (error) throw error;

      toast({
        title: learningPath ? "Trilha salva!" : "Trilha removida!",
        description: learningPath 
          ? "O mentorado agora pode ver o presente."
          : "A trilha foi removida.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingLearningPath(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando...
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
          <h2 className="text-xl font-display font-bold text-foreground">
            {menteeName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerenciar entregáveis do mentorado
          </p>
        </div>
      </div>

      {/* Stage 2 Access Control */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stage2Unlocked ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
              {stage2Unlocked ? (
                <Unlock className="w-5 h-5 text-green-500" />
              ) : (
                <Lock className="w-5 h-5 text-destructive" />
              )}
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">
                Etapa 2 - Gerador de CV
              </h3>
              <p className="text-xs text-muted-foreground">
                {stage2Unlocked
                  ? '✓ Liberada - Mentorado pode acessar'
                  : '○ Bloqueada - Aguardando validação do LinkedIn'}
              </p>
            </div>
          </div>

          <Button
            variant={stage2Unlocked ? 'outline' : 'default'}
            onClick={async () => {
              setTogglingStage2(true);
              try {
                const { error } = await supabase
                  .from('profiles')
                  .update({ stage2_unlocked: !stage2Unlocked })
                  .eq('user_id', menteeId);

                if (error) throw error;

                setStage2Unlocked(!stage2Unlocked);
                toast({
                  title: stage2Unlocked ? "Etapa 2 bloqueada" : "Etapa 2 liberada!",
                  description: stage2Unlocked
                    ? "O mentorado não pode mais acessar a Etapa 2."
                    : "O mentorado agora pode acessar a Etapa 2.",
                });
              } catch (error: any) {
                toast({
                  title: "Erro",
                  description: error.message,
                  variant: "destructive",
                });
              } finally {
                setTogglingStage2(false);
              }
            }}
            disabled={togglingStage2}
            className={stage2Unlocked ? '' : 'bg-green-600 hover:bg-green-700'}
          >
            {togglingStage2 ? (
              'Salvando...'
            ) : stage2Unlocked ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Bloquear Etapa 2
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Liberar Etapa 2
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Learning Path / Gift Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-card rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${learningPath ? 'bg-accent/20' : 'bg-muted/20'}`}>
              <Gift className={`w-5 h-5 ${learningPath ? 'text-accent' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">
                🎁 Presente - Trilha de Desenvolvimento
              </h3>
              <p className="text-xs text-muted-foreground">
                {learningPath
                  ? '✓ Configurado - Mentorado pode ver o presente'
                  : '○ Pendente - Nenhuma trilha adicionada'}
              </p>
            </div>
          </div>

          {learningPath && (
            <Sparkles className="w-6 h-6 text-accent" />
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Trilha Personalizada</Label>
            <Textarea
              value={learningPath}
              onChange={(e) => setLearningPath(e.target.value)}
              placeholder="Cole aqui a trilha de cursos personalizada para o mentorado...

Exemplo:
🔹 MÓDULO 1 – BASE TÉCNICA
Foco: Fundamentos da área

Curso de Excel – Fundação Bradesco
https://www.ev.org.br/cursos/excel

Gestão de Projetos – FGV
https://educacao-executiva.fgv.br/cursos/gratuitos"
              className="bg-secondary/30 min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Cole o texto da trilha exatamente como quer que apareça. A IA irá organizar automaticamente.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSaveLearningPath}
              disabled={savingLearningPath}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {savingLearningPath ? (
                'Salvando...'
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  {learningPath ? 'Atualizar Trilha' : 'Adicionar Trilha'}
                </>
              )}
            </Button>
            {learningPath && (
              <Button
                variant="outline"
                onClick={() => setLearningPath('')}
                disabled={savingLearningPath}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">
                Etapa 1 - Diagnóstico LinkedIn
              </h3>
              <p className="text-xs text-muted-foreground">
                {diagnostic?.status === 'published'
                  ? '✓ Publicado - Mentorado pode visualizar'
                  : diagnostic
                    ? '● Rascunho - Salvo mas não publicado'
                    : '○ Pendente - Nenhum arquivo enviado'}
              </p>
            </div>
          </div>

          {diagnostic?.status === 'published' && (
            <CheckCircle className="w-6 h-6 text-primary" />
          )}
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
            <Label>Observações (opcional)</Label>
            <Textarea
              value={diagnosticNotes}
              onChange={(e) => setDiagnosticNotes(e.target.value)}
              placeholder="Notas ou instruções para o mentorado..."
              className="bg-secondary/30 min-h-[80px]"
            />
          </div>

          {/* PDF upload */}
          <div className="space-y-2">
            <Label>PDF do Diagnóstico</Label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingDiagnosticPdf ? 'Enviando...' : 'Clique para enviar PDF'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleDiagnosticFileUpload(e, 'pdf')}
                  disabled={uploadingDiagnosticPdf}
                />
              </label>

              {diagnostic?.pdf_url && (
                <Button variant="outline" asChild>
                  <a href={diagnostic.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver PDF
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Word upload */}
          <div className="space-y-2">
            <Label>Word do Diagnóstico (editável)</Label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingDiagnosticWord ? 'Enviando...' : 'Clique para enviar Word (.docx)'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  onChange={(e) => handleDiagnosticFileUpload(e, 'word')}
                  disabled={uploadingDiagnosticWord}
                />
              </label>

              {diagnostic?.word_url && (
                <Button variant="outline" asChild>
                  <a href={diagnostic.word_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Word
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleSaveDiagnostic(false)}
              disabled={savingDiagnostic}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSaveDiagnostic(true)}
              disabled={savingDiagnostic || !diagnostic?.pdf_url}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Publicar para Mentorado
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Opportunity Funnel - Stage 3 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">
                Etapa 3 - Funil de Oportunidades
              </h3>
              <p className="text-xs text-muted-foreground">
                {funnel?.status === 'published'
                  ? '✓ Publicado - Mentorado pode visualizar'
                  : funnel
                    ? '● Rascunho - Salvo mas não publicado'
                    : '○ Pendente - Nenhum conteúdo criado'}
              </p>
            </div>
          </div>

          {funnel?.status === 'published' && (
            <CheckCircle className="w-6 h-6 text-primary" />
          )}
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

          {/* PDF upload for funnel */}
          <div className="space-y-2">
            <Label>PDF do Funil</Label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingFunnelPdf ? 'Enviando...' : 'Clique para enviar PDF'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFunnelFileUpload(e, 'pdf')}
                  disabled={uploadingFunnelPdf}
                />
              </label>

              {funnel?.pdf_url && (
                <Button variant="outline" asChild>
                  <a href={funnel.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver PDF
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Word upload for funnel */}
          <div className="space-y-2">
            <Label>Word do Funil (editável)</Label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingFunnelWord ? 'Enviando...' : 'Clique para enviar Word (.docx)'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFunnelFileUpload(e, 'word')}
                  disabled={uploadingFunnelWord}
                />
              </label>

              {funnel?.word_url && (
                <Button variant="outline" asChild>
                  <a href={funnel.word_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Word
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo do Funil (opcional)</Label>
            <Textarea
              value={funnelContent}
              onChange={(e) => setFunnelContent(e.target.value)}
              placeholder="Descreva o funil de oportunidades do mentorado..."
              className="bg-secondary/30 min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Você pode usar texto simples ou JSON estruturado. O PDF é o conteúdo principal.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={funnelNotes}
              onChange={(e) => setFunnelNotes(e.target.value)}
              placeholder="Notas ou instruções para o mentorado..."
              className="bg-secondary/30 min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleSaveFunnel(false)}
              disabled={savingFunnel}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSaveFunnel(true)}
              disabled={savingFunnel || !funnel?.pdf_url}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Publicar para Mentorado
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
