export type ActionError = {
  message: string;
  statusCode?: number;
  code?: string;
  field?: string;
  fields?: Record<string, string[]>;
  details?: unknown;
  source?: "app" | "api" | "network" | "unknown";
  requestId?: string;
};

export type ActionResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: ActionError };
