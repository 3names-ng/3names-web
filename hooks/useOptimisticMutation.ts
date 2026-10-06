import { useCallback, useRef, useState } from "react";
import { showError, showSuccess } from "@/components/ui/toast";
import { bumpSync } from "@/store/syncStore";

/**
 * Generates a temporary id for an entity that doesn't exist on the server yet.
 * Pair it with a `pending`/`optimistic` flag on the local object so the UI can
 * tell the two apart until the real server entity replaces it.
 */
export function createOptimisticId(prefix = "temp"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface OptimisticMutationOptions<TResult, TVars = void> {
  /**
   * Apply the change to local state right away — before the request is sent.
   * This is what makes the save "instant": the caller can navigate away or
   * close the editor immediately after calling `run(vars)`.
   */
  apply: (vars: TVars) => void;
  /** Undo `apply` when the server rejects the change. */
  rollback: (vars: TVars) => void;
  /** The background network call. */
  request: (vars: TVars) => Promise<TResult>;
  /**
   * Reconcile local state with the server's authoritative result (e.g. swap
   * the optimistic/temp entity for the real one).
   */
  onSuccess?: (result: TResult, vars: TVars) => void;
  /**
   * Called after `rollback` on failure. When provided it replaces the default
   * error toast, so it can show a more specific message.
   */
  onError?: (error: unknown, vars: TVars) => void;
  /** Toast shown when the request succeeds. Omit for a silent sync. */
  successMessage?: string;
  /** Toast shown when the request fails and no `onError` is given. */
  errorMessage?: string;
  /**
   * Sync keys to invalidate once the request settles. Screens the user
   * navigates to (which may fetch before the write lands) subscribe via
   * useSyncSignal and refetch. Bumped on both success and failure, since a
   * rollback also changes what the server has.
   */
  invalidateKeys?: string[];
}

/**
 * Runs a write optimistically: the caller's `apply` mutates local state
 * immediately, the request happens in the background, and the result is
 * reconciled on success or rolled back on failure.
 *
 * `run()` returns the underlying promise (useful for awaits/tests) but callers
 * normally fire-and-forget it so navigation isn't blocked on the network.
 *
 * @example
 * const save = useOptimisticMutation({
 *   apply: () => upsertCachedNote(optimisticNote),
 *   rollback: () => removeCachedNote(optimisticNote.id),
 *   request: () => notesService.createNote(payload),
 *   onSuccess: (serverNote) => upsertCachedNote(serverNote),
 *   successMessage: t("notes.saved"),
 * });
 *
 * save.run();
 * closeEditor();
 */
export function useOptimisticMutation<TResult, TVars = void>(
  options: OptimisticMutationOptions<TResult, TVars>,
) {
  // Keep the latest options in a ref so the returned `run` is stable and never
  // captures stale closures over screen state.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [pendingCount, setPendingCount] = useState(0);

  const run = useCallback((vars: TVars): Promise<void> => {
    const {
      apply,
      rollback,
      request,
      onSuccess,
      onError,
      successMessage,
      errorMessage,
      invalidateKeys,
    } = optionsRef.current;

    // Synchronous: the UI updates the instant the user taps save.
    apply(vars);
    setPendingCount((n) => n + 1);

    return (async () => {
      try {
        const result = await request(vars);
        onSuccess?.(result, vars);
        if (successMessage) showSuccess(successMessage);
      } catch (error) {
        rollback(vars);
        if (onError) {
          onError(error, vars);
        } else {
          showError(errorMessage ?? "Something went wrong. Please try again.");
        }
      } finally {
        invalidateKeys?.forEach(bumpSync);
        setPendingCount((n) => n - 1);
      }
    })();
  }, []);

  return { run, isPending: pendingCount > 0 };
}
