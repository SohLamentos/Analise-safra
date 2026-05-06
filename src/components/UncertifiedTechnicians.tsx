import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  UserMinus, 
  MapPin, 
  Building2, 
  Search, 
  Filter, 
  Calendar,
  ChevronDown,
  ArrowDownWideNarrow,
  AlertCircle
} from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn } from '../lib/utils';
import { MONTHS_ORDER, normalizeText } from '../constants';

interface UncertifiedTechniciansProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function UncertifiedTechnicians({ data, config }: UncertifiedTechniciansProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');
  const [filterRegion, setFilterRegion] = useState<string>('TODAS');
  const [filterCompany, setFilterCompany] = useState<string>('TODAS');
  const [filterGap, setFilterGap] = useState<string>('TODOS');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Month options with YYYY-MM key for sorting
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

  // Default to the most recent month key
  useEffect(() => {
    if (monthOptions.length > 0 && !selectedMonthKey) {
      setSelectedMonthKey(monthOptions[monthOptions.length - 1].key);
    }
  }, [monthOptions, selectedMonthKey]);

  // 2. Base Filtered & Deduplicated Data (Month + Dashboard-style uniqueness)
  const baseData = useMemo(() => {
    if (!selectedMonthKey || monthOptions.length === 0) return [];
    
    const currentMonthObj = monthOptions.find(mo => mo.key === selectedMonthKey);
    if (!currentMonthObj) return [];

    // Filter by the selected month first
    const monthRecords = data.filter(d => d.MES_REF === currentMonthObj.original);
    
    // Deduplicate logic identical to Dashboard
    const techMap = new Map<string, TechnicianRecord>();
    monthRecords.forEach(d => {
      // Key: Login + Type (Dashboard use this)
      const key = `${d.LOGIN_TECNICO}_${d.TIPO_BASE}`;
      techMap.set(key, d);
    });

    const lista = Array.from(techMap.values()).filter(d => (d.PERCENT_TC || 0) < 70);

    // DEBUG per request
    console.log("DEBUG TECNICOS NAO CERTIFICADOS", {
      mesSelecionado: selectedMonthKey,
      tipoFiltro: filterType,
      regiaoFiltro: filterRegion,
      total: lista.length,
      logins: lista.map(x => x.LOGIN_TECNICO)
    });

    return lista;
  }, [data, selectedMonthKey, monthOptions, filterType, filterRegion]);

  // 3. Totals Cards (Must match Dashboard sums for the selected month)
  const stats = useMemo(() => {
    const capital = baseData.filter(d => d.REGIAO_PR === 'CAPITAL').length;
    const interior = baseData.filter(d => d.REGIAO_PR === 'INTERIOR').length;
    const naoClassificado = baseData.filter(d => d.REGIAO_PR === 'NAO_CLASSIFICADO' || !d.REGIAO_PR).length;
    
    return {
      capital,
      interior,
      naoClassificado,
      total: baseData.length
    };
  }, [baseData]);

  // 4. Dynamic Filters Options
  const companies = useMemo(() => 
    Array.from(new Set(baseData.map(d => d.EMPRESA))).sort(),
    [baseData]
  );

  const gaps = useMemo(() => 
    Array.from(new Set(baseData.flatMap(d => d.notCertifiedReasons || []))).sort(),
    [baseData]
  );

  // 5. Apply UI Filters and Sorting
  const filteredAndSortedList = useMemo(() => {
    let result = [...baseData];

    if (filterRegion !== 'TODAS') {
      result = result.filter(d => d.REGIAO_PR === filterRegion);
    }

    if (filterCompany !== 'TODAS') {
      result = result.filter(d => d.EMPRESA === filterCompany);
    }

    if (filterGap !== 'TODOS') {
      result = result.filter(d => (d.notCertifiedReasons || []).some(r => r.toUpperCase().includes(filterGap.toUpperCase())));
    }

    if (filterType !== 'TODOS') {
      result = result.filter(d => d.TIPO_BASE === filterType);
    }

    if (searchTerm) {
      const term = normalizeText(searchTerm).toLowerCase();
      result = result.filter(d => 
        normalizeText(d.LOGIN_TECNICO).toLowerCase().includes(term) ||
        normalizeText(d.EMPRESA).toLowerCase().includes(term) ||
        normalizeText(d.UNIDADE_NEGOCIO).toLowerCase().includes(term)
      );
    }

    // Sort: Região, Empresa, %TC (menor primeiro)
    return result.sort((a, b) => {
      // Região
      const regionA = a.REGIAO_PR || '';
      const regionB = b.REGIAO_PR || '';
      if (regionA !== regionB) return regionA.localeCompare(regionB);

      // Empresa
      const empA = a.EMPRESA || '';
      const empB = b.EMPRESA || '';
      if (empA !== empB) return empA.localeCompare(empB);

      // %TC
      return (a.PERCENT_TC || 0) - (b.PERCENT_TC || 0);
    });
  }, [baseData, filterRegion, filterCompany, filterGap, filterType, searchTerm]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header com Filtro de Mês */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Técnicos Não Certificados</h2>
          <p className="text-xs text-slate-400 font-medium">Listagem consolidada baseada em TC &lt; 70%</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <Calendar className="w-4 h-4 text-slate-400 ml-2" />
           <select 
             value={selectedMonthKey} 
             onChange={(e) => setSelectedMonthKey(e.target.value)}
             className="bg-white text-xs font-black uppercase tracking-widest py-2 px-3 focus:outline-none cursor-pointer min-w-[160px]"
           >
             {monthOptions.map(m => (
               <option key={m.key} value={m.key}>{m.label}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-colors rounded-[2rem]">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital</p>
              <h4 className="text-3xl font-black text-slate-900">{stats.capital}</h4>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-500/30 transition-colors rounded-[2rem]">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interior</p>
              <h4 className="text-3xl font-black text-slate-900">{stats.interior}</h4>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-500/30 transition-colors rounded-[2rem]">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ñ Classif.</p>
              <h4 className="text-3xl font-black text-slate-900">{stats.naoClassificado}</h4>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-slate-900 text-white shadow-xl shadow-slate-200 flex items-center justify-between group transition-all rounded-[2rem]">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl text-white group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Não Certificados</p>
              <h4 className="text-3xl font-black text-white">{stats.total}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6 bg-white border border-slate-100 shadow-sm rounded-[2rem]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Região */}
          <div className="relative">
            <Filter className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
            >
              <option value="TODAS">Região: TODAS</option>
              <option value="CAPITAL">CAPITAL</option>
              <option value="INTERIOR">INTERIOR</option>
              <option value="NAO_CLASSIFICADO">Ñ CLASSIFICADO</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Empresa */}
          <div className="relative">
            <Building2 className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
            >
              <option value="TODAS">Empresa: TODAS</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* GAP */}
          <div className="relative">
            <ArrowDownWideNarrow className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={filterGap}
              onChange={(e) => setFilterGap(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
            >
              <option value="TODOS">GAP: TODOS</option>
              {gaps.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Tipo */}
          <div className="relative">
            <Users className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
            >
              <option value="TODOS">Tipo: TODOS</option>
              <option value="SAFRA">SAFRA</option>
              <option value="VETERANO">VETERANO</option>
              <option value="VETERANO_EM_SAFRA">VETERANO EM SAFRA</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2.5rem]">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Técnico / Login</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Empresa</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Região</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">UN / Cluster</th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">% TC</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Principal GAP</th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedList.length > 0 ? (
                filteredAndSortedList.map((record, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                          {record.LOGIN_TECNICO.substring(0, 1).toUpperCase()}
                        </div>
                        <span className="text-sm font-black text-slate-900">{record.LOGIN_TECNICO}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {record.EMPRESA}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                        record.REGIAO_PR === 'CAPITAL' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                        record.REGIAO_PR === 'INTERIOR' ? "bg-purple-50 text-purple-600 border border-purple-100" :
                        "bg-slate-50 text-slate-400 border border-slate-100"
                      )}>
                        {record.REGIAO_PR || 'NÃO CLASS.'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{record.UNIDADE_NEGOCIO}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">CLAROPR</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={cn(
                        "inline-flex items-center justify-center w-12 h-12 rounded-2xl font-black text-sm shadow-sm",
                        (record.PERCENT_TC || 0) < 40 ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                      )}>
                        {record.PERCENT_TC.toFixed(1).replace('.', ',')}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px]">
                        <p className="text-[10px] font-black text-slate-500 uppercase leading-relaxed line-clamp-2">
                          {(record.notCertifiedReasons || []).join(' + ') || 'Critério Técnico'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        (record.PERCENT_TC || 0) < 40 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", (record.PERCENT_TC || 0) < 40 ? "bg-red-500" : "bg-amber-500")} />
                        {(record.PERCENT_TC || 0) < 40 ? 'Crítico' : 'Alerta'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-[0.1em]",
                         record.TIPO_BASE === 'SAFRA' ? "text-primary bg-primary/5 px-2 py-1 rounded-lg" : "text-slate-500"
                       )}>
                         {record.TIPO_BASE}
                       </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <UserMinus className="w-12 h-12" />
                      <p className="text-sm font-black uppercase tracking-widest">Nenhum técnico não certificado disponível no mês/filtros selecionados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
