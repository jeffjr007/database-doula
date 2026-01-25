import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Circle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenteeProgress {
  userId: string;
  name: string;
  email: string;
  currentStage: number;
  stages: {
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
    5: boolean;
    6: boolean;
    7: boolean;
  };
}

const STAGE_LABELS = [
  'Diagnóstico',
  'CV & Carta',
  'Funil',
  'Entrevista',
  'Simulado',
  'Gupy',
  'LinkedIn'
];

export const StageProgressTracker = () => {
  const [mentees, setMentees] = useState<MenteeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenteesProgress();
  }, []);

  const fetchMenteesProgress = async () => {
    try {
      // Get all non-admin users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminUserIds = adminRoles?.map(r => r.user_id) || [];

      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      if (!profiles) {
        setMentees([]);
        setLoading(false);
        return;
      }

      // Filter out admins
      const menteeProfiles = profiles.filter(p => !adminUserIds.includes(p.user_id));

      // Get all opportunity funnels
      const { data: funnels } = await supabase
        .from('opportunity_funnels')
        .select('user_id, status');

      // Get all interview history
      const { data: interviews } = await supabase
        .from('interview_history')
        .select('user_id');

      // Get all mentoring progress (for stage 5 and 6 completion)
      const { data: progress } = await supabase
        .from('mentoring_progress')
        .select('user_id, stage_number, completed');

      // Get all linkedin posts from collected_data
      const { data: linkedinPosts } = await supabase
        .from('collected_data')
        .select('user_id')
        .eq('data_type', 'linkedin_posts');

      // Build mentee progress data
      const menteeProgressList: MenteeProgress[] = menteeProfiles.map(profile => {
        const userId = profile.user_id;
        
        // Stage 1: Everyone who has access starts at stage 1
        const stage1 = profile.platform_activated || true;
        
        // Stage 2: Check if stage2_unlocked is true
        const stage2 = profile.stage2_unlocked === true;
        
        // Stage 3: Check if opportunity_funnels exists for user
        const hasFunnel = funnels?.some(f => f.user_id === userId);
        const stage3 = hasFunnel || false;
        
        // Stage 4: Check if interview_history exists
        const hasInterview = interviews?.some(i => i.user_id === userId);
        const stage4 = hasInterview || false;
        
        // Stage 5: Check mentoring_progress for stage 5 completed
        const stage5Completed = progress?.some(p => p.user_id === userId && p.stage_number === 5 && p.completed);
        const stage5 = stage5Completed || false;
        
        // Stage 6: Check mentoring_progress for stage 6 completed
        const stage6Completed = progress?.some(p => p.user_id === userId && p.stage_number === 6 && p.completed);
        const stage6 = stage6Completed || false;
        
        // Stage 7: Check if linkedin_posts exists
        const hasLinkedinPosts = linkedinPosts?.some(lp => lp.user_id === userId);
        const stage7 = hasLinkedinPosts || false;

        // Calculate current stage (highest completed + 1, max 7)
        let currentStage = 1;
        if (stage7) currentStage = 7;
        else if (stage6) currentStage = 7;
        else if (stage5) currentStage = 6;
        else if (stage4) currentStage = 5;
        else if (stage3) currentStage = 4;
        else if (stage2) currentStage = 3;
        else currentStage = 1;

        return {
          userId,
          name: profile.full_name || 'Sem nome',
          email: profile.email || '',
          currentStage,
          stages: {
            1: stage1,
            2: stage2,
            3: stage3,
            4: stage4,
            5: stage5,
            6: stage6,
            7: stage7
          }
        };
      });

      // Sort by current stage (descending) then by name
      menteeProgressList.sort((a, b) => {
        if (b.currentStage !== a.currentStage) {
          return b.currentStage - a.currentStage;
        }
        return a.name.localeCompare(b.name);
      });

      setMentees(menteeProgressList);
    } catch (error) {
      console.error('Error fetching mentee progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (mentees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum mentorado encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stage labels */}
      <div className="hidden md:grid grid-cols-[200px_1fr] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground">
        <div>Mentorado</div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {STAGE_LABELS.map((label, idx) => (
            <div key={idx} className="truncate">
              {idx + 1}. {label}
            </div>
          ))}
        </div>
      </div>

      {/* Mentee rows */}
      {mentees.map((mentee, index) => (
        <motion.div
          key={mentee.userId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="bg-secondary/30 border border-border/50 rounded-xl p-4 hover:bg-secondary/50 transition-colors"
        >
          {/* Desktop view */}
          <div className="hidden md:grid grid-cols-[200px_1fr] gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{mentee.name}</p>
                <p className="text-xs text-muted-foreground truncate">{mentee.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((stage) => (
                <div key={stage} className="flex justify-center">
                  <StageIndicator 
                    completed={mentee.stages[stage as keyof typeof mentee.stages]} 
                    current={mentee.currentStage === stage}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{mentee.name}</p>
                <p className="text-xs text-muted-foreground">Etapa atual: {mentee.currentStage}</p>
              </div>
            </div>
            <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((stage) => (
                <div key={stage} className="flex flex-col items-center gap-1">
                  <StageIndicator 
                    completed={mentee.stages[stage as keyof typeof mentee.stages]} 
                    current={mentee.currentStage === stage}
                    small
                  />
                  <span className="text-[10px] text-muted-foreground">{stage}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

interface StageIndicatorProps {
  completed: boolean;
  current: boolean;
  small?: boolean;
}

const StageIndicator = ({ completed, current, small }: StageIndicatorProps) => {
  const size = small ? 'w-5 h-5' : 'w-6 h-6';
  
  if (completed) {
    return (
      <div className={cn(
        "rounded-full flex items-center justify-center",
        current ? "bg-primary text-primary-foreground" : "bg-accent/30 text-accent"
      )}>
        <CheckCircle2 className={size} />
      </div>
    );
  }
  
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center",
      current ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
    )}>
      <Circle className={size} />
    </div>
  );
};
