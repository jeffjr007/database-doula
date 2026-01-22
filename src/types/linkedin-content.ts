// Types for Stage 7: Esteira de Conteúdos

export type ContentType = 'inspiracao' | 'enquete' | 'dicas_rapidas' | 'como_resolver';

export interface ContentTheme {
  id: string;
  title: string;
  description: string;
  selected?: boolean;
}

export interface GeneratedPost {
  id: string;
  type: ContentType;
  headline: string;
  content: string;
  created_at: string;
  theme?: string;
  scheduled_for?: string;
  copied?: boolean;
}

export interface EnquetePost extends GeneratedPost {
  type: 'enquete';
  question: string;
  options: string[]; // max 4, each max 30 chars
}

export interface ContentSession {
  id: string;
  user_id: string;
  content_type: ContentType;
  reference_content: string;
  themes: ContentTheme[];
  generated_posts: GeneratedPost[];
  created_at: string;
}

export interface WeeklyCalendar {
  week_number: number;
  phase: 1 | 2;
  days: {
    day: 1 | 2 | 3 | 4 | 5;
    day_name: string;
    slots: {
      time: string;
      post?: GeneratedPost;
    }[];
  }[];
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  inspiracao: 'Inspiração',
  enquete: 'Enquete',
  dicas_rapidas: 'Dicas Rápidas',
  como_resolver: 'Como Resolver',
};

export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  inspiracao: 'bg-purple-500/20 text-purple-700 border-purple-300',
  enquete: 'bg-green-500/20 text-green-700 border-green-300',
  dicas_rapidas: 'bg-blue-500/20 text-blue-700 border-blue-300',
  como_resolver: 'bg-orange-500/20 text-orange-700 border-orange-300',
};

export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  inspiracao: '✨',
  enquete: '📊',
  dicas_rapidas: '💡',
  como_resolver: '🎯',
};

// Phase 1 - Week 1 structure
export const PHASE_1_SCHEDULE: Record<number, ContentType[]> = {
  1: ['inspiracao', 'enquete', 'dicas_rapidas'],
  2: ['enquete', 'como_resolver', 'como_resolver'],
  3: ['enquete', 'como_resolver', 'como_resolver'],
  4: ['enquete', 'como_resolver', 'como_resolver'],
  5: ['como_resolver', 'enquete', 'enquete'],
};

// Phase 2 - Week 2+ structure
export const PHASE_2_SCHEDULE: Record<number, ContentType[]> = {
  1: ['como_resolver', 'como_resolver', 'enquete'],
  2: ['como_resolver', 'enquete', 'como_resolver'],
  3: ['como_resolver', 'enquete', 'como_resolver'],
  4: ['como_resolver', 'como_resolver', 'enquete'],
  5: ['como_resolver', 'como_resolver', 'enquete'],
};

// Posting times
export const POSTING_TIMES = ['09:02', '11:04', '14:06'];
