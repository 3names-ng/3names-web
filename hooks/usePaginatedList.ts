import { useCallback, useEffect, useRef, useState } from "react";

export interface PaginatedPage<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Backs an infinite-scroll list (viewers/reactions/gifters/likers, etc.).
 * Fetches page 1 fresh whenever `active` flips to true (e.g. a modal opens
 * or a tab becomes selected), and exposes `loadMore` for FlatList's
 * onEndReached. Never caches across an active->inactive->active cycle —
 * these lists change often enough that a fresh fetch on reopen is correct.
 */
export function usePaginatedList<T>(
  active: boolean,
  fetchPage: (cursor: string | null) => Promise<PaginatedPage<T>>,
) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setItems([]);
    setNextCursor(null);
    setLoading(true);
    fetchPageRef
      .current(null)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setNextCursor(res.nextCursor);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore || loading) return;
    setLoadingMore(true);
    fetchPageRef
      .current(nextCursor)
      .then((res) => {
        setItems((prev) => [...prev, ...res.items]);
        setNextCursor(res.nextCursor);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [nextCursor, loadingMore, loading]);

  return { items, loading, loadingMore, loadMore, hasMore: nextCursor !== null };
}
