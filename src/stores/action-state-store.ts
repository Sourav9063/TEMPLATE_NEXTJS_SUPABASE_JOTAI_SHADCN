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

export function getActionState(
  states: Partial<Record<ActionKey, ActionState>>,
  key: ActionKey,
) {
  return states[key] ?? emptyActionState;
}

export const startActionAtom = atom(
  null,
  (get, set, input: { key: ActionKey; requestId: number }) => {
    const states = get(actionStatesAtom);
    const previous = getActionState(states, input.key);
    set(actionStatesAtom, {
      ...states,
      [input.key]: {
        ...previous,
        pending: true,
        error: null,
        requestId: input.requestId,
        startedAt: Date.now(),
        finishedAt: null,
      },
    });
  },
);

export const resolveActionAtom = atom(
  null,
  (get, set, input: { key: ActionKey; requestId: number }) => {
    const states = get(actionStatesAtom);
    const previous = getActionState(states, input.key);
    if (previous.requestId !== input.requestId) return;
    set(actionStatesAtom, {
      ...states,
      [input.key]: {
        ...previous,
        pending: false,
        error: null,
        finishedAt: Date.now(),
      },
    });
  },
);

export const rejectActionAtom = atom(
  null,
  (
    get,
    set,
    input: { key: ActionKey; requestId: number; error: ActionError },
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
        finishedAt: Date.now(),
      },
    });
  },
);

export const clearActionErrorAtom = atom(null, (get, set, key: ActionKey) => {
  const states = get(actionStatesAtom);
  const previous = getActionState(states, key);
  set(actionStatesAtom, { ...states, [key]: { ...previous, error: null } });
});
