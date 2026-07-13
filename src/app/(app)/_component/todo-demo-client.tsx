"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Suspense, useEffect, useRef, useState } from "react";
import { createTodo, deleteTodo, toggleTodo } from "@/action/todo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { actionKeys } from "@/constants/action-keys";
import { useActionRunner } from "@/hooks/use-action-runner";
import { useQueryState } from "@/hooks/use-query-state";
import {
  todoQueryAtom,
  todoStatsAtom,
  todosAtom,
  updateTodosAtom,
  visibleTodosAtom,
} from "@/stores/todo-store";
import type { Todo } from "@/types/todo";

export function TodoDemoClient() {
  return (
    <Card className="mx-auto mt-6 max-w-3xl">
      <CardHeader>
        <CardTitle>Todo: Client async Jotai pattern</CardTitle>
        <p className="text-sm text-muted-foreground">
          Data loads from the todos API route. Jotai suspends while the request
          is pending and applies optimistic updates after mutations.
        </p>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Loading todos…</p>
          }
        >
          <ClientTodoContent />
        </Suspense>
      </CardContent>
    </Card>
  );
}

function ClientTodoContent() {
  const todos = useAtomValue(todosAtom);
  const visibleTodos = useAtomValue(visibleTodosAtom);
  const stats = useAtomValue(todoStatsAtom);
  const updateTodos = useSetAtom(updateTodosAtom);
  const [query, setQueryParam] = useQueryState<string>("client_q", "", {
    shallow: true,
  });
  const setTodoQuery = useSetAtom(todoQueryAtom);
  const [title, setTitle] = useState("");
  const temporaryId = useRef(-1);
  const createTodoRunner = useActionRunner(actionKeys.todoCreate, createTodo);

  useEffect(() => {
    setTodoQuery(query);
  }, [query, setTodoQuery]);

  function submitTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const optimisticTodo: Todo = {
      id: temporaryId.current--,
      user_id: "",
      title,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    updateTodos((todos) => [optimisticTodo, ...todos]);
    setTitle("");

    void createTodoRunner.run({ title }).then((result) => {
      updateTodos((todos) => {
        if (!result.success) {
          return todos.filter((todo) => todo.id !== optimisticTodo.id);
        }

        return todos.map((todo) =>
          todo.id === optimisticTodo.id ? result.data : todo,
        );
      });
    });
  }

  return (
    <div className="space-y-4">
      <form className="flex gap-2" onSubmit={submitTodo}>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a todo"
          aria-invalid={Boolean(createTodoRunner.fields.title)}
        />
        <Button disabled={createTodoRunner.pending} type="submit">
          {createTodoRunner.pending ? "Adding…" : "Add"}
        </Button>
      </form>
      {createTodoRunner.fields.title?.map((error) => (
        <p className="text-sm text-destructive" key={error}>
          {error}
        </p>
      ))}
      <Input
        value={query}
        onChange={(event) => setQueryParam(event.target.value)}
        placeholder="Filter loaded todos"
      />
      <p className="text-sm text-muted-foreground">
        {stats.completed} of {stats.total} shown complete ·{" "}
        {visibleTodos.length} shown
      </p>
      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No todos yet.</p>
      ) : (
        <div className="space-y-2">
          {visibleTodos.map((todo) => (
            <ClientTodoRow key={todo.id} todo={todo} />
          ))}
        </div>
      )}
      {createTodoRunner.error && !createTodoRunner.fields.title ? (
        <p className="text-sm text-destructive">
          {createTodoRunner.error.message}
        </p>
      ) : null}
    </div>
  );
}

function ClientTodoRow({ todo }: { todo: Todo }) {
  const updateTodos = useSetAtom(updateTodosAtom);
  const toggleTodoRunner = useActionRunner(
    actionKeys.todoToggle(todo.id),
    toggleTodo,
  );
  const deleteTodoRunner = useActionRunner(
    actionKeys.todoDelete(todo.id),
    deleteTodo,
  );
  const pending = toggleTodoRunner.pending || deleteTodoRunner.pending;

  function toggle() {
    updateTodos((todos) =>
      todos.map((item) =>
        item.id === todo.id ? { ...item, completed: !item.completed } : item,
      ),
    );

    void toggleTodoRunner.run(todo.id).then((result) => {
      updateTodos((todos) =>
        todos.map((item) => {
          if (item.id !== todo.id) return item;
          return result.success ? result.data : todo;
        }),
      );
    });
  }

  function remove() {
    let removedIndex = -1;
    updateTodos((todos) => {
      removedIndex = todos.findIndex((item) => item.id === todo.id);
      return todos.filter((item) => item.id !== todo.id);
    });

    void deleteTodoRunner.run(todo.id).then((result) => {
      if (result.success) return;

      updateTodos((todos) => {
        if (todos.some((item) => item.id === todo.id)) return todos;
        const index = removedIndex < 0 ? todos.length : removedIndex;
        return [...todos.slice(0, index), todo, ...todos.slice(index)];
      });
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={toggle}
        type="button"
        disabled={pending}
      >
        <span
          aria-hidden
          className={todo.completed ? "text-primary" : "text-muted-foreground"}
        >
          {todo.completed ? "✓" : "○"}
        </span>
        <span
          className={todo.completed ? "text-muted-foreground line-through" : ""}
        >
          {todo.title}
        </span>
      </button>
      <Button variant="ghost" size="sm" onClick={remove} disabled={pending}>
        Delete
      </Button>
      {toggleTodoRunner.error ? (
        <span className="text-xs text-destructive">
          {toggleTodoRunner.error.message}
        </span>
      ) : null}
    </div>
  );
}
