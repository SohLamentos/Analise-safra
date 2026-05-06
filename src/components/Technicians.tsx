import React, { useState, useMemo } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';

interface TechniciansProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function Technicians({ data, config }: TechniciansProps) {
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterUnidade, setFilterUnidade] = useState('');
  const [filterSegmento, setFilterSegmento] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const months = useMemo(() => Array.from(new Set(data.map(d => d.MES_REF))), [data]);
  const empresas = useMemo(() => Array.from(new Set(data.map(d => d.EMPRESA))), [data]);
  const unidades = useMemo(() => Array.from(new Set(data.map(d => d.UNIDADE_NEGOCIO))), [data]);
  const segmentos = useMemo(() => Array.from(new Set(data.map(d => d.SEGMENTO))), [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const login = (d.LOGIN_TECNICO || '').toString().toLowerCase();
      const matchSearch = login.includes(search.toLowerCase());
      const matchMonth = !filterMonth || d.MES_REF === filterMonth;
      const matchEmpresa = !filterEmpresa || d.EMPRESA === filterEmpresa;
      const matchUnidade = !filterUnidade || d.UNIDADE_NEGOCIO === filterUnidade;
      const matchSegmento = !filterSegmento || d.SEGMENTO === filterSegmento;
      
      let statusMatches = true;
      if (filterStatus === 'CERTIFICADO') statusMatches = d.isCertified;
      else if (filterStatus === 'NÃO CERTIFICADO') statusMatches = !d.isCertified && !d.isLowVolume;
      else if (filterStatus === 'SEM VOLUME') statusMatches = d.isLowVolume;
      
      return matchSearch && matchMonth && matchEmpresa && matchUnidade && matchSegmento && statusMatches;
    });
  }, [data, search, filterMonth, filterEmpresa, filterUnidade, filterSegmento, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Buscar técnico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 focus:outline-none"
          >
            <option value="">Todos os Meses</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select 
            value={filterEmpresa}
            onChange={(e) => setFilterEmpresa(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 focus:outline-none"
          >
            <option value="">Todas Empresas</option>
            {empresas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <select 
            value={filterUnidade}
            onChange={(e) => setFilterUnidade(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 focus:outline-none"
          >
            <option value="">Unidades de Negócio</option>
            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          <select 
            value={filterSegmento}
            onChange={(e) => setFilterSegmento(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 focus:outline-none"
          >
            <option value="">Segmentos</option>
            {segmentos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 focus:outline-none"
          >
            <option value="">Todos Status</option>
            <option value="CERTIFICADO">Certificado</option>
            <option value="NÃO CERTIFICADO">Não Certificado</option>
            <option value="SEM VOLUME">Sem Volume</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Técnico</th>
                <th className="px-6 py-4 font-bold text-slate-700">Empresa / Unidade</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Mês</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-right">Produtividade</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-right">% Revisita</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-right">% Agenda</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Status Mês</th>
                <th className="px-6 py-4 font-bold text-slate-700">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{d.LOGIN_TECNICO}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">{d.SEGMENTO}</div>
                      <span className={cn(
                        "text-[8px] font-black px-1 py-0.5 rounded uppercase tracking-tighter border",
                        d.REGIAO_PR === 'CAPITAL' ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                        d.REGIAO_PR === 'INTERIOR' ? "bg-purple-100 text-purple-700 border-purple-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {d.REGIAO_PR}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="text-slate-700 font-medium">{d.EMPRESA_NORMALIZADA || d.EMPRESA}</div>
                       <span className={cn(
                         "text-[7px] font-black px-1 py-0.5 rounded-full uppercase tracking-widest border",
                         d.STATUS_EMPRESA === 'MAPEADA' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                       )}>
                         {d.STATUS_EMPRESA === 'MAPEADA' ? 'OK' : 'Ñ Mapeada'}
                       </span>
                    </div>
                    {d.EMPRESA_ORIGINAL && d.EMPRESA_ORIGINAL !== (d.EMPRESA_NORMALIZADA || d.EMPRESA) && (
                      <div className="text-[9px] text-slate-400 italic leading-none mb-1">orig: {d.EMPRESA_ORIGINAL}</div>
                    )}
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{d.UNIDADE_NEGOCIO}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{d.MES_REF}</span>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-black",
                    d.GAP_PROD < 0 ? "text-red-500" : "text-green-600"
                  )}>
                    {(d.PROD || 0).toFixed(1)}
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold",
                    d.GAP_REV > 0 ? "text-red-500" : "text-slate-700"
                  )}>
                    {formatPercent(d.PERCENT_REV)}
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold",
                    d.GAP_CUMP_AGENDA > 0 ? "text-red-500" : "text-slate-700"
                  )}>
                    {formatPercent(d.PERCENT_CUMP_AGENDA)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {d.isLowVolume ? (
                      <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase">Sem Volume</span>
                    ) : d.isCertified ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Certificado</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase">Não Certificado</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!d.isLowVolume && d.notCertifiedReasons.length > 0 ? (
                      <span className="text-[10px] font-black text-red-500 uppercase">
                        {d.notCertifiedReasons.join(' + ')}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            Nenhum resultado encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
}
