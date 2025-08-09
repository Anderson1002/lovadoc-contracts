import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace(/\s/g, ' ');
}

export function formatCurrencyInput(value: string): string {
  // Remove non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d]/g, '');
  
  if (!numericValue) return '';
  
  // Format with thousands separator
  return new Intl.NumberFormat('es-CO').format(parseInt(numericValue));
}
