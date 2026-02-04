import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InviteCodeManager } from '@/components/admin/InviteCodeManager';
import { MenteeList } from '@/components/admin/MenteeList';
import { MenteeDetail } from '@/components/admin/MenteeDetail';
import { TicketManager } from '@/components/admin/TicketManager';
import { StageProgressTracker } from '@/components/admin/StageProgressTracker';
import { ArrowLeft, Users, Ticket, Shield, MessageSquare, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [selectedMentee, setSelectedMentee] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>);
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
            <Logo size="sm" />
            <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /><span className="font-display font-semibold text-foreground">Painel Admin</span></div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
          {selectedMentee ? (
            <MenteeDetail menteeId={selectedMentee.id} menteeName={selectedMentee.name} onBack={() => setSelectedMentee(null)} />
          ) : (
            <Tabs defaultValue="progress" className="space-y-6">
              <TabsList className="bg-secondary/30 p-1">
                <TabsTrigger value="progress" className="gap-2"><BarChart3 className="w-4 h-4" />Progresso</TabsTrigger>
                <TabsTrigger value="mentees" className="gap-2"><Users className="w-4 h-4" />Mentorados</TabsTrigger>
                <TabsTrigger value="tickets" className="gap-2"><MessageSquare className="w-4 h-4" />Tickets</TabsTrigger>
                <TabsTrigger value="invites" className="gap-2"><Ticket className="w-4 h-4" />Convites</TabsTrigger>
              </TabsList>
              <TabsContent value="progress">
                <div className="space-y-4">
                  <div><h2 className="text-2xl font-display font-bold text-foreground">Progresso das Etapas</h2><p className="text-muted-foreground text-sm">Visualize em qual etapa cada mentorado está atualmente.</p></div>
                  <StageProgressTracker />
                </div>
              </TabsContent>
              <TabsContent value="mentees">
                <div className="space-y-4">
                  <div><h2 className="text-2xl font-display font-bold text-foreground">Mentorados</h2><p className="text-muted-foreground text-sm">Gerencie os entregáveis e progresso de cada mentorado.</p></div>
                  <MenteeList onSelectMentee={(id, name) => setSelectedMentee({ id, name })} />
                </div>
              </TabsContent>
              <TabsContent value="tickets">
                <div className="space-y-4">
                  <div><h2 className="text-2xl font-display font-bold text-foreground">Tickets de Suporte</h2><p className="text-muted-foreground text-sm">Responda às dúvidas dos mentorados.</p></div>
                  <TicketManager />
                </div>
              </TabsContent>
              <TabsContent value="invites">
                <div className="space-y-4">
                  <div><h2 className="text-2xl font-display font-bold text-foreground">Códigos de Convite</h2><p className="text-muted-foreground text-sm">Gere códigos únicos para novos mentorados se cadastrarem.</p></div>
                  <InviteCodeManager />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
