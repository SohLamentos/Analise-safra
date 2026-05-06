import React, { useMemo, useState, useEffect } from 'react';
import { 
  Calendar,
  TrendingDown,
} from 'lucide-react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { TechnicianRecord, AppConfig } from '../types';
import { MONTHS_ORDER, getMonthMapping } from '../constants';
import { getTechnicianHistory } from '../lib/utils';

const getMonthKey = (monthStr: string) => {
  return getMonthMapping(monthStr)?.key || '';
};

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
  if (!monthStr) return '';
  const parts = monthStr.split(/[\/\s]/);
  if (parts.length < 2) return monthStr;
  const month = parts[0];
  const year = parts[1];
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  return `${monthLabel} ${year}`;
};

const normalizeText = (text: string) => 
  (text || '')
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

const RetentionTooltip = ({ active, payload, label, coordinate }: any) => {
  if (active && payload && payload.length) {
    const stepName = label;
    const items = payload.filter((e: any) => e.name && e.name !== 'mKey' && e.name !== 'MKEY' && e.name !== 'step');

    const TOOLTIP_WIDTH = 340;
    const TOOLTIP_HEIGHT = 400; 
    const MARGIN = 24;

    const { x, y } = coordinate || { x: 0, y: 0 };
    let left = x + 16;
    let top = y + 16;

    if (x + TOOLTIP_WIDTH + MARGIN > window.innerWidth) {
      left = x - TOOLTIP_WIDTH - 16;
    }
    if (y + TOOLTIP_HEIGHT + MARGIN > window.innerHeight) {
      top = y - TOOLTIP_HEIGHT - 16;
    }

    left = Math.max(8, left);
    top = Math.max(8, top);

    return (
      <div 
        className="bg-slate-900 border border-white/10 p-4 rounded-[1.5rem] shadow-2xl w-[340px] max-h-[420px] overflow-y-auto custom-scrollbar"
        style={{
          position: 'fixed',
          left: `${left}px`,
          top: `${top}px`,
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      >
        <div className="border-b border-white/10 pb-2 mb-4">
          <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Análise Executiva</p>
          <p className="text-sm font-black text-white">{stepName}</p>
        </div>

        <div className="space-y-4">
          {items.map((entry: any, index: number) => {
            const company = entry.name;
            const activeCount = entry.value;
            const p = entry.payload;
            
            const entranceTotal = p[`${company}_entrada_total`] || 0;
            const prevCount = p[`${company}_anterior`] ?? entranceTotal;
            const certCount = p[`${company}_certificados`] || 0;
            const uncertCount = activeCount - certCount;
            const gapCounts = p[`${company}_gap_counts`] || { AGENDA: 0, REVISITA: 0, PRODUTIVIDADE: 0, OUTROS: 0 };

            const retentionRate = entranceTotal > 0 ? (activeCount / entranceTotal) * 100 : 0;
            const lossFromEntry = entranceTotal - activeCount;
            const lossVsPrevious = Math.max(0, prevCount - activeCount);
            const certRate = activeCount > 0 ? (certCount / activeCount) * 100 : 0;

            const sortedGaps = Object.entries(gapCounts)
              .sort((a, b) => {
                const freqDiff = (b[1] as number) - (a[1] as number);
                if (freqDiff !== 0) return freqDiff;
                const priority: Record<string, number> = { 'AGENDA': 4, 'REVISITA': 3, 'PRODUTIVIDADE': 2, 'OUTROS': 1 };
                return priority[b[0]] - priority[a[0]];
              });
            const topGap = uncertCount > 0 && (sortedGaps[0][1] as number) > 0 ? sortedGaps[0][0] : 'NENHUM';

            const lossPercent = 100 - retentionRate;
            let insight = "";
            if (lossPercent >= 50 && certRate >= 70) insight = "Alta perda mesmo com boa certificação.";
            else if (lossPercent >= 50 && certRate < 70) insight = "Alta perda com baixa certificação.";
            else if (lossPercent < 30 && certRate >= 70) insight = "Boa retenção com boa certificação.";
            else if (lossPercent < 30 && certRate < 70) insight = "Boa retenção, risco por baixa certificação.";
            else insight = "Perda moderada. Acompanhar certificação.";

            return (
              <div key={index} className="space-y-2 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[11px] font-black text-white uppercase truncate max-w-[120px]">{company}</span>
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase">{retentionRate.toFixed(1)}% RETIDO</span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="bg-white/5 p-1.5 rounded-lg">
                    <p className="text-[7px] font-bold text-slate-500 uppercase">Ativos / Entradas</p>
                    <p className="text-[10px] font-black text-white">{activeCount} / {entranceTotal}</p>
                  </div>
                  <div className="bg-white/5 p-1.5 rounded-lg text-right">
                    <p className="text-[7px] font-bold text-slate-500 uppercase">Retenção Acum.</p>
                    <p className="text-[10px] font-black text-primary">{retentionRate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8px] font-bold">
                  <span className="text-red-400">-{lossFromEntry} DESDE ENTRADA</span>
                  <span className="text-amber-400">{p[`${company}_anterior`] !== undefined ? `-${lossVsPrevious} VS ETAPA ANT.` : ''}</span>
                </div>

                <div className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded-lg">
                  <div>
                    <p className="text-[7px] font-bold text-slate-500 uppercase">Certificação</p>
                    <p className="text-[9px] font-black text-emerald-400">{certCount} CERT / {uncertCount} Ñ CERT</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-bold text-slate-500 uppercase">Principal GAP</p>
                    <p className="text-[9px] font-black text-primary uppercase">{topGap}</p>
                  </div>
                </div>

                <p className="text-[9px] font-medium text-slate-400 italic leading-tight">
                  "{insight}"
                </p>
                <p className="text-[7px] font-bold text-slate-600 uppercase text-center mt-1">Ver detalhes na tabela abaixo</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

interface RetentionTimeProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function RetentionTime({ data, config }: RetentionTimeProps) {
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [chartCompanies, setChartCompanies] = useState<string[]>([]);

  // 1. Calculate Base Logic for Cohort
  const continuityStats = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Fixed month ordering and uniqueness using MES_KEY (YYYY-MM)
    const monthEntries = Array.from(new Set(data.map(d => (d.MES_REF || '').toString().toUpperCase())))
      .map(m => ({ label: m, key: getMonthKey(m) }))
      .filter(m => m.key);
    
    // Remote duplicates and sort ONLY by key
    const uniqueMonthsMap = new Map();
    monthEntries.forEach(m => {
      // If we already have this key, don't overwrite if the new one is invalid or something
      // Actually, since we already filtered invalid keys in getMonthKey, we just take the first occurrence
      if (!uniqueMonthsMap.has(m.key)) {
        uniqueMonthsMap.set(m.key, m);
      }
    });

    const uniqueMonthsList = Array.from(uniqueMonthsMap.values())
      .sort((a, b) => a.key.localeCompare(b.key));

    const sortedAllMonths = uniqueMonthsList.map(m => m.label);
    const sortedAllKeys = uniqueMonthsList.map(m => m.key);

    const techJourneyMap = new Map<string, Map<string, TechnicianRecord>>();
    const techInfoMap = new Map<string, { empresa: string; login: string }>();
    const allCompaniesSet = new Set<string>();

    data.forEach(d => {
      if (!d || !d.LOGIN_TECNICO) return;
      if (!techJourneyMap.has(d.LOGIN_TECNICO)) techJourneyMap.set(d.LOGIN_TECNICO, new Map());
      const monthKey = getMonthKey((d.MES_REF || '').toString());
      if (monthKey) {
        techJourneyMap.get(d.LOGIN_TECNICO)!.set(monthKey, d);
      }
      techInfoMap.set(d.LOGIN_TECNICO, { empresa: d.EMPRESA || 'NÃO MAPEADA', login: d.LOGIN_TECNICO });
      
      const emp = normalizeText(d.EMPRESA_NORMALIZADA || d.EMPRESA || '');
      if (emp && emp !== 'MKEY' && emp !== 'M_KEY' && emp !== 'UNKNOWN' && emp !== 'MES_KEY') {
        allCompaniesSet.add(emp);
      }
    });

    return {
      sortedAllMonths,
      sortedAllKeys,
      uniqueMonthsList,
      techJourneyMap,
      allCompanies: Array.from(allCompaniesSet).sort()
    };
  }, [data]);

  // Initial cohort selection (using key)
  useEffect(() => {
    if (continuityStats?.uniqueMonthsList && continuityStats.uniqueMonthsList.length > 0 && !selectedCohort) {
      setSelectedCohort(continuityStats.uniqueMonthsList[0].key);
    }
  }, [continuityStats, selectedCohort]);

  // Helper to get selected cohort label
  const selectedCohortLabel = useMemo(() => {
    return continuityStats?.uniqueMonthsList.find(m => m.key === selectedCohort)?.label || '';
  }, [continuityStats, selectedCohort]);

  const { cohortData, cohortInsights, displayedCompanies } = useMemo(() => {
    if (!continuityStats || !selectedCohort) return { cohortData: [], cohortInsights: [], displayedCompanies: [] };

    const { techJourneyMap, sortedAllKeys } = continuityStats;
    const cohortIdx = sortedAllKeys.indexOf(selectedCohort);
    if (cohortIdx === -1) return { cohortData: [], cohortInsights: [] };
    
    const cohortTechs = Array.from(techJourneyMap.keys()).filter((login: string) => {
      const journey = techJourneyMap.get(login);
      const record = journey?.get(selectedCohort);
      if (record?.TIPO_BASE !== 'SAFRA') return false;
      
      const prevKey = sortedAllKeys[cohortIdx - 1];
      if (!prevKey) return true;
      const prevRecord = journey?.get(prevKey);
      return !prevRecord || prevRecord.TIPO_BASE !== 'SAFRA';
    }).map((login: string) => ({
      login,
      history: getTechnicianHistory(login, data)
    }));

    const activeCompanies = chartCompanies.length > 0 ? chartCompanies.map(normalizeText) : [];
    const displayedCompanies = activeCompanies.length > 0 
      ? continuityStats.allCompanies.filter(c => activeCompanies.includes(normalizeText(c)))
      : continuityStats.allCompanies.slice(0, 3);

    const maxSteps = sortedAllKeys.length - cohortIdx;
    const dataByStep: any[] = [];
    const usedHistories: any[] = cohortTechs.map(t => t.history);

    for (let i = 0; i < maxSteps; i++) {
      const mKey = sortedAllKeys[cohortIdx + i];
      const activeInStep = cohortTechs.filter(t => t.history.some(h => getMonthKey(h.MES_REF) === mKey));
      
      if (activeInStep.length === 0 && i > 3) break; 

      let label = '';
      if (i === 0) label = 'Entrada';
      else if (i === 1) label = 'M2';
      else if (i === 2) label = 'M3';
      else {
        const types = activeInStep.map(t => t.history.find(h => getMonthKey(h.MES_REF) === mKey)?.TIPO_BASE || '');
        const majorityType: Record<string, number> = types.reduce((acc: any, t) => {
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {});
        const bestType = Object.keys(majorityType).sort((a, b) => majorityType[b] - majorityType[a])[0];
        
        if (bestType === 'VETERANO') label = `VM${i - 2}`;
        else if (bestType === 'VETERANO_EM_SAFRA') label = `VES${i - 2}`;
        else label = `Pós-Safra ${i - 2}`;
      }

      const stepObj: any = { step: label, mKey };
      
      displayedCompanies.forEach(company => {
        const companyTechs = cohortTechs.filter(t => {
          const entryRec = t.history.find(h => getMonthKey(h.MES_REF) === selectedCohort);
          return normalizeText(entryRec?.EMPRESA || '') === normalizeText(company);
        });

        const activeCompanyTechs = activeInStep.filter(t => {
          const entryRec = t.history.find(h => getMonthKey(h.MES_REF) === selectedCohort);
          return normalizeText(entryRec?.EMPRESA || '') === normalizeText(company);
        });

        stepObj[company] = activeCompanyTechs.length;
        stepObj[`${company}_logins`] = activeCompanyTechs.map(t => t.login);
        stepObj[`${company}_entrada_total`] = companyTechs.length;
        stepObj[`${company}_certificados`] = activeCompanyTechs.filter(t => {
           const rec = t.history.find(h => getMonthKey(h.MES_REF) === mKey);
           return rec && (rec.PERCENT_TC || 0) >= 70;
        }).length;

        // GAP Identification logic for tooltip
        const gapCounts = { AGENDA: 0, REVISITA: 0, PRODUTIVIDADE: 0, OUTROS: 0 };
        activeCompanyTechs.forEach(t => {
           const rec = t.history.find(h => getMonthKey(h.MES_REF) === mKey);
           if (rec && (rec.PERCENT_TC || 0) < 70) {
               // Logic similar to ImportSafra but simplified for useMemo
               const gaps = [
                 { name: 'AGENDA', val: rec.GAP_CUMP_AGENDA || 0 },
                 { name: 'REVISITA', val: rec.GAP_REV || 0 },
                 { name: 'PRODUTIVIDADE', val: rec.GAP_PROD || 0 }
               ].sort((a, b) => b.val - a.val);
               const pg = gaps[0].val > 0 ? gaps[0].name as 'AGENDA' | 'REVISITA' | 'PRODUTIVIDADE' : 'OUTROS';
               gapCounts[pg]++;
           }
        });
        stepObj[`${company}_gap_counts`] = gapCounts;

        // Active in previous step
        if (i > 0) {
           const prevStep = dataByStep[i-1];
           stepObj[`${company}_anterior`] = prevStep[company];
        } else {
           // On first step, previous is effectively the entrance
           // But for variation purposes, we might want to know it's the start
        }
      });

      dataByStep.push(stepObj);
    }

    console.log("DEBUG EMPRESAS RETENCAO", displayedCompanies);
    console.log("DEBUG RETENCAO UNIFICADA", {
      cohortMes: selectedCohort,
      empresasSelecionadas: displayedCompanies,
      loginsCohort: cohortTechs.map(x => x.login),
      historicos: usedHistories,
      chartData: dataByStep
    });

    return { cohortData: dataByStep, cohortInsights: [], displayedCompanies };
  }, [continuityStats, selectedCohort, chartCompanies, data]);

  const certificationMetrics = useMemo(() => {
    if (!continuityStats || !selectedCohort) return [];

    const { techJourneyMap, sortedAllKeys } = continuityStats;
    const cohortIdx = sortedAllKeys.indexOf(selectedCohort);
    if (cohortIdx === -1) return [];

    const cohortTechs = Array.from(techJourneyMap.keys()).filter((login: string) => {
      const journey = techJourneyMap.get(login);
      const record = journey?.get(selectedCohort);
      if (record?.TIPO_BASE !== 'SAFRA') return false;
      const prevKey = sortedAllKeys[cohortIdx - 1];
      if (!prevKey) return true;
      const prevRecord = journey?.get(prevKey);
      return !prevRecord || prevRecord.TIPO_BASE !== 'SAFRA';
    }).map((login: string) => ({
      login,
      history: getTechnicianHistory(login, data)
    }));

    const activeCompanies = chartCompanies.length > 0 ? chartCompanies.map(normalizeText) : [];
    const displayedCompanies = activeCompanies.length > 0 
      ? continuityStats.allCompanies.filter(c => activeCompanies.includes(normalizeText(c)))
      : continuityStats.allCompanies.slice(0, 3);

    const isStepAvailable = {
      'M2': cohortIdx + 1 < sortedAllKeys.length,
      'M3': cohortIdx + 2 < sortedAllKeys.length,
      'VM1': cohortIdx + 3 < sortedAllKeys.length,
      'VM2': cohortIdx + 4 < sortedAllKeys.length,
    };

    return displayedCompanies.map(company => {
      const companyTechs = cohortTechs.filter(t => {
        const entryRec = t.history.find(h => getMonthKey(h.MES_REF) === selectedCohort);
        return normalizeText(entryRec?.EMPRESA || '') === normalizeText(company);
      });

      if (companyTechs.length === 0) return null;

      let certificados = 0;
      let entrada = companyTechs.length;
      let saidaM2 = 0;
      let saidaM3 = 0;
      let saidaVM1 = 0;
      let chegaramVM1 = 0;
      let viraramVM2 = 0;
      let aguardando = 0;
      let naoEvoluiu = 0;
      let unidentified = 0;

      companyTechs.forEach(t => {
        const entranceRecord = t.history.find(h => getMonthKey(h.MES_REF) === selectedCohort);
        if (entranceRecord && (entranceRecord.PERCENT_TC ?? 0) >= 70) certificados++;

        const m2Key = sortedAllKeys[cohortIdx + 1];
        const m2Rec = m2Key ? t.history.find(h => getMonthKey(h.MES_REF) === m2Key) : null;
        
        if (isStepAvailable['M2'] && !m2Rec) {
          saidaM2++;
        } else if (m2Rec) {
          const m3Key = sortedAllKeys[cohortIdx + 2];
          const m3Rec = m3Key ? t.history.find(h => getMonthKey(h.MES_REF) === m3Key) : null;
          if (isStepAvailable['M3'] && !m3Rec) {
            saidaM3++;
          } else if (m3Rec) {
            const vm1Key = sortedAllKeys[cohortIdx + 3];
            const vm1Rec = vm1Key ? t.history.find(h => getMonthKey(h.MES_REF) === vm1Key) : null;
            if (isStepAvailable['VM1'] && !vm1Rec) {
              saidaVM1++;
            } else if (vm1Rec) {
              chegaramVM1++;
              const vm2Key = sortedAllKeys[cohortIdx + 4];
              const vm2Rec = vm2Key ? t.history.find(h => getMonthKey(h.MES_REF) === vm2Key) : null;
              if (vm2Rec?.TIPO_BASE === 'VETERANO' || vm2Rec?.TIPO_BASE === 'VETERANO_EM_SAFRA') {
                viraramVM2++;
              } else if (isStepAvailable['VM2']) {
                if (vm2Rec?.classification === 'NÃO CERTIFICADO') naoEvoluiu++;
                else if (vm2Rec) aguardando++; 
              }
            }
          }
        }
      });

      return {
        company,
        entrada,
        certificados,
        naoCertificados: entrada - certificados,
        percentCertificacao: entrada > 0 ? (certificados / entrada) * 100 : 0,
        saidaM2,
        saidaM3,
        saidaVM1,
        chegaramVM1,
        viraramVM2,
        aguardando,
        naoEvoluiu,
        unidentified,
        insight: `${company}: ${entrada} entraram, ${certificados} certificados e ${saidaM2} saíram antes do M2.`
      };
    }).filter(Boolean);
  }, [continuityStats, selectedCohort, chartCompanies, data]);

  const techTrajectories = useMemo(() => {
    if (!continuityStats || !selectedCohort) return [];

    const { techJourneyMap, sortedAllKeys } = continuityStats;
    const cohortIdx = sortedAllKeys.indexOf(selectedCohort);
    if (cohortIdx === -1) return [];

    const cohortTechs = Array.from(techJourneyMap.keys()).filter((login: string) => {
      const journey = techJourneyMap.get(login);
      const record = journey?.get(selectedCohort);
      if (record?.TIPO_BASE !== 'SAFRA') return false;
      const prevKey = sortedAllKeys[cohortIdx - 1];
      if (!prevKey) return true;
      const prevRecord = journey?.get(prevKey);
      return !prevRecord || prevRecord.TIPO_BASE !== 'SAFRA';
    }).map((login: string) => ({
      login,
      history: getTechnicianHistory(login, data)
    }));

    const activeCompanies = chartCompanies.length > 0 ? chartCompanies.map(normalizeText) : [];
    const displayedCompanies = activeCompanies.length > 0 
      ? continuityStats.allCompanies.filter(c => activeCompanies.includes(normalizeText(c)))
      : continuityStats.allCompanies.slice(0, 3);

    const trajectories: any[] = [];
    const maxStepsAvailable = cohortData.length;

    displayedCompanies.forEach(company => {
      const companyTechs = cohortTechs.filter(t => {
        const entryRec = t.history.find(h => getMonthKey(h.MES_REF) === selectedCohort);
        return normalizeText(entryRec?.EMPRESA || '') === normalizeText(company);
      });

      companyTechs.forEach(t => {
        const keys = sortedAllKeys.slice(cohortIdx);
        let exitStep = '';
        let lastRecord: TechnicianRecord | null = null;
        const presence = new Array(maxStepsAvailable).fill(false);
        let certStepIdx = -1;

        for (let i = 0; i < maxStepsAvailable; i++) {
           const k = keys[i];
           if (!k) break;
           const rec = t.history.find(h => getMonthKey(h.MES_REF) === k);
           
           if (!rec) {
              if (i > 0 && !exitStep) exitStep = `SAIU NO ${cohortData[i]?.step || 'DESCONHECIDO'}`;
              continue;
           }

           lastRecord = rec;
           presence[i] = true;

           if (certStepIdx === -1 && (rec.PERCENT_TC ?? 0) >= 70) {
             certStepIdx = i;
           }
        }

        if (!exitStep) {
           const latestRec = lastRecord || t.history.find(h => getMonthKey(h.MES_REF) === selectedCohort);
           if (latestRec?.TIPO_BASE === 'VETERANO') exitStep = 'VETERANO';
           else if (latestRec?.TIPO_BASE === 'VETERANO_EM_SAFRA') exitStep = 'VET EM SAFRA';
           else exitStep = 'ATIVO';
        }

        // GAP Identification
        let gap = 'N/A';
        const finalTC = lastRecord?.PERCENT_TC ?? (t.history.find(h => getMonthKey(h.MES_REF) === selectedCohort)?.PERCENT_TC ?? 0);
        if (certStepIdx === -1) {
          const recForGap = lastRecord || t.history.find(h => getMonthKey(h.MES_REF) === selectedCohort);
          if (recForGap) {
            const agenda = recForGap.PERCENT_CUMP_AGENDA ?? 0;
            const rev = recForGap.PERCENT_REV ?? 0;
            const prod = recForGap.PROD ?? 0; 
            
            if (agenda < 90) gap = 'AGENDA';
            else if (rev > 5) gap = 'REVISITA';
            else if (prod < 3.5) gap = 'PRODUTIVIDADE';
            else gap = 'OUTROS';
          }
        } else {
          gap = 'CERTIFICADO';
        }

        trajectories.push({
          login: t.login,
          company,
          entrance: selectedCohortLabel || 'N/A',
          exitStep,
          finalTC,
          gap,
          presence,
          certStepIdx
        });
      });
    });

    // Group by company
    const grouped = displayedCompanies.map(c => ({
      company: c,
      techs: trajectories.filter(t => t.company === c)
    })).filter(g => g.techs.length > 0);

    return grouped;
  }, [continuityStats, selectedCohort, selectedCohortLabel, chartCompanies, data, cohortData]);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const getStepColor = (idx: number, tech: any) => {
    if (tech.certStepIdx !== -1 && idx === tech.certStepIdx) return 'bg-emerald-500 border-emerald-500';
    if (tech.certStepIdx !== -1 && idx > tech.certStepIdx && tech.presence[idx]) return 'bg-emerald-300 border-emerald-300';
    if (tech.presence[idx]) return 'bg-primary border-primary';
    return 'bg-slate-200 border-slate-200';
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="card p-10 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[3rem]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tempo de Retenção de Técnicos</h3>
              <p className="text-xs text-slate-400 font-medium">Análise de Cohort: Acompanhamento da base por mês de entrada</p>
              
              <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mês de Entrada (Cohort):</span>
                  <select 
                    value={selectedCohort} 
                    onChange={(e) => setSelectedCohort(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-primary/50 shadow-sm transition-all"
                  >
                    {continuityStats?.uniqueMonthsList.map(m => (
                      <option key={m.key} value={m.key}>{formatFullMonth(m.label)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Filtro de Empresa (Máx 3):</span>
                  <div className="flex flex-wrap gap-2">
                    {continuityStats?.allCompanies.slice(0, 8).map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          setChartCompanies(prev => {
                            if (prev.includes(c)) return prev.filter(x => x !== c);
                            if (prev.length >= 3) return [...prev.slice(1), c];
                            return [...prev, c];
                          });
                        }}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                          chartCompanies.includes(c) 
                            ? "bg-primary border-primary text-white" 
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {cohortData.some(d => Object.keys(d).length > 1) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cohortData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="step" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  content={<RetentionTooltip />} 
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 9999 }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ paddingBottom: '30px' }}
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{value}</span>}
                />
                {displayedCompanies.map((company, idx) => (
                  <Line
                    key={company}
                    type="monotone"
                    dataKey={company}
                    name={company}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={4}
                    dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    animationDuration={1500}
                    connectNulls={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Nenhum dado encontrado para o período e empresas selecionadas.</p>
            </div>
          )}
        </div>

        {cohortInsights.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cohortInsights.map((insight, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <TrendingDown className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{insight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-10 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[3rem]">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Certificação da Cohort Selecionada</h3>
            <p className="text-xs text-slate-400 font-medium">Análise de certificação vs. desligamento precoce</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Entraram</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">Certificados</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-amber-600">Não Certificados</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">% Certificação</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-red-400">Saída M2</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-red-400">Saída M3</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-red-400">Saída VM1</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Chegaram VM1</th>
                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-primary">VM2+</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {certificationMetrics.map((m: any, idx: number) => (
                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-xs font-black text-slate-900 uppercase">{m.company}</td>
                  <td className="py-4 text-center text-xs font-bold text-slate-600">{m.entrada}</td>
                  <td className="py-4 text-center text-xs font-black text-emerald-600">{m.certificados}</td>
                  <td className="py-4 text-center text-xs font-bold text-amber-600">{m.naoCertificados}</td>
                  <td className="py-4 text-center text-xs font-black text-slate-900">{m.percentCertificacao.toFixed(1)}%</td>
                  <td className="py-4 text-center text-xs font-bold text-red-400">{m.saidaM2}</td>
                  <td className="py-4 text-center text-xs font-bold text-red-400">{m.saidaM3}</td>
                  <td className="py-4 text-center text-xs font-bold text-red-400">{m.saidaVM1}</td>
                  <td className="py-4 text-center text-xs font-bold text-slate-600">
                    <div className="flex flex-col items-center">
                      <span>{m.chegaramVM1}</span>
                      <div className="flex gap-1 mt-1">
                        {m.aguardando > 0 && <span className="text-[7px] text-amber-500 font-black">A:{m.aguardando}</span>}
                        {m.naoEvoluiu > 0 && <span className="text-[7px] text-slate-400 font-black">N:{m.naoEvoluiu}</span>}
                        {m.unidentified > 0 && <span className="text-[7px] text-purple-400 font-black">?:{m.unidentified}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center text-xs font-black text-primary">{m.viraramVM2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificationMetrics.map((m: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <TrendingDown className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{m.insight}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-10 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[3rem]">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Trajetória dos Técnicos da Cohort</h3>
            <p className="text-xs text-slate-400 font-medium">Acompanhamento individualizado e motivos de perda</p>
          </div>
        </div>

        <div className="space-y-8">
          {techTrajectories.map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              <h4 className="text-sm font-black text-primary uppercase tracking-widest border-l-4 border-primary pl-4">{group.company}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.techs.map((t, tIdx) => (
                  <div key={tIdx} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 group-hover:border-primary/30 transition-all font-black text-[10px] text-slate-400">
                          {t.login.slice(-2)}
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-900 uppercase">{t.login}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                            Entrada: {t.entrance}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {['Ent', 'M2', 'M3', 'VM1', 'VM2'].map((step, idx) => {
                           let label = step;
                           // Logic for VES labels if needed
                           if (idx === 3) label = 'VM1/VES1';
                           if (idx === 4) label = 'VM2/VES2';
                           
                           return (
                             <div key={step} className="flex flex-col items-center gap-1">
                               <div className={`w-3 h-3 rounded-full border transition-all ${getStepColor(idx, t)}`} />
                               <span className="text-[6px] font-black text-slate-400 uppercase">{label}</span>
                             </div>
                           );
                        })}
                      </div>
                    </div>

                    <div className="text-right">
                       <div className={`text-[9px] font-black uppercase tracking-tight ${(t.exitStep.includes('VETERANO') || t.exitStep.includes('VM') || t.exitStep.includes('ATIVO')) ? 'text-emerald-600' : 'text-slate-600'}`}>
                         {t.exitStep}
                       </div>
                       <div className="flex items-center gap-2 justify-end mt-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">TC: {Math.round(t.finalTC * 100)}%</span>
                          {t.certStepIdx !== -1 ? (
                            <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                              {t.certStepIdx === 0 ? 'Certificado na Entrada' : 
                               t.certStepIdx <= 2 ? `Certificou no M${t.certStepIdx + 1}` : 
                               `Certificou como Veterano (VM${t.certStepIdx - 2})`}
                            </span>
                          ) : (
                            t.gap !== 'N/A' && (
                              <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                                Gap: {t.gap}
                              </span>
                            )
                          )}
                       </div>
                       <div className="text-[7px] font-bold text-slate-300 uppercase mt-1">
                          {t.certStepIdx !== -1 
                            ? (t.exitStep.includes('SAIU') ? 'Certificado antes da saída' : 'Certificado no ciclo')
                            : 'Não certificado'}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
