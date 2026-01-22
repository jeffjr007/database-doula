export interface CVData {
  // Personal info
  nome: string;
  cargos: string;
  telefone: string;
  email: string;
  linkedin: string;

  // CV sections
  sumario: {
    paragrafos: string[];
    bullets: string[];
  };
  sistemas: string[];
  skills: string[];
  competencias: string[];
  realizacoes: string[];
  educacao: EducacaoItem[];
  experiencias: ExperienciaItem[];
}

export interface EducacaoItem {
  curso: string;
  instituicao: string;
}

export interface ExperienciaItem {
  empresa: string;
  cargo: string;
  periodo: string;
  bullets: string[];
}
