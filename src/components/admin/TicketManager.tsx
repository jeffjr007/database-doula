import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User, Phone, Mail, Clock, CheckCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ticket {
  id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  user_email?: string;
}

export const TicketManager = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
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

          return {
            ...ticket,
            profile: profile || { full_name: null, phone: null },
            user_email: 'Carregando...'
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

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
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
        description: "O ticket foi marcado como resolvido.",
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
      case 'closed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Resolvido</Badge>;
      default:
        return null;
    }
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as WhatsApp link
    return digits;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open');
  const closedTickets = tickets.filter(t => t.status === 'closed');

  return (
    <div className="space-y-6">
      {/* Open Tickets */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Tickets Abertos ({openTickets.length})
        </h3>
        
        {openTickets.length === 0 ? (
          <Card className="p-6 text-center bg-secondary/30 border-border/50">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum ticket pendente!</p>
          </Card>
        ) : (
          <AnimatePresence>
            {openTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-5 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
                  {/* Header with status */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-foreground">
                          {ticket.profile?.full_name || 'Nome não disponível'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(ticket.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>

                  {/* Contact info - easy to copy */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {ticket.profile?.phone && (
                      <button
                        onClick={() => handleCopy(formatPhone(ticket.profile?.phone) || '', `phone-${ticket.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors group text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-[#25D366]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">WhatsApp</p>
                          <p className="font-mono text-sm text-foreground truncate">{ticket.profile.phone}</p>
                        </div>
                        <Copy className={`w-4 h-4 transition-colors ${copiedField === `phone-${ticket.id}` ? 'text-green-500' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      </button>
                    )}

                    <button
                      onClick={() => handleCopy(ticket.user_email || '', `email-${ticket.id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-mono text-sm text-foreground truncate">{ticket.user_email}</p>
                      </div>
                      <Copy className={`w-4 h-4 transition-colors ${copiedField === `email-${ticket.id}` ? 'text-green-500' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    </button>
                  </div>

                  {/* Message */}
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Dúvida:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <a
                      href={`https://wa.me/${formatPhone(ticket.profile?.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#25D366]/90 text-white text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Abrir WhatsApp
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseTicket(ticket.id)}
                      className="gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar como Resolvido
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Closed Tickets */}
      {closedTickets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Tickets Resolvidos ({closedTickets.length})
          </h3>
          
          <div className="space-y-2">
            {closedTickets.slice(0, 5).map((ticket) => (
              <Card key={ticket.id} className="p-4 bg-secondary/20 border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {ticket.profile?.full_name || 'Nome não disponível'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {ticket.message}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tickets.length === 0 && (
        <Card className="p-8 text-center bg-secondary/30 border-border/50">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum ticket ainda</h3>
          <p className="text-sm text-muted-foreground">
            Os tickets dos mentorados aparecerão aqui.
          </p>
        </Card>
      )}
    </div>
  );
};
