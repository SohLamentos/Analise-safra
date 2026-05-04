import React, { useMemo } from 'react';
import { 
  TrendingUp,
  Building2,
  MapPin,
  Clock,
  ArrowUpCircle,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';
import { MONTHS_ORDER } from '../constants';

interface RecuperaveisViewProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function RecuperaveisView({ data, config }: RecuperaveisViewProps) {
  // 1. Identify Last Month
  const lastMonth = useMemo(() => {
    if (!data || data.length === 0) return null;
    const months = Array.from(new Set(data.map(d => d.MES_REF).filter(Boolean)));
    if (months.length === 0) return null;
    
    return months.sort((a, b) => {
      const orderA = MONTHS_ORDER[(a || '').toString().toLowerCase()] || 0;
      const orderB = MONTHS_ORDER[(b || '').toString().toLowerCase()] || 0;
      return orderB - orderA;
    })[0];
  }, [data]);

  // 2. Identify Recoverable Techs with Scoring
  const prioritizedRecuperaveis = useMemo(() => {
    if (!lastMonth || data.length === 0) return [];

    // Map all records by tech+type for history check
    const techHistory = new Map<string, string[]>();
    data.forEach(d => {
      const key = `${d.LOGIN_TECNICO}_${d.TIPO_BASE}`;
      if (!techHistory.has(key)) {
        techHistory.set(key, []);
      }
      techHistory.get(key)!.push(d.MES_REF);
    });

    const lastMonthRecords = data.filter(d => d.MES_REF === lastMonth);
    
    // Unique technicians for last month per TIPO_BASE
    const uniqueTechMap = new Map<string, TechnicianRecord>();
    lastMonthRecords.forEach(d => {
      const key = `${d.LOGIN_TECNICO}_${d.TIPO_BASE}`;
      uniqueTechMap.set(key, d);
    });

    const recoverableList = Array.from(uniqueTechMap.values())
      .filter(d => {
        // Base critical: TC < 70% or any GAP
        const isNotCert = (d.PERCENT_TC || 0) < 0.7 || (d.notCertifiedReasons || []).length > 0;
        if (!isNotCert) return false;

        const reasons = (d.notCertifiedReasons || []).map(r => r.toUpperCase());
        
        // EXCLUDE: NOSHOW, SEM EAD
        const hasExcludedGap = reasons.some(r => r.includes('NOSHOW') || r.includes('EAD'));
        if (hasExcludedGap) return false;

        // INCLUDE: AGENDA, REVISITA
        const hasIncludedGap = reasons.some(r => r.includes('AGENDA') || r.includes('REVISITA'));
        return hasIncludedGap;
      })
      .map(d => {
        const reasons = (d.notCertifiedReasons || []).map(r => r.toUpperCase());
        
        // 6. Weights
        let peso = 0;
        if (reasons.some(r => r.includes('REVISITA'))) peso = 3;
        else if (reasons.some(r => r.includes('AGENDA'))) peso = 2;
        else peso = 1;

        // 5. History Bonus
        const history = techHistory.get(`${d.LOGIN_TECNICO}_${d.TIPO_BASE}`) || [];
        const hasHistory = history.some(m => m !== lastMonth);
        const bonus = hasHistory ? 2 : 0;

        return {
          ...d,
          score: peso + bonus,
          primaryGap: (reasons || []).join(', ') || 'N/A',
          hasHistory
        };
      })
      // 8. Sort by Score
      .sort((a, b) => b.score - a.score);

    return recoverableList;
  }, [data, lastMonth]);

  if (!lastMonth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200">
        <Layers className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-xl font-black text-slate-400">Sem dados carregados</h3>
        <p className="text-sm text-slate-400 mt-2">Importe a base para identificar oportunidades de recuperação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Wins</span>
           </div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Oportunidades: Recuperáveis</h2>
           <p className="text-sm text-slate-500 mt-1">Técnicos com GAPs operacionais leves e alto potencial de certificação ({lastMonth}).</p>
        </div>

        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-emerald-600">{prioritizedRecuperaveis.length}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Oportunidades</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Recuperação Rápida</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnico / Login</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade / UF</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">GAP Operacional</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">TC %</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {prioritizedRecuperaveis.length > 0 ? (
                prioritizedRecuperaveis.map((tech, index) => {
                  const isTop10 = index < 10;
                  return (
                    <tr 
                      key={`${tech.LOGIN_TECNICO}-${index}`}
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors",
                        isTop10 ? "bg-emerald-50/30" : ""
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className={cn(
                          "w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black",
                          isTop10 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{tech.LOGIN_TECNICO}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{tech.TIPO_BASE}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">{tech.EMPRESA}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-slate-300" />
                          <span className="text-xs font-medium text-slate-500 uppercase">{tech.NM_GRUPO_REGIONAL || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter",
                          isTop10 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {tech.primaryGap}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "text-sm font-black",
                          (tech.PERCENT_TC || 0) < 0.7 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {formatPercent(tech.PERCENT_TC || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <span className={cn(
                             "text-lg font-black",
                             isTop10 ? "text-emerald-700" : "text-slate-900"
                           )}>{tech.score}</span>
                           {tech.hasHistory && (
                             <Clock className="w-3 h-3 text-amber-500" title="Possui histórico anterior" />
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-600 text-white">
                            <ArrowUpCircle className="w-2.5 h-2.5" /> RECUPERÁVEL
                         </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                    Sem t&eacute;cnicos recuper&aacute;veis no per&iacute;odo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">O que &eacute; um t&eacute;cnico recuper&aacute;vel?</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              S&atilde;o profissionais que n&atilde;o atingiram a certifica&ccedil;&atilde;o (TC &lt; 70%), mas cujos GAPs s&atilde;o puramente operacionais (Agenda ou Revisita). 
              T&eacute;cnicos com problemas de No-Show ou Falta de EAD s&atilde;o <strong>exclu&iacute;dos</strong> desta lista por exigirem treinamento ou san&ccedil;&otilde;es mais complexas.
            </p>
         </div>
      </div>
    </div>
  );
}

