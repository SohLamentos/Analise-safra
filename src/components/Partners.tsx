import React, { useMemo, useState, useEffect } from 'react';
import { Building2, TrendingUp, TrendingDown, Minus, Calendar, Users } from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';
import { MONTHS_ORDER, getTecnicosCriticos, normalizeText } from '../constants';

interface PartnersProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function Partners({ data, config }: PartnersProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const monthOptions = useMemo(() => {
    const uniqueMesRefs = Array.from(new Set(data.map(d => d.MES_REF).filter(Boolean)));
    
    const monthNamesMap: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };

    const sorted = uniqueMesRefs.map(m => {
      const clean = normalizeText(m).toLowerCase();
      const parts = clean.split(' ');
      const mName = parts[0];
      const year = parts[parts.length - 1];
      const mNum = monthNamesMap[mName] || '00';
      return {
        key: `${year}-${mNum}`,
        label: m,
        original: m
      };
    }).sort((a, b) => a.key.localeCompare(b.key));
    
    return sorted;
  }, [data]);

  useEffect(() => {
    if (monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[monthOptions.length - 1].key);
    }
  }, [monthOptions, selectedMonth]);

  const partnersStats = useMemo(() => {
    if (!selectedMonth || monthOptions.length === 0) return [];

    const currentMonthObj = monthOptions.find(mo => mo.key === selectedMonth);
    const activeMesRef = currentMonthObj?.original;
    if (!activeMesRef) return [];

    const monthFilteredData = data.filter(d => d.MES_REF === activeMesRef);
    if (monthFilteredData.length === 0) return [];

    const empresas = Array.from(new Set(monthFilteredData.map(d => d.EMPRESA)));
    
    // Global criticals for the whole data set (needed for history context)
    const criticalLogins = new Set(getTecnicosCriticos(data, config).map(c => c.login));

    // Group records by technician for consolidated status
    const techMap: Record<string, TechnicianRecord[]> = {};
    data.forEach(d => {
      const key = `${d.LOGIN_TECNICO}_${d.TIPO_BASE}`;
      if (!techMap[key]) techMap[key] = [];
      techMap[key].push(d);
    });

    const consolidatedTechsByCompany: Record<string, any[]> = {};
    const JANELA_SAFRA_FIXA = 3;
    
    Object.entries(techMap).forEach(([login, records]) => {
      const currentRec = records.find(r => r.MES_REF === activeMesRef);
      if (!currentRec) return; // Not active in this month

      const empresa = currentRec.EMPRESA;

      const historyUntilNow = records.filter(r => {
        const orderR = MONTHS_ORDER[(r.MES_REF || '').toString().toLowerCase()] || 0;
        const orderNow = MONTHS_ORDER[(activeMesRef || '').toString().toLowerCase()] || 0;
        return orderR <= orderNow;
      }).sort((a, b) => {
        const orderA = MONTHS_ORDER[(a.MES_REF || '').toString().toLowerCase()] || 0;
        const orderB = MONTHS_ORDER[(b.MES_REF || '').toString().toLowerCase()] || 0;
        return orderA - orderB;
      });

      const safraWindow = historyUntilNow.slice(0, JANELA_SAFRA_FIXA);
      
      let status = 'SEM VOLUME SUFICIENTE';
      if (criticalLogins.has(login)) status = 'CRÍTICO';
      else if (currentRec.isCertified) status = 'CERTIFICADO';
      else if (historyUntilNow.length >= JANELA_SAFRA_FIXA && historyUntilNow.every(r => !r.isCertified)) status = 'ENCERRADO SEM CERTIFICAÇÃO';
      else if (currentRec.isLowVolume) status = 'SEM VOLUME SUFICIENTE';
      else status = 'EM ATENÇÃO';

      if (!consolidatedTechsByCompany[empresa]) consolidatedTechsByCompany[empresa] = [];
      consolidatedTechsByCompany[empresa].push({ login, status, records: historyUntilNow });
    });

    return empresas.map(empresa => {
      const techs = consolidatedTechsByCompany[empresa] || [];
      const totalTechs = techs.length;
      
      const certified = techs.filter(t => t.status === 'CERTIFICADO').length;
      const atencao = techs.filter(t => t.status === 'EM ATENÇÃO').length;
      const criticos = techs.filter(t => t.status === 'CRÍTICO').length;
      const encerrados = techs.filter(t => t.status === 'ENCERRADO SEM CERTIFICAÇÃO').length;

      const empRecordsForMonth = monthFilteredData.filter(d => d.EMPRESA === empresa);
      const avgRev = empRecordsForMonth.reduce((acc, curr) => acc + (curr.PERCENT_REV || 0), 0) / empRecordsForMonth.length || 0;
      const avgAgenda = empRecordsForMonth.reduce((acc, curr) => acc + (curr.PERCENT_CUMP_AGENDA || 0), 0) / empRecordsForMonth.length || 0;
      const avgProd = empRecordsForMonth.reduce((acc, curr) => acc + (curr.PROD || 0), 0) / empRecordsForMonth.length || 0;
      
      const avgGapRev = empRecordsForMonth.reduce((acc, curr) => acc + (curr.GAP_REV || 0), 0) / empRecordsForMonth.length || 0;
      const avgGapAgenda = empRecordsForMonth.reduce((acc, curr) => acc + (curr.GAP_CUMP_AGENDA || 0), 0) / empRecordsForMonth.length || 0;

      const regions = Array.from(new Set(empRecordsForMonth.map(r => r.REGIAO_PR)));
      const statusEmpresa = empRecordsForMonth[0]?.STATUS_EMPRESA || 'NAO_MAPEADA';

      // Trend analysis (up to selected month)
      const empHistoricalRecords = data.filter(d => d.EMPRESA === empresa);
      const months = Array.from(new Set(empHistoricalRecords.filter(r => r.MES_REF).map(r => r.MES_REF)))
        .sort((a, b) => (MONTHS_ORDER[(a || '').toLowerCase()] || 0) - (MONTHS_ORDER[(b || '').toLowerCase()] || 0));
      
      const activeIdx = months.indexOf(activeMesRef);
      const availableHistory = months.slice(0, activeIdx + 1);
      const last3 = availableHistory.slice(-3);
      
      const monthlyRates = last3.map(m => {
        const monthRecs = empHistoricalRecords.filter(r => r.MES_REF === m);
        return (monthRecs.filter(r => r.isCertified).length / monthRecs.length) || 0;
      });

      let tendencia: 'Melhorando' | 'Estável' | 'Piorando' = 'Estável';
      if (monthlyRates.length >= 2) {
        const diff = monthlyRates[monthlyRates.length - 1] - monthlyRates[0];
        if (diff > 0.05) tendencia = 'Melhorando';
        else if (diff < -0.05) tendencia = 'Piorando';
      }

      return {
        empresa,
        totalTechs,
        percentCert: (certified / totalTechs) || 0,
        percentAtencao: (atencao / totalTechs) || 0,
        percentCriticos: (criticos / totalTechs) || 0,
        percentEncerrados: (encerrados / totalTechs) || 0,
        avgRev,
        avgAgenda,
        avgProd,
        avgGapRev,
        avgGapAgenda,
        tendencia,
        regions,
        statusEmpresa
      };
    });
  }, [data, config, selectedMonth, monthOptions]);

  return (
    <div className="space-y-6 pb-12">
      {/* Month Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-lg shadow-slate-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Análise por Empresa</h2>
            <p className="text-xs text-slate-400 font-medium">Desempenho consolidado e evolução mensal</p>
          </div>
        </div>
        
        {monthOptions.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
             <Calendar className="w-4 h-4 text-slate-400 ml-2" />
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(e.target.value)}
               className="bg-white text-xs font-black uppercase tracking-widest py-2 px-3 focus:outline-none cursor-pointer min-w-[160px]"
             >
               {monthOptions.map(m => (
                 <option key={m.key} value={m.key}>{m.label}</option>
               ))}
             </select>
          </div>
        )}
      </div>

      {partnersStats.length === 0 ? (
        <div className="card p-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-50 border-dashed">
          <div className="bg-white p-4 rounded-full shadow-sm">
            <Building2 className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold max-w-xs">
            {data.length === 0 
              ? 'Importe dados para visualizar a análise por empresa.' 
              : 'Nenhum dado disponível para o mês selecionado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {partnersStats.map((p, i) => (
            <div key={i} className={cn(
              "card overflow-hidden flex flex-col group transition-all",
              p.statusEmpresa === 'NAO_MAPEADA' ? "border-amber-200 bg-amber-50/5 shadow-amber-100/20" : "hover:border-primary/30"
            )}>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-2xl shadow-lg transition-all",
                    p.statusEmpresa === 'MAPEADA' ? "bg-slate-900 shadow-slate-200" : "bg-amber-600 shadow-amber-200"
                  )}>
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black text-slate-900 leading-none">{p.empresa}</h3>
                      {p.statusEmpresa === 'NAO_MAPEADA' && (
                        <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-amber-200">Não Mapeada</span>
                      )}
                      {p.statusEmpresa === 'MAPEADA' && (
                        <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-emerald-200">Mapeada</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <Users className="w-3 h-3 text-slate-400" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.totalTechs} Técnicos Ativos</span>
                       <div className="flex gap-1 ml-2">
                         {p.regions.map(r => (
                           <span key={r} className={cn(
                             "text-[7px] font-black px-1 py-0.5 rounded uppercase",
                             r === 'CAPITAL' ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : 
                             r === 'INTERIOR' ? "bg-purple-100 text-purple-700 border border-purple-200" : 
                             "bg-slate-100 text-slate-500 border border-slate-200"
                           )}>
                             {r}
                           </span>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-wider",
                  p.tendencia === 'Melhorando' ? "bg-green-100 text-green-700" :
                  p.tendencia === 'Piorando' ? "bg-red-100 text-red-700" :
                  "bg-slate-100 text-slate-500"
                )}>
                  {p.tendencia === 'Melhorando' && <TrendingUp className="w-3 h-3" />}
                  {p.tendencia === 'Piorando' && <TrendingDown className="w-3 h-3" />}
                  {p.tendencia === 'Estável' && <Minus className="w-3 h-3" />}
                  {p.tendencia}
                </div>
              </div>

              <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
                 <div className="p-3 bg-green-50/50 rounded-2xl border border-green-100">
                    <div className="text-[10px] font-black text-green-700/60 uppercase mb-1">Certificados</div>
                    <div className="text-xl font-black text-green-900">{formatPercent(p.percentCert)}</div>
                 </div>
                 <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <div className="text-[10px] font-black text-amber-700/60 uppercase mb-1">Em Atenção</div>
                    <div className="text-xl font-black text-amber-900">{formatPercent(p.percentAtencao)}</div>
                 </div>
                 <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100">
                    <div className="text-[10px] font-black text-red-700/60 uppercase mb-1">Críticos</div>
                    <div className="text-xl font-black text-red-900">{formatPercent(p.percentCriticos)}</div>
                 </div>
                 <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-500/60 uppercase mb-1">Encerrados</div>
                    <div className="text-xl font-black text-slate-900">{formatPercent(p.percentEncerrados)}</div>
                 </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-6">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Méd. Revisita</span>
                    <span className={cn("text-xs font-black", p.avgGapRev > 0 ? "text-red-500" : "text-emerald-600")}>
                      {formatPercent(p.avgRev)}
                    </span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Méd. Agenda</span>
                    <span className={cn("text-xs font-black", p.avgGapAgenda > 0 ? "text-red-500" : "text-emerald-600")}>
                      {formatPercent(p.avgAgenda)}
                    </span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Produtividade</span>
                    <span className="text-xs font-black text-slate-900">{p.avgProd.toFixed(1)} pts</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
