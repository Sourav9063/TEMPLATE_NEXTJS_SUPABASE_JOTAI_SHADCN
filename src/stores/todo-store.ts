"use client";

import { atom } from "jotai";
import { atomWithDefault, atomWithRefresh } from "jotai/utils";
import type { Todo } from "@/types/todo";

const fetchedTodosAtom = atomWithRefresh(async (): Promise<Todo[]> => {
  const response = await fetch("/api/v1/todos");

  if (!response.ok) {
    throw new Error("Unable to load todos.");
  }

  return response.json();
});

export const todosAtom = atomWithDefault<Todo[] | Promise<Todo[]>>((get) =>
  get(fetchedTodosAtom),
);
todosAtom.debugLabel = "todosAtom";

type TodosUpdater = (todos: Todo[]) => Todo[];

export const updateTodosAtom = atom(null, (_get, set, update: TodosUpdater) => {
  set(todosAtom, (todos) =>
    todos instanceof Promise ? todos.then(update) : update(todos),
  );
});
updateTodosAtom.debugLabel = "updateTodosAtom";

export const todoQueryAtom = atom("");
todoQueryAtom.debugLabel = "todoQueryAtom";

export const visibleTodosAtom = atom(async (get) => {
  const todos = await get(todosAtom);
  const query = get(todoQueryAtom).trim().toLowerCase();

  return todos.filter((todo) => todo.title.toLowerCase().includes(query));
});
visibleTodosAtom.debugLabel = "visibleTodosAtom";

export const todoStatsAtom = atom(async (get) => {
  const todos = await get(visibleTodosAtom);

  return {
    total: todos.length,
    completed: todos.filter((todo) => todo.completed).length,
  };
});
todoStatsAtom.debugLabel = "todoStatsAtom";
