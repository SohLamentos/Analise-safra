import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TechnicianRecord } from '../types';
import { getMonthMapping } from '../constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTechnicianHistory(login: string, allData: TechnicianRecord[]) {
  const records = allData
    .filter(d => d.LOGIN_TECNICO.toUpperCase() === login.toUpperCase())
    .sort((a, b) => {
      const keyA = getMonthMapping(a.MES_REF)?.key || '';
      const keyB = getMonthMapping(b.MES_REF)?.key || '';
      return keyA.localeCompare(keyB);
    });

  // Deduplicate by MES_KEY + LOGIN_TECNICO + TIPO_BASE
  const uniqueRecords: TechnicianRecord[] = [];
  const seenKeys = new Set<string>();

  records.forEach(rec => {
    const mKey = getMonthMapping(rec.MES_REF)?.key || 'UNKNOWN';
    const uniqueKey = `${mKey}_${rec.LOGIN_TECNICO}_${rec.TIPO_BASE}`;
    if (!seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      uniqueRecords.push(rec);
    }
  });

  return uniqueRecords;
}

export function formatPercent(value: number): string {
  // If the value is already on a 0-100 scale, don't multiply by 100
  // If we decide to store everything as 0-100, this should just be:
  return `${Number(value).toFixed(1).replace('.', ',')}%`;
}

export function normalizePercent(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  
  const raw = String(value).replace('%', '').replace(',', '.').trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 0;

  // Se Excel vier como 0.911, converter para 91.1
  if (n > 0 && n <= 1) return n * 100;

  // Se já vier como 91.1, manter 91.1
  return n;
}

export function normalizeNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function parseExcelPercent(value: string | number | undefined): number {
  return normalizePercent(value);
}
