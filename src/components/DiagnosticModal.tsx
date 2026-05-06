import React from 'react';
import { 
  X, 
  Target, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Award,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DiagnosticModalProps {
  technician: TechnicianRecord | null;
  onClose: () => void;
  config: AppConfig;
}

export default function DiagnosticModal({ technician, onClose, config }: DiagnosticModalProps) {
  if (!technician) return null;

  const prodOk = (technician.GAP_PROD || 0) <= 0;
  const revOk = (technician.GAP_REV || 0) <= 0;
  const agendaOk = (technician.GAP_CUMP_AGENDA || 0) <= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        />
        
        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
        >
           {/* Header */}
           <div className="bg-slate-900 p-8 text-white">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center relative">
                    <Award className="w-8 h-8 text-primary" />
                    <div className="absolute -bottom-2 -right-2 bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                       {formatPercent(technician.PERCENT_TC || 0)}
                    </div>
                 </div>
                 <div>
                    <h2 className="text-2xl font-black tracking-tight">{technician.LOGIN_TECNICO || 'N/A'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">{technician.MES_REF}</span>
                       <span className="w-1 h-1 bg-slate-700 rounded-full" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{technician.EMPRESA || 'N/A'}</span>
                       <span className="w-1 h-1 bg-slate-700 rounded-full" />
                       <span className={cn(
                         "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                         technician.TIPO_BASE === 'SAFRA' ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                       )}>
                         {technician.TIPO_BASE || 'N/A'}
                       </span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Body */}
           <div className="p-8 space-y-8">
              {/* Classification & Probability */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status % TC</p>
                    <div className="flex items-center gap-2">
                       <div className={cn(
                         "w-2 h-2 rounded-full animate-pulse",
                         (technician.PERCENT_TC || 0) >= 70 ? "bg-emerald-500" : "bg-red-500"
                       )} />
                       <span className="text-sm font-black text-slate-900">
                         {(technician.PERCENT_TC || 0) >= 70 ? 'CERTIFICADO' : 'NÃO CERTIFICADO'}
                       </span>
                    </div>
                 </div>
                 <div className="p-4 rounded-[1.5rem] border" style={{ 
                   backgroundColor: technician.recoveryProbability === 'Alta' ? '#f0fdf4' : technician.recoveryProbability === 'Média' ? '#fffbeb' : '#fef2f2',
                   borderColor: technician.recoveryProbability === 'Alta' ? '#bbf7d0' : technician.recoveryProbability === 'Média' ? '#fef3c7' : '#fee2e2'
                 }}>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Gaps Detectados</p>
                    <div className="flex items-center gap-2">
                       <TrendingUp className={cn(
                         "w-4 h-4",
                         technician.recoveryProbability === 'Alta' ? "text-emerald-600" : technician.recoveryProbability === 'Média' ? "text-amber-600" : "text-red-600"
                       )} />
                       <span className={cn(
                         "text-sm font-black",
                         technician.recoveryProbability === 'Alta' ? "text-emerald-700" : technician.recoveryProbability === 'Média' ? "text-amber-700" : "text-red-700"
                       )}>
                         {(technician.notCertifiedReasons || []).length === 0 ? 'Meta Atingida' : `${(technician.notCertifiedReasons || []).length} Gaps: ${(technician.notCertifiedReasons || []).join(', ')}`}
                       </span>
                    </div>
                 </div>
              </div>

              {/* Volume & Working Days */}
               <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">QTDE OSs</p>
                     <p className="text-lg font-black text-slate-900">{technician.QTDE_OSS || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">QTDE WOs</p>
                     <p className="text-lg font-black text-slate-900">{technician.QTDE_WOS || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">DIAS TRAB.</p>
                     <p className="text-lg font-black text-slate-900">{(technician.MEDIA_DIAS_TRABALHADOS || 0).toFixed(1)}</p>
                  </div>
               </div>

               {/* Indicators */}
              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Diagnóstico Sugerido via GAPs
                 </h4>
                 <div className="space-y-3">
                    {/* Revisita */}
                    <div className={cn("p-4 rounded-2xl border transition-all", revOk ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100")}>
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">Revisita</span>
                          {revOk ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                       </div>
                       <div className="flex items-end justify-between">
                          <div className="text-lg font-black text-slate-900">
                             {formatPercent(technician.PERCENT_REV || 0)}
                             <span className="text-[10px] text-slate-400 font-medium ml-2">Realizado</span>
                          </div>
                          {!revOk && (
                            <div className="text-right">
                               <p className="text-[10px] font-black text-red-600 uppercase">GAP: +{(technician.GAP_REV || 0).toFixed(1)}%</p>
                               <p className="text-[8px] text-red-400 font-bold">FALTA MELHORAR</p>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Agenda */}
                    <div className={cn("p-4 rounded-2xl border transition-all", agendaOk ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100")}>
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">Cumprimento de Agenda</span>
                          {agendaOk ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                       </div>
                       <div className="flex items-end justify-between">
                          <div className="text-lg font-black text-slate-900">
                             {formatPercent(technician.PERCENT_CUMP_AGENDA || 0)}
                             <span className="text-[10px] text-slate-400 font-medium ml-2">Realizado</span>
                          </div>
                          {!agendaOk && (
                            <div className="text-right">
                               <p className="text-[10px] font-black text-red-600 uppercase">GAP: {technician.GAP_CUMP_AGENDA || 0} OSs</p>
                               <p className="text-[8px] text-red-400 font-bold">FALTA MELHORAR</p>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Produtividade */}
                    <div className={cn("p-4 rounded-2xl border transition-all", prodOk ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100")}>
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">Produtividade</span>
                          {prodOk ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                       </div>
                       <div className="flex items-end justify-between">
                          <div className="text-lg font-black text-slate-900">
                             {(technician.PROD || 0).toFixed(1)}
                             <span className="text-[10px] text-slate-400 font-medium ml-2">Pontos</span>
                          </div>
                          {!prodOk && (
                            <div className="text-right">
                               <p className="text-[10px] font-black text-red-600 uppercase">GAP: {(technician.GAP_PROD || 0).toFixed(1)} pts</p>
                               <p className="text-[8px] text-red-400 font-bold">FALTA MELHORAR</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Actionable Advice */}
              <div className="p-6 bg-slate-900 rounded-[2rem] text-white overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rotate-45 -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Plano de Ação Recomendado
                 </h4>
                 <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                       <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                       <div>
                          <p className="text-sm font-bold text-white mb-1">Ação Baseada no GAP</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{technician.recommendedAction || 'N/A'}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                       <TrendingDown className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                       <div>
                          <p className="text-sm font-bold text-white mb-1">Resumo de Falhas</p>
                          <p className="text-xs text-slate-400 leading-relaxed">Considerar {technician.mainFailure || 'N/A'} como prioridade no feedback.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
