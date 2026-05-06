export interface TechnicianRecord {
  NM_GRUPO_REGIONAL: string;
  EMPRESA: string;
  SEGMENTO: string;
  UNIDADE_NEGOCIO: string;
  LOGIN_TECNICO: string;
  PERCENT_TC: number; // % TC
  QTDE_WOS: number;
  QTDE_OSS: number;
  QTDE_REV: number;
  PROD: number;
  GAP_PROD: number;
  PERCENT_REV: number; // % REV
  GAP_REV: number;
  PERCENT_CUMP_AGENDA: number; // % CUMP. AGENDA
  GAP_CUMP_AGENDA: number;
  MEDIA_DIAS_TRABALHADOS: number;
  MES_REF: string; // From tab name
  TIPO_BASE: 'SAFRA' | 'VETERANO' | 'VETERANO_EM_SAFRA'; 
  REGIAO_PR: 'INTERIOR' | 'CAPITAL' | 'NAO_CLASSIFICADO';
  
  // Calculated fields (per month)
  isCertified: boolean;
  classification: 'CERTIFICADO' | 'QUASE CERTIFICADO' | 'NÃO CERTIFICADO' | 'SEM VOLUME';
  
  // Validation fields
  isMappedCompany: boolean;
  STATUS_EMPRESA: 'MAPEADA' | 'NAO_MAPEADA';
  EMPRESA_ORIGINAL: string;
  EMPRESA_NORMALIZADA: string;
  notCertifiedReasons: string[];
  isLowVolume: boolean;
  score: number; // 0, 40, 70, 100
  
  // Diagnostic fields (for modals)
  recommendedAction?: string;
  recoveryProbability?: 'Alta' | 'Média' | 'Baixa';
  mainFailure?: string;
}

export interface UNMappingRule {
  un: string;
  uf: string;
  regiaoPR: 'CAPITAL' | 'INTERIOR' | 'NAO_CLASSIFICADO';
  cluster: string;
  status: 'ATIVA' | 'INATIVA';
}

export interface AppConfig {
  normalizationRules: NormalizationRule[];
  knownCompanies: string[];
  unMappingRules: UNMappingRule[];
}

export interface NormalizationRule {
  id: string;
  pattern: string;
  replacement: string;
  status: 'ATIVA' | 'INATIVA';
}

export type MonthlyStatus = 'CERTIFICADO' | 'NÃO CERTIFICADO' | 'SEM VOLUME SUFICIENTE';
export type ConsolidatedStatus = 'CERTIFICADO' | 'EM ATENÇÃO' | 'CRÍTICO' | 'ENCERRADO SEM CERTIFICAÇÃO' | 'SEM VOLUME SUFICIENTE';

export interface ConsolidatedTechnician {
  login: string;
  empresa: string;
  unidadeNegocio: string;
  segmento: string;
  primeiroMes: string;
  ultimoMes: string;
  mesesAvaliados: string[];
  mesesCertificados: number;
  mesesSemCertificar: number;
  sequenciaConsecutiva: number;
  statusConsolidado: ConsolidatedStatus;
  principalMotivo: string;
}

export interface MonthlyStats {
  mes: string;
  empresa?: string;
  totalTecnicos: number;
  certificados: number;
  naoCertificados: number;
  atencao?: number;
  criticos?: number;
  encerrados?: number;
  semVolume?: number;
  taxaCertificacao: number;
  mediaRevisita: number;
  mediaAgenda: number;
  mediaProdutividade: number;
}

export interface PartnerStats {
  empresa: string;
  totalTecnicosUnicos: number;
  taxaCertificacao: number;
  percentAtencao: number;
  percentCriticos: number;
  percentEncerrados: number;
  mediaRevisita: number;
  mediaAgenda: number;
  mediaProdutividade: number;
  tendencia: 'Melhorando' | 'Estável' | 'Piorando';
}
