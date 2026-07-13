import {
  createTodoFromForm,
  deleteTodoFromForm,
  getTodos,
  toggleTodoFromForm,
} from "@/action/todo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Todo } from "@/types/todo";

type TodoDemoProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanQuery(value: string | string[] | undefined) {
  const query = firstParam(value)?.trim();
  return query || undefined;
}

export async function TodoDemo({ searchParams }: TodoDemoProps) {
  const params = await searchParams;
  const query = cleanQuery(params.q);
  const result = await getTodos({ query });

  if (!result.success) {
    return (
      <p className="mx-auto mt-6 max-w-3xl text-sm text-muted-foreground">
        {result.error.message}
      </p>
    );
  }

  return (
    <Card className="mx-auto mt-6 max-w-3xl">
      <CardHeader>
        <CardTitle>Todo: Server Component pattern</CardTitle>
        <p className="text-sm text-muted-foreground">
          Data and filtering run on the server. Forms invoke Server Actions
          without a client component or client-side data store.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex gap-2" action="/" method="get">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Filter todos on the server"
          />
          <Button type="submit">Search</Button>
        </form>

        <form className="flex gap-2" action={createTodoFromForm}>
          <Input name="title" placeholder="Add a todo" />
          <Button type="submit">Add</Button>
        </form>

        {result.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No todos found.</p>
        ) : (
          <div className="space-y-2">
            {result.data.map((todo) => (
              <ServerTodoRow key={todo.id} todo={todo} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServerTodoRow({ todo }: { todo: Todo }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <form
        className="min-w-0 flex-1"
        action={toggleTodoFromForm.bind(null, todo.id)}
      >
        <button
          className="flex w-full items-center gap-3 text-left"
          type="submit"
        >
          <span
            aria-hidden
            className={
              todo.completed ? "text-primary" : "text-muted-foreground"
            }
          >
            {todo.completed ? "✓" : "○"}
          </span>
          <span
            className={
              todo.completed ? "text-muted-foreground line-through" : ""
            }
          >
            {todo.title}
          </span>
        </button>
      </form>
      <form action={deleteTodoFromForm.bind(null, todo.id)}>
        <Button variant="ghost" size="sm" type="submit">
          Delete
        </Button>
      </form>
    </div>
  );
}
