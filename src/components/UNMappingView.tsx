import React, { useState } from 'react';
import { Database, Plus, Search, Trash2, Edit2, CheckCircle2, XCircle, MapPin, Building2 } from 'lucide-react';
import { AppConfig, UNMappingRule } from '../types';
import { cn } from '../lib/utils';

interface UNMappingViewProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

export default function UNMappingView({ config, setConfig }: UNMappingViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<UNMappingRule | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<UNMappingRule>>({
    un: '',
    uf: 'PR',
    regiaoPR: 'CAPITAL',
    cluster: '',
    status: 'ATIVA'
  });

  const filteredRules = (config.unMappingRules || []).filter(rule => 
    rule.un.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.cluster.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (rule?: UNMappingRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData(rule);
    } else {
      setEditingRule(null);
      setFormData({
        un: '',
        uf: 'PR',
        regiaoPR: 'CAPITAL',
        cluster: '',
        status: 'ATIVA'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.un) {
      alert('O nome da UN é obrigatório.');
      return;
    }

    const newRule = formData as UNMappingRule;

    setConfig(prev => {
      const currentRules = prev.unMappingRules || [];
      const exists = currentRules.some(r => r.un === newRule.un);
      
      let updatedRules;
      if (editingRule) {
        // Mode Edit: Replace by old UN name (in case it changed)
        updatedRules = currentRules.map(r => r.un === editingRule.un ? newRule : r);
      } else {
        // Mode Add
        if (exists) {
          alert('Esta UN já está mapeada.');
          return prev;
        }
        updatedRules = [...currentRules, newRule];
      }

      return {
        ...prev,
        unMappingRules: updatedRules
      };
    });

    setIsModalOpen(false);
  };

  const handleDelete = (un: string) => {
    if (confirm(`Tem certeza que deseja excluir o mapeamento da UN "${un}"?`)) {
      setConfig(prev => ({
        ...prev,
        unMappingRules: (prev.unMappingRules || []).filter(r => r.un !== un)
      }));
    }
  };

  const toggleStatus = (un: string) => {
    setConfig(prev => ({
      ...prev,
      unMappingRules: (prev.unMappingRules || []).map(r => 
        r.un === un ? { ...r, status: r.status === 'ATIVA' ? 'INATIVA' : 'ATIVA' } : r
      )
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar UN ou Cluster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" /> Adicionar Nova UN
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">UNIDADE_NEGOCIO</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">UF</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">TIPO REGIONAL</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">CLUSTER / REGIÃO</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRules.map((rule) => (
              <tr key={rule.un} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900">{rule.un}</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-center">
                  <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase">{rule.uf}</span>
                </td>
                <td className="px-8 py-4">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tight",
                    rule.regiaoPR === 'CAPITAL' ? "bg-blue-50 text-blue-600" : 
                    rule.regiaoPR === 'INTERIOR' ? "bg-amber-50 text-amber-600" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {rule.regiaoPR}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                    <MapPin className="w-3 h-3 opacity-40 " />
                    {rule.cluster || 'N/A'}
                  </div>
                </td>
                <td className="px-8 py-4 text-center">
                  <button onClick={() => toggleStatus(rule.un)}>
                    {rule.status === 'ATIVA' ? (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">ATIVA</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">INATIVA</span>
                      </div>
                    )}
                  </button>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(rule)}
                      className="p-2 text-slate-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(rule.un)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Database className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-medium">Nenhum mapeamento encontrado.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingRule ? 'Editar Mapeamento' : 'Nova UN'}
                </h3>
                <p className="text-sm text-slate-400 font-medium">Defina como esta UN será classificada nas análises.</p>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, un: e.target.value.toUpperCase() }))}
                    placeholder="Ex: CWB-EQS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
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
                    placeholder="Ex: CURITIBA E REGIÃO METROPOLITANA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                  <div className="flex gap-2">
                    {(['ATIVA', 'INATIVA'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setFormData(prev => ({ ...prev, status: s }))}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                          formData.status === s 
                            ? (s === 'ATIVA' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-slate-800 text-white shadow-lg shadow-slate-200")
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
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
                onClick={handleSave}
                className="flex-[2] px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {editingRule ? 'Salvar Alterações' : 'Cadastrar UN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
