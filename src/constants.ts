
export const MONTHS_ORDER: Record<string, number> = {
  'janeiro 2025': 1, 'fevereiro 2025': 2, 'março 2025': 3, 'abril 2025': 4,
  'maio 2025': 5, 'junho 2025': 6, 'julho 2025': 7, 'agosto 2025': 8,
  'setembro 2025': 9, 'outubro 2025': 10, 'novembro 2025': 11, 'dezembro 2025': 12,
  'janeiro 2026': 13, 'fevereiro 2026': 14, 'março 2026': 15, 'abril 2026': 16,
  'janeiro/2025': 1, 'fevereiro/2025': 2, 'março/2025': 3, 'abril/2025': 4,
  'maio/2025': 5, 'junho/2025': 6, 'julho/2025': 7, 'agosto/2025': 8,
  'setembro/2025': 9, 'outubro/2025': 10, 'novembro/2025': 11, 'dezembro/2025': 12,
  'janeiro/2026': 13, 'fevereiro/2026': 14, 'março/2026': 15, 'abril/2026': 16
};

export function getMonthMapping(mesRef: string) {
  const clean = normalizeText(mesRef).toLowerCase();
  
  const monthNamesMap: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03', 'abril': '04',
    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };

  const parts = clean.split(' ');
  const mName = parts[0];
  const year = parts[parts.length - 1];
  const mNum = monthNamesMap[mName] || '00';
  
  if (mNum === '00') return null;

  return {
    key: `${year}-${mNum}`,
    label: mesRef
  };
}

export function normalizeText(value: any): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Normaliza nomes de empresas conforme regras de negócio da Etapa 1
 */
export function normalizeCompanyName(name: string): string {
  const normalized = normalizeText(name);
  if (normalized.includes('AMARAL')) return 'AMARAL SAT';
  if (normalized === 'VIA' || normalized.includes('VIA TELECOM')) return 'VIA TELECOM';
  return normalized;
}

/**
 * Classifica a região conforme padrões oficiais (CAPITAL, INTERIOR ou NAO_CLASSIFICADO)
 */
export function classifyRegion(region: any): 'CAPITAL' | 'INTERIOR' | 'NAO_CLASSIFICADO' {
  const norm = normalizeText(region);
  if (norm === 'CAPITAL') return 'CAPITAL';
  if (norm === 'INTERIOR') return 'INTERIOR';
  return 'NAO_CLASSIFICADO';
}

import { UNMappingRule } from './types';

export const INITIAL_UN_MAPPINGS: UNMappingRule[] = [
  { un: "APU-VIA_TELECOM", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "ARA-PRISMA", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "CAB-VIA_TELECOM", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "CPM-AMARALSAT", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "CSC-AMARAL_SAT", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "FNB-EQS", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "FOZ-AMARALSAT", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "LON-EQS", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "LON-PRISMA", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "LON-VIA TELECOM", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "MGA-AMARALSAT", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "MGA-EQS", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "TOL-AMARALSAT", uf: "PR", regiaoPR: "INTERIOR", cluster: "INTERIOR", status: "ATIVA" },
  { un: "ATC-NET_ENERGY", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "CWB-EQS", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "CWB-FFA", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "CWB-FFA_VT", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "CWB-PROCABO", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "CWB-PROCISA", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "CWB-PROCISA_VT", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "CWB-TIME01", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "FZR-NET ENERGY", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "GPV-PRISMA", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "PNIS-NET ENERGY", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "PQA-NET_ENERGY", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "PTG-PRISMA", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "PTG-TIME01", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" },
  { un: "SJP-EQS", uf: "PR", regiaoPR: "CAPITAL", cluster: "CAPITAL", status: "ATIVA" }
];

export function getRegiaoPR(row: any, sheetName: string, mappingRules: UNMappingRule[] = []): 'CAPITAL' | 'INTERIOR' | 'NAO_CLASSIFICADO' {
  const un = normalizeText(row["UNIDADE_NEGOCIO"] || row["UNIDADE NEGOCIO"] || row["UN"]);
  const sheet = normalizeText(sheetName);

  // 1. Check mapping rules first
  const rule = mappingRules.find(r => normalizeText(r.un) === un && r.status === 'ATIVA');
  if (rule) return rule.regiaoPR;

  // 2. Fallback to sheet name if mapping doesn't exist
  if (sheet.includes("INTERIOR")) return "INTERIOR";
  if (sheet.includes("CAPITAL")) return "CAPITAL";

  return "NAO_CLASSIFICADO";
}

export interface CriticalFilters {
  regiao?: string;
  tipoBase?: string;
  empresa?: string;
  statusEmpresa?: string;
}

export function getTecnicosCriticos(data: any[], _config?: any, filters?: CriticalFilters) {
  let filtered = data;
  if (filters) {
    if (filters.regiao && filters.regiao !== 'TODAS') {
       filtered = filtered.filter(d => d && normalizeText(d.REGIAO_PR || '') === normalizeText(filters.regiao));
    }
    if (filters.tipoBase && filters.tipoBase !== 'TODAS') {
       filtered = filtered.filter(d => d && d.TIPO_BASE === filters.tipoBase);
    }
    if (filters.empresa && filters.empresa !== 'TODAS') {
       filtered = filtered.filter(d => d && (d.EMPRESA_NORMALIZADA === filters.empresa || d.EMPRESA === filters.empresa));
    }
    if (filters.statusEmpresa && filters.statusEmpresa !== 'TODAS') {
       filtered = filtered.filter(d => d && d.STATUS_EMPRESA === filters.statusEmpresa);
    }
  }

  const techMap: Record<string, any[]> = {};
  filtered.forEach(d => {
    const key = `${d.LOGIN_TECNICO}_${d.TIPO_BASE}`;
    if (!techMap[key]) techMap[key] = [];
    techMap[key].push(d);
  });

  const criticals: any[] = [];
  const MESES_CONSECUTIVOS_CRITICO = 2;

  Object.entries(techMap).forEach(([login, records]) => {
    const sorted = records.sort((a, b) => {
      const mesA = (a.MES_REF || '').toString().toLowerCase();
      const mesB = (b.MES_REF || '').toString().toLowerCase();
      const orderA = MONTHS_ORDER[mesA] || 0;
      const orderB = MONTHS_ORDER[mesB] || 0;
      return orderA - orderB;
    });

    if (sorted.length === 0) return;

    let currentConsecutiveFail = 0;
    sorted.forEach(r => {
      if (!r.isCertified) {
        currentConsecutiveFail++;
      } else {
        currentConsecutiveFail = 0;
      }
    });

    const lastMonth = sorted[sorted.length - 1];
    if (lastMonth && currentConsecutiveFail >= MESES_CONSECUTIVOS_CRITICO) {
      criticals.push({
        login,
        records: sorted,
        consecutiveFails: currentConsecutiveFail,
        lastMonth
      });
    }
  });

  return criticals;
}

