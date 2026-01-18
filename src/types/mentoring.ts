export interface StageStep {
  id: string;
  title: string;
  description?: string;
  type: 'intro' | 'collect' | 'process' | 'output' | 'confirm';
  collectField?: string;
  prompt?: string;
}

export interface StageConfig {
  number: number;
  title: string;
  description: string;
  steps: StageStep[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface MentoringProgress {
  id: string;
  user_id: string;
  stage_number: number;
  current_step: number;
  completed: boolean;
  stage_data: Record<string, any>;
}

export interface CollectedData {
  id: string;
  user_id: string;
  data_type: string;
  data_content: any;
  stage_number?: number;
}

// Stage 4: Convencer Recrutador
export const STAGE_4_CONFIG: StageConfig = {
  number: 4,
  title: "Como Convencer um Recrutador",
  description: "Vamos montar seu roteiro de entrevista usando uma metodologia que conecta suas experiências com o que a vaga realmente pede.",
  steps: [
    {
      id: 'intro',
      title: 'Introdução',
      type: 'intro',
    },
    {
      id: 'job_description',
      title: 'Descrição da Vaga',
      type: 'collect',
      collectField: 'job_description',
    },
    {
      id: 'analyze_keywords',
      title: 'Análise de Palavras-chave',
      type: 'process',
    },
    {
      id: 'distribute_keywords',
      title: 'Distribuir Palavras-chave',
      type: 'process',
    },
    {
      id: 'create_script',
      title: 'Criar Roteiro',
      type: 'output',
    },
    {
      id: 'transitions',
      title: 'Transições entre Experiências',
      type: 'output',
    },
    {
      id: 'closing_questions',
      title: 'Perguntas de Fechamento',
      type: 'output',
    },
    {
      id: 'confirm',
      title: 'Confirmar Conclusão',
      type: 'confirm',
    },
  ],
};

// Stage 5: Convencer Gestor
export const STAGE_5_CONFIG: StageConfig = {
  number: 5,
  title: "Como Convencer um Gestor",
  description: "Agora vamos intensificar seu roteiro e transformá-lo em uma apresentação visual que vai te diferenciar.",
  steps: [
    {
      id: 'intro',
      title: 'Introdução',
      type: 'intro',
    },
    {
      id: 'intensify_how',
      title: 'Intensificar o COMO',
      type: 'process',
    },
    {
      id: 'create_presentation',
      title: 'Criar Apresentação',
      type: 'output',
    },
    {
      id: 'presentation_intro',
      title: 'Como Introduzir a Apresentação',
      type: 'output',
    },
    {
      id: 'closing_strategy',
      title: 'Estratégia de Fechamento',
      type: 'output',
    },
    {
      id: 'confirm',
      title: 'Confirmar Conclusão',
      type: 'confirm',
    },
  ],
};

// Stage 6: Estratégias Gupy
export const STAGE_6_CONFIG: StageConfig = {
  number: 6,
  title: "Revisão e Estratégias da Gupy",
  description: "Vamos otimizar seu currículo da Gupy para passar no ATS e aumentar suas chances de ser chamado.",
  steps: [
    {
      id: 'intro',
      title: 'Introdução',
      type: 'intro',
    },
    {
      id: 'optimize_courses',
      title: 'Otimizar Nomenclatura dos Cursos',
      type: 'process',
    },
    {
      id: 'experiences',
      title: 'Experiências Profissionais',
      type: 'process',
    },
    {
      id: 'achievements',
      title: 'Conquistas e Certificações',
      type: 'process',
    },
    {
      id: 'skills',
      title: 'Habilidades',
      type: 'process',
    },
    {
      id: 'customize_application',
      title: 'Personalizar Candidatura',
      type: 'process',
    },
    {
      id: 'confirm',
      title: 'Confirmar Conclusão',
      type: 'confirm',
    },
  ],
};

export const getStageConfig = (stageNumber: number): StageConfig | null => {
  switch (stageNumber) {
    case 4: return STAGE_4_CONFIG;
    case 5: return STAGE_5_CONFIG;
    case 6: return STAGE_6_CONFIG;
    default: return null;
  }
};
