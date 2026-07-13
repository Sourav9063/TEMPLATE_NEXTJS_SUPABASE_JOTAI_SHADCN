import { handleDbError, query } from "@/lib/db";
import type { CreateTodoInput, Todo } from "@/types/todo";

const TODO_COLUMNS = `
  id, user_id, title, completed, created_at, updated_at
`;

export const TodoRepository = {
  async findMany(
    user_id: string,
    queryText = "",
    limit = 100,
  ): Promise<Todo[]> {
    try {
      const result = await query<Todo>(
        `
          SELECT ${TODO_COLUMNS}
          FROM todos
          WHERE user_id = $1
            AND ($2 = '' OR title ILIKE '%' || $2 || '%')
          ORDER BY created_at DESC, id DESC
          LIMIT $3;
        `,
        [user_id, queryText, limit],
      );
      return result.rows;
    } catch (error: unknown) {
      return handleDbError(error);
    }
  },

  async create(user_id: string, input: CreateTodoInput): Promise<Todo> {
    try {
      const result = await query<Todo>(
        `
          INSERT INTO todos (user_id, title)
          VALUES ($1, $2)
          RETURNING ${TODO_COLUMNS};
        `,
        [user_id, input.title],
      );
      return result.rows[0];
    } catch (error: unknown) {
      return handleDbError(error);
    }
  },

  async toggle(user_id: string, id: number): Promise<Todo | null> {
    try {
      const result = await query<Todo>(
        `
          UPDATE todos
          SET completed = NOT completed, updated_at = now()
          WHERE id = $1 AND user_id = $2
          RETURNING ${TODO_COLUMNS};
        `,
        [id, user_id],
      );
      return result.rows[0] ?? null;
    } catch (error: unknown) {
      return handleDbError(error);
    }
  },

  async remove(user_id: string, id: number): Promise<boolean> {
    try {
      const result = await query(
        "DELETE FROM todos WHERE id = $1 AND user_id = $2",
        [id, user_id],
      );
      return result.rowCount === 1;
    } catch (error: unknown) {
      return handleDbError(error);
    }
  },
};
