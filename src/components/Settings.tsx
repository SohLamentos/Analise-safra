import React from 'react';
import { Save, AlertCircle, Trash2, Sliders, Target, Calendar, Clock, Building, Plus, Trash } from 'lucide-react';
import { AppConfig } from '../types';

interface SettingsProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

export default function Settings({ config, setConfig }: SettingsProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const addRule = () => {
    setConfig(prev => ({
      ...prev,
      normalizationRules: [
        ...(prev.normalizationRules || []),
        { id: Date.now().toString(), pattern: '', replacement: '' }
      ]
    }));
  };

  const updateRule = (id: string, field: 'pattern' | 'replacement' | 'status', value: string) => {
    setConfig(prev => ({
      ...prev,
      normalizationRules: (prev.normalizationRules || []).map(r => 
        r.id === id ? { ...r, [field]: value } : r
      )
    }));
  };

  const removeRule = (id: string) => {
    setConfig(prev => ({
      ...prev,
      normalizationRules: (prev.normalizationRules || []).filter(r => r.id !== id)
    }));
  };

  const addKnownCompany = () => {
    const name = prompt("Novo nome de empresa normalizada:");
    if (name && !config.knownCompanies.includes(name)) {
      setConfig(prev => ({
        ...prev,
        knownCompanies: [...prev.knownCompanies, name]
      }));
    }
  };

  const removeKnownCompany = (name: string) => {
    if (confirm(`Remover "${name}" da lista de empresas mapeadas?`)) {
      setConfig(prev => ({
        ...prev,
        knownCompanies: prev.knownCompanies.filter(c => c !== name)
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Sliders className="text-primary w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Configurações de Safra</h3>
        </div>

        {/* Known Companies Management */}
        <div className="card p-8 bg-white shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <Building className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Empresas Mapeadas</h3>
                <p className="text-xs text-slate-400">Lista oficial de empresas conhecidas pelo sistema.</p>
              </div>
            </div>
            <button 
              onClick={addKnownCompany}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Plus className="w-4 h-4" /> Adicionar Empresa
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {config.knownCompanies.map(comp => (
              <div key={comp} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 group">
                <span className="text-xs font-bold text-slate-700">{comp}</span>
                <button 
                  onClick={() => removeKnownCompany(comp)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Plus className="w-3 h-3 rotate-45" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Normalization Rules */}
        <div className="card p-8 bg-white shadow-xl shadow-slate-200/50 mt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl">
                <Sliders className="text-amber-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Regras de Normalização (Equivalências)</h3>
                <p className="text-xs text-slate-400">Vincula nomes originais a nomes normalizados.</p>
              </div>
            </div>
            <button 
              onClick={addRule}
              className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Adicionar Equivalência
            </button>
          </div>

          <div className="space-y-4">
             <div className="space-y-3">
               {(config.normalizationRules || []).map((rule) => (
                 <div key={rule.id} className="flex flex-col md:flex-row gap-3 items-end group animate-in fade-in slide-in-from-top-2 duration-200 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1 w-full">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Se contém:</label>
                       <input 
                         type="text"
                         value={rule.pattern}
                         onChange={(e) => updateRule(rule.id, 'pattern', e.target.value)}
                         placeholder="Ex: AMARAL"
                         className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                    </div>
                    <div className="flex-1 w-full">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Normalizar para:</label>
                       <input 
                         type="text"
                         value={rule.replacement}
                         onChange={(e) => updateRule(rule.id, 'replacement', e.target.value)}
                         placeholder="Ex: AMARAL SAT"
                         className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                    </div>
                    <div className="w-32">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status:</label>
                       <select 
                         value={rule.status}
                         onChange={(e) => updateRule(rule.id, 'status', e.target.value as any)}
                         className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                       >
                          <option value="ATIVA">ATIVA</option>
                          <option value="INATIVA">INATIVA</option>
                       </select>
                    </div>
                    <button 
                      onClick={() => removeRule(rule.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                       <Trash className="w-5 h-5" />
                    </button>
                 </div>
               ))}
               
               {(config.normalizationRules || []).length === 0 && (
                 <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                   <p className="text-slate-400 text-sm">Nenhuma regra cadastrada.</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="mt-12 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            O aplicativo agora segue regras fixas sincronizadas com a planilha oficial. As configurações de metas operacionais foram removidas para garantir a integridade dos dados.
          </p>
        </div>
      </div>
    </div>
  );
}
