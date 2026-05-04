import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TechnicianRecord, AppConfig, NormalizationRule } from '../types';
import { parseExcelPercent, cn } from '../lib/utils';
import { MONTHS_ORDER, normalizeText, classifyRegion, normalizeCompanyName, getRegiaoPR } from '../constants';

interface ImportSafraProps {
  data: TechnicianRecord[];
  setData: React.Dispatch<React.SetStateAction<TechnicianRecord[]>>;
  config: AppConfig;
}

export default function ImportSafra({ data, setData, config }: ImportSafraProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [manualType, setManualType] = useState<'SAFRA' | 'VETERANO'>('SAFRA');
  const [summary, setSummary] = useState<{
    meses: string[];
    total: number;
    existentesAntes: number;
    totalFinal: number;
    unicos: number;
    substituidos: number;
    regioes: { CAPITAL: number; INTERIOR: number; NAO_CLASSIFICADO: number };
    naoMapeadas: number;
    inconsistentes: number;
    safra: number;
    veterano: number;
    semTipo: number;
    duplicados: number;
  } | null>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setSummary(null);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) throw new Error('Falha ao ler arquivo: conteúdo vazio.');
        
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        let newRecords: TechnicianRecord[] = [];
        const importedMonths: string[] = [];
        let rowCount = 0;

        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws) as any[];
          
          if (rawRows.length === 0) return;
          importedMonths.push(sheetName);
          rowCount += rawRows.length;

          const sheetRecords = rawRows.map(row => {
            try {
              const rev = parseExcelPercent(row['% REV.']);
              const agenda = parseExcelPercent(row['% CUMP. AGENDA']);
              const gapProd = parseFloat((row['GAP PROD. (PONTOS)'] || '0').toString().replace(',', '.'));
              const gapRev = parseFloat((row['GAP REV.'] || '0').toString().replace(',', '.'));
              const gapAgenda = parseFloat((row['GAP CUMP. AGENDA (OSs)'] || '0').toString().replace(',', '.'));
              const mediaDias = parseFloat((row['MÉDIA DIAS TRABALHADOS'] || '0').toString().replace(',', '.'));
              const qtdeOSS = parseInt(row['QTDE OSs'] || '0');
              const qtdeWOS = parseInt(row['QTDE WOs'] || '0');

              const regiaoPR = getRegiaoPR(row, sheetName, config.unMappingRules);
              
              const percentTC = parseExcelPercent(row['% TC']);
              let isCertified = percentTC >= 0.7;
              
              const reasons: string[] = [];
              let score = 0;
              let classification: 'CERTIFICADO' | 'QUASE CERTIFICADO' | 'NÃO CERTIFICADO' | 'SEM VOLUME' = 'NÃO CERTIFICADO';

              if (percentTC === 1) {
                classification = 'CERTIFICADO';
                score = 100;
              } else {
                if (gapRev > 0) reasons.push('REVISITA');
                if (gapAgenda > 0) reasons.push('AGENDA');
                if (gapProd > 0) reasons.push('PRODUTIVIDADE');
                
                if (normalizeText(row['SEM EAD']) === 'SIM' || row['GAP EAD'] > 0) reasons.push('SEM EAD');
                if (normalizeText(row['NOSHOW']) === 'SIM' || row['GAP NOSHOW'] > 0) reasons.push('NOSHOW');

                classification = percentTC >= 0.7 ? 'CERTIFICADO' : (percentTC > 0 ? 'QUASE CERTIFICADO' : 'NÃO CERTIFICADO');
                score = (percentTC || 0) * 100;
              }

              let mainFailure = '-';
              let recommendedAction = '-';
              let recoveryProbability: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
              
              if (!isCertified) {
                mainFailure = reasons.join(' + ') || 'Critério Técnico';
                const sortedGaps = [
                  { name: 'REVISITA', val: gapRev, action: `Reduzir revisita em ${gapRev.toFixed(1)}%` },
                  { name: 'AGENDA', val: gapAgenda, action: `Cumprir mais ${gapAgenda} OSs na agenda` },
                  { name: 'PRODUTIVIDADE', val: gapProd, action: `Aumentar produtividade em ${gapProd.toFixed(1)} pontos` }
                ].sort((a, b) => b.val - a.val);

                const principalGap = sortedGaps[0];
                recommendedAction = principalGap.val > 0 ? principalGap.action : 'Revisar critérios técnicos';
                
                if (reasons.length === 1) recoveryProbability = 'Alta';
                else if (reasons.length === 2) recoveryProbability = 'Média';
                else recoveryProbability = 'Baixa';
              }

              const rawEmpresa = row['EMPRESA'] || row['EMPRESA_NORMALIZADA'] || '';
              const normalizedEmpresa = normalizeCompanyName(rawEmpresa);
              const isMapped = config.knownCompanies.includes(normalizedEmpresa);

              const tipoPlanilhaRaw = row['TIPO_BASE'] ? row['TIPO_BASE'].toString().toUpperCase() : '';
              let baseFinal: 'SAFRA' | 'VETERANO' = manualType;

              if (tipoPlanilhaRaw === 'SAFRA' || tipoPlanilhaRaw === 'VETERANO') {
                baseFinal = tipoPlanilhaRaw as 'SAFRA' | 'VETERANO';
              }

              return {
                NM_GRUPO_REGIONAL: row['NM_GRUPO_REGIONAL'] || '',
                EMPRESA: normalizedEmpresa,
                EMPRESA_ORIGINAL: rawEmpresa,
                EMPRESA_NORMALIZADA: normalizedEmpresa,
                isMappedCompany: isMapped,
                STATUS_EMPRESA: (isMapped ? 'MAPEADA' : 'NAO_MAPEADA') as "MAPEADA" | "NAO_MAPEADA",
                SEGMENTO: row['SEGMENTO'] || '',
                UNIDADE_NEGOCIO: row['UNIDADE_NEGOCIO'] || '',
                LOGIN_TECNICO: row['LOGIN_TECNICO'] || '',
                PERCENT_TC: percentTC,
                QTDE_WOS: qtdeWOS,
                QTDE_OSS: qtdeOSS,
                QTDE_REV: row['QTDE REV.'] || 0,
                PROD: parseFloat(row['PROD.']?.toString().replace(',', '.') || '0'),
                GAP_PROD: gapProd,
                PERCENT_REV: rev,
                GAP_REV: gapRev,
                PERCENT_CUMP_AGENDA: agenda,
                GAP_CUMP_AGENDA: gapAgenda,
                MEDIA_DIAS_TRABALHADOS: mediaDias,
                MES_REF: sheetName,
                TIPO_BASE: baseFinal,
                REGIAO_PR: regiaoPR,
                isCertified,
                classification,
                isLowVolume: false, 
                notCertifiedReasons: reasons,
                score,
                mainFailure,
                recommendedAction,
                recoveryProbability
              } as TechnicianRecord;
            } catch (rowErr) {
              console.error('Erro na linha:', row, rowErr);
              return null;
            }
          }).filter(Boolean) as TechnicianRecord[];
          
          newRecords = [...newRecords, ...sheetRecords];
        });

        // Validation & Multi-import Logic
        const isValidRecord = (r: TechnicianRecord) => {
          return r && 
                 r.LOGIN_TECNICO && 
                 r.MES_REF && 
                 r.EMPRESA && 
                 r.TIPO_BASE;
        };

        const validNew = newRecords.filter(isValidRecord);
        const inconsistencies = newRecords.length - validNew.length;

        // Use a persistent map for current + new
        const currentData = Array.isArray(data) ? data.filter(isValidRecord) : [];
        const registryMap = new Map<string, TechnicianRecord>();

        const getUniqueKey = (r: TechnicianRecord) => [
          (r.LOGIN_TECNICO || '').toString().trim().toUpperCase(),
          (r.MES_REF || '').toString().trim().toUpperCase(),
          (r.TIPO_BASE || 'SAFRA').toString().trim().toUpperCase(),
          (r.UNIDADE_NEGOCIO || '').toString().trim().toUpperCase(),
          (r.EMPRESA || '').toString().trim().toUpperCase()
        ].join('|');

        // Load current
        currentData.forEach(r => registryMap.set(getUniqueKey(r), r));
        
        // Add new (substitution)
        let substituidos = 0;
        validNew.forEach(nr => {
          const key = getUniqueKey(nr);
          if (registryMap.has(key)) substituidos++;
          registryMap.set(key, nr);
        });

        const finalProcessed = Array.from(registryMap.values());
        setData(finalProcessed);
        
        // Limpar o input para permitir nova importação do mesmo arquivo se necessário
        if (e.target) {
          e.target.value = "";
        }

        setSummary({
          meses: importedMonths,
          total: rowCount, // Novos registros lidos
          existentesAntes: currentData.length,
          totalFinal: registryMap.size,
          unicos: Array.from(new Set(finalProcessed.map(r => r.LOGIN_TECNICO))).length,
          substituidos,
          regioes: {
            CAPITAL: finalProcessed.filter(r => r.REGIAO_PR === "CAPITAL").length,
            INTERIOR: finalProcessed.filter(r => r.REGIAO_PR === "INTERIOR").length,
            NAO_CLASSIFICADO: finalProcessed.filter(r => r.REGIAO_PR === "NAO_CLASSIFICADO").length,
          },
          naoMapeadas: finalProcessed.filter(r => r.STATUS_EMPRESA === 'NAO_MAPEADA').length,
          inconsistentes: inconsistencies,
          safra: finalProcessed.filter(r => r.TIPO_BASE === 'SAFRA').length,
          veterano: finalProcessed.filter(r => r.TIPO_BASE === 'VETERANO').length,
          semTipo: finalProcessed.filter(r => !r.TIPO_BASE).length,
          duplicados: substituidos
        });

        setIsImporting(false);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        alert('Erro crítico ao processar planilha. Verifique o formato e campos obrigatórios.');
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card p-12 text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
        
        <div className="bg-primary/5 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 group-hover:rotate-6 transition-transform">
          <Upload className="text-primary w-10 h-10" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Importar Dados</h2>
        
        <div className="flex flex-col items-center gap-6 mb-10">
           <div className="flex gap-3">
              <button 
                onClick={() => setManualType('SAFRA')}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-bold text-xs border transition-all",
                  manualType === 'SAFRA' ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-400 hover:border-slate-300"
                )}
              >
                Importar como SAFRA
              </button>
              <button 
                onClick={() => setManualType('VETERANO')}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-bold text-xs border transition-all",
                  manualType === 'VETERANO' ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-400 hover:border-slate-300"
                )}
              >
                Importar como VETERANO
              </button>
           </div>
        </div>

        <p className="text-slate-500 mb-10 max-w-lg mx-auto">
          Arraste ou selecione o arquivo Excel (.xlsx). Cada aba será tratada como um mês de referência. 
          Dados duplicados (Mês + Login) serão substituídos.
        </p>

        <label className="inline-block cursor-pointer group/label">
          <div className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            {isImporting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5" />
            )}
            {isImporting ? 'Processando...' : 'Selecionar Planilha'}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".xlsx, .xls" 
            onChange={handleImport}
            disabled={isImporting}
          />
        </label>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Status Base</div>
             <div className="text-sm font-bold text-slate-900">{data.length > 0 ? 'Dados Ativos' : 'Aguardando'}</div>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Técnicos Unicos</div>
             <div className="text-sm font-bold text-slate-900">{Array.from(new Set(data.map(r => r.LOGIN_TECNICO))).length}</div>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Última Ref.</div>
             <div className="text-sm font-bold text-slate-900">{data.length > 0 ? data[data.length-1].MES_REF : '-'}</div>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-primary">
             <div className="text-[10px] font-black text-primary/60 uppercase mb-1 font-mono tracking-tighter">Colunas Requeridas</div>
             <div className="text-[10px] leading-tight font-medium opacity-80">LOGIN_TECNICO, EMPRESA, GAP PROD, % REV, % CUMP. AGENDA...</div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {summary && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 border-green-200 bg-green-50/30"
          >
            <div className="flex items-center gap-4 mb-6">
               <div className="bg-green-500 p-2 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h3 className="font-bold text-green-900 text-lg">Importação Concluída</h3>
                  <p className="text-green-700 text-sm opacity-80">Seus dados foram consolidados na base local.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-6 pt-6 border-t border-green-200">
               <div className="bg-white/50 p-3 rounded-xl border border-green-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-tighter text-center">Existentes</div>
                  <div className="text-xl font-black text-slate-700 text-center">{summary.existentesAntes}</div>
               </div>
               <div className="bg-white/50 p-3 rounded-xl border border-green-100">
                  <div className="text-[10px] font-bold text-blue-600 uppercase mb-1 tracking-tighter text-center">Novos Lidos</div>
                  <div className="text-xl font-black text-blue-700 text-center">{summary.total}</div>
               </div>
               <div className="bg-white/50 p-3 rounded-xl border border-green-100">
                  <div className="text-[10px] font-bold text-green-800 uppercase mb-1 tracking-tighter text-center">Total Final</div>
                  <div className="text-xl font-black text-green-900 text-center">{summary.totalFinal}</div>
               </div>
               <div className="bg-white/50 p-3 rounded-xl border border-green-100">
                  <div className="text-[10px] font-bold text-primary uppercase mb-1 tracking-tighter text-center">SAFRA</div>
                  <div className="text-xl font-black text-primary text-center">{summary.safra}</div>
               </div>
               <div className="bg-white/50 p-3 rounded-xl border border-green-100">
                  <div className="text-[10px] font-bold text-blue-800 uppercase mb-1 tracking-tighter text-center">VETERANO</div>
                  <div className="text-xl font-black text-blue-900 text-center">{summary.veterano}</div>
               </div>
               <div className="bg-white/50 p-3 rounded-xl border border-green-100">
                  <div className="text-[10px] font-bold text-amber-800 uppercase mb-1 tracking-tighter text-center">Duplicidades</div>
                  <div className="text-xl font-black text-amber-900 text-center">{summary.duplicados}</div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
               <div>
                  <div className="text-xs font-bold text-green-800 uppercase mb-1">Regiões Atribuídas</div>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-slate-600">CAP: {summary.regioes.CAPITAL}</span>
                    <span className="text-[10px] font-bold text-slate-600">INT: {summary.regioes.INTERIOR}</span>
                    <span className="text-[10px] font-bold text-red-600">N/C: {summary.regioes.NAO_CLASSIFICADO}</span>
                  </div>
               </div>
               <div>
                  <div className="text-xs font-bold text-amber-800 uppercase mb-1">Empresas</div>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-green-600">MAP: {summary.total - summary.naoMapeadas}</span>
                    <span className="text-[10px] font-bold text-amber-600">N/M: {summary.naoMapeadas}</span>
                  </div>
               </div>
               <div>
                  <div className="text-xs font-bold text-red-800 uppercase mb-1">Campos Inválidos</div>
                  <div className="text-2xl font-black text-red-600">{summary.inconsistentes}</div>
               </div>
            </div>

            {summary.regioes.NAO_CLASSIFICADO > 0 && (
              <div className="mt-6 p-4 bg-red-100 border border-red-200 rounded-xl flex items-center gap-3">
                 <AlertCircle className="w-5 h-5 text-red-600" />
                 <p className="text-xs text-red-700 font-bold">
                   Existem dados sem região definida. Esses dados não serão considerados nos comparativos regionais.
                 </p>
              </div>
            )}

            {summary.naoMapeadas > 0 && (
              <div className="mt-3 p-4 bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-3">
                 <AlertCircle className="w-5 h-5 text-amber-600" />
                 <p className="text-xs text-amber-700 font-bold">
                   Existem empresas não mapeadas ({summary.naoMapeadas}). Verifique a aba de Validação de Dados.
                 </p>
              </div>
            )}
            
            <div className="mt-8">
               <div className="text-xs font-bold text-green-800 uppercase mb-2">Meses Detectados</div>
               <div className="flex flex-wrap gap-1">
                 {summary.meses.map(m => (
                   <span key={m} className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded uppercase">{m}</span>
                 ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
         <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
         <div className="text-sm text-amber-900">
            <p className="font-bold mb-1">Importante: Formato das Abas</p>
            <p className="opacity-80 leading-relaxed text-xs">
              Certifique-se de que cada aba no Excel tenha o nome correto do mês (ex: "Janeiro 2025"). 
              O sistema utiliza o nome da aba para definir o período de referência do técnico na safra. 
              Substituições acontecem quando o mesmo Login de Técnico é encontrado no mesmo Mês de Referência.
            </p>
         </div>
      </div>
    </div>
  );
}
