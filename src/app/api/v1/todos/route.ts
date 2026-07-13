import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { TodoService } from "@/services/todo";

export const GET = withApiHandler(async (_request, _body, user) => {
  return NextResponse.json(await TodoService.listTodos(user.id));
});

export const POST = withApiHandler(async (_request, body, user) => {
  return NextResponse.json(await TodoService.createTodo(user.id, body), {
    status: 201,
  });
});
