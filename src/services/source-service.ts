import { apiRequest } from '@/lib/api-client';
import type { Source } from '@/types/api';

export function listSources(): Promise<Source[]> {
  return apiRequest<Source[]>('/sources');
}

export function indexSource(url: string): Promise<Source> {
  return apiRequest<Source>('/sources', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export function deleteSource(id: string): Promise<void> {
  return apiRequest<void>(`/sources/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
