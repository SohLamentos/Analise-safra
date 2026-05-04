import React, { useMemo } from 'react';
import { 
  History, 
  TrendingUp, 
  ArrowRight, 
  Award, 
  ZapOff,
  Users,
  ShieldCheck,
  Building2,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { TechnicianRecord, AppConfig } from '../types';
import { cn, formatPercent } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TransicaoViewProps {
  data: TechnicianRecord[];
  config: AppConfig;
}

export default function TransicaoView({ data, config }: TransicaoViewProps) {
  const transicaoStats = useMemo(() => {
    const techMap: Record<string, TechnicianRecord[]> = {};
    data.forEach(d => {
      if (!techMap[d.LOGIN_TECNICO]) techMap[d.LOGIN_TECNICO] = [];
      techMap[d.LOGIN_TECNICO].push(d);
    });

    let totalTransitioned = 0;
    let certifiedInSafra = 0;
    let certifiedInVeterano = 0;
    let bothCertified = 0;
    let evolved = 0;
    let regressed = 0;
    let chronic = 0;

    Object.values(techMap).forEach(records => {
      const safra = records.filter(r => r.TIPO_BASE === 'SAFRA');
      const veterano = records.filter(r => r.TIPO_BASE === 'VETERANO');

      if (safra.length > 0 && veterano.length > 0) {
        totalTransitioned++;
        const wasCertifiedSafra = safra.some(r => r.isCertified);
        const isCertifiedVeterano = veterano.some(r => r.isCertified);

        if (wasCertifiedSafra) certifiedInSafra++;
        if (isCertifiedVeterano) certifiedInVeterano++;
        
        if (wasCertifiedSafra && isCertifiedVeterano) bothCertified++;
        else if (!wasCertifiedSafra && isCertifiedVeterano) evolved++;
        else if (wasCertifiedSafra && !isCertifiedVeterano) regressed++;
        else chronic++;
      }
    });

    const pieData = [
       { name: 'Referência (Ambos OK)', value: bothCertified, color: '#10b981' },
       { name: 'Evoluiu (Safra NOK -> Vet OK)', value: evolved, color: '#0ea5e9' },
       { name: 'Regrediu (Safra OK -> Vet NOK)', value: regressed, color: '#f59e0b' },
       { name: 'Crônico (Ambos NOK)', value: chronic, color: '#ef4444' },
    ];

    return {
      totalTransitioned,
      certifiedInSafra,
      certifiedInVeterano,
      bothCertified,
      evolved,
      regressed,
      chronic,
      pieData,
      taxaSucessoSafra: (certifiedInSafra / (totalTransitioned || 1)) * 100,
      taxaSucessoVet: (certifiedInVeterano / (totalTransitioned || 1)) * 100,
    };
  }, [data]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Análise de Maturidade operacional</h2>
            <p className="text-sm text-slate-500">Acompanhamento do fluxo de técnicos da Safra para o período de Veteranos.</p>
         </div>
         <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
               <Users className="w-4 h-4 text-slate-400" />
               <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase leading-none">Total Analisado</div>
                  <div className="text-sm font-black text-slate-900">{transicaoStats.totalTransitioned} Técnicos</div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="card p-6 border-b-4 border-emerald-500">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Certificados na Safra</h4>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black text-slate-900">{transicaoStats.certifiedInSafra}</span>
               <span className="text-xs font-bold text-slate-500">({transicaoStats.taxaSucessoSafra.toFixed(1)}%)</span>
            </div>
         </div>
         <div className="card p-6 border-b-4 border-sky-500">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Certificados como Veteranos</h4>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black text-slate-900">{transicaoStats.certifiedInVeterano}</span>
               <span className="text-xs font-bold text-slate-500">({transicaoStats.taxaSucessoVet.toFixed(1)}%)</span>
            </div>
         </div>
         <div className="card p-6 border-b-4 border-amber-500">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Evoluíram (Salto de Performance)</h4>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black text-slate-900">{transicaoStats.evolved}</span>
               <span className="text-xs font-bold text-sky-600">Upgrade Operacional</span>
            </div>
         </div>
         <div className="card p-6 border-b-4 border-red-500">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Crônicos (Meta Nunca Atingida)</h4>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black text-slate-900">{transicaoStats.chronic}</span>
               <span className="text-xs font-bold text-red-600">Risco Alto</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="card p-8 lg:col-span-2">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Distribuição de Resultados pós-Safra</h3>
                  <p className="text-xs text-slate-500">Como os técnicos se comportam na transição</p>
               </div>
               <BarChart3 className="w-6 h-6 text-slate-200" />
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={transicaoStats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {transicaoStats.pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="card p-8 space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2 text-primary flex items-center gap-2">
               <ShieldCheck className="w-5 h-5" /> Insights Operacionais
            </h3>
            
            <div className="space-y-4">
               {transicaoStats.evolved > transicaoStats.regressed ? (
                 <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-xs font-bold text-green-800 leading-relaxed">
                       Sinal Positivo: Existem mais técnicos evoluindo do que regredindo. A maturação operacional está acontecendo.
                    </p>
                 </div>
               ) : (
                 <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-xs font-bold text-red-800 leading-relaxed">
                       Sinal de Alerta: A regressão pós-safra está alta. Verificar se os critérios da safra estão fáceis demais ou se o suporte cai no veteranismo.
                    </p>
                 </div>
               )}

               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Pilar de Transição</div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                      <span>Conversão Safra -&gt; Vet</span>
                      <span className="text-primary">{((transicaoStats.certifiedInVeterano / (transicaoStats.certifiedInSafra || 1)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-primary" 
                       style={{ width: `${(transicaoStats.certifiedInVeterano / (transicaoStats.certifiedInSafra || 1)) * 100}%` }}
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="card p-6 flex flex-col items-center text-center space-y-4">
            <Award className="w-10 h-10 text-emerald-500" />
            <div>
               <h4 className="text-sm font-bold text-slate-900">Referência</h4>
               <p className="text-[10px] text-slate-500 uppercase font-black">Performance Alta Contínua</p>
            </div>
            <div className="text-3xl font-black text-slate-900">{transicaoStats.bothCertified}</div>
         </div>
         <div className="card p-6 flex flex-col items-center text-center space-y-4">
            <TrendingUp className="w-10 h-10 text-sky-500" />
            <div>
               <h4 className="text-sm font-bold text-slate-900">Evoluiu</h4>
               <p className="text-[10px] text-slate-500 uppercase font-black">Curva de Aprendizado Completa</p>
            </div>
            <div className="text-3xl font-black text-slate-900">{transicaoStats.evolved}</div>
         </div>
         <div className="card p-6 flex flex-col items-center text-center space-y-4 opacity-70">
            <ZapOff className="w-10 h-10 text-amber-500" />
            <div>
               <h4 className="text-sm font-bold text-slate-900">Regrediu</h4>
               <p className="text-[10px] text-slate-500 uppercase font-black">Queda de Performance</p>
            </div>
            <div className="text-3xl font-black text-slate-900">{transicaoStats.regressed}</div>
         </div>
         <div className="card p-6 flex flex-col items-center text-center space-y-4 border-2 border-red-100">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <div>
               <h4 className="text-sm font-bold text-slate-900">Crônico</h4>
               <p className="text-[10px] text-slate-500 uppercase font-black">Risco de Desligamento Operacional</p>
            </div>
            <div className="text-3xl font-black text-red-600">{transicaoStats.chronic}</div>
         </div>
      </div>
    </div>
  );
}
