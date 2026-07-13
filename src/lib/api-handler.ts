import { NextResponse } from "next/server";
import type { AuthenticatedUser } from "@/lib/create-action";
import { normalizeActionError } from "@/lib/utils/error";
import { getUser } from "@/lib/utils/server/get-user";

type ApiHandler = (
  request: Request,
  body: unknown,
  user: AuthenticatedUser,
) => Promise<NextResponse>;

type ApiHandlerOptions = {
  parseJson?: boolean;
};

export function withApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {},
) {
  return async (request: Request) => {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized", statusCode: 401 } },
        { status: 401 },
      );
    }

    let body: unknown = null;
    if (
      options.parseJson !== false &&
      ["POST", "PUT", "PATCH"].includes(request.method)
    ) {
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { success: false, error: { message: "Invalid JSON payload" } },
          { status: 400 },
        );
      }
    }

    try {
      return await handler(request, body, user);
    } catch (error: unknown) {
      const normalized = normalizeActionError(error);
      return NextResponse.json(
        { success: false, error: normalized },
        { status: normalized.statusCode ?? 500 },
      );
    }
  };
}
