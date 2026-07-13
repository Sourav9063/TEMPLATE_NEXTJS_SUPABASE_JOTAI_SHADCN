import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { TodoService } from "@/services/todo";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withApiHandler(async (_request, _body, user) => {
    const { id } = await context.params;
    const todo = await TodoService.toggleTodo(user.id, id);
    revalidatePath("/");
    return NextResponse.json(todo);
  })(request);
}

export async function DELETE(request: Request, context: RouteContext) {
  return withApiHandler(async (_request, _body, user) => {
    const { id } = await context.params;
    await TodoService.deleteTodo(user.id, id);
    revalidatePath("/");
    return new NextResponse(null, { status: 204 });
  })(request);
}
