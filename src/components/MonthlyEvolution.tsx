import React, { useMemo, useState } from 'react';
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
import { Filter } from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn } from '../lib/utils';
import { MONTHS_ORDER, normalizeText } from '../constants';

interface MonthlyEvolutionProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function MonthlyEvolution({ data, config }: MonthlyEvolutionProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [grouping, setGrouping] = useState<'EMPRESA' | 'REGIAO' | 'AMBOS'>('EMPRESA');
  
  const allCompanies = useMemo(() => Array.from(new Set(data.map(d => d.EMPRESA))), [data]);
  const allRegions = ['CAPITAL', 'INTERIOR', 'NAO_CLASSIFICADO'];

  const toggleCompany = (comp: string) => {
    setSelectedCompanies(prev => 
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    );
  };

  const toggleRegion = (reg: string) => {
    const normReg = normalizeText(reg);
    setSelectedRegions(prev => 
      prev.includes(normReg) ? prev.filter(r => r !== normReg) : [...prev, normReg]
    );
  };

  const filteredData = useMemo(() => {
    let filtered = data;
    if (selectedCompanies.length > 0) {
      filtered = filtered.filter(d => selectedCompanies.includes(d.EMPRESA));
    }
    if (selectedRegions.length > 0) {
      filtered = filtered.filter(d => selectedRegions.includes(normalizeText(d.REGIAO_PR)));
    }
    return filtered;
  }, [data, selectedCompanies, selectedRegions]);

  const monthlyReport = useMemo(() => {
    const months = Array.from(new Set(filteredData.filter(d => d.MES_REF).map(d => d.MES_REF)))
      .sort((a, b) => {
        const orderA = MONTHS_ORDER[(a || '').toString().toLowerCase()] || 0;
        const orderB = MONTHS_ORDER[(b || '').toString().toLowerCase()] || 0;
        return orderA - orderB;
      });

    const report: any[] = [];

    // Pre-group all data by tech for fast history lookup
    const allTechHistoryMap = new Map<string, TechnicianRecord[]>();
    data.forEach(r => {
      const login = r.LOGIN_TECNICO;
      if (!allTechHistoryMap.has(login)) allTechHistoryMap.set(login, []);
      allTechHistoryMap.get(login)!.push(r);
    });

    months.forEach(month => {
      const monthData = filteredData.filter(d => d.MES_REF === month);
      
      let segments: { key: string, criteria: (d: TechnicianRecord) => boolean }[] = [];
      
      if (grouping === 'EMPRESA') {
        const comps = selectedCompanies.length > 0 ? selectedCompanies : Array.from(new Set(monthData.map(d => d.EMPRESA)));
        segments = comps.map(c => ({ key: c, criteria: (d: TechnicianRecord) => d.EMPRESA === c }));
      } else if (grouping === 'REGIAO') {
        const regs = selectedRegions.length > 0 ? selectedRegions : Array.from(new Set(monthData.map(d => normalizeText(d.REGIAO_PR))));
        const allPossibleRegions = ['CAPITAL', 'INTERIOR', 'NAO_CLASSIFICADO'];
        const regsToUse = regs.filter(r => allPossibleRegions.includes(r));
        segments = regsToUse.map(r => ({ key: r, criteria: (d: TechnicianRecord) => normalizeText(d.REGIAO_PR) === r }));
      } else {
        const comps = selectedCompanies.length > 0 ? selectedCompanies : Array.from(new Set(monthData.map(d => d.EMPRESA)));
        const regs = selectedRegions.length > 0 ? selectedRegions : Array.from(new Set(monthData.map(d => normalizeText(d.REGIAO_PR))));
        const allPossibleRegions = ['CAPITAL', 'INTERIOR', 'NAO_CLASSIFICADO'];
        const regsToUse = regs.filter(r => allPossibleRegions.includes(r));
        
        comps.forEach(c => {
          regsToUse.forEach(r => {
            segments.push({ key: `${c} (${r})`, criteria: (d: TechnicianRecord) => d.EMPRESA === c && normalizeText(d.REGIAO_PR) === r });
          });
        });
      }

      segments.forEach(seg => {
        const d = monthData.filter(r => seg.criteria(r));
        if (d.length === 0) return;

        const certifiedCount = d.filter(r => r.isCertified).length;
        
        const techsInMonth = d.map(r => r.LOGIN_TECNICO);
        let criticosCount = 0;
        
        techsInMonth.forEach(login => {
          const techHistory = allTechHistoryMap.get(login) || [];
          const monthIdx = (MONTHS_ORDER[(month || '').toString().toLowerCase()] || 0);
          const historyUpToMonth = techHistory.filter(r => (MONTHS_ORDER[(r.MES_REF || '').toString().toLowerCase()] || 0) <= monthIdx)
            .sort((a, b) => {
              const orderA = MONTHS_ORDER[(a.MES_REF || '').toString().toLowerCase()] || 0;
              const orderB = MONTHS_ORDER[(b.MES_REF || '').toString().toLowerCase()] || 0;
              return orderB - orderA;
            });
          
          const last2 = historyUpToMonth.slice(0, 2);
          if (last2.length === 2 && last2.every(r => !r.isCertified)) {
            criticosCount++;
          }
        });

        report.push({
          mes: month,
          segmento: seg.key,
          total: d.length,
          certificados: (certifiedCount / d.length) * 100,
          revisita: (d.reduce((acc, curr) => acc + (curr.PERCENT_REV || 0), 0) / d.length) * 100,
          agenda: (d.reduce((acc, curr) => acc + (curr.PERCENT_CUMP_AGENDA || 0), 0) / d.length) * 100,
          prod: d.reduce((acc, curr) => acc + (curr.PROD || 0), 0) / d.length,
          criticos: criticosCount
        });
      });
    });

    return report;
  }, [filteredData, data, selectedCompanies, selectedRegions, grouping]);

  const chartData = useMemo(() => {
     const months = Array.from(new Set(monthlyReport.map(r => r.mes)));
     return months.map(m => {
        const entry: any = { mes: m };
        monthlyReport.filter(r => r.mes === m).forEach(r => {
           entry[r.segmento] = parseFloat(r.certificados.toFixed(1));
        });
        return entry;
     });
  }, [monthlyReport]);

  const allSegments = useMemo(() => Array.from(new Set(monthlyReport.map(r => r.segmento))), [monthlyReport]);

  const colors = ['#e11d48', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#64748b', '#2dd4bf', '#fb7185', '#a78bfa'];

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Filtros</h3>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               {(['EMPRESA', 'REGIAO', 'AMBOS'] as const).map(g => (
                 <button 
                   key={g}
                   onClick={() => setGrouping(g)}
                   className={cn(
                     "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                     grouping === g ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   {g === 'EMPRESA' ? 'Empresa' : g === 'REGIAO' ? 'Região' : 'Empresa + Região'}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Empresas</p>
              <div className="flex flex-wrap gap-2">
                {allCompanies.map(comp => (
                  <button
                    key={comp}
                    onClick={() => toggleCompany(comp)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                      selectedCompanies.includes(comp) ? "bg-primary border-primary text-white shadow-sm" : "bg-white border-slate-200 text-slate-600"
                    )}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Regiões</p>
              <div className="flex flex-wrap gap-2">
                {allRegions.map(reg => (
                  <button
                    key={reg}
                    onClick={() => toggleRegion(reg)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                      selectedRegions.includes(reg) ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600",
                      reg === 'NAO_CLASSIFICADO' && !selectedRegions.includes(reg) && "text-red-400 border-red-50"
                    )}
                  >
                    {reg === 'NAO_CLASSIFICADO' ? 'Não Classificado' : reg}
                  </button>
                ))}
              </div>
            </div>

            {(selectedCompanies.length > 0 || selectedRegions.length > 0) && (
              <button 
                onClick={() => { setSelectedCompanies([]); setSelectedRegions([]); }}
                className="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            )}
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-center bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-2xl -mr-16 -mt-16" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumo da Seleção</p>
           <div className="grid grid-cols-2 gap-6">
              <div>
                 <p className="text-2xl font-black">{filteredData.length}</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase">Registros</p>
              </div>
              <div>
                 <p className="text-2xl font-black">{new Set(filteredData.map(d => d.LOGIN_TECNICO)).size}</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase">Técnicos Únicos</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="card p-6 shadow-xl shadow-slate-200/50">
          <h3 className="font-bold text-slate-900 mb-6 font-black uppercase text-xs tracking-widest">Tendência de Certificação (%)</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" fontSize={11} />
                <YAxis fontSize={11} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend />
                {allSegments.slice(0, 10).map((seg, idx) => (
                  <Line 
                    key={seg}
                    type="monotone" 
                    dataKey={seg} 
                    stroke={colors[idx % colors.length]} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden shadow-xl shadow-slate-200/50">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Detalhamento por Segmento</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700">Mês</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Segmento</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-center">Qtd. Técnicos</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-right">% Certificados</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-right">Méd. Revisita</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-right">Méd. Agenda</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-right">Méd. Prod.</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-center">Críticos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyReport.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-tight">{r.mes}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-xs">{r.segmento}</td>
                    <td className="px-6 py-4 text-center font-medium">{r.total}</td>
                    <td className="px-6 py-4 text-right">
                       <span className={cn(
                         "font-black",
                         r.certificados > 80 ? "text-green-600" : r.certificados > 50 ? "text-amber-600" : "text-red-500"
                       )}>{r.certificados.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{r.revisita.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{r.agenda.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{r.prod.toFixed(1)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black",
                        r.criticos > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-400"
                      )}>
                        {r.criticos}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
