import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InviteCode {
  id: string;
  code: string;
  mentee_name: string | null;
  mentee_email: string | null;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

export const InviteCodeManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [menteeName, setMenteeName] = useState('');
  const [menteeEmail, setMenteeEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MNT-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateCode = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const code = generateCode();

      const { error } = await supabase
        .from('invite_codes')
        .insert({
          code,
          mentee_name: menteeName || null,
          mentee_email: menteeEmail || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Código gerado!",
        description: `Código ${code} criado com sucesso.`,
      });

      setMenteeName('');
      setMenteeEmail('');
      fetchCodes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Código removido",
        description: "O código foi removido com sucesso.",
      });

      fetchCodes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate new code */}
      <div className="glass-card rounded-xl p-6 space-y-4 bg-card border border-border">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Gerar Novo Código de Convite
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mentee-name">Nome do Mentorado (opcional)</Label>
            <Input
              id="mentee-name"
              placeholder="Ex: João Silva"
              value={menteeName}
              onChange={(e) => setMenteeName(e.target.value)}
              className="bg-secondary/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mentee-email">Email do Mentorado (opcional)</Label>
            <Input
              id="mentee-email"
              type="email"
              placeholder="Ex: joao@email.com"
              value={menteeEmail}
              onChange={(e) => setMenteeEmail(e.target.value)}
              className="bg-secondary/30"
            />
          </div>
        </div>

        <Button
          onClick={handleCreateCode}
          disabled={generating}
          variant="glow"
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          {generating ? 'Gerando...' : 'Gerar Código'}
        </Button>
      </div>

      {/* Codes list */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Códigos Gerados
        </h3>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum código gerado ainda.
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {codes.map((code) => (
                <motion.div
                  key={code.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    code.used ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <code className="text-lg font-mono text-primary font-bold">
                        {code.code}
                      </code>
                      {code.used && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          Usado
                        </span>
                      )}
                    </div>
                    {(code.mentee_name || code.mentee_email) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {code.mentee_name} {code.mentee_email && `(${code.mentee_email})`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em: {new Date(code.created_at).toLocaleDateString('pt-BR')}
                      {code.used_at && ` • Usado em: ${new Date(code.used_at).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!code.used && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code, code.id)}
                        >
                          {copiedId === code.id ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCode(code.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
