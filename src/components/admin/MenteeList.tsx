import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, FileText, Target, ChevronRight, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Mentee {
  id: string;
  user_id: string;
  full_name: string | null;
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
  const [deletingMentee, setDeletingMentee] = useState<string | null>(null);

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

  const handleClearMenteeData = async (menteeUserId: string, menteeName: string) => {
    setDeletingMentee(menteeUserId);
    try {
      // Delete data from all tables (same as delete-account but without deleting the user)
      await Promise.all([
        supabase.from('chat_messages').delete().eq('user_id', menteeUserId),
        supabase.from('collected_data').delete().eq('user_id', menteeUserId),
        supabase.from('interview_history').delete().eq('user_id', menteeUserId),
        supabase.from('learning_paths').delete().eq('user_id', menteeUserId),
        supabase.from('linkedin_diagnostics').delete().eq('user_id', menteeUserId),
        supabase.from('mentoring_progress').delete().eq('user_id', menteeUserId),
        supabase.from('opportunity_funnels').delete().eq('user_id', menteeUserId),
        supabase.from('saved_cover_letters').delete().eq('user_id', menteeUserId),
        supabase.from('saved_cvs').delete().eq('user_id', menteeUserId),
        supabase.from('support_tickets').delete().eq('user_id', menteeUserId),
      ]);

      // Reset profile flags but keep user info
      await supabase
        .from('profiles')
        .update({
          platform_activated: false,
          stage2_completed: false,
          stage2_unlocked: false,
          stage3_unlocked: false,
          learning_path: null,
        })
        .eq('user_id', menteeUserId);

      toast.success(`Dados de ${menteeName} limpos com sucesso!`);
      fetchMentees();
    } catch (error) {
      console.error('Error clearing mentee data:', error);
      toast.error('Erro ao limpar dados do mentorado');
    } finally {
      setDeletingMentee(null);
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
    <div className="space-y-4">
      {mentees.map((mentee, index) => (
        <motion.div
          key={mentee.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-4 flex-1 cursor-pointer"
              onClick={() => onSelectMentee(mentee.user_id, mentee.full_name || 'Sem nome')}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground">
                  {mentee.full_name || 'Sem nome'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Desde {new Date(mentee.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar dados do mentorado</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Você está prestes a limpar todos os dados de <strong>{mentee.full_name || 'Sem nome'}</strong>.
                      </p>
                      <p className="text-sm">
                        Isso irá excluir: progresso, CVs, cartas, entrevistas, diagnósticos e funis.
                        O usuário continuará ativo e poderá recomeçar do zero.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => handleClearMenteeData(mentee.user_id, mentee.full_name || 'Sem nome')}
                      disabled={deletingMentee === mentee.user_id}
                    >
                      {deletingMentee === mentee.user_id ? 'Limpando...' : 'Limpar dados'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <ChevronRight 
                className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all cursor-pointer" 
                onClick={() => onSelectMentee(mentee.user_id, mentee.full_name || 'Sem nome')}
              />
            </div>
          </div>

          {/* Stage status indicators */}
          <div 
            className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 cursor-pointer"
            onClick={() => onSelectMentee(mentee.user_id, mentee.full_name || 'Sem nome')}
          >
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
    </div>
  );
};