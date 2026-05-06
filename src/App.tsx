/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './lib/supabase';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  Building2, 
  Search,
  TrendingUp, 
  Settings as SettingsIcon, 
  Upload,
  Menu,
  X,
  FileDown,
  FileUp,
  Database,
  HelpCircle,
  History,
  LineChart as LineChartIcon,
  ChevronDown,
  ChevronUp,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LZString from 'lz-string';
import { 
  AppConfig, 
  TechnicianRecord
} from './types';
import { cn } from './lib/utils';
import { normalizeText, INITIAL_UN_MAPPINGS, getRegiaoPR } from './constants';

// Views
import Dashboard from './components/Dashboard';
import Technicians from './components/Technicians';
import Partners from './components/Partners';
import MonthlyEvolution from './components/MonthlyEvolution';
import Settings from './components/Settings';
import ImportSafra from './components/ImportSafra';

// New Decision Views
import TransicaoView from './components/TransicaoView';
import DataValidationView from './components/DataValidationView';
import SafraContinuity from './components/SafraContinuity';
import UNMappingView from './components/UNMappingView';
import UncertifiedTechnicians from './components/UncertifiedTechnicians';
import LoginSearch from './components/LoginSearch';

const STORAGE_KEY = 'safra_certificacao_data_v3';
const CONFIG_KEY = 'safra_certificacao_config_v3';

const DEFAULT_CONFIG: AppConfig = {
  normalizationRules: [
    { id: '1', pattern: 'AMARAL', replacement: 'AMARAL SAT', status: 'ATIVA' },
    { id: '2', pattern: 'VIA', replacement: 'VIA TELECOM', status: 'ATIVA' }
  ],
  knownCompanies: [
    'AMARAL SAT', 'EQS', 'FFA', 'NET', 'NET ENERGY', 'PRISMA', 
    'PROCISA', 'PROCABO', 'TIME', 'TIME01', 'VIA TELECOM'
  ],
  unMappingRules: INITIAL_UN_MAPPINGS
};

/**
 * ESTRUTURA DE PERFIS (PREVISTA)
 * ADMIN: vê tudo
 * ANALISTA: vê apenas sua região/estado
 * GESTOR_CLARO: vê apenas seu cluster (Capital ou Interior)
 * PARCEIRA: vê apenas sua empresa
 */
type UserRole = 'ADMIN' | 'ANALISTA' | 'GESTOR_CLARO' | 'PARCEIRA';
const currentUserRole: UserRole = 'ADMIN';

// Error Boundary Component for safety
export default function App() {
  const [data, setData] = useState<TechnicianRecord[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<'TODAS' | 'INTERIOR' | 'CAPITAL' | 'NAO_CLASSIFICADO'>('TODAS');
  const [selectedType, setSelectedType] = useState<'TODAS' | 'SAFRA' | 'VETERANO' | 'VETERANO_EM_SAFRA'>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<'TODAS' | 'MAPEADA' | 'NAO_MAPEADA'>('TODAS');

  // Load from LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    
    if (savedData) {
      try {
        let decompressed = savedData;
        // Simple heuristic: if it doesn't look like JSON (starts with '['), try decompressing from UTF16
        if (savedData.length > 0 && savedData[0] !== '[' && savedData[0] !== '{') {
          const result = LZString.decompressFromUTF16(savedData);
          if (result) decompressed = result;
        }
        
        const parsed = JSON.parse(decompressed);
        if (Array.isArray(parsed)) {
          setData(parsed);
        }
      } catch (e) {
        console.error("Error loading data", e);
      }
    }

    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig && typeof parsedConfig === 'object') {
          // Merge with DEFAULT_CONFIG to ensure new keys exist
          setConfig(prev => ({ ...prev, ...parsedConfig }));
        }
      } catch (e) {
        console.error("Error loading config", e);
      }
    }
  }, []);

  // Filtered Data based on Global Filters
  const filteredData = useMemo(() => {
    // Strict validation: must be an object with essential fields
    const safeData = Array.isArray(data) 
      ? data.filter(d => d && typeof d === 'object' && d.LOGIN_TECNICO && d.MES_REF && d.EMPRESA) 
      : [];
      
    if (safeData.length === 0) return [];
    
    let result = [...safeData];
    
    // Region Filter
    const fRegion = selectedRegion ? normalizeText(selectedRegion) : 'TODAS';
    if (fRegion !== 'TODAS') {
      result = result.filter(d => normalizeText(d.REGIAO_PR || '') === fRegion);
    }

    // Type Filter
    if (selectedType && selectedType !== 'TODAS') {
      result = result.filter(d => d.TIPO_BASE === selectedType);
    }

    // Status Filter
    if (selectedStatus && selectedStatus !== 'TODAS') {
      result = result.filter(d => d.STATUS_EMPRESA === selectedStatus);
    }

    return result;
  }, [data, selectedRegion, selectedType, selectedStatus]);

  // Save to LocalStorage
  useEffect(() => {
    try {
      const stringified = JSON.stringify(data);
      const compressed = LZString.compressToUTF16(stringified);
      localStorage.setItem(STORAGE_KEY, compressed);
    } catch (error) {
      console.error("Erro ao salvar dados no localStorage:", error);
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error("Erro ao salvar configuração no localStorage:", error);
    }
  }, [config]);

  const exportBackup = () => {
    const backup = {
      data,
      config,
      version: '2.0.0',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safra_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const backup = JSON.parse(evt.target?.result as string);
        if (backup.data && Array.isArray(backup.data)) {
          setData(backup.data);
          if (backup.config) setConfig(backup.config);
          alert('Backup restaurado com sucesso!');
        }
      } catch (err) {
        alert('Erro ao restaurar backup. Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    if (confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) {
      setData([]);
    }
  };

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'uncertified', label: 'Técnicos Não Certificados', icon: AlertTriangle },
    { id: 'loginSearch', label: 'Consultar Login', icon: Search },
    { id: 'safraContinuity', label: 'Continuidade da Safra', icon: Users },
    { id: 'partners', label: 'Empresas', icon: Building2 },
    { id: 'transicao', label: 'Tempo de Retenção', icon: LineChartIcon },
    { id: 'evolution', label: 'Evolução Mensal', icon: HelpCircle },
  ];

  const adminNavItems = [
    { id: 'import', label: 'Importação', icon: Upload },
    { id: 'unMapping', label: 'Mapeamento de UN', icon: Database },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
    { id: 'validation', label: 'Validação de Dados', icon: AlertTriangle, color: 'text-amber-500' },
  ];

  const allNavItems = [...mainNavItems, ...adminNavItems];

  const handleUpdateConfig = (newConfig: AppConfig | ((prev: AppConfig) => AppConfig)) => {
    setConfig(prev => {
      const updatedConfig = typeof newConfig === 'function' ? newConfig(prev) : newConfig;
      
      // If unMappingRules changed, we might want to re-classify existing data
      // This ensures "reprocessar a base" requirement is met
      if (Array.isArray(data)) {
        setData(currentData => Array.isArray(currentData) ? currentData.map(record => ({
          ...record,
          REGIAO_PR: getRegiaoPR(record, record.MES_REF, updatedConfig.unMappingRules)
        })) : []);
      }

      return updatedConfig;
    });
  };

  const renderContent = () => {
    if (data.length === 0 && activeView !== 'import' && activeView !== 'settings' && activeView !== 'unMapping') {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Database className="text-slate-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum dado importado</h3>
            <p className="text-slate-500 text-sm mb-6">
              Para visualizar as análises de decisão, vá até a aba "Importação" e suba seu arquivo Excel.
            </p>
            <button 
              onClick={() => setActiveView('import')}
              className="bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              Importar Agora
            </button>
          </div>
        </div>
      );
    }

    try {
      switch (activeView) {
        case 'dashboard': return <Dashboard data={filteredData} config={config} />;
        case 'uncertified': return <UncertifiedTechnicians data={filteredData} config={config} />;
        case 'loginSearch': return <LoginSearch data={data} config={config} />;
        case 'partners': return <Partners data={filteredData} config={config} />;
        case 'transicao': return <TransicaoView data={filteredData} config={config} />;
        case 'safraContinuity': return <SafraContinuity data={data} config={config} />;
        case 'evolution': return <MonthlyEvolution data={filteredData} config={config} />;
        case 'validation': return <DataValidationView data={data} config={config} setConfig={handleUpdateConfig} />;
        case 'import': return <ImportSafra data={data} setData={setData} config={config} />;
        case 'unMapping': return <UNMappingView config={config} setConfig={handleUpdateConfig} />;
        case 'settings': return <Settings config={config} setConfig={handleUpdateConfig} />;
        default: return <Dashboard data={filteredData} config={config} />;
      }
    } catch (e) {
      console.error("Render error:", e);
      return (
        <div className="h-full flex items-center justify-center p-12">
          <div className="card p-8 border-red-200 bg-red-50 text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Erro de Cálculo</h3>
            <p className="text-red-700 text-sm">Não foi possível calcular esta visão com os dados atuais. Tente reimportar ou verificar a Validação de Dados.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 flex flex-col fixed inset-y-0 z-50 md:relative",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !isSidebarOpen && "w-0 opacity-0")}>
            <div className="bg-primary p-1.5 rounded-lg shrink-0">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold whitespace-nowrap text-lg">Painel Safra</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-4 overflow-y-auto no-scrollbar">
          {/* Menu Analítico */}
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                activeView === item.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}

          {/* Grupo Administração */}
          <div className="pt-4 mt-4 border-t border-slate-800/50">
            <button 
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white group",
                adminNavItems.some(item => item.id === activeView) && "text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-[0.15em]">Administração</span>}
              </div>
              {isSidebarOpen && (isAdminMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
            </button>

            <AnimatePresence>
              {(isAdminMenuOpen || !isSidebarOpen) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-1 mt-1 pl-2"
                >
                  {adminNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all group",
                        activeView === item.id 
                          ? "bg-slate-800 text-primary font-bold" 
                          : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {isSidebarOpen && <span className="text-xs">{item.label}</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {isSidebarOpen && (
          <div className="p-4 space-y-2 border-t border-slate-800">
            <button onClick={exportBackup} className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white py-2 px-3 hover:bg-slate-800 rounded-lg transition-colors">
              <FileDown className="w-4 h-4" /> <span>Exportar Backup</span>
            </button>
            <label className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white py-2 px-3 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <FileUp className="w-4 h-4" /> <span>Restaurar Backup</span>
              <input type="file" className="hidden" accept=".json" onChange={importBackup} />
            </label>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-500" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">
              {allNavItems.find(i => i.id === activeView)?.label || activeView}
            </h2>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            {/* Regiao Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['TODAS', 'CAPITAL', 'INTERIOR', 'NAO_CLASSIFICADO'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    selectedRegion === r ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600",
                    r === 'NAO_CLASSIFICADO' && "text-red-400"
                  )}
                >
                  {r === 'NAO_CLASSIFICADO' ? 'Ñ Class' : r}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['TODAS', 'SAFRA', 'VETERANO', 'VETERANO_EM_SAFRA'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    selectedType === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {t === 'VETERANO_EM_SAFRA' ? 'VET EM SAFRA' : t}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['TODAS', 'MAPEADA', 'NAO_MAPEADA'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    selectedStatus === s ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {s === 'TODAS' ? 'TODOS STATUS' : s === 'MAPEADA' ? 'MAPEADAS' : 'Ñ MAPEADAS'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Base de Dados</span>
                <span className="text-sm font-bold text-slate-900">{data.length} registros</span>
             </div>
             {data.length > 0 && (
               <button 
                 onClick={clearData}
                 className="text-xs font-bold text-red-600 hover:text-white border border-red-200 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-all"
               >
                 Limpar Base
               </button>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeView}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="max-w-[1600px] mx-auto"
             >
               {renderContent()}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
