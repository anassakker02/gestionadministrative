/**
 * Utilitaires de formatage
 */

/**
 * Formate un montant en devise (MAD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formate un montant sans le symbole de devise
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formate une date en français
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Formate une date courte en français
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
