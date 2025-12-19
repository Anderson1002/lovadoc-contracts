import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parsea una fecha de la base de datos (formato YYYY-MM-DD) sin problemas de timezone.
 * Evita el bug donde new Date("2025-11-01") se interpreta como UTC y se muestra
 * como el día anterior en zonas horarias negativas (ej: GMT-5).
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
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
