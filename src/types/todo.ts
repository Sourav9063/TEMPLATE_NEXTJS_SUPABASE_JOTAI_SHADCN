import { z } from "zod";

export const CreateTodoSchema = z.object({
  title: z.string().trim().min(1, "Todo title is required.").max(200),
});

export const TodoIdSchema = z.coerce.number().int().positive();

export const TodoFiltersSchema = z.object({
  query: z.string().trim().max(100).optional(),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type TodoFilters = z.infer<typeof TodoFiltersSchema>;

export type Todo = {
  id: number;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
};
