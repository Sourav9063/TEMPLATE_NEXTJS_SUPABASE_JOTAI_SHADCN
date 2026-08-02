"use client";

import { atom } from "jotai";
import type { ActionKey } from "@/constants/action-keys";
import type { ActionError } from "@/types/action-state";

export type ActionState = {
  pending: boolean;
  error: ActionError | null;
  requestId: number;
  startedAt: number | null;
  finishedAt: number | null;
};

export const emptyActionState: ActionState = {
  pending: false,
  error: null,
  requestId: 0,
  startedAt: null,
  finishedAt: null,
};

export const actionStatesAtom = atom<Partial<Record<ActionKey, ActionState>>>(
  {},
);
actionStatesAtom.debugLabel = "actionStatesAtom";

export const getActionState = (
  states: Partial<Record<ActionKey, ActionState>>,
  key: ActionKey,
) => states[key] ?? emptyActionState;

export const startActionAtom = atom(
  null,
  (get, set, input: { key: ActionKey; requestId: number; now?: number }) => {
    const previous = getActionState(get(actionStatesAtom), input.key);
    set(actionStatesAtom, {
      ...get(actionStatesAtom),
      [input.key]: {
        ...previous,
        pending: true,
        error: null,
        requestId: input.requestId,
        startedAt: input.now ?? Date.now(),
        finishedAt: null,
      },
    });
  },
);
startActionAtom.debugLabel = "startActionAtom";

export const resolveActionAtom = atom(
  null,
  (get, set, input: { key: ActionKey; requestId: number; now?: number }) => {
    const states = get(actionStatesAtom);
    const previous = getActionState(states, input.key);
    if (previous.requestId !== input.requestId) return;

    set(actionStatesAtom, {
      ...states,
      [input.key]: {
        ...previous,
        pending: false,
        error: null,
        finishedAt: input.now ?? Date.now(),
      },
    });
  },
);
resolveActionAtom.debugLabel = "resolveActionAtom";

export const rejectActionAtom = atom(
  null,
  (
    get,
    set,
    input: {
      key: ActionKey;
      requestId: number;
      error: ActionError;
      now?: number;
    },
  ) => {
    const states = get(actionStatesAtom);
    const previous = getActionState(states, input.key);
    if (previous.requestId !== input.requestId) return;

    set(actionStatesAtom, {
      ...states,
      [input.key]: {
        ...previous,
        pending: false,
        error: input.error,
        finishedAt: input.now ?? Date.now(),
      },
    });
  },
);
rejectActionAtom.debugLabel = "rejectActionAtom";

export const clearActionErrorAtom = atom(null, (get, set, key: ActionKey) => {
  const states = get(actionStatesAtom);
  const previous = getActionState(states, key);

  set(actionStatesAtom, { ...states, [key]: { ...previous, error: null } });
});

clearActionErrorAtom.debugLabel = "clearActionErrorAtom";

export const clearActionScopeAtom = atom(null, (get, set, prefix: string) => {
  const nextStates = { ...get(actionStatesAtom) };

  for (const key of Object.keys(nextStates) as ActionKey[]) {
    if (key.startsWith(prefix)) {
      delete nextStates[key];
    }
  }

  set(actionStatesAtom, nextStates);
});

clearActionScopeAtom.debugLabel = "clearActionScopeAtom";
