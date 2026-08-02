import type { ActionError, ErrorFields } from "@/types/action-state";

const STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  408: "Request Timeout",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

type ErrorPayload = {
  status?: unknown;
  statusCode?: unknown;
  statusText?: unknown;
  payload?: unknown;
};

const isServer = () => typeof window === "undefined";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (
  record: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }

  return undefined;
};

const getNumber = (
  record: Record<string, unknown>,
  keys: string[],
): number | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isInteger(parsed)) return parsed;
    }
  }

  return undefined;
};

const normalizeFields = (input: unknown): ErrorFields | undefined => {
  if (Array.isArray(input)) {
    const fields: ErrorFields = {};

    for (const item of input) {
      if (!isRecord(item)) continue;

      const field =
        getString(item, ["field", "path", "name", "param"]) ??
        (Array.isArray(item.path)
          ? item.path
              .filter((part): part is string => typeof part === "string")
              .join(".")
          : undefined);
      const message = getString(item, ["message", "error", "msg"]);

      if (field && message) {
        fields[field] = [...(fields[field] ?? []), message];
      }
    }

    return Object.keys(fields).length > 0 ? fields : undefined;
  }

  if (!isRecord(input)) return undefined;

  const fields: ErrorFields = {};
  const walk = (record: Record<string, unknown>, path: string[]): void => {
    for (const [key, value] of Object.entries(record)) {
      const nextPath = [...path, key];
      if (typeof value === "string") {
        fields[nextPath.join(".")] = [value];
      } else if (Array.isArray(value)) {
        const messages = value.filter(
          (message): message is string => typeof message === "string",
        );
        if (messages.length > 0) fields[nextPath.join(".")] = messages;
      } else if (isRecord(value)) {
        walk(value, nextPath);
      }
    }
  };
  walk(input, []);

  return Object.keys(fields).length > 0 ? fields : undefined;
};

const getFields = (record: Record<string, unknown>) =>
  normalizeFields(record.fields) ??
  normalizeFields(record.fieldErrors) ??
  normalizeFields(record.field_errors) ??
  normalizeFields(record.errors);

const parseJsonMessage = (message: string): ErrorPayload | null => {
  try {
    const parsed: unknown = JSON.parse(message);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const fromRecord = (record: Record<string, unknown>): ActionError => {
  const payloadRecord = isRecord(record.payload) ? record.payload : undefined;
  const nestedError = isRecord(record.error)
    ? record.error
    : payloadRecord && isRecord(payloadRecord.error)
      ? payloadRecord.error
      : undefined;
  const payload = nestedError ?? payloadRecord ?? record;
  const payloadText =
    typeof record.payload === "string" && record.payload.trim().length > 0
      ? record.payload
      : undefined;
  const statusCode =
    getNumber(record, ["statusCode", "status"]) ??
    getNumber(payload, ["statusCode", "status"]);
  const statusText =
    getString(record, ["statusText"]) ?? getString(payload, ["statusText"]);
  const message =
    getString(payload, ["message", "error"]) ??
    getString(record, ["message", "error"]) ??
    payloadText ??
    statusText ??
    (statusCode ? STATUS_TEXT[statusCode] : undefined) ??
    "Unknown error";
  const field = getString(payload, ["field", "cause"]);
  const fields = getFields(payload);

  return {
    message,
    statusCode,
    code: getString(payload, ["code", "errorCode", "error_code"]),
    field,
    fields: fields ?? (field ? { [field]: [message] } : undefined),
    details: payload.details ?? payload.errors,
    source: statusCode ? "api" : "unknown",
    requestId: getString(payload, ["requestId", "request_id", "traceId"]),
  };
};

export class AppError extends Error {
  public code?: string;
  public field?: string;
  public fields?: ErrorFields;
  public details?: unknown;
  public source?: ActionError["source"];
  public requestId?: string;

  constructor(
    public statusCode: number,
    message?: string,
    options: Omit<ActionError, "message" | "statusCode"> = {},
  ) {
    super(message || STATUS_TEXT[statusCode] || "Unknown Error");
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
    const parsed = parseJsonMessage(error.message);
    if (parsed) return fromRecord(parsed);
    return { message: error.message, source: "unknown" };
  }

  if (typeof error === "string") {
    return { message: error, source: "unknown" };
  }

  if (isRecord(error)) return fromRecord(error);

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
    const normalizedError = normalizeActionError(error);
    if (isServer()) console.error(normalizedError);
    return { success: false, error: normalizedError };
  }
}
