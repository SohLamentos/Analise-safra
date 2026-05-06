import React, { useMemo, useState } from 'react';
import { 
  Search, 
  History, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  MapPin,
  Building2,
  Calendar,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  User
} from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent, getTechnicianHistory } from '../lib/utils';
import { getMonthMapping } from '../constants';

interface LoginSearchProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

interface JourneyRecord extends TechnicianRecord {
  calculatedStage: string;
  hasGapBefore: boolean;
  isCertified: boolean;
}

export default function LoginSearch({ data, config }: LoginSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLogin, setActiveLogin] = useState<string | null>(null);

  // 1. Get all unique logins for suggestions (optional but helpful)
  const allLogins = useMemo(() => Array.from(new Set(data.map(d => d.LOGIN_TECNICO))).sort(), [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveLogin(searchTerm.trim().toUpperCase());
    }
  };

  // 2. Journey Calculation
  const journey = useMemo(() => {
    if (!activeLogin) return null;

    const records = getTechnicianHistory(activeLogin, data);
    console.log("DEBUG CONSULTAR LOGIN BASE OK", records);

    if (records.length === 0) return { found: false };

    const firstSafraIdx = records.findIndex(r => r.TIPO_BASE === 'SAFRA');
    if (firstSafraIdx === -1) {
      return { found: true, noSafra: true, records };
    }

    const processedJourney: JourneyRecord[] = [];
    let safraCount = 0;
    let vetCount = 0;
    let vesCount = 0;
    let lastMonthKey: string | null = null;
    let firstCertifiedMonth: string | null = null;

    records.forEach((rec, idx) => {
      const monthMap = getMonthMapping(rec.MES_REF);
      const currentMonthKey = monthMap?.key || '';
      
      // Stage Calculation
      let stage = 'N/A';
      if (rec.TIPO_BASE === 'SAFRA') {
        safraCount++;
        stage = safraCount === 1 ? 'Entrada / M1' : `M${safraCount} Safra`;
      } else if (rec.TIPO_BASE === 'VETERANO') {
        vetCount++;
        stage = `VM${vetCount}`;
      } else if (rec.TIPO_BASE === 'VETERANO_EM_SAFRA') {
        vesCount++;
        stage = `VES${vesCount}`;
      }

      // Check for Month Gaps
      let hasGap = false;
      if (lastMonthKey) {
        // Simple string increment for YYYY-MM gap check (e.g., 2024-01 to 2024-03)
        // For production, a real date diff is better, but this follows our MES_KEY logic
        const lastYear = parseInt(lastMonthKey.split('-')[0]);
        const lastMonth = parseInt(lastMonthKey.split('-')[1]);
        const currYear = parseInt(currentMonthKey.split('-')[0]);
        const currMonth = parseInt(currentMonthKey.split('-')[1]);
        
        const monthsDiff = (currYear * 12 + currMonth) - (lastYear * 12 + lastMonth);
        if (monthsDiff > 1) hasGap = true;
      }

      const isCertified = (rec.PERCENT_TC || 0) >= 70;
      if (isCertified && !firstCertifiedMonth) {
        firstCertifiedMonth = rec.MES_REF;
      }

      processedJourney.push({
        ...rec,
        calculatedStage: stage,
        hasGapBefore: hasGap,
        isCertified
      });

      lastMonthKey = currentMonthKey;
    });

    return {
      found: true,
      noSafra: false,
      records: processedJourney,
      summary: {
        login: activeLogin,
        firstMonth: records[0].MES_REF,
        lastMonth: records[records.length - 1].MES_REF,
        currentEmpresa: records[records.length - 1].EMPRESA,
        currentType: records[records.length - 1].TIPO_BASE,
        currentPercent: records[records.length - 1].PERCENT_TC || 0,
        everCertified: !!firstCertifiedMonth,
        firstCertifiedMonth
      }
    };
  }, [data, activeLogin]);

  // Helper inside component for LoginSearch context
  const getGAPReason = (rec: TechnicianRecord) => {
    if (rec.PERCENT_TC >= 70) return null;
    
    // User logic:
    // PROD. < META -> PRODUTIVIDADE
    // % REV > META -> REVISITA (Wait, usually Revisita Meta is a MAX, so if value > target, it's a gap)
    // % CUM < META -> AGENDA
    
    // Reusing reasons from record if available, but enforcing user priorities
    const reasons = rec.notCertifiedReasons || [];
    if (reasons.length > 0) return reasons.join(' + ');

    // Fallback logic based on fields
    const gaps = [];
    if (rec.PERCENT_REV > 5) gaps.push('REVISITA'); // Meta example
    if (rec.PERCENT_CUMP_AGENDA < 90) gaps.push('AGENDA'); // Meta example
    if (rec.PROD < 2) gaps.push('PRODUTIVIDADE'); // Meta example
    
    return gaps.length > 0 ? gaps.join(' + ') : 'Critério Técnico';
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consultar Login</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Visualize a jornada completa do técnico mês a mês</p>
        </div>

        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Digite o login do técnico (ex: Z123456)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {!activeLogin && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300">
           <User className="w-16 h-16 mb-4 opacity-20" />
           <p className="text-sm font-black uppercase tracking-[0.2em]">Aguardando busca de login...</p>
        </div>
      )}

      {journey?.found === false && (
        <div className="card p-12 bg-white border border-red-100 rounded-[3rem] flex flex-col items-center gap-4 text-center">
           <AlertTriangle className="w-12 h-12 text-red-500" />
           <div>
             <h4 className="text-xl font-black text-slate-900 uppercase">Login não encontrado</h4>
             <p className="text-slate-400 text-sm font-medium">O login "{activeLogin}" não consta na base de dados carregada.</p>
           </div>
        </div>
      )}

      {journey?.noSafra === true && (
        <div className="card p-12 bg-white border border-amber-100 rounded-[3rem] flex flex-col items-center gap-4 text-center">
           <AlertCircle className="w-12 h-12 text-amber-500" />
           <div>
             <h4 className="text-xl font-black text-slate-900 uppercase">Sem Histórico de Safra</h4>
             <p className="text-slate-400 text-sm font-medium">Este login possui registros, mas nenhum como SAFRA (Entrada).</p>
           </div>
        </div>
      )}

      {journey?.found && journey.summary && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Card */}
          <div className="card p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <History className="w-32 h-32 text-white" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Colaborador</p>
                <h3 className="text-3xl font-black">{journey.summary.login}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-indigo-500/30 px-2 py-0.5 rounded uppercase tracking-tighter">
                    {journey.summary.currentType.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400">{journey.summary.currentEmpresa}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Jornada</p>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                     <p className="text-lg font-black">{journey.summary.firstMonth.split(' ')[0]}</p>
                     <p className="text-[9px] font-bold text-indigo-400 uppercase">Início</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                  <div className="text-center">
                     <p className="text-lg font-black">{journey.summary.lastMonth.split(' ')[0]}</p>
                     <p className="text-[9px] font-bold text-indigo-400 uppercase">Atual</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Status Certificação</p>
                <div className="flex items-center gap-2">
                   {journey.summary.everCertified ? (
                     <CheckCircle2 className="w-6 h-6 text-green-400" />
                   ) : (
                     <XCircle className="w-6 h-6 text-red-400" />
                   )}
                   <div>
                     <p className="text-lg font-black">{journey.summary.everCertified ? 'CERTIFICOU' : 'NUNCA CERTIFICOU'}</p>
                     {journey.summary.firstCertifiedMonth && (
                       <p className="text-[9px] font-bold text-indigo-400 uppercase">Desde {journey.summary.firstCertifiedMonth}</p>
                     )}
                   </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Performance Atual</p>
                <div className="flex items-center gap-3">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs",
                     journey.summary.currentPercent >= 70 ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                   )}>
                     {journey.summary.currentPercent.toFixed(1).replace('.', ',')}%
                   </div>
                   <p className="text-[10px] font-bold text-indigo-300 opacity-60 leading-tight uppercase tracking-tighter">Técnico em {getMonthMapping(journey.summary.lastMonth)?.label}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline View */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2 ml-4">
               <History className="w-4 h-4 text-slate-400" />
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Cronologia de Performance</h4>
            </div>

            <div className="space-y-12 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
               {journey.records.map((rec, i) => (
                 <div key={i} className="relative pl-12 group">
                   {/* Timeline Marker */}
                   <div className={cn(
                     "absolute left-0 top-0 w-10 h-10 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center z-10 transition-all group-hover:scale-110",
                     rec.isCertified ? "bg-green-500 text-white" : "bg-red-500 text-white"
                   )}>
                     {rec.isCertified ? <CheckCircle2 className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                   </div>

                   {/* Month Card */}
                   <div className="card p-6 bg-white border border-slate-100 shadow-sm rounded-[2rem] hover:border-primary/20 transition-all">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Column 1: Time & Stage */}
                        <div className="lg:col-span-3 space-y-2 border-r border-slate-50 pr-6">
                          <div className="flex items-center gap-2">
                             <Calendar className="w-4 h-4 text-slate-300" />
                             <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{rec.MES_REF}</span>
                          </div>
                          <h5 className="text-xl font-black text-slate-900">{rec.calculatedStage}</h5>
                          <span className={cn(
                            "inline-block text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                            rec.TIPO_BASE === 'SAFRA' ? "bg-primary/5 text-primary" : 
                            rec.TIPO_BASE === 'VETERANO' ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"
                          )}>
                            {rec.TIPO_BASE.replace('_', ' ')}
                          </span>

                          {rec.hasGapBefore && (
                            <div className="mt-4 flex items-center gap-2 p-2 bg-amber-50 rounded-xl border border-amber-100">
                               <AlertTriangle className="w-4 h-4 text-amber-600" />
                               <span className="text-[9px] font-black text-amber-700 uppercase leading-none">Quebra no histórico (mês anterior ausente)</span>
                            </div>
                          )}
                        </div>

                        {/* Column 2: Location & Work */}
                        <div className="lg:col-span-3 space-y-4">
                           <div className="flex items-start gap-3">
                              <Building2 className="w-4 h-4 text-slate-300 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Empresa / UN</p>
                                <p className="text-sm font-black text-slate-900">{rec.EMPRESA}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{rec.UNIDADE_NEGOCIO}</p>
                              </div>
                           </div>
                           <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-slate-300 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Região</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{rec.REGIAO_PR || 'NÃO CLASS.'}</p>
                              </div>
                           </div>
                        </div>

                        {/* Column 3: Performance GAPs */}
                        <div className="lg:col-span-4 bg-slate-50/50 p-4 rounded-2xl space-y-3">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Detalhada</p>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Produtividade</p>
                                <p className={cn("text-xs font-black", (rec.PROD || 0) < 3.5 ? "text-red-500" : "text-slate-700")}>
                                  {rec.PROD.toFixed(1).replace('.', ',')}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Qualidade/Rev.</p>
                                <p className={cn("text-xs font-black", (rec.PERCENT_REV || 0) > 5 ? "text-red-500" : "text-slate-700")}>
                                  {formatPercent(rec.PERCENT_REV || 0)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Agenda/Cump.</p>
                                <p className={cn("text-xs font-black", (rec.PERCENT_CUMP_AGENDA || 0) < 90 ? "text-red-500" : "text-slate-700")}>
                                  {formatPercent(rec.PERCENT_CUMP_AGENDA || 0)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Dias Trab.</p>
                                <p className="text-xs font-black text-slate-700">{Math.round(rec.MEDIA_DIAS_TRABALHADOS || 0)}d</p>
                              </div>
                           </div>
                           {!rec.isCertified && (
                             <div className="pt-2 border-t border-slate-100 flex items-start gap-2">
                                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5" />
                                <p className="text-[9px] font-bold text-red-700 uppercase tracking-tighter leading-tight">
                                  Motivo: {getGAPReason(rec)}
                                </p>
                             </div>
                           )}
                        </div>

                        {/* Column 4: %TC Badge */}
                        <div className="lg:col-span-2 flex flex-col items-center justify-center border-l border-slate-50">
                           <div className={cn(
                             "w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center shadow-sm",
                             rec.isCertified ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100 shadow-red-100"
                           )}>
                             <span className="text-xl font-black">{formatPercent(rec.PERCENT_TC || 0)}</span>
                             <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">% TC</span>
                           </div>
                           <span className={cn(
                             "mt-3 text-[9px] font-black uppercase tracking-[0.2em]",
                             rec.isCertified ? "text-green-600" : "text-red-600"
                           )}>
                             {rec.isCertified ? 'Certificado' : 'Não Certificado'}
                           </span>
                        </div>
                      </div>
                   </div>
                 </div>
               ))}
            </div>
            
            {/* End of Journey */}
            <div className="flex flex-col items-center justify-center pt-8 opacity-20">
               <div className="w-[1px] h-12 bg-slate-400 mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Fim do histórico encontrado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
