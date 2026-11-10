'use client';

import { useCallback, useEffect, useState } from 'react';
import { deleteSource as removeSource, indexSource, listSources } from '@/services/source-service';
import type { Source } from '@/types/api';

export function useSources(isAuthenticated: boolean) {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSources([]);
      setApiOnline(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    listSources()
      .then((items) => { if (!cancelled) { setSources(items); setApiOnline(true); setError(''); } })
      .catch((reason) => { if (!cancelled) { setApiOnline(false); setError(reason instanceof Error ? reason.message : 'Could not load sources.'); } })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const add = useCallback(async (url: string) => {
    setError('');
    if (sources.length >= 4) throw new Error('You can add up to 4 research sources.');
    setIsIndexing(true);
    try {
      const added = await indexSource(url);
      setSources((current) => [added, ...current.filter((source) => source.id !== added.id)].slice(0, 4));
      setApiOnline(true);
      setError('');
      return added;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not index this URL.';
      setError(message);
      throw reason;
    } finally { setIsIndexing(false); }
  }, [sources.length]);

  const remove = useCallback(async (source: Source) => {
    setError('');
    setDeletingId(source.id);
    try {
      await removeSource(source.id);
      setSources((current) => current.filter((item) => item.id !== source.id));
      setApiOnline(true);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not delete this source.';
      setError(message);
      throw reason;
    } finally { setDeletingId(null); }
  }, []);

  return { sources, isLoading, isIndexing, deletingId, error, apiOnline, add, remove };
}
