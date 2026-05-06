import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp,
  Calendar,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';
import { MONTHS_ORDER } from '../constants';

// Helper to format short month names
const formatShortMonth = (monthStr: string) => {
  if (!monthStr) return '';
  const parts = monthStr.split(/[\/\s]/);
  if (parts.length < 2) return monthStr;
  const month = parts[0].substring(0, 3);
  const year = parts[1].substring(2);
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  return `${monthLabel}/${year}`;
};

// Full month name for tooltip
const formatFullMonth = (monthStr: string) => {
  const parts = monthStr.split(/[\/\s]/);
  if (parts.length < 2) return monthStr;
  const month = parts[0];
  const year = parts[1];
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  return `${monthLabel} ${year}`;
};

const CustomTooltip = ({ active, payload, companyLabel }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { 
      monthLabel, 
      m1,
      m2,
      m3,
      perdaM1, 
      perdaM2,
      viraramVeterano, 
      aguardando,
      naoViraram
    } = data;

    const total = m1 + m2 + m3 + perdaM1 + perdaM2 + viraramVeterano + aguardando + naoViraram;

    return (
      <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 min-w-[280px]">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
             {monthLabel}
          </p>
          <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold text-slate-400 uppercase">
            {companyLabel || 'Geral'}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Técnicos em Análise:</span>
            <span className="text-sm font-black text-white">{total}</span>
          </div>

          <div className="h-px bg-white/5 my-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-[10px] text-slate-300 font-bold uppercase">M1 (Novas Entradas):</span>
            </div>
            <span className="text-xs font-black text-white">{m1}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <span className="text-[10px] text-slate-300 font-bold uppercase">M2 (Continuaram M1):</span>
            </div>
            <span className="text-xs font-black text-white">{m2}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-[10px] text-slate-300 font-bold uppercase">M3 (Continuaram M2):</span>
            </div>
            <span className="text-xs font-black text-white">{m3}</span>
          </div>

          <div className="h-px bg-white/5 my-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-[10px] text-slate-300 font-bold uppercase">Saída M1 (Churn M1):</span>
            </div>
            <span className="text-xs font-black text-red-300">{perdaM1}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span className="text-[10px] text-slate-300 font-bold uppercase">Saída M2 (Churn M2):</span>
            </div>
            <span className="text-xs font-black text-red-500">{perdaM2}</span>
          </div>

          <div className="h-px bg-white/5 my-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-300 font-bold uppercase">Viraram Veterano:</span>
            </div>
            <span className="text-xs font-black text-emerald-400">{viraramVeterano}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-[10px] text-slate-300 font-bold uppercase">Aguardando Transição:</span>
            </div>
            <span className="text-xs font-black text-indigo-300">{aguardando}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-slate-300 font-bold uppercase">Não Evoluiu:</span>
            </div>
            <span className="text-xs font-black text-amber-500">{naoViraram}</span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-black uppercase italic">Fluxo:</span>
              <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                Operational Real-time tracking
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};


interface SafraContinuityProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

type TechJourneyStatus = 
  | 'EM_SAFRA_M1' 
  | 'EM_SAFRA_M2' 
  | 'PERDA_M1' 
  | 'PERDA_M2' 
  | 'VIROU_VETERANO' 
  | 'VIROU_VETERANO_EM_SAFRA'
  | 'AGUARDA_TRANSICAO' 
  | 'NAO_VIROU_APOS_M3' 
  | 'STATUS_INVALIDO';

interface TechnicianJourney {
  login: string;
  empresa: string;
  un: string;
  regiao: string;
  firstMonth: string;
  lastMonth: string;
  safraMonthsCount: number;
  totalMonthsCount: number;
  status: TechJourneyStatus;
  statusLabel: string;
  lastTC: number;
  lastGap: string;
}

const normalizeText = (text: string) => 
  (text || '')
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

export default function SafraContinuity({ data, config }: SafraContinuityProps) {
  const [periodType, setPeriodType] = useState<'TODOS' | 'LAST_3' | 'LAST_6' | 'LAST_12' | 'CUSTOM'>('TODOS');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [chartCompanies, setChartCompanies] = useState<string[]>([]);

  // 1. Calculate Base and Unique Companies
  const { baseContinuidade, allCompaniesList } = useMemo(() => {
    const rawData = Array.isArray(data) ? data : [];
    
    // List of all unique companies (normalized) for the selection UI
    const companiesSet = new Set<string>();
    rawData.forEach(d => {
      const name = normalizeText(d.EMPRESA_NORMALIZADA || d.EMPRESA || '');
      if (name) companiesSet.add(name);
    });
    const allCompaniesList = Array.from(companiesSet).sort();

    // Filtered base for all calculations
    const baseContinuidade = chartCompanies.length > 0
      ? rawData.filter(item => {
          const emp = normalizeText(item.EMPRESA_NORMALIZADA || item.EMPRESA || '');
          return chartCompanies.map(normalizeText).includes(emp);
        })
      : rawData;

    console.log("DEBUG FILTRO EMPRESA CONTINUIDADE", {
      selectedCompanies: chartCompanies,
      totalOriginal: rawData.length,
      totalFiltrado: baseContinuidade.length,
      empresasNaBase: [...new Set(baseContinuidade.map(d => d.EMPRESA_NORMALIZADA || d.EMPRESA))]
    });

    return { baseContinuidade, allCompaniesList };
  }, [data, chartCompanies]);

  // 2. Main Logic - Operational monthly tracking using baseContinuidade
  const continuityStats = useMemo(() => {
    if (baseContinuidade.length === 0) return null;

    // Ordered list of unique months in dataset
    const sortedAllMonths = Array.from(new Set(baseContinuidade.map(d => (d.MES_REF || '').toString().toUpperCase())))
      .sort((a, b) => (MONTHS_ORDER[(a as string).toLowerCase()] || 0) - (MONTHS_ORDER[(b as string).toLowerCase()] || 0)) as string[];

    // Map: login -> { month -> record }
    const techJourneyMap = new Map<string, Map<string, TechnicianRecord>>();
    const techInfoMap = new Map<string, { empresa: string; login: string }>();

    baseContinuidade.forEach(d => {
      if (!d || !d.LOGIN_TECNICO) return;
      if (!techJourneyMap.has(d.LOGIN_TECNICO)) techJourneyMap.set(d.LOGIN_TECNICO, new Map());
      const monthKey = (d.MES_REF || '').toString().toUpperCase();
      techJourneyMap.get(d.LOGIN_TECNICO)!.set(monthKey, d);
      techInfoMap.set(d.LOGIN_TECNICO, { empresa: d.EMPRESA || 'NÃO MAPEADA', login: d.LOGIN_TECNICO });
    });

    // Helper to get month order
    const getOrder = (month: string) => MONTHS_ORDER[month.toLowerCase()] || 0;

    // Monthly Operational Data: Month -> Company -> Counters
    const monthlyStats = new Map<string, Map<string, {
      m1: number;
      m2: number;
      m3: number;
      perdaM1: number;
      perdaM2: number;
      virouVeterano: number;
      aguardando: number;
      naoVirou: number;
      techs: { login: string; status: string; statusLabel: string; type: string }[];
    }>>();

    sortedAllMonths.forEach((currentMonth, idx) => {
      const prevMonth = sortedAllMonths[idx - 1];
      const prevPrevMonth = sortedAllMonths[idx - 2];
      const prevPrevPrevMonth = sortedAllMonths[idx - 3];

      const currentStats = new Map<string, any>();
      monthlyStats.set(currentMonth, currentStats);

      const monthKey = currentMonth as string;
      techJourneyMap.forEach((journey, login) => {
        const info = techInfoMap.get(login)!;
        const recordInM = journey.get(monthKey);
        const recordInM1 = prevMonth ? journey.get(prevMonth as string) : null;
        const recordInM2 = prevPrevMonth ? journey.get(prevPrevMonth as string) : null;
        const recordInM3 = prevPrevPrevMonth ? journey.get(prevPrevPrevMonth as string) : null;

        // Ensure we have a valid company context even if not in current month
        const company = recordInM?.EMPRESA || recordInM1?.EMPRESA || recordInM2?.EMPRESA || recordInM3?.EMPRESA || 'NÃO MAPEADA';
        
        if (!currentStats.has(company)) {
          currentStats.set(company, { m1: 0, m2: 0, m3: 0, perdaM1: 0, perdaM2: 0, virouVeterano: 0, aguardando: 0, naoVirou: 0, techs: [] });
        }
        const stats = currentStats.get(company);

        // Operational Logic per Technician in Month currentMonth
        
        // 1. M1: Entrou agora
        const isEntryInM = recordInM?.TIPO_BASE === 'SAFRA' && !recordInM1;
        if (isEntryInM) {
          stats.m1++;
          stats.techs.push({
            login,
            status: 'M1',
            statusLabel: 'Entrou na Safra (M1)',
            type: 'M1',
            empresa: company,
            regiao: recordInM?.REGIAO_PR || 'N/A',
            un: recordInM?.UNIDADE_NEGOCIO || 'N/A',
            firstMonth: currentMonth,
            lastMonth: currentMonth,
            safraMonthsCount: 1,
            lastTC: recordInM?.PERCENT_TC || 0,
            lastGap: recordInM?.mainFailure || 'Nenhum'
          });
          return;
        }

        // 2. M2 or Saída M1
        // Was M1 in previous month?
        const wasM1InPrev = recordInM1?.TIPO_BASE === 'SAFRA' && (!recordInM2 || recordInM2.TIPO_BASE !== 'SAFRA');
        if (wasM1InPrev) {
          if (recordInM?.TIPO_BASE === 'SAFRA') {
            stats.m2++;
            stats.techs.push({
              login,
              status: 'M2',
              statusLabel: 'Técnico Ativo em M2',
              type: 'M2',
              empresa: company,
              regiao: recordInM?.REGIAO_PR || 'N/A',
              un: recordInM?.UNIDADE_NEGOCIO || 'N/A',
              firstMonth: prevMonth || currentMonth,
              lastMonth: currentMonth,
              safraMonthsCount: 2,
              lastTC: recordInM?.PERCENT_TC || 0,
              lastGap: recordInM?.mainFailure || 'Nenhum'
            });
          } else {
            stats.perdaM1++;
            stats.techs.push({
              login,
              status: 'PERDA_M1',
              statusLabel: 'Saída no M1 (Churn Precoce)',
              type: 'PERDA_M1',
              empresa: company,
              regiao: recordInM1?.REGIAO_PR || 'N/A',
              un: recordInM1?.UNIDADE_NEGOCIO || 'N/A',
              firstMonth: prevMonth || currentMonth,
              lastMonth: prevMonth || currentMonth,
              safraMonthsCount: 1,
              lastTC: recordInM1?.PERCENT_TC || 0,
              lastGap: 'Desistência após M1'
            });
          }
          return;
        }

        // 3. M3 or Saída M2
        // Was M2 in previous month?
        const wasM2InPrev = recordInM1?.TIPO_BASE === 'SAFRA' && recordInM2?.TIPO_BASE === 'SAFRA' && (!recordInM3 || recordInM3.TIPO_BASE !== 'SAFRA');
        if (wasM2InPrev) {
          if (recordInM?.TIPO_BASE === 'SAFRA') {
            stats.m3++;
            stats.techs.push({
              login,
              status: 'M3',
              statusLabel: 'Completou M3 / Ativo em M3',
              type: 'M3',
              empresa: company,
              regiao: recordInM?.REGIAO_PR || 'N/A',
              un: recordInM?.UNIDADE_NEGOCIO || 'N/A',
              firstMonth: prevPrevMonth || currentMonth,
              lastMonth: currentMonth,
              safraMonthsCount: 3,
              lastTC: recordInM?.PERCENT_TC || 0,
              lastGap: recordInM?.mainFailure || 'Nenhum'
            });
          } else {
            stats.perdaM2++;
            stats.techs.push({
              login,
              status: 'PERDA_M2',
              statusLabel: 'Saída no M2 (Churn Intermediário)',
              type: 'PERDA_M2',
              empresa: company,
              regiao: recordInM1?.REGIAO_PR || 'N/A',
              un: recordInM1?.UNIDADE_NEGOCIO || 'N/A',
              firstMonth: prevPrevMonth || currentMonth,
              lastMonth: prevMonth || currentMonth,
              safraMonthsCount: 2,
              lastTC: recordInM1?.PERCENT_TC || 0,
              lastGap: 'Desistência após M2'
            });
          }
          return;
        }

        // 4. Virou Veterano or Não Evoluiu
        // Was M3 in previous month?
        const wasM3InPrev = recordInM1?.TIPO_BASE === 'SAFRA' && recordInM2?.TIPO_BASE === 'SAFRA' && recordInM3?.TIPO_BASE === 'SAFRA';
        if (wasM3InPrev) {
          if (recordInM?.TIPO_BASE === 'VETERANO') {
            stats.virouVeterano++;
            stats.techs.push({
              login,
              status: 'VIROU_VETERANO',
              statusLabel: 'Virou Veterano',
              type: 'VETERANO',
              empresa: company,
              regiao: recordInM?.REGIAO_PR || 'N/A',
              un: recordInM?.UNIDADE_NEGOCIO || 'N/A',
              firstMonth: prevPrevPrevMonth || currentMonth,
              lastMonth: currentMonth,
              safraMonthsCount: 3,
              lastTC: recordInM?.PERCENT_TC || 0,
              lastGap: 'Transição Finalizada'
            });
          } else if (recordInM?.TIPO_BASE === 'VETERANO_EM_SAFRA') {
            stats.virouVeterano++;
            stats.techs.push({
              login,
              status: 'VIROU_VETERANO_EM_SAFRA',
              statusLabel: 'Evoluiu para Veterano em Safra',
              type: 'VET_EM_SAFRA',
              empresa: company,
              regiao: recordInM?.REGIAO_PR || 'N/A',
              un: recordInM?.UNIDADE_NEGOCIO || 'N/A',
              firstMonth: prevPrevPrevMonth || currentMonth,
              lastMonth: currentMonth,
              safraMonthsCount: 3,
              lastTC: recordInM?.PERCENT_TC || 0,
              lastGap: 'Evolução Confirmada'
            });
          } else if (recordInM?.TIPO_BASE === 'SAFRA') {
            stats.aguardando++;
            stats.techs.push({
              login,
              status: 'AGUARDANDO_TRANSICAO',
              statusLabel: 'Aguardando Transição (M4+)',
              type: 'AGUARDANDO',
              empresa: company,
              regiao: recordInM?.REGIAO_PR || 'N/A',
              un: recordInM?.UNIDADE_NEGOCIO || 'N/A',
              firstMonth: prevPrevPrevMonth || currentMonth,
              lastMonth: currentMonth,
              safraMonthsCount: 4,
              lastTC: recordInM?.PERCENT_TC || 0,
              lastGap: 'Aguardando Avaliação Final'
            });
          } else if (!recordInM || recordInM.TIPO_BASE !== 'SAFRA') {
            // Either disappeared or not a veteran yet (but not in safra either)
            stats.naoVirou++;
            stats.techs.push({
              login,
              status: 'NAO_VIROU',
              statusLabel: 'Não Evoluiu para Veterano',
              type: 'NAO_VIROU',
              empresa: company,
              regiao: recordInM1?.REGIAO_PR || 'N/A',
              un: recordInM1?.UNIDADE_NEGOCIO || 'N/A',
              firstMonth: prevPrevPrevMonth || currentMonth,
              lastMonth: prevMonth || currentMonth,
              safraMonthsCount: 3,
              lastTC: recordInM1?.PERCENT_TC || 0,
              lastGap: 'Desistência após Safra'
            });
          }
          return;
        }
      });
    });

    // Prepare chart Data
    const chartData = sortedAllMonths.map(month => {
      const monthStats = monthlyStats.get(month)!;
      let m1 = 0, m2 = 0, m3 = 0, loss1 = 0, loss2 = 0, vet = 0, aguardando = 0, noVet = 0;
      
      monthStats.forEach(s => {
        m1 += s.m1;
        m2 += s.m2;
        m3 += s.m3;
        loss1 += s.perdaM1;
        loss2 += s.perdaM2;
        vet += s.virouVeterano;
        aguardando += s.aguardando;
        noVet += s.naoVirou;
      });

      return {
        month,
        monthLabel: formatShortMonth(month),
        m1,
        m2,
        m3,
        perdaM1: loss1,
        perdaM2: loss2,
        viraramVeterano: vet,
        aguardando,
        naoViraram: noVet,
        totalTracked: m1 + m2 + m3 + loss1 + loss2 + vet + aguardando + noVet
      };
    });

    // Collection of all participating companies
    const companiesSet = new Set<string>();
    monthlyStats.forEach(mStats => mStats.forEach((_, company) => companiesSet.add(company)));
    const allCompanies = Array.from(companiesSet).sort();

    return {
      monthlyStats,
      sortedAllMonths,
      chartData,
      allCompanies,
      techJourneyMap,
      techInfoMap
    };
  }, [baseContinuidade]);

  const toggleMonth = (month: string) => {
    setPeriodType('CUSTOM');
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        const result = prev.filter(m => m !== month);
        return result;
      } else {
        return [...prev, month];
      }
    });
  };

  const aggregatedData = useMemo(() => {
    if (!continuityStats) return null;

    let targetMonths: string[] = [];
    
    if (periodType === 'TODOS') {
      targetMonths = continuityStats.sortedAllMonths;
    } else if (periodType === 'LAST_3') {
      targetMonths = continuityStats.sortedAllMonths.slice(-3);
    } else if (periodType === 'LAST_6') {
      targetMonths = continuityStats.sortedAllMonths.slice(-6);
    } else if (periodType === 'LAST_12') {
      targetMonths = continuityStats.sortedAllMonths.slice(-12);
    } else if (periodType === 'CUSTOM') {
      targetMonths = selectedMonths.length > 0 ? selectedMonths : continuityStats.sortedAllMonths;
    }

    const totals = { m1: 0, m2: 0, m3: 0, perdaM1: 0, perdaM2: 0, virouVeterano: 0, aguardando: 0, naoVirou: 0 };
    const companyAgg = new Map<string, any>();

    targetMonths.forEach(m => {
      const monthData = continuityStats.monthlyStats.get(m);
      if (monthData) {
        monthData.forEach((s, company) => {
          totals.m1 += s.m1;
          totals.m2 += s.m2;
          totals.m3 += s.m3;
          totals.perdaM1 += s.perdaM1;
          totals.perdaM2 += s.perdaM2;
          totals.virouVeterano += s.virouVeterano;
          totals.aguardando += s.aguardando;
          totals.naoVirou += s.naoVirou;

          if (!companyAgg.has(company)) {
            companyAgg.set(company, { m1: 0, m2: 0, m3: 0, perdaM1: 0, perdaM2: 0, virouVeterano: 0, aguardando: 0, naoVirou: 0, techs: [] });
          }
          const cStats = companyAgg.get(company);
          cStats.m1 += s.m1;
          cStats.m2 += s.m2;
          cStats.m3 += s.m3;
          cStats.perdaM1 += s.perdaM1;
          cStats.perdaM2 += s.perdaM2;
          cStats.virouVeterano += s.virouVeterano;
          cStats.aguardando += s.aguardando;
          cStats.naoVirou += s.naoVirou;
          cStats.techs = [...cStats.techs, ...s.techs];
        });
      }
    });

    const survivorsM1 = Math.max(0, totals.m1 - totals.perdaM1);
    const survivorsM2 = Math.max(0, survivorsM1 - totals.perdaM2);
    const completaramM3 = totals.virouVeterano + totals.aguardando + totals.naoVirou;

    // Validation mandatory: Entraram = Perda M1 + Perda M2 + Completaram M3
    const sumCheck = totals.perdaM1 + totals.perdaM2 + completaramM3;
    if (totals.m1 !== sumCheck && totals.m1 > 0) {
      console.warn(`[SafraContinuity] Inconsistência nos totais: Entraram(${totals.m1}) != Soma das Partes(${sumCheck}). Dif: ${totals.m1 - sumCheck}`);
    }

    return {
      totals,
      companyAgg,
      targetMonths,
      currentTotals: {
        ...totals,
        iniciaram: totals.m1,
        perdaM1: totals.perdaM1,
        sobreviventesM1: survivorsM1,
        perdaM2: totals.perdaM2,
        sobreviventesM2: survivorsM2,
        completaramM3,
        virouVeterano: totals.virouVeterano,
        aguardando: totals.aguardando,
        naoVirou: totals.naoVirou,
        perdaTotalSafra: totals.perdaM1 + totals.perdaM2
      }
    };
  }, [continuityStats, selectedMonths, periodType]);

  const currentTotals = aggregatedData?.currentTotals || { 
    m1: 0, m2: 0, m3: 0, perdaM1: 0, perdaM2: 0, virouVeterano: 0, aguardando: 0, naoVirou: 0, 
    iniciaram: 0, sobreviventesM1: 0, sobreviventesM2: 0, completaramM3: 0, perdaTotalSafra: 0 
  };

  const toggleChartCompany = (company: string) => {
    setChartCompanies(prev => {
      const normalizedCompany = normalizeText(company);
      const exists = prev.some(c => normalizeText(c) === normalizedCompany);
      
      if (exists) {
        return prev.filter(c => normalizeText(c) !== normalizedCompany);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), company];
      }
      return [...prev, company];
    });
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Evolução da Retenção - Gráfico */}
      <div className="card p-10 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[3rem]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Fluxo Operacional Mensal</h3>
              <p className="text-xs text-slate-400 font-medium">Categorização de técnicos ativos e transições por mês operacional</p>
              
              <div className="mt-4 space-y-4">
                <div className="flex flex-col relative">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selecionar Período:</span>
                  
                  <div className="relative">
                    <button
                      onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                      className="flex items-center justify-between w-full max-w-xs bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-primary/30 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                          {periodType === 'TODOS' ? 'Todos os meses' : 
                           periodType === 'LAST_3' ? 'Últimos 3 meses' :
                           periodType === 'LAST_6' ? 'Últimos 6 meses' :
                           periodType === 'LAST_12' ? 'Últimos 12 meses' :
                           selectedMonths.length === 1 ? formatShortMonth(selectedMonths[0]) :
                           selectedMonths.length > 1 ? `${selectedMonths.length} meses selecionados` : 'Todos os meses'}
                        </span>
                      </div>
                      {isPeriodOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isPeriodOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                          {[
                            { id: 'TODOS', label: 'Todos os meses' },
                            { id: 'LAST_3', label: 'Últimos 3 meses' },
                            { id: 'LAST_6', label: 'Últimos 6 meses' },
                            { id: 'LAST_12', label: 'Últimos 12 meses' },
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setPeriodType(opt.id as any);
                                setSelectedMonths([]);
                                setIsPeriodOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-colors",
                                periodType === opt.id ? "bg-primary text-white" : "text-slate-500 hover:bg-white hover:text-primary"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        
                        <div className="p-2 max-h-60 overflow-y-auto no-scrollbar">
                          <p className="px-4 py-1 text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Personalizado</p>
                          {continuityStats.sortedAllMonths.map(m => (
                            <button
                              key={m}
                              onClick={() => toggleMonth(m)}
                              className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-50 group transition-colors"
                            >
                              <span className={cn(
                                "text-[10px] font-bold uppercase transition-colors",
                                selectedMonths.includes(m) ? "text-primary" : "text-slate-500 group-hover:text-slate-700"
                              )}>
                                {formatFullMonth(m)}
                              </span>
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                selectedMonths.includes(m) ? "bg-primary border-primary" : "border-slate-200"
                              )}>
                                {selectedMonths.includes(m) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filtro de Empresa:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-tighter">
                      {chartCompanies.length === 0 ? 'Geral' : chartCompanies.join(' + ')}
                    </span>
                    {chartCompanies.length > 0 && (
                      <button 
                        onClick={() => setChartCompanies([])}
                        className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                      >
                        (Limpar)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end max-w-md">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 py-2 w-full text-right">Filtro por Empresa (Máx 3):</span>
            {allCompaniesList.slice(0, 15).map(c => (
              <button
                key={c}
                onClick={() => toggleChartCompany(c)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                  chartCompanies.some(sc => normalizeText(sc) === normalizeText(c))
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={continuityStats.chartData.filter(d => aggregatedData?.targetMonths?.includes(d.month))} 
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="monthLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                allowDecimals={false}
              />
              <Tooltip 
                content={<CustomTooltip companyLabel={chartCompanies.length === 0 ? 'Geral' : chartCompanies.length === 1 ? chartCompanies[0] : 'Empresas Selecionadas'} />}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                wrapperStyle={{ paddingBottom: '30px' }}
                iconType="circle"
                formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{value}</span>}
              />
              <Bar 
                dataKey="m1" 
                stackId="a" 
                fill="#94a3b8" 
                name="Técnicos Ativos M1" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="m2" 
                stackId="a" 
                fill="#cbd5e1" 
                name="Técnicos Ativos M2" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="m3" 
                stackId="a" 
                fill="#475569" 
                name="Completaram M3" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="perdaM1" 
                stackId="a" 
                fill="#fca5a5" 
                name="Saída M1 (Churn Precoce)" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="perdaM2" 
                stackId="a" 
                fill="#ef4444" 
                name="Saída M2 (Churn Intermediário)" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="viraramVeterano" 
                stackId="a" 
                fill="#10b981" 
                name="Viraram Veterano" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="aguardando" 
                stackId="a" 
                fill="#6366f1" 
                name="Aguardando Transição" 
                radius={[12, 12, 0, 0]}
              />
              <Bar 
                dataKey="naoViraram" 
                stackId="a" 
                fill="#f59e0b" 
                name="Não Evoluiu" 
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
             Legenda: O gráfico mostra a jornada operacional acumulada em cada mês de referência<br/>
             <span className="text-[9px] opacity-70 italic">M1 = Entradas no mês | M2 = Ativos do mês ant. | M3 = Ativos de 2 meses atrás | Perdas = Churn ocorrido no mês</span>
           </p>
        </div>
      </div>
    </div>
  );
}
