import React, { useMemo, useState } from 'react';
import { TechnicianRecord, AppConfig, UNMappingRule } from '../types';
import { AlertTriangle, Building2, MapPin, CheckCircle2, AlertCircle, Plus, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { MONTHS_ORDER, normalizeText } from '../constants';

interface DataValidationViewProps {
  data: TechnicianRecord[];
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

export default function DataValidationView({ data, config, setConfig }: DataValidationViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<UNMappingRule>>({
    un: '',
    uf: 'PR',
    regiaoPR: 'CAPITAL',
    cluster: '',
    status: 'ATIVA'
  });

  const stats = useMemo(() => {
    const total = data.length;
    const capital = data.filter(d => normalizeText(d.REGIAO_PR) === 'CAPITAL').length;
    const interior = data.filter(d => normalizeText(d.REGIAO_PR) === 'INTERIOR').length;
    const unclassified = data.filter(d => normalizeText(d.REGIAO_PR) === 'NAO_CLASSIFICADO').length;
    const mapped = data.filter(d => d.STATUS_EMPRESA === 'MAPEADA').length;
    const unmapped = data.filter(d => d.STATUS_EMPRESA === 'NAO_MAPEADA').length;

    const isInconsistent = (r: TechnicianRecord) => {
      return !r.LOGIN_TECNICO || !r.EMPRESA || !r.UNIDADE_NEGOCIO || 
             r.PERCENT_TC === null || r.PERCENT_TC === undefined ||
             r.GAP_REV === null || r.GAP_REV === undefined ||
             r.GAP_CUMP_AGENDA === null || r.GAP_CUMP_AGENDA === undefined ||
             r.LOGIN_TECNICO.trim() === '' || r.EMPRESA.trim() === '' || r.UNIDADE_NEGOCIO.trim() === '';
    };

    const inconsistent = data.filter(isInconsistent).length;
    const safraCount = data.filter(d => d.TIPO_BASE === 'SAFRA').length;
    const veteranoCount = data.filter(d => d.TIPO_BASE === 'VETERANO').length;

    return { total, capital, interior, unclassified, mapped, unmapped, inconsistent, safraCount, veteranoCount };
  }, [data]);

  const unmappedTable = useMemo(() => {
    const unmapped = data.filter(d => d.STATUS_EMPRESA === 'NAO_MAPEADA');
    const groups: Record<string, { 
      original: string, 
      normalized: string,
      count: number, 
      firstApp: string,
      lastApp: string,
      types: Record<string, number>,
      regions: Record<string, number>
    }> = {};
    
    unmapped.forEach(d => {
      if (!groups[d.EMPRESA_ORIGINAL]) {
        groups[d.EMPRESA_ORIGINAL] = { 
          original: d.EMPRESA_ORIGINAL, 
          normalized: d.EMPRESA_NORMALIZADA,
          count: 0, 
          firstApp: d.MES_REF,
          lastApp: d.MES_REF,
          types: {},
          regions: {}
        };
      }
      const g = groups[d.EMPRESA_ORIGINAL];
      g.count++;
      
      // Chronological check
      const currentOrder = MONTHS_ORDER[(d.MES_REF || '').toString().toLowerCase()] || 0;
      const firstOrder = MONTHS_ORDER[(g.firstApp || '').toString().toLowerCase()] || 0;
      const lastOrder = MONTHS_ORDER[(g.lastApp || '').toString().toLowerCase()] || 0;
      
      if (currentOrder < firstOrder) g.firstApp = d.MES_REF;
      if (currentOrder > lastOrder) g.lastApp = d.MES_REF;

      g.types[d.TIPO_BASE] = (g.types[d.TIPO_BASE] || 0) + 1;
      const normReg = normalizeText(d.REGIAO_PR);
      g.regions[normReg] = (g.regions[normReg] || 0) + 1;
    });
    
    return Object.values(groups).map(g => {
      const commonType = Object.entries(g.types).sort((a,b) => b[1] - a[1])[0]?.[0] || '-';
      const commonRegion = Object.entries(g.regions).sort((a,b) => b[1] - a[1])[0]?.[0] || '-';
      return { ...g, commonType, commonRegion };
    }).sort((a, b) => b.count - a.count);
  }, [data]);

  const unmappedUNTable = useMemo(() => {
    const unclassified = data.filter(d => normalizeText(d.REGIAO_PR) === 'NAO_CLASSIFICADO');
    const groups: Record<string, {
      un: string,
      empresa: string,
      count: number,
      firstApp: string,
      lastApp: string
    }> = {};

    unclassified.forEach(d => {
      const key = d.UNIDADE_NEGOCIO;
      if (!groups[key]) {
        groups[key] = {
          un: key,
          empresa: d.EMPRESA,
          count: 0,
          firstApp: d.MES_REF,
          lastApp: d.MES_REF
        };
      }
      const g = groups[key];
      g.count++;

      const currentOrder = MONTHS_ORDER[(d.MES_REF || '').toString().toLowerCase()] || 0;
      const firstOrder = MONTHS_ORDER[(g.firstApp || '').toString().toLowerCase()] || 0;
      const lastOrder = MONTHS_ORDER[(g.lastApp || '').toString().toLowerCase()] || 0;
      
      if (currentOrder < firstOrder) g.firstApp = d.MES_REF;
      if (currentOrder > lastOrder) g.lastApp = d.MES_REF;
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [data]);

  const inconsistentTable = useMemo(() => {
    return data.filter(r => {
      return !r.LOGIN_TECNICO || !r.EMPRESA || !r.UNIDADE_NEGOCIO || 
             r.PERCENT_TC === null || r.PERCENT_TC === undefined ||
             r.GAP_REV === null || r.GAP_REV === undefined ||
             r.GAP_CUMP_AGENDA === null || r.GAP_CUMP_AGENDA === undefined ||
             r.LOGIN_TECNICO.trim() === '' || r.EMPRESA.trim() === '' || r.UNIDADE_NEGOCIO.trim() === '';
    });
  }, [data]);

  const handleMapearUN = (un: string) => {
    setFormData({
      un: un,
      uf: 'PR',
      regiaoPR: 'CAPITAL',
      cluster: '',
      status: 'ATIVA'
    });
    setIsModalOpen(true);
  };

  const handleSaveMapping = () => {
    if (!formData.un) return;
    const newRule = formData as UNMappingRule;
    setConfig(prev => ({
      ...prev,
      unMappingRules: [...(prev.unMappingRules || []), newRule]
    }));
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Validação de Dados</h2>
        <p className="text-slate-500 text-sm italic font-medium">Garantia de integridade para análises regionais e de empresas.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
        <div className="card p-4 bg-slate-900 text-white border-none">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Registros</p>
          <p className="text-2xl font-black">{stats.total}</p>
        </div>
        <div className="card p-4 border-l-4 border-primary">
          <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">Registros SAFRA</p>
          <p className="text-2xl font-black text-slate-900">{stats.safraCount}</p>
        </div>
        <div className="card p-4 border-l-4 border-indigo-600">
          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Registros VETERANO</p>
          <p className="text-2xl font-black text-slate-900">{stats.veteranoCount}</p>
        </div>
        <div className="card p-4 border-l-4 border-indigo-500">
          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Capital</p>
          <p className="text-2xl font-black text-slate-900">{stats.capital}</p>
        </div>
        <div className="card p-4 border-l-4 border-emerald-500">
          <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest mb-1">Interior</p>
          <p className="text-2xl font-black text-slate-900">{stats.interior}</p>
        </div>
        <div className="card p-4 border-l-4 border-slate-400">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Não Classificado</p>
          <p className="text-2xl font-black text-slate-400">{unmappedUNTable.length} UNs</p>
        </div>
        <div className="card p-4 border-l-4 border-green-600">
          <p className="text-[9px] font-black uppercase text-green-600 tracking-widest mb-1">Mapeadas</p>
          <p className="text-2xl font-black text-slate-900">{stats.mapped}</p>
        </div>
        <div className="card p-4 border-l-4 border-amber-600">
          <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest mb-1">Não Mapeadas</p>
          <p className="text-2xl font-black text-amber-600">{stats.unmapped}</p>
        </div>
        <div className="card p-4 border-l-4 border-red-600">
          <p className="text-[9px] font-black uppercase text-red-600 tracking-widest mb-1">Inconsistências</p>
          <p className="text-2xl font-black text-red-600">{stats.inconsistent}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Table 0: Unmapped UNs */}
        <div className="card overflow-hidden border-indigo-100 shadow-xl shadow-indigo-100/20">
          <div className="p-6 border-b border-indigo-50 bg-indigo-50/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="font-black text-indigo-900 uppercase text-xs tracking-widest">UNs Não Mapeadas</h3>
            </div>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-1 rounded">PENDENTE DE CLASSIFICAÇÃO REGIONAL</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">UNIDADE_NEGOCIO</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Empresa</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-center">Registros</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Primeira/Última Aparição</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {unmappedUNTable.map((g, i) => (
                  <tr key={i} className="hover:bg-indigo-50/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{g.un}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{g.empresa}</td>
                    <td className="px-6 py-4 text-center font-mono font-black text-indigo-600">{g.count}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium tracking-tighter">{g.firstApp} → {g.lastApp}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleMapearUN(g.un)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        Mapear UN
                      </button>
                    </td>
                  </tr>
                ))}
                {unmappedUNTable.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-emerald-600 font-bold">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      Todas as UNs detectadas possuem mapeamento regional.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 1: Unmapped Companies */}
        <div className="card overflow-hidden border-amber-100">
          <div className="p-6 border-b border-amber-50 bg-amber-50/30 flex items-center gap-3">
            <div className="bg-amber-500 p-1.5 rounded-lg text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-black text-amber-900 uppercase text-xs tracking-widest">Empresas Não Mapeadas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Empresa Original</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Normalizada</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-center">Registros</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Primeira/Última</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Base Comum</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Região Comum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {unmappedTable.map((g, i) => (
                  <tr key={i} className="hover:bg-amber-50/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{g.original}</td>
                    <td className="px-6 py-4 text-slate-500 italic">{g.normalized}</td>
                    <td className="px-6 py-4 text-center font-mono font-black text-slate-900">{g.count}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{g.firstApp} → {g.lastApp}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                        g.commonType === 'SAFRA' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"
                      )}>{g.commonType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                        g.commonRegion === 'CAPITAL' ? "bg-indigo-100 text-indigo-700" :
                        g.commonRegion === 'INTERIOR' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                      )}>{g.commonRegion}</span>
                    </td>
                  </tr>
                ))}
                {unmappedTable.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-emerald-600 font-bold">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      Todas as empresas estão mapeadas no sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Registros Inconsistentes */}
        <div className="card overflow-hidden border-red-100">
          <div className="p-6 border-b border-red-50 bg-red-50/30 flex items-center gap-3">
            <div className="bg-red-500 p-1.5 rounded-lg text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="font-black text-red-900 uppercase text-xs tracking-widest">Registros Inconsistentes</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-red-50">
                <tr>
                  <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-tighter">Login</th>
                  <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-tighter">Mês</th>
                  <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-tighter text-right">Inconsistência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inconsistentTable.slice(0, 100).map((r, i) => {
                  let reason = "Campo Vazio";
                  if (!r.LOGIN_TECNICO) reason = "Login Vazio";
                  else if (!r.EMPRESA) reason = "Empresa Vazia";
                  else if (r.PERCENT_TC === null || r.PERCENT_TC === undefined) reason = "% TC Vazio";
                  
                  return (
                    <tr key={i} className="hover:bg-red-50/20">
                      <td className="px-4 py-3 font-mono font-bold text-red-700">{r.LOGIN_TECNICO || '---'}</td>
                      <td className="px-4 py-3 font-bold text-slate-400">{r.MES_REF}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-[4px] font-bold">{reason}</span>
                      </td>
                    </tr>
                  );
                })}
                {inconsistentTable.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-emerald-600 font-bold">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      Não foram detectados dados inconsistentes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Mapear UN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Mapear UN</h3>
                <p className="text-sm text-slate-400 font-medium">Defina a classificação para a UN <span className="text-primary font-bold">{formData.un}</span></p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">UNIDADE_NEGOCIO</label>
                  <input 
                    type="text"
                    value={formData.un}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-4 text-sm font-bold opacity-70 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">UF</label>
                  <input 
                    type="text"
                    value={formData.uf}
                    onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                    placeholder="PR"
                    maxLength={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo Regional</label>
                  <select 
                    value={formData.regiaoPR}
                    onChange={(e) => setFormData(prev => ({ ...prev, regiaoPR: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  >
                    <option value="CAPITAL">CAPITAL</option>
                    <option value="INTERIOR">INTERIOR</option>
                    <option value="NAO_CLASSIFICADO">NÃO CLASSIFICADO</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Região / Cluster</label>
                  <input 
                    type="text"
                    value={formData.cluster}
                    onChange={(e) => setFormData(prev => ({ ...prev, cluster: e.target.value.toUpperCase() }))}
                    placeholder="Ex: CURITIBA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveMapping}
                className="flex-[2] px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Salvar Mapeamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
