"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/create-action";
import { TodoService } from "@/services/todo";

export const getTodos = createAction.user(async (user, filters: unknown = {}) =>
  TodoService.listTodos(user.id, filters),
);

export const createTodo = createAction.user(async (user, input: unknown) => {
  const todo = await TodoService.createTodo(user.id, input);
  revalidatePath("/");
  return todo;
});

export const toggleTodo = createAction.user(async (user, id: unknown) => {
  const todo = await TodoService.toggleTodo(user.id, id);
  revalidatePath("/");
  return todo;
});

export const deleteTodo = createAction.user(async (user, id: unknown) => {
  await TodoService.deleteTodo(user.id, id);
  revalidatePath("/");
});

export async function createTodoFromForm(formData: FormData): Promise<void> {
  await createTodo(formData);
}

export async function toggleTodoFromForm(
  id: number,
  _formData: FormData,
): Promise<void> {
  await toggleTodo(id);
}

export async function deleteTodoFromForm(
  id: number,
  _formData: FormData,
): Promise<void> {
  await deleteTodo(id);
}
