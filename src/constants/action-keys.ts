export const actionKeys = {
  todoCreate: "todo.create",
  todoToggle: (todoId: number) => `todo.${todoId}.toggle` as const,
  todoDelete: (todoId: number) => `todo.${todoId}.delete` as const,
} as const;

type ActionKeyValue<T> = T extends (...args: never[]) => infer TReturn
  ? TReturn
  : T;

export type ActionKey = ActionKeyValue<
  (typeof actionKeys)[keyof typeof actionKeys]
>;
