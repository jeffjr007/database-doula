export interface ATSCVData {
  // Personal info
  nome: string;
  telefone: string;
  localizacao: string;
  email: string;
  linkedin: string;
  nacionalidade: string;
  idade: string;

  // Experiences - copied exactly as provided
  experiencias: ATSExperienciaItem[];

  // Education & Certifications
  educacao: ATSEducacaoItem[];

  // Languages
  idiomas: IdiomaItem[];
}

export interface ATSExperienciaItem {
  empresa: string;
  localizacao: string;
  cargo: string;
  periodo: string;
  bullets: string[];
}

export interface ATSEducacaoItem {
  instituicao: string;
  curso: string;
}

export interface IdiomaItem {
  idioma: string;
  nivel: string;
}
