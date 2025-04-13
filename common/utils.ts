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