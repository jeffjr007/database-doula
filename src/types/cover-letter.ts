export interface CoverLetterFormData {
  nome: string;
  idade: string;
  localizacao: string;
  profissao: string;
  estadoCivil: string;
  interesses: string;
  softSkills: string;
  hardSkills: string;
  ultimoCargo: string;
  cargosInteresse: string;
  cvAnalysis: string; // CV texto extraído
}

export interface CoverLetterModel {
  tipo: 'completa' | 'objetiva' | 'tecnica';
  titulo: string;
  descricao: string;
  conteudo: string;
  cta: string;
}

export interface CoverLetterData {
  formData: CoverLetterFormData;
  modelos: CoverLetterModel[];
}
