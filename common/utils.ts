import { QueryPaging } from "@/types";

export function buildQueryString<T extends Partial<QueryPaging>>(params: T): string {
  if (!params || typeof params !== 'object') {
    return '';
  }

  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      // Handle date objects
      if (value && typeof value === 'object' && 'toISOString' in value && typeof (value as { toISOString: () => string }).toISOString === 'function') {
        return `${encodeURIComponent(key)}=${encodeURIComponent((value as { toISOString: () => string }).toISOString())}`;
      }
      // Handle date strings specifically for dateFrom and dateTo
      else if ((key === 'dateFrom' || key === 'dateTo') && typeof value === 'string') {
        try {
          // Ensure it's in ISO format
          const date = new Date(value);
          return `${encodeURIComponent(key)}=${encodeURIComponent(date.toISOString())}`;
        } catch (error) {
          console.warn(`Invalid date format for ${key}:`, value);
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        }
      }
      
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    });

  return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
}

export function formatVND(
  amount: number | null | undefined, 
  options: {
    showSymbol?: boolean;
    symbolPosition?: 'before' | 'after';
    decimalPlaces?: number;
    fallback?: string;
  } = {}
): string {
  // Default options
  const {
    showSymbol = true,
    symbolPosition = 'after',
    decimalPlaces = 0,
    fallback = '0 ₫'
  } = options;

  // Handle null, undefined, or NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return fallback;
  }

  // Format the number with Vietnamese locale
  const formatted = amount.toLocaleString('vi-VN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  // Add currency symbol based on position preference
  if (showSymbol) {
    return symbolPosition === 'before' 
      ? `₫ ${formatted}` 
      : `${formatted} ₫`;
  }

  return formatted;
}

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
};