import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, FileText, Target, ChevronRight, CheckCircle, Clock, AlertCircle, Trash2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface Mentee {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  linkedin_diagnostic: {
    status: string;
  } | null;
  opportunity_funnel: {
    status: string;
  } | null;
  mentoring_progress: {
    stage_number: number;
    completed: boolean;
  }[];
}

interface MenteeListProps {
  onSelectMentee: (menteeId: string, menteeName: string) => void;
}

export const MenteeList = ({ onSelectMentee }: MenteeListProps) => {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menteeToDelete, setMenteeToDelete] = useState<Mentee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMentees();
  }, []);

  const fetchMentees = async () => {
    try {
      // First get all admin user_ids to exclude them
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = (adminRoles || []).map(r => r.user_id);

      // Get all profiles (users) excluding admins
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Filter out admin profiles
      const nonAdminProfiles = (profiles || []).filter(
        profile => !adminUserIds.includes(profile.user_id)
      );

      // Get diagnostics and funnels for each user
      const menteesWithData = await Promise.all(
        nonAdminProfiles.map(async (profile) => {
          const [diagnosticResult, funnelResult, progressResult] = await Promise.all([
            supabase
              .from('linkedin_diagnostics')
              .select('status')
              .eq('user_id', profile.user_id)
              .maybeSingle(),
            supabase
              .from('opportunity_funnels')
              .select('status')
              .eq('user_id', profile.user_id)
              .maybeSingle(),
            supabase
              .from('mentoring_progress')
              .select('stage_number, completed')
              .eq('user_id', profile.user_id),
          ]);

          return {
            ...profile,
            linkedin_diagnostic: diagnosticResult.data,
            opportunity_funnel: funnelResult.data,
            mentoring_progress: progressResult.data || [],
          };
        })
      );

      setMentees(menteesWithData);
    } catch (error) {
      console.error('Error fetching mentees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, mentee: Mentee) => {
    e.stopPropagation(); // Prevent card click
    setMenteeToDelete(mentee);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!menteeToDelete) return;

    setDeleting(true);
    try {
      // Delete only the admin-related data (deliverables), NOT the user account
      // This removes the mentee from the admin panel view without deleting their actual account
      
      // Delete linkedin diagnostics created by admin for this user
      await supabase
        .from('linkedin_diagnostics')
        .delete()
        .eq('user_id', menteeToDelete.user_id);

      // Delete opportunity funnels created by admin for this user
      await supabase
        .from('opportunity_funnels')
        .delete()
        .eq('user_id', menteeToDelete.user_id);

      // Delete mentoring progress
      await supabase
        .from('mentoring_progress')
        .delete()
        .eq('user_id', menteeToDelete.user_id);

      // Delete collected data
      await supabase
        .from('collected_data')
        .delete()
        .eq('user_id', menteeToDelete.user_id);

      // Delete chat messages
      await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', menteeToDelete.user_id);

      // Reset the profile to initial state (deactivate platform, clear learning path)
      await supabase
        .from('profiles')
        .update({
          platform_activated: false,
          stage2_unlocked: false,
          stage2_completed: false,
          stage3_unlocked: false,
          learning_path: null,
        })
        .eq('user_id', menteeToDelete.user_id);

      // Remove from local state
      setMentees(prev => prev.filter(m => m.id !== menteeToDelete.id));

      toast({
        title: "Mentorado removido",
        description: `Os dados de ${menteeToDelete.full_name || 'mentorado'} foram removidos do painel admin. A conta do usuário permanece ativa.`,
      });
    } catch (error: any) {
      console.error('Error removing mentee data:', error);
      toast({
        title: "Erro ao remover",
        description: error.message || "Ocorreu um erro ao remover os dados do mentorado.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setMenteeToDelete(null);
    }
  };

  const getStageStatus = (mentee: Mentee, stageNumber: number) => {
    if (stageNumber === 1) {
      if (mentee.linkedin_diagnostic?.status === 'published') return 'published';
      if (mentee.linkedin_diagnostic) return 'draft';
      return 'pending';
    }
    if (stageNumber === 3) {
      if (mentee.opportunity_funnel?.status === 'published') return 'published';
      if (mentee.opportunity_funnel) return 'draft';
      return 'pending';
    }
    const progress = mentee.mentoring_progress.find(p => p.stage_number === stageNumber);
    if (progress?.completed) return 'completed';
    if (progress) return 'in_progress';
    return 'not_started';
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      published: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/20', label: 'Publicado' },
      draft: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/20', label: 'Rascunho' },
      pending: { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pendente' },
      completed: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/20', label: 'Concluído' },
      in_progress: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/20', label: 'Em progresso' },
      not_started: { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Não iniciado' },
    }[status] || { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: status };

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando mentorados...
      </div>
    );
  }

  if (mentees.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-display font-semibold text-foreground mb-2">
          Nenhum mentorado ainda
        </h3>
        <p className="text-sm text-muted-foreground">
          Gere códigos de convite para seus mentorados se cadastrarem.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <AnimatePresence>
          {mentees.map((mentee, index) => (
            <motion.div
              key={mentee.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group relative"
              onClick={() => onSelectMentee(mentee.user_id, mentee.full_name || 'Sem nome')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground">
                      {mentee.full_name || 'Sem nome'}
                    </h4>
                    {/* Email display */}
                    {mentee.email && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{mentee.email}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Desde {new Date(mentee.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteClick(e, mentee)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              {/* Stage status indicators */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">E1:</span>
                  <StatusBadge status={getStageStatus(mentee, 1)} />
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">E2:</span>
                  <StatusBadge status={getStageStatus(mentee, 2)} />
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">E3:</span>
                  <StatusBadge status={getStageStatus(mentee, 3)} />
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">E4-6:</span>
                  <StatusBadge status={getStageStatus(mentee, 4)} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover mentorado do painel?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Isso irá remover <strong>{menteeToDelete?.full_name || 'este mentorado'}</strong> do painel administrativo e resetar seus dados de progresso.
              </p>
              <p className="text-amber-500 font-medium">
                ⚠️ A conta do usuário NÃO será excluída. Ele ainda poderá fazer login, mas precisará de um novo código de ativação.
              </p>
              <p>
                Esta ação removerá:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Diagnóstico LinkedIn</li>
                <li>Funil de Oportunidades</li>
                <li>Progresso nas etapas</li>
                <li>Dados coletados</li>
                <li>Histórico de chat</li>
                <li>Trilha de desenvolvimento</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Removendo...' : 'Remover do Painel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
