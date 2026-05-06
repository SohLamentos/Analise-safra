import React, { useMemo, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  Timer, 
  Search, 
  Filter, 
  BadgeAlert,
  BadgeCheck,
  BadgeX,
  History,
  ZapOff
} from 'lucide-react';
import { TechnicianRecord, AppConfig, ConsolidatedTechnician } from '../types';
import { cn } from '../lib/utils';
import { MONTHS_ORDER } from '../constants';

interface SafraCriticosProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function SafraCriticos({ data, config }: SafraCriticosProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const consolidated = useMemo(() => {
    const techMap: Record<string, TechnicianRecord[]> = {};
    data.forEach(d => {
      if (!techMap[d.LOGIN_TECNICO]) techMap[d.LOGIN_TECNICO] = [];
      techMap[d.LOGIN_TECNICO].push(d);
    });

    return Object.entries(techMap).map(([login, records]) => {
      const sorted = records.sort((a, b) => 
        (MONTHS_ORDER[(a.MES_REF || '').toString().toLowerCase()] || 0) - (MONTHS_ORDER[(b.MES_REF || '').toString().toLowerCase()] || 0)
      );

      // Slice to max ventana if needed, or analyze all? 
      // User says: "Cada técnico permanece com essa skill por no máximo 3 meses."
      // so we analyze up to the first 3 months found for this tech.
      const JANELA_SAFRA_FIXA = 3;
      const MESES_CONSECUTIVOS_CRITICO = 2;
      const safraWindow = sorted.slice(0, JANELA_SAFRA_FIXA);
      
      const mesesAvaliados = safraWindow.map(r => r.MES_REF);
      const mesesCertificados = safraWindow.filter(r => r.isCertified).length;
      const mesesSemCertificar = safraWindow.length - mesesCertificados;
      
      let maxConsecutiveFail = 0;
      let currentConsecutiveFail = 0;
      safraWindow.forEach(r => {
        if (!r.isCertified) {
          currentConsecutiveFail++;
          maxConsecutiveFail = Math.max(maxConsecutiveFail, currentConsecutiveFail);
        } else {
          currentConsecutiveFail = 0;
        }
      });

      // Status calculation
      let status: ConsolidatedTechnician['statusConsolidado'] = 'SEM VOLUME SUFICIENTE';
      
      const allLowVolume = safraWindow.every(r => r.isLowVolume);
      
      if (allLowVolume) {
        status = 'SEM VOLUME SUFICIENTE';
      } else if (safraWindow.some(r => r.isCertified)) {
        status = 'CERTIFICADO';
      } else if (maxConsecutiveFail >= MESES_CONSECUTIVOS_CRITICO) {
        status = 'CRÍTICO';
      } else if (safraWindow.length === JANELA_SAFRA_FIXA && !safraWindow.some(r => r.isCertified)) {
        status = 'ENCERRADO SEM CERTIFICAÇÃO';
      } else {
        status = 'EM ATENÇÃO';
      }

      // Principal motive
      const reasonCounts: Record<string, number> = {};
      safraWindow.filter(r => r && !r.isCertified && !r.isLowVolume).forEach(r => {
        (r.notCertifiedReasons || []).forEach(reason => {
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });
      });
      const principalMotivo = Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      return {
        login,
        empresa: sorted[0].EMPRESA,
        unidadeNegocio: sorted[0].UNIDADE_NEGOCIO,
        segmento: sorted[0].SEGMENTO,
        primeiroMes: sorted[0].MES_REF,
        ultimoMes: safraWindow[safraWindow.length - 1].MES_REF,
        mesesAvaliados,
        mesesCertificados,
        mesesSemCertificar,
        sequenciaConsecutiva: maxConsecutiveFail,
        statusConsolidado: status,
        principalMotivo
      } as ConsolidatedTechnician;
    });
  }, [data, config]);

  const filtered = useMemo(() => {
    return consolidated.filter(c => {
      const matchSearch = c.login.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || c.statusConsolidado === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [consolidated, search, filterStatus]);

  const stats = useMemo(() => {
    return {
      criticos: consolidated.filter(c => c.statusConsolidado === 'CRÍTICO').length,
      atencao: consolidated.filter(c => c.statusConsolidado === 'EM ATENÇÃO').length,
      certificados: consolidated.filter(c => c.statusConsolidado === 'CERTIFICADO').length,
      encerrados: consolidated.filter(c => c.statusConsolidado === 'ENCERRADO SEM CERTIFICAÇÃO').length
    };
  }, [consolidated]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-green-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Certificados</span>
          </div>
          <div className="text-2xl font-black">{stats.certificados}</div>
          <p className="text-xs text-slate-500 mt-1">Atingiram meta na janela</p>
        </div>
        <div className="card p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-2">
            <Timer className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Em Atenção</span>
          </div>
          <div className="text-2xl font-black">{stats.atencao}</div>
          <p className="text-xs text-slate-500 mt-1">1-2 meses sem meta</p>
        </div>
        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Críticos</span>
          </div>
          <div className="text-2xl font-black">{stats.criticos}</div>
          <p className="text-xs text-slate-500 mt-1">2+ meses consecutivos sem meta</p>
        </div>
        <div className="card p-5 border-l-4 border-slate-900">
          <div className="flex items-center justify-between mb-2">
            <ZapOff className="w-5 h-5 text-slate-900" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Encerrados</span>
          </div>
          <div className="text-2xl font-black">{stats.encerrados}</div>
          <p className="text-xs text-slate-500 mt-1">Saíram da safra sem certificar</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Buscar técnico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none ring-primary/20 focus:ring-2"
          />
        </div>
        <div className="flex gap-2">
          {['CERTIFICADO', 'EM ATENÇÃO', 'CRÍTICO', 'ENCERRADO SEM CERTIFICAÇÃO', 'SEM VOLUME SUFICIENTE'].map(st => (
            <button 
              key={st}
              onClick={() => setFilterStatus(filterStatus === st ? '' : st)}
              className={cn(
                "px-3 py-1 space-x-1.5 rounded-full text-[10px] font-bold border transition-all",
                filterStatus === st 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-primary/40"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Técnico / Empresa</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Início Safra</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Meses Analisados</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Seq. Sem Meta</th>
                <th className="px-6 py-4 font-bold text-slate-700">Status Safra</th>
                <th className="px-6 py-4 font-bold text-slate-700">Principal Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{c.login}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{c.empresa} • {c.unidadeNegocio}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{c.primeiroMes}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {c.mesesAvaliados.map((m, idx) => (
                        <div key={idx} className="w-2 h-2 rounded-full bg-primary/20" title={m} />
                      ))}
                      <span className="ml-1 text-xs font-bold text-slate-500">{c.mesesAvaliados.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-red-600 font-black text-lg">
                    {c.sequenciaConsecutiva}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                      c.statusConsolidado === 'CERTIFICADO' ? "bg-green-100 text-green-700" :
                      c.statusConsolidado === 'EM ATENÇÃO' ? "bg-amber-100 text-amber-700" :
                      c.statusConsolidado === 'CRÍTICO' ? "bg-red-100 text-red-700" :
                      c.statusConsolidado === 'ENCERRADO SEM CERTIFICAÇÃO' ? "bg-slate-800 text-white" :
                      "bg-slate-100 text-slate-400"
                    )}>
                      {c.statusConsolidado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.principalMotivo !== '-' ? (
                       <span className="text-[10px] font-bold text-red-500 border border-red-100 px-2 py-0.5 rounded uppercase">{c.principalMotivo}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
