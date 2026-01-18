import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, User, Phone, Mail, Clock, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ticket {
  id: string;
  user_id: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  responded_at: string | null;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  user_email?: string;
}

export const TicketManager = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each ticket
      const ticketsWithProfiles = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('user_id', ticket.user_id)
            .single();

          // Get user email from auth (we'll use a workaround)
          const { data: userData } = await supabase.auth.admin?.getUserById?.(ticket.user_id) || { data: null };
          
          return {
            ...ticket,
            profile: profile || { full_name: null, phone: null },
            user_email: userData?.user?.email || 'Email não disponível'
          };
        })
      );

      setTickets(ticketsWithProfiles);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          admin_response: response,
          status: 'answered',
          responded_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Resposta enviada!",
        description: "O mentorado foi notificado da sua resposta.",
      });

      setResponse('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Error responding to ticket:', error);
      toast({
        title: "Erro ao responder",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Ticket fechado",
        description: "O ticket foi marcado como fechado.",
      });

      fetchTickets();
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Aberto</Badge>;
      case 'answered':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Respondido</Badge>;
      case 'closed':
        return <Badge className="bg-muted text-muted-foreground">Fechado</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <Card className="p-8 text-center bg-secondary/30 border-border/50">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum ticket ainda</h3>
          <p className="text-sm text-muted-foreground">
            Os tickets dos mentorados aparecerão aqui.
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
                <Card 
                  className={`p-4 bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors cursor-pointer ${
                    selectedTicket?.id === ticket.id ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* User info */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {ticket.profile?.full_name || 'Nome não disponível'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {ticket.profile?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {ticket.profile.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {ticket.user_email}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Message preview */}
                      <p className={`text-sm text-muted-foreground ${selectedTicket?.id !== ticket.id ? 'line-clamp-2' : ''}`}>
                        {ticket.message}
                      </p>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/60">
                        <Clock className="w-3 h-3" />
                        {format(new Date(ticket.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(ticket.status)}
                      {ticket.status === 'open' && (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {selectedTicket?.id === ticket.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-border/50"
                      >
                        {/* Admin response if exists */}
                        {ticket.admin_response && (
                          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-xs text-green-400 mb-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Sua resposta
                            </p>
                            <p className="text-sm text-foreground">{ticket.admin_response}</p>
                          </div>
                        )}

                        {/* Response form for open tickets */}
                        {ticket.status === 'open' && (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Digite sua resposta..."
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              className="min-h-[100px] bg-background/50"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRespond();
                                }}
                                disabled={!response.trim() || sending}
                                className="gap-2"
                              >
                                <Send className="w-4 h-4" />
                                {sending ? 'Enviando...' : 'Responder'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCloseTicket(ticket.id);
                                }}
                                className="gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Fechar ticket
                              </Button>
                            </div>
                          </div>
                        )}

                        {ticket.status === 'answered' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseTicket(ticket.id);
                            }}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Fechar ticket
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
