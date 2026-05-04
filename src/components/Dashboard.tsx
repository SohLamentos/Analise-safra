import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingDown,
  Calendar,
  Layers
} from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';
import { MONTHS_ORDER, getTecnicosCriticos } from '../constants';

interface DashboardProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function Dashboard({ data, config }: DashboardProps) {
  // 1. Identify the latest month automatically
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

  // 2. Filter data for the last month and technicians with volume
  const lastMonthData = useMemo(() => {
    if (!lastMonth) return [];
    // Ensure unique technicians for the latest month per TIPO_BASE
    const techMap = new Map<string, TechnicianRecord>();
    data.filter(d => d.MES_REF === lastMonth).forEach(d => {
      const key = `${d.LOGIN_TECNICO}_${d.TIPO_BASE}`;
      techMap.set(key, d);
    });
    return Array.from(techMap.values());
  }, [data, lastMonth]);

  // 3. Calculate Executive Metrics
  const metrics = useMemo(() => {
    if (lastMonthData.length === 0) return null;

    const total = lastMonthData.length;
    const certificados = lastMonthData.filter(d => (d.PERCENT_TC || 0) >= 0.7).length;
    const naoCertificados = total - certificados;
    
    // Criticals (historically based, but for the current context)
    const criticals = getTecnicosCriticos(data, config)
      .filter(c => c.lastMonth.MES_REF === lastMonth).length;

    // 5. GAP Classification
    const gaps: Record<string, number> = {
      'AGENDA': 0,
      'REVISITA': 0,
      'SEM EAD': 0,
      'NOSHOW': 0,
      'OUTROS': 0
    };

    lastMonthData.filter(d => (d.PERCENT_TC || 0) < 0.7).forEach(d => {
      const reasons = d.notCertifiedReasons || [];
      if (reasons.length === 0) {
        gaps['OUTROS']++;
      } else {
        reasons.forEach(r => {
          const upperR = r.toUpperCase();
          if (upperR.includes('AGENDA')) gaps['AGENDA']++;
          else if (upperR.includes('REVISITA')) gaps['REVISITA']++;
          else if (upperR.includes('EAD')) gaps['SEM EAD']++;
          else if (upperR.includes('NOSHOW')) gaps['NOSHOW']++;
          else gaps['OUTROS']++;
        });
      }
    });

    // 6. Identify Principal GAP
    const sortedGaps = Object.entries(gaps)
      .sort((a, b) => b[1] - a[1]);
    
    const principalGap = sortedGaps[0];

    return {
      total,
      certificados,
      naoCertificados,
      criticals,
      certRate: total > 0 ? (certificados / total) * 100 : 0,
      naoCertRate: total > 0 ? (naoCertificados / total) * 100 : 0,
      gaps,
      principalGap: {
        name: principalGap ? principalGap[0] : 'NENHUM',
        count: principalGap ? principalGap[1] : 0,
        percent: total > 0 && principalGap ? (principalGap[1] / total) * 100 : 0
      }
    };
  }, [data, lastMonthData, config]);

  // Safety Gate
  if (!lastMonth || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center">
        <Layers className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-xl font-black text-slate-400">Sem dados carregados</h3>
        <p className="text-sm text-slate-400 mt-2">Importe a base Safra para habilitar a visão executiva.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Executive */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="text-primary w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Visão Executiva</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter">
              Status Atual: <span className="text-primary uppercase">{lastMonth}</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-6 bg-slate-800/50 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/5">
             <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Técnicos Base</p>
                <p className="text-3xl font-black">{metrics.total}</p>
             </div>
             <div className="w-px h-12 bg-white/10" />
             <div className="text-center">
                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-wider mb-1">Certificados</p>
                <p className="text-3xl font-black text-emerald-400">{metrics.certRate.toFixed(1)}%</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Técnicos */}
        <div className="card p-8 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <Users className="absolute top-4 right-4 w-12 h-12 text-slate-50 group-hover:text-blue-50 transition-colors" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Técnicos</p>
          <h3 className="text-4xl font-black text-slate-900 mb-1">{metrics.total}</h3>
          <p className="text-xs font-bold text-slate-500">Logins ativos no mês</p>
        </div>

        {/* Certificados */}
        <div className="card p-8 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 border-b-4 border-b-emerald-500">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Certificados (TC ≥ 70%)</p>
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-1">{metrics.certificados}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{metrics.certRate.toFixed(1)}%</span>
            <span className="text-xs text-slate-400 font-medium">do total</span>
          </div>
        </div>

        {/* Não Certificados */}
        <div className="card p-8 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 border-b-4 border-b-red-500">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Não Certificados</p>
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-1">{metrics.naoCertificados}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{metrics.naoCertRate.toFixed(1)}%</span>
            <span className="text-xs text-slate-400 font-medium">detratores</span>
          </div>
        </div>

        {/* Críticos */}
        <div className="card p-8 bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
          <AlertTriangle className="absolute top-4 right-4 w-12 h-12 text-white/5" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-amber-500">Atenção Crítica</p>
          <h3 className="text-4xl font-black text-white mb-1">{metrics.criticals}</h3>
          <p className="text-xs font-bold text-slate-400">Técnicos 2+ meses sem meta</p>
        </div>
      </div>

      {/* GAP Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Principal Detrator Card */}
        <div className="lg:col-span-1 card p-8 bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl shadow-red-500/20">
          <div className="flex items-center gap-3 mb-8">
            <TrendingDown className="w-6 h-6 text-red-200" />
            <h4 className="text-lg font-black tracking-tight">Principal Detrator</h4>
          </div>
          
          <div className="mb-8">
            <p className="text-5xl font-black mb-2 uppercase">{metrics.principalGap.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-red-100 font-bold text-lg">{metrics.principalGap.percent.toFixed(1)}%</span>
              <span className="text-red-200/60 text-sm">impacto na base</span>
            </div>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xs font-medium text-red-50 leading-relaxed italic">
              "Foco imediato na redução do gap de {metrics.principalGap.name.toLowerCase()} para elevar o índice de certificação."
            </p>
          </div>
        </div>

        {/* Distribution Card */}
        <div className="lg:col-span-2 card p-8 bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-black text-slate-900 tracking-tight">Distribuição de GAPs</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lastMonth}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {Object.entries(metrics.gaps).map(([name, count]) => (
              <div key={name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">{name}</span>
                  <span className="text-sm font-black text-slate-900">{count} <span className="text-slate-400 font-bold text-[10px]">TÉCS</span></span>
                </div>
                <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((count as number) / (metrics.naoCertificados || 1)) * 100}%` }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      count === metrics.principalGap.count ? "bg-red-500" : "bg-slate-300"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <Layers className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Entenda:</strong> Os GAPs são calculados com base nos motivos de falha de cada técnico não certificado (TC &lt; 70%) no mês de <strong>{lastMonth}</strong>. Um técnico pode apresentar mais de um GAP simultaneamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
