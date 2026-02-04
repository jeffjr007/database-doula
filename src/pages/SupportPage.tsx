import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, MessageSquare, CheckCircle, Clock, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Logo } from '@/components/Logo';

interface Ticket {
  id: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  responded_at: string | null;
}

const MAX_CHARS = 1000;

const SupportPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || message.length > MAX_CHARS) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user!.id,
          message: message.trim()
        });

      if (error) throw error;

      toast({
        title: "Ticket enviado!",
        description: "Seu mentor responderá em breve.",
      });

      setMessage('');
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Aguardando resposta</Badge>;
      case 'answered':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Respondido</Badge>;
      case 'closed':
        return <Badge className="bg-muted text-muted-foreground">Fechado</Badge>;
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-sm">Precisa de ajuda?</h1>
                <p className="text-xs text-muted-foreground">Fale com seu mentor</p>
              </div>
            </div>
          </div>
          <Logo size="sm" />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* New ticket form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Abrir novo ticket</h2>
                <p className="text-sm text-muted-foreground">Descreva sua dúvida com detalhes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Escreva sua dúvida aqui... Seja específico para receber uma resposta mais completa."
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                  className="min-h-[150px] bg-background/50 resize-none"
                />
                <div className={`absolute bottom-3 right-3 text-xs ${message.length > MAX_CHARS * 0.9 ? 'text-amber-500' : 'text-muted-foreground/60'}`}>
                  {message.length}/{MAX_CHARS}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || message.length > MAX_CHARS || sending}
                className="w-full gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Enviando...' : 'Enviar ticket'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Previous tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Seus tickets anteriores
          </h3>

          {tickets.length === 0 ? (
            <Card className="p-8 text-center bg-secondary/30 border-border/50">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Você ainda não abriu nenhum ticket.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {tickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 bg-secondary/30 border-border/50">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="text-sm text-foreground flex-1">{ticket.message}</p>
                        {getStatusBadge(ticket.status)}
                      </div>

                      <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(ticket.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </p>

                      {/* Admin response */}
                      {ticket.admin_response && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 pt-3 border-t border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium text-green-500">Resposta do mentor</span>
                          </div>
                          <p className="text-sm text-foreground bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            {ticket.admin_response}
                          </p>
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SupportPage;
