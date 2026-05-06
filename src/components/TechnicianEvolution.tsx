import React, { useMemo, useState } from 'react';
import { 
  Search, 
  User, 
  Building2, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  History,
  Activity,
  Layers
} from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';
import { MONTHS_ORDER } from '../constants';

interface TechnicianEvolutionProps {
  data: TechnicianRecord[];
  config: AppConfig;
  initialLogin?: string | null;
}

export default function TechnicianEvolution({ data, config, initialLogin }: TechnicianEvolutionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialLogin) {
      // Find the first record with this login or identity to set as initial identity
      const firstRecord = data.find(d => 
        d.LOGIN_TECNICO === initialLogin || 
        `${d.LOGIN_TECNICO}_${d.TIPO_BASE}` === initialLogin
      );
      if (firstRecord) {
        setSelectedIdentity(`${firstRecord.LOGIN_TECNICO}_${firstRecord.TIPO_BASE}`);
      }
    }
  }, [initialLogin, data]);

  // 1 & 2. Group by Technician and Search by LOGIN or CPF
  const technicians = useMemo(() => {
    const map = new Map<string, TechnicianRecord>();
    if (!data) return [];
    
    data.forEach(d => {
      const login = d.LOGIN_TECNICO;
      const type = d.TIPO_BASE;
      if (!login) return;
      const key = `${login}_${type}`;
      if (!map.has(key)) {
        map.set(key, d);
      }
    });
    return Array.from(map.values()).map(d => ({
      login: d.LOGIN_TECNICO || 'N/A',
      type: d.TIPO_BASE || 'SAFRA',
      fullKey: `${d.LOGIN_TECNICO}_${d.TIPO_BASE}`,
      cpf: (d as any).CPF || 'N/A',
      empresa: d.EMPRESA || 'N/A',
      unidade: d.UNIDADE_NEGOCIO || 'N/A',
      cidade: d.NM_GRUPO_REGIONAL || 'N/A'
    }));
  }, [data]);

  const filteredTechs = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return technicians.filter(t => 
      (t.login || '').toLowerCase().includes(term) ||
      (t.cpf || '').toLowerCase().includes(term)
    ).slice(0, 10);
  }, [technicians, searchTerm]);

  // 3, 4, 5 & 6. Evolution Data Calculation
  const evolutionData = useMemo(() => {
    if (!selectedIdentity || !data) return null;

    const [login, type] = selectedIdentity.split('_');

    const techRecords = data
      .filter(d => d.LOGIN_TECNICO === login && d.TIPO_BASE === type)
      .sort((a, b) => {
        const orderA = MONTHS_ORDER[(a.MES_REF || '').toString().toLowerCase()] || 0;
        const orderB = MONTHS_ORDER[(b.MES_REF || '').toString().toLowerCase()] || 0;
        return orderA - orderB;
      });

    if (techRecords.length === 0) return null;

    // Timeline and Status Mapping
    const timeline = techRecords.map(r => ({
      mes: r.MES_REF,
      tc: r.PERCENT_TC || 0,
      gap: (r.notCertifiedReasons || []).join(', ') || 'N/A',
      isCertified: (r.PERCENT_TC || 0) >= 70,
      tipo: r.TIPO_BASE,
      score: r.score
    }));

    const lastMonth = timeline[timeline.length - 1];
    const prevMonth = timeline.length > 1 ? timeline[timeline.length - 2] : null;

    // Classification Logic (Requirement 6)
    let classification = 'ESTÁVEL';
    let statusColor = 'bg-slate-100 text-slate-500';

    const isCertifiedCurrent = lastMonth.isCertified;
    const isCertifiedPrev = prevMonth?.isCertified;

    // CRÔNICO: 2+ months consecutive with critical GAP
    const consecutiveGaps = timeline.slice(-2).every(t => !t.isCertified && t.gap !== 'N/A');
    
    if (consecutiveGaps && timeline.length >= 2) {
      classification = 'CRÔNICO';
      statusColor = 'bg-red-600 text-white';
    } else if (prevMonth && !isCertifiedPrev && isCertifiedCurrent) {
      classification = 'EVOLUINDO';
      statusColor = 'bg-emerald-500 text-white';
    } else if (prevMonth && isCertifiedPrev && !isCertifiedCurrent) {
      classification = 'REGREDINDO';
      statusColor = 'bg-amber-500 text-white';
    } else if (prevMonth && !isCertifiedPrev && !isCertifiedCurrent && prevMonth.gap === lastMonth.gap && lastMonth.gap !== 'N/A') {
      classification = 'ESTAGNADO';
      statusColor = 'bg-slate-900 text-white';
    } else if (isCertifiedCurrent) {
        classification = 'CERTIFICADO';
        statusColor = 'bg-emerald-500 text-white';
    } else {
        classification = 'ATENÇÃO';
        statusColor = 'bg-amber-500 text-white';
    }

    // Time to certify
    const firstMonthIndex = timeline.findIndex(t => t.isCertified);
    const timeToCertify = firstMonthIndex !== -1 ? `${firstMonthIndex + 1}º mês` : 'Ainda não certificado';
    const isVeterano = techRecords.some(r => r.TIPO_BASE === 'VETERANO');

    return {
      tech: techRecords[0],
      timeline,
      classification,
      statusColor,
      timeToCertify,
      isVeterano,
      currentTC: lastMonth.tc,
      currentGap: lastMonth.gap
    };
  }, [selectedIdentity, data]);

  return (
    <div className="space-y-8 pb-20">
      {/* Search Header */}
      <div className="card p-8 bg-white shadow-xl shadow-slate-200/40 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <Search className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Buscar Trajetória</h2>
        </div>
        
        <div className="relative">
          <input 
            type="text"
            placeholder="Digite LOGIN ou CPF do técnico..."
            className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] py-5 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm.length >= 2 && (
            <div className="absolute top-full left-0 w-full bg-white mt-3 border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden divide-y divide-slate-50">
              {filteredTechs.map(t => (
                <button
                  key={t.fullKey}
                  onClick={() => {
                    setSelectedIdentity(t.fullKey);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-8 py-5 hover:bg-slate-50 group transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-slate-900">{t.login}</div>
                      <div className="flex gap-2 mt-0.5">
                        <span className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                          t.type === 'SAFRA' ? "bg-blue-100 text-blue-700" : "bg-slate-800 text-white"
                        )}>{t.type}</span>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{t.empresa}</div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                </button>
              ))}
              {filteredTechs.length === 0 && (
                <div className="px-8 py-6 text-sm text-slate-400 italic flex items-center gap-3">
                  <Activity className="w-4 h-4" /> Técnico não encontrado
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {evolutionData ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Status Top Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className={cn(
              "card p-8 flex flex-col items-center justify-center text-center shadow-xl transition-all",
              evolutionData.statusColor
            )}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Diagnóstico Atual</span>
              <h3 className="text-4xl font-black tracking-tighter">{evolutionData.classification}</h3>
            </div>

            <div className="card p-8 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center justify-center text-center">
              <Clock className="w-8 h-8 text-slate-200 mb-2" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo até Certificar</span>
              <p className="text-2xl font-black text-slate-900">{evolutionData.timeToCertify}</p>
            </div>

            <div className="card p-8 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center justify-center text-center">
              <ShieldCheck className={cn("w-8 h-8 mb-2", evolutionData.isVeterano ? "text-emerald-500" : "text-slate-200")} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formado Veterano</span>
              <p className="text-2xl font-black text-slate-900">{evolutionData.isVeterano ? 'SIM' : 'NÃO (SAFRA)'}</p>
            </div>

            <div className="card p-8 bg-slate-900 text-white shadow-xl flex flex-col items-center justify-center text-center">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Último TC %</span>
               <p className="text-4xl font-black text-emerald-400">{formatPercent(evolutionData.currentTC)}</p>
               <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase truncate w-full">{evolutionData.currentGap}</p>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="card p-10 bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
             <div className="flex items-center gap-3 mb-12">
                <History className="w-5 h-5 text-primary" />
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Timeline de Evolução</h4>
             </div>

             <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-4 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />

                <div className="space-y-12 relative">
                   {evolutionData.timeline.map((item, idx) => (
                     <div key={idx} className="flex gap-8 group">
                        <div className={cn(
                          "w-9 h-9 rounded-full border-4 border-white shadow-md flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110",
                          item.isCertified ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                        )}>
                           {item.isCertified ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 pb-4">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                              <h5 className="text-xl font-black text-slate-900 uppercase font-mono">{item.mes}</h5>
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                   "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                   item.tipo === 'SAFRA' ? "bg-blue-50 text-blue-600" : "bg-slate-900 text-white"
                                 )}>{item.tipo}</div>
                                 <span className={cn(
                                   "text-sm font-black",
                                   item.isCertified ? "text-emerald-600" : "text-red-600"
                                 )}>{formatPercent(item.tc)}</span>
                              </div>
                           </div>
                           
                           <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-3">
                                 <AlertTriangle className={cn("w-4 h-4", item.isCertified ? "text-slate-300" : "text-amber-500")} />
                                 <p className="text-xs font-bold text-slate-600">
                                    GAP Identificado: <span className={cn(
                                      "font-black uppercase ml-1",
                                      item.isCertified ? "text-slate-400" : "text-red-600"
                                    )}>{item.gap}</span>
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Quick Info Card */}
          <div className="card p-8 bg-slate-50 border border-dashed border-slate-200">
            <div className="flex items-start gap-4">
               <Layers className="w-6 h-6 text-slate-400 shrink-0 mt-1" />
               <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Resumo Operacional</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                       O técnico <strong>{evolutionData.tech.LOGIN_TECNICO}</strong> apresenta um perfil <strong>{evolutionData.classification}</strong>. 
                       {evolutionData.classification === 'CRÔNICO' ? ' Atenção redobrada: apresenta falhas críticas persistentes por 2 ou mais meses.' : ''}
                       {evolutionData.classification === 'EVOLUINDO' ? ' Excelente: demonstrou melhoria significativa e atingiu a meta no último registro.' : ''}
                       {evolutionData.classification === 'CERTIFICADO' ? ' Operação saudável: mantém a certificação ativa conforme os últimos registros.' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-6 pt-2">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Empresa</span>
                        <span className="text-sm font-bold text-slate-700">{evolutionData.tech.EMPRESA}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Unidade</span>
                        <span className="text-sm font-bold text-slate-700">{evolutionData.tech.UNIDADE_NEGOCIO}</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-24 text-center bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem]">
           <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-slate-300" />
           </div>
           <h3 className="text-xl font-black text-slate-900 uppercase">Nenhum Técnico Selecionado</h3>
           <p className="text-slate-400 max-w-sm mx-auto text-sm mt-3 font-medium">
             Utilize o campo de busca acima para carregar o diagnóstico e a jornada histórica de um profissional.
           </p>
        </div>
      )}
    </div>
  );
}
