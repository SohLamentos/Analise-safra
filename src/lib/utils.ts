import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function parseExcelPercent(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value > 1 ? value / 100 : value;
  
  // Handle string like "7,5%" or "0,075"
  const cleaned = value.toString().replace('%', '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  
  // If it's something like 95 (for 95%), convert to 0.95
  return num > 1 ? num / 100 : num;
}
