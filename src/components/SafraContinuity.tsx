import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserMinus, 
  UserCheck, 
  ArrowRight, 
  TrendingDown,
  TrendingUp,
  Building2,
  AlertCircle,
  X,
  Search,
  ExternalLink,
  Info,
  Calendar,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';
import { MONTHS_ORDER } from '../constants';

// Helper to format short month names
const formatShortMonth = (monthStr: string) => {
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
  onViewTech?: (login: string) => void;
}

type TechJourneyStatus = 
  | 'EM_SAFRA_M1' 
  | 'EM_SAFRA_M2' 
  | 'PERDA_M1' 
  | 'PERDA_M2' 
  | 'VIROU_VETERANO' 
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

export default function SafraContinuity({ data, config, onViewTech }: SafraContinuityProps) {
  const [periodType, setPeriodType] = useState<'TODOS' | 'LAST_3' | 'LAST_6' | 'LAST_12' | 'CUSTOM'>('TODOS');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<string | null>(null);
  const [drillDownType, setDrillDownType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('M1');
  const [searchTerm, setSearchTerm] = useState('');
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
        completaramM3: totals.virouVeterano + totals.aguardando + totals.naoVirou,
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

  const companiesRanking = useMemo(() => {
    if (!aggregatedData) return [];
    
    return Array.from(aggregatedData.companyAgg.entries()).map(([name, s]) => {
      const retention = (s.m1 + s.m2) > 0 ? (s.m2 / (s.m1 + s.m2)) : 1;
      return {
        name,
        ...s,
        iniciaram: s.m1,
        retention,
        statusLabel: retention < 0.6 ? 'CRÍTICO' : retention < 0.8 ? 'ATENÇÃO' : 'SAUDÁVEL' as any,
        statusColor: retention < 0.6 ? 'text-red-600' : retention < 0.8 ? 'text-amber-600' : 'text-emerald-600',
        bgColor: retention < 0.6 ? 'bg-red-50' : retention < 0.8 ? 'bg-amber-50' : 'bg-emerald-50',
        borderColor: retention < 0.6 ? 'border-red-200' : retention < 0.8 ? 'border-amber-200' : 'border-emerald-200',
        barBg: retention < 0.6 ? 'bg-red-500' : retention < 0.8 ? 'bg-amber-500' : 'bg-emerald-500',
        perdaTotalSafra: s.perdaM1 + s.perdaM2
      };
    }).sort((a, b) => b.m1 - a.m1); // Sort by volume of entries
  }, [aggregatedData]);

  const filteredDrillDownData = useMemo(() => {
    if (!aggregatedData) return [];

    let allTechs: any[] = [];
    if (selectedCompanyModal) {
      allTechs = aggregatedData.companyAgg.get(selectedCompanyModal)?.techs || [];
    } else {
      aggregatedData.companyAgg.forEach(s => {
        allTechs = [...allTechs, ...s.techs];
      });
    }

    return allTechs.filter(tech => {
      // Tab Filtering
      const matchesTab = 
        activeTab === 'ENTRARAM' || activeTab === 'M1' ? tech.status === 'M1' :
        activeTab === 'EM_SAFRA' ? (tech.status === 'M2' || tech.status === 'M3') :
        activeTab === 'VIROU_VETERANO' ? tech.status === 'VIROU_VETERANO' :
        activeTab === 'AGUARDANDO_TRANSICAO' ? tech.status === 'AGUARDANDO_TRANSICAO' :
        activeTab === 'NAO_VIROU' ? tech.status === 'NAO_VIROU' :
        activeTab === 'PERDA_SAFRA' ? (tech.status === 'PERDA_M1' || tech.status === 'PERDA_M2') :
        activeTab === 'PERDA_M1' ? tech.status === 'PERDA_M1' :
        activeTab === 'PERDA_M2' ? tech.status === 'PERDA_M2' :
        activeTab === 'COMPLETOU_M3' ? tech.status === 'M3' :
        true;

      if (!matchesTab) return false;

      // Search Filtering
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return tech.login.toLowerCase().includes(term) || tech.empresa.toLowerCase().includes(term);
      }

      return true;
    });
  }, [aggregatedData, selectedCompanyModal, activeTab, searchTerm]);

  const openDrillDown = (type: string | null = null, company: string | null = null) => {
    setDrillDownType(type);
    setSelectedCompanyModal(company);
    if (type) {
      if (type === 'M1') setActiveTab('M1');
      else if (type === 'EM_SAFRA') setActiveTab('EM_SAFRA');
      else if (type === 'VIROU_VETERANO') setActiveTab('VIROU_VETERANO');
      else if (type === 'PERDA_SAFRA') setActiveTab('PERDA_M1');
      else setActiveTab(type);
    }
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

  const chartLines = chartCompanies.length > 0 ? chartCompanies : companiesRanking.slice(0, 3).map(c => c.name);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

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

      {/* Funil de Storytelling - Visão Executiva */}
      <div className="card p-10 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[3rem]">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Fluxo de Sobrevivência na Safra</h3>
            <p className="text-xs text-slate-400 font-medium">Análise de perdas e retenção por etapa do ciclo de transição</p>
          </div>
        </div>

        <div className="flex flex-col items-center max-w-4xl mx-auto space-y-1">
          {/* Stage 1: Entraram */}
          <div 
            onClick={() => openDrillDown('M1')}
            className="w-full flex items-center justify-between bg-indigo-50 border border-indigo-100 p-6 rounded-3xl cursor-pointer hover:scale-[1.01] transition-transform shadow-sm group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-900">1. Entraram na Safra</span>
            </div>
            <span className="text-4xl font-black text-indigo-600">{currentTotals.iniciaram}</span>
          </div>

          <ArrowRight className="w-6 h-6 text-slate-200 rotate-90 my-1" />

          {/* Stage 2: Saída M1 */}
          <div 
            onClick={() => openDrillDown('PERDA_M1')}
            className="w-11/12 flex items-center justify-between bg-red-50/50 border border-red-100/50 p-4 rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform group"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-red-400 rounded-lg flex items-center justify-center text-white">
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">2. SAÍDA NO M1 (CHURN PRECOCE)</span>
            </div>
            <span className="text-2xl font-black text-red-400">-{currentTotals.perdaM1}</span>
          </div>

          <ArrowRight className="w-6 h-6 text-slate-200 rotate-90 my-1" />

          {/* Stage 3: Técnicos Ativos M1 */}
          <div className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-inner">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-400 rounded-lg flex items-center justify-center text-white">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">3. TÉCNICOS ATIVOS APÓS M1</span>
            </div>
            <span className="text-3xl font-black text-slate-900">{currentTotals.sobreviventesM1}</span>
          </div>

          <ArrowRight className="w-6 h-6 text-slate-200 rotate-90 my-1" />

          {/* Stage 4: Saída M2 */}
          <div 
            onClick={() => openDrillDown('PERDA_M2')}
            className="w-10/12 flex items-center justify-between bg-red-50 border border-red-200 p-4 rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform group"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">4. SAÍDA NO M2 (CHURN INTERMEDIÁRIO)</span>
            </div>
            <span className="text-2xl font-black text-red-600">-{currentTotals.perdaM2}</span>
          </div>

          <ArrowRight className="w-6 h-6 text-slate-200 rotate-90 my-1" />

          {/* Stage 5: Técnicos Ativos em M2 */}
          <div 
            onClick={() => openDrillDown('EM_SAFRA')}
            className="w-full flex items-center justify-between bg-slate-100 border border-slate-200 p-6 rounded-3xl cursor-pointer hover:scale-[1.01] transition-transform shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-900">5. TÉCNICOS ATIVOS EM M2</span>
            </div>
            <span className="text-4xl font-black text-slate-900">{currentTotals.sobreviventesM2}</span>
          </div>

          <ArrowRight className="w-6 h-6 text-slate-200 rotate-90 my-1" />

          {/* Stage 6: Completaram M3 */}
          <div 
            onClick={() => openDrillDown('COMPLETOU_M3')}
            className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-3xl cursor-pointer hover:scale-[1.01] transition-transform shadow-xl text-white"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">6. COMPLETARAM M3</span>
            </div>
            <span className="text-4xl font-black">{currentTotals.completaramM3}</span>
          </div>

          <div className="flex items-center w-full gap-4 pt-4">
            <div className="h-px bg-slate-200 flex-1" />
            <div className="px-3 py-1 bg-slate-50 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">Conversão Final</div>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-3 w-full gap-3 pt-2">
            {/* Stage 7: Viraram */}
            <div 
              onClick={() => openDrillDown('VIROU_VETERANO')}
              className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-5 rounded-3xl cursor-pointer hover:scale-[1.05] transition-all shadow-emerald-100 shadow-xl"
            >
              <div className="flex flex-col gap-1">
                <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white mb-1">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-emerald-800">7. Viraram Veterano</span>
                <span className="text-2xl font-black text-emerald-600">{currentTotals.virouVeterano}</span>
              </div>
            </div>

            {/* Stage 8: Aguardando */}
            <div 
              onClick={() => openDrillDown('AGUARDANDO_TRANSICAO')}
              className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-5 rounded-3xl cursor-pointer hover:scale-[1.05] transition-all shadow-indigo-100 shadow-xl"
            >
              <div className="flex flex-col gap-1">
                <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white mb-1">
                  <Info className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-indigo-800">8. Aguardando Transição</span>
                <span className="text-2xl font-black text-indigo-600">{currentTotals.aguardando}</span>
              </div>
            </div>

            {/* Stage 9: Não Evoluíram */}
            <div 
              onClick={() => openDrillDown('NAO_VIROU')}
              className="flex items-center justify-between bg-amber-50 border border-amber-100 p-5 rounded-3xl cursor-pointer hover:scale-[1.05] transition-all"
            >
              <div className="flex flex-col gap-1">
                <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white mb-1">
                  <UserMinus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-amber-800">9. NÃO EVOLUÍRAM PARA VETERANO</span>
                <span className="text-2xl font-black text-amber-500">{currentTotals.naoVirou}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Retenção Global */}
      <div className="card p-10 bg-slate-900 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 rounded-[3rem]">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -ml-32 -mt-32" />
        
        <div className="relative z-10 text-center md:text-left">
           <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-2">KPI de Eficiência {chartCompanies.length > 0 ? 'Selecionado' : 'Global'}</h4>
           <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white">
                {(() => {
                  const num = currentTotals.sobreviventesM2;
                  const den = currentTotals.iniciaram;
                  return formatPercent(den > 0 ? num / den : 0);
                })()}
              </span>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Taxa de Sobrevivência (Fluxo Safra)</span>
           </div>
        </div>
 
        <div className="flex-1 max-w-xl w-full relative z-10 bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center">
            <div className="flex items-center justify-center gap-6">
               <div>
                  <p className="text-[10px] font-black text-slate-500 mb-1">ENTRARAM</p>
                  <p className="text-2xl font-black">{currentTotals.iniciaram}</p>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-700" />
               <div>
                  <p className="text-[10px] font-black text-red-400 mb-1">PERDAS</p>
                  <p className="text-2xl font-black text-red-400">{currentTotals.perdaTotalSafra}</p>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-700" />
               <div>
                  <p className="text-[10px] font-black text-primary mb-1">COMPLETARAM M3</p>
                  <p className="text-2xl font-black text-primary">{currentTotals.completaramM3}</p>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-700" />
               <div>
                  <p className="text-[10px] font-black text-emerald-500 mb-1">VETERANOS</p>
                  <p className="text-2xl font-black text-emerald-500">{currentTotals.virouVeterano}</p>
               </div>
            </div>
        </div>
      </div>

      {/* Títulos Visão por Empresa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Análise por Empresa</h3>
            <p className="text-xs text-slate-400 font-medium">Empresas ordenadas por menor taxa de retenção</p>
          </div>
        </div>
      </div>

      {/* Grid de Cards por Empresa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {companiesRanking.map((c, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            onClick={() => toggleChartCompany(c.name)}
            className={cn(
              "card bg-white border-2 p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 hover:scale-[1.01] transition-all cursor-pointer group flex flex-col h-full rounded-[3.5rem]",
              chartCompanies.includes(c.name) ? "border-primary ring-4 ring-primary/10 shadow-primary/20" : c.borderColor
            )}
          >
            {/* Header: Nome e Status */}
            <div className="flex items-start justify-between mb-8">
               <div className="max-w-[70%]">
                  <h4 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-primary transition-colors">{c.name}</h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                     <div className={cn("w-2 h-2 rounded-full animate-pulse", c.barBg)} />
                     <span className={cn("text-[10px] font-black tracking-widest uppercase", c.statusColor)}>
                        {c.statusLabel}
                     </span>
                     <span className="w-1 h-1 rounded-full bg-slate-300 mx-1" />
                     <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrillDown('ENTRARAM', c.name);
                        }}
                        className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-widest"
                      >
                        Ver Detalhes <ExternalLink className="w-3 h-3" />
                      </button>
                  </div>
               </div>
               <div className="text-right">
                  <div className={cn("px-5 py-3 rounded-[1.5rem] font-black text-2xl shadow-sm mb-2", c.bgColor, c.statusColor)}>
                    {formatPercent(c.retention)}
                  </div>
                  {c.delta !== null && (
                    <div className={cn(
                      "flex items-center justify-end gap-1 text-[10px] font-black uppercase",
                      c.delta > 0 ? "text-emerald-500" : c.delta < 0 ? "text-red-500" : "text-slate-400"
                    )}>
                      {c.delta > 0 ? <ChevronUp className="w-3 h-3" /> : c.delta < 0 ? <ChevronDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {Math.abs(Math.round(c.delta * 100))}% vs Mês Ant.
                    </div>
                  )}
               </div>
            </div>

            {/* Warning Alerts */}
            <div className="space-y-2 mb-8">
              {c.perdaTotalSafra > (c.m2 + c.m3) && c.perdaTotalSafra > 0 && (
                <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Alta perda operacional detectada este mês</span>
                </div>
              )}
              {c.naoViraram > c.viraramVeterano && c.naoViraram > 0 && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Quebra na transição para veterano</span>
                </div>
              )}
            </div>

            {/* Mini Funnel Visual */}
            <div className="mb-10 bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 shadow-inner">
               <div className="flex flex-col gap-1 items-center">
                  {[
                    { label: 'Entradas (M1)', val: c.m1, id: 'M1', color: 'text-indigo-600', bg: 'bg-indigo-50', w: 'w-full' },
                    { label: 'Saída M1 (Churn Precoce)', val: c.perdaM1, id: 'PERDA_M1', color: 'text-red-400', bg: 'bg-red-50/30', w: 'w-[95%]', isLoss: true },
                    { label: 'Técnicos Ativos M1', val: Math.max(0, c.m1 - c.perdaM1), id: 'EM_SAFRA', color: 'text-slate-500', bg: 'bg-slate-50', w: 'w-[90%]' },
                    { label: 'Saída M2 (Churn Intermediário)', val: c.perdaM2, id: 'PERDA_M2', color: 'text-red-600', bg: 'bg-red-50', w: 'w-[85%]', isLoss: true },
                    { label: 'Técnicos Ativos M2', val: Math.max(0, c.m1 - c.perdaM1 - c.perdaM2), id: 'COMPLETOU_M3', color: 'text-slate-900', bg: 'bg-slate-100', w: 'w-[80%]' },
                    { label: 'Completaram M3', val: Math.max(0, c.m1 - c.perdaM1 - c.perdaM2), id: 'COMPLETOU_M3', color: 'text-primary', bg: 'bg-primary/5 border-dashed', w: 'w-[75%]' },
                  ].map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrillDown(step.id, c.name);
                        }}
                        className={cn(
                          "flex items-center justify-between px-6 py-2.5 rounded-xl border border-white shadow-sm transition-transform cursor-pointer hover:scale-[1.02]", 
                          step.bg,
                          step.w
                        )}
                      >
                        <span className={cn("text-[9px] font-black uppercase tracking-tighter", step.isLoss ? "text-red-400" : "text-slate-400")}>
                          {step.label}
                        </span>
                        <span className={cn("text-base font-black", step.color)}>
                          {step.isLoss ? `-${step.val}` : step.val}
                        </span>
                      </div>
                      {idx < 4 && <ArrowRight className="w-3 h-3 text-slate-200 rotate-90" />}
                    </React.Fragment>
                  ))}
                  
                  <div className="flex gap-2 w-[80%] pt-2">
                     <div 
                        onClick={(e) => { e.stopPropagation(); openDrillDown('VIROU_VETERANO', c.name); }}
                        className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform text-center"
                     >
                        <p className="text-[8px] font-black text-emerald-800 uppercase mb-1">Viraram</p>
                        <p className="text-xl font-black text-emerald-600">{c.virouVeterano}</p>
                     </div>
                     <div 
                        onClick={(e) => { e.stopPropagation(); openDrillDown('NAO_VIROU', c.name); }}
                        className="flex-1 bg-amber-50 border border-amber-100 p-3 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform text-center"
                     >
                        <p className="text-[8px] font-black text-amber-800 uppercase mb-1">Não</p>
                        <p className="text-xl font-black text-amber-500">{c.naoViraram}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Retention Bar */}
            <div className="mb-8 px-2">
               <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">
                  <span>Barra de Retenção</span>
                  <span className={c.retention >= 0.6 ? "text-emerald-600" : "text-slate-400"}>Meta: 60%</span>
               </div>
               <div className="h-4 w-full bg-slate-200/50 rounded-full overflow-hidden flex shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${c.retention * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                    className={cn("h-full", c.barBg)} 
                  />
               </div>
            </div>

            {/* Metrics List (Hidden but kept for logic/drilldown) */}
            <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-tighter">
                      {c.perdaTotalSafra} Perdidos na Safra
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      Taxa: {formatPercent(c.retention)}
                    </p>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver Detalhes
                  <ExternalLink className="w-4 h-4" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* MODAL DRILL-DOWN */}
      {(drillDownType || selectedCompanyModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setDrillDownType(null); setSelectedCompanyModal(null); }} />
          
          <div className="bg-white w-full max-w-7xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             {/* Header */}
             <div className="px-10 py-8 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      {selectedCompanyModal ? `Detalhamento: ${selectedCompanyModal}` : 'Detalhamento Global da Safra'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Lista de Técnicos na Jornada</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative hidden md:block">
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Buscar por login ou empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/10 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm placeholder:text-slate-500 focus:outline-none focus:bg-white/15 transition-all w-64"
                    />
                  </div>
                  <button 
                    onClick={() => { setDrillDownType(null); setSelectedCompanyModal(null); }}
                    className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
             </div>

             {/* Modal Tabs */}
             <div className="px-10 pt-4 flex gap-6 overflow-x-auto no-scrollbar border-b border-slate-100 bg-white">
                {[
                  { id: 'M1', label: '1. Entraram (M1)' },
                  { id: 'EM_SAFRA', label: '2. Em Safra (M2+M3)' },
                  { id: 'VIROU_VETERANO', label: '3. Viraram Veterano' },
                  { id: 'AGUARDANDO_TRANSICAO', label: '4. Aguardando Transição' },
                  { id: 'PERDA_M1', label: '5. Saída M1 (Precoce)' },
                  { id: 'PERDA_M2', label: '6. Saída M2 (Interm.)' },
                  { id: 'NAO_VIROU', label: '7. Não Evoluíram' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "pb-4 px-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4",
                      activeTab === tab.id ? "border-primary text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
             </div>

             {/* Modal Content - Tech Table */}
             <div className="flex-1 overflow-y-auto bg-white p-0">
                <div className="min-w-[1200px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-10 py-5">Técnico (Login)</th>
                          <th className="px-6 py-5">Empresa</th>
                          <th className="px-6 py-5">Região / UN</th>
                          <th className="px-6 py-5">Entrada Safra</th>
                          <th className="px-6 py-5">Último Mês</th>
                          <th className="px-6 py-5 text-center">Meses Ativos</th>
                          <th className="px-6 py-5">Status Final</th>
                          <th className="px-6 py-5 text-right">% TC</th>
                          <th className="px-6 py-5">GAP Principal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredDrillDownData.length > 0 ? (
                          filteredDrillDownData.map((tech, idx) => (
                            <tr 
                              key={idx} 
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              <td className="px-10 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-slate-100 p-2 rounded-xl text-slate-500 font-bold text-xs uppercase">
                                    {tech.login.substring(0, 2)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-900">{tech.login}</p>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(tech.login);
                                        // Small toast-like feedback could go here
                                      }}
                                      className="text-[9px] text-primary font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                    >
                                      Copiar Login
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase">
                                  {tech.empresa}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black text-slate-900">{tech.regiao}</p>
                                  <p className="text-[9px] font-bold text-slate-400">{tech.un}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px] font-black text-slate-600 uppercase">{tech.firstMonth}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px] font-black text-slate-600 uppercase">{tech.lastMonth}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="w-7 h-7 inline-flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-600">
                                  {tech.safraMonthsCount}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className={cn(
                                  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight",
                                  tech.status === 'VIROU_VETERANO' ? "bg-emerald-100 text-emerald-700" :
                                  (tech.status === 'PERDA_M1' || tech.status === 'PERDA_M2') ? "bg-red-100 text-red-700" :
                                  (tech.status === 'M1' || tech.status === 'M2' || tech.status === 'M3') ? "bg-slate-100 text-slate-600" :
                                  tech.status === 'NAO_VIROU' ? "bg-amber-100 text-amber-700" : 
                                  tech.status === 'AGUARDANDO_TRANSICAO' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
                                )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", 
                                    tech.status === 'VIROU_VETERANO' ? "bg-emerald-500" :
                                    (tech.status === 'PERDA_M1' || tech.status === 'PERDA_M2') ? "bg-red-500" :
                                    (tech.status === 'M1' || tech.status === 'M2' || tech.status === 'M3') ? "bg-slate-400 shadow-sm" :
                                    tech.status === 'NAO_VIROU' ? "bg-amber-500" : 
                                    tech.status === 'AGUARDANDO_TRANSICAO' ? "bg-indigo-500" : "bg-slate-500"
                                  )} />
                                  {tech.statusLabel}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={cn(
                                  "text-sm font-black",
                                  tech.lastTC >= 80 ? "text-emerald-600" : tech.lastTC >= 50 ? "text-amber-600" : "text-red-600"
                                )}>
                                  {formatPercent(tech.lastTC/100)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-[10px] font-bold text-slate-500 max-w-[150px] truncate" title={tech.lastGap}>
                                  {tech.lastGap}
                                </p>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-20 text-center">
                              <div className="flex flex-col items-center gap-4 text-slate-300">
                                <Users className="w-12 h-12" />
                                <p className="text-sm font-black uppercase tracking-widest">Nenhum técnico encontrado</p>
                              </div>
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
             </div>
             
             {/* Modal Footer */}
             <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <div>
                   {filteredDrillDownData.length} Técnicos Listados
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Ativo em Safra</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Saída M1/M2</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Veterano</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Aguardando</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Não Evoluiu</span>
                   </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
