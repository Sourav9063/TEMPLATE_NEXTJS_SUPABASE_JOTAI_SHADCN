import { AppError } from "@/lib/utils/error";
import { TodoRepository } from "@/repository/todo";
import type { Todo } from "@/types/todo";
import {
  CreateTodoSchema,
  TodoFiltersSchema,
  TodoIdSchema,
} from "@/types/todo";

function parseTodoId(input: unknown): number {
  const parsed = TodoIdSchema.safeParse(input);
  if (!parsed.success) throw new AppError(400, "Invalid todo id.");
  return parsed.data;
}

export const TodoService = {
  async listTodos(user_id: string, input: unknown = {}): Promise<Todo[]> {
    const parsed = TodoFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(400, "Invalid todo filters.");
    }
    return TodoRepository.findMany(user_id, parsed.data.query ?? "");
  },

  async createTodo(user_id: string, input: unknown): Promise<Todo> {
    const rawInput =
      input instanceof FormData
        ? { title: input.get("title") }
        : typeof input === "string"
          ? { title: input }
          : input;
    const parsed = CreateTodoSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AppError(400, "Invalid todo data.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    return TodoRepository.create(user_id, parsed.data);
  },

  async toggleTodo(user_id: string, input: unknown): Promise<Todo> {
    const id = parseTodoId(input);
    const todo = await TodoRepository.toggle(user_id, id);
    if (!todo) throw new AppError(404, "Todo not found.");
    return todo;
  },

  async deleteTodo(user_id: string, input: unknown): Promise<void> {
    const id = parseTodoId(input);
    const deleted = await TodoRepository.remove(user_id, id);
    if (!deleted) throw new AppError(404, "Todo not found.");
  },
};
