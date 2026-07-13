"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useTopLoader } from "nextjs-toploader";
import { useCallback, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import type { ActionKey } from "@/constants/action-keys";
import { normalizeActionError } from "@/lib/utils/error";
import {
  actionStatesAtom,
  clearActionErrorAtom,
  getActionState,
  rejectActionAtom,
  resolveActionAtom,
  startActionAtom,
} from "@/stores/action-state-store";
import type { ActionError, ActionResult } from "@/types/action-state";

type UseActionRunnerOptions<TData> = {
  onSuccess?: (data: TData) => void;
  onError?: (error: ActionError) => void;
  toastError?: boolean | ((error: ActionError) => boolean);
  useTopLoader?: boolean;
};

export function useActionRunner<TArgs extends unknown[], TData>(
  key: ActionKey,
  action: (...args: TArgs) => Promise<ActionResult<TData>>,
  options: UseActionRunnerOptions<TData> = {},
) {
  const actionStates = useAtomValue(actionStatesAtom);
  const startAction = useSetAtom(startActionAtom);
  const resolveAction = useSetAtom(resolveActionAtom);
  const rejectAction = useSetAtom(rejectActionAtom);
  const clearActionError = useSetAtom(clearActionErrorAtom);
  const topLoader = useTopLoader();
  const requestIdRef = useRef(0);
  const [isTransitionPending, startTransition] = useTransition();
  const state = getActionState(actionStates, key);

  const clearError = useCallback(() => {
    startTransition(() => clearActionError(key));
  }, [clearActionError, key]);

  useEffect(() => () => clearActionError(key), [clearActionError, key]);

  const run = useCallback(
    async (...args: TArgs): Promise<ActionResult<TData>> => {
      const requestId = ++requestIdRef.current;
      if (options.useTopLoader !== false) topLoader.start();
      startTransition(() => startAction({ key, requestId }));

      try {
        const result = await action(...args);
        if (!result.success) {
          const error = normalizeActionError(result.error);
          startTransition(() => rejectAction({ key, requestId, error }));
          options.onError?.(error);
          if (options.toastError !== false) toast.error(error.message);
          return { success: false, error };
        }
        startTransition(() => resolveAction({ key, requestId }));
        options.onSuccess?.(result.data);
        return result;
      } catch (error) {
        const normalizedError = normalizeActionError(error);
        startTransition(() =>
          rejectAction({ key, requestId, error: normalizedError }),
        );
        options.onError?.(normalizedError);
        if (options.toastError !== false) toast.error(normalizedError.message);
        return { success: false, error: normalizedError };
      } finally {
        if (options.useTopLoader !== false) topLoader.done();
      }
    },
    [action, key, options, rejectAction, resolveAction, startAction, topLoader],
  );

  return {
    run,
    pending: state.pending,
    isTransitionPending,
    error: state.error,
    fields: state.error?.fields ?? {},
    clearError,
  };
}
