import { apiRequest } from '@/lib/api-client';
import type { Citation } from '@/types/api';

type AskResponse = { answer: string; sources: Citation[] };

export function askQuestion(question: string): Promise<AskResponse> {
  return apiRequest<AskResponse>('/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}
