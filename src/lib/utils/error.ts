import type { ActionError } from "@/types/action-state";

const isServer = () => typeof window === "undefined";

const STATUS_CODES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

// A lightweight custom error class
export class AppError extends Error {
  public code?: string;
  public field?: string;
  public fields?: Record<string, string[]>;
  public details?: unknown;
  public source?: ActionError["source"];
  public requestId?: string;

  constructor(
    public statusCode: number,
    message?: string,
    options: Omit<ActionError, "message" | "statusCode"> = {},
  ) {
    // If no message is provided, it falls back to the standard text (e.g., "Conflict" for 409)
    super(message || STATUS_CODES[statusCode] || "Unknown Error");
    this.name = "AppError";
    this.code = options.code;
    this.field = options.field;
    this.fields = options.fields;
    this.details = options.details;
    this.source = options.source ?? "app";
    this.requestId = options.requestId;
  }
}

export function normalizeActionError(error: unknown): ActionError {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      field: error.field,
      fields:
        error.fields ??
        (error.field ? { [error.field]: [error.message] } : undefined),
      details: error.details,
      source: error.source ?? "app",
      requestId: error.requestId,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, source: "unknown" };
  }

  if (typeof error === "string") {
    return { message: error, source: "unknown" };
  }

  return { message: "Unknown error", source: "unknown" };
}

export async function handleError<T>(
  fn: Promise<T> | (() => Promise<T>),
): Promise<
  { success: true; data: T } | { success: false; error: ActionError }
> {
  try {
    const result = typeof fn === "function" ? await fn() : await fn;
    return { success: true, data: result };
  } catch (error) {
    console.log(error);
    if (!isServer()) {
      return { success: false, error: normalizeActionError(error) };
    }
    if (error instanceof Error) {
      try {
        // External API errors from apiRequest are JSON-stringified: { status, statusText, payload }
        const parsed = JSON.parse(error.message) as {
          status?: number;
          statusText?: string;
          payload?: unknown;
        };
        const message =
          (typeof parsed.payload === "object" &&
          parsed.payload !== null &&
          "message" in parsed.payload &&
          typeof (parsed.payload as { message?: unknown }).message === "string"
            ? (parsed.payload as { message: string }).message
            : null) ??
          parsed.statusText ??
          "Unknown error";
        return { success: false, error: normalizeActionError(message) };
      } catch {
        return { success: false, error: normalizeActionError(error) };
      }
    }
    return { success: false, error: normalizeActionError(error) };
  }
}
