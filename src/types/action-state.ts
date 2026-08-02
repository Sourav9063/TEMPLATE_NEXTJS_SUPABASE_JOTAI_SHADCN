export type ErrorFields = Record<string, string[]>;

export type ActionErrorSource = "app" | "api" | "network" | "unknown";

export type ActionError = {
  message: string;
  statusCode?: number;
  code?: string;
  field?: string;
  fields?: ErrorFields;
  details?: unknown;
  source?: ActionErrorSource;
  requestId?: string;
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };
