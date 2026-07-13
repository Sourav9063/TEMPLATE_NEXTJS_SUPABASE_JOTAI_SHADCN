import { config } from "@/config";
import { GLOBAL_CACHE_TAG } from "@/constants/cache";
import { AppError } from "@/lib/utils/error";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type RequestBody = Record<string, unknown> | FormData | string | null;

export interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: RequestBody;
}

type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions extends FetchOptions {
  query?: Record<string, QueryValue>;
}

export interface ApiRequestDefaults
  extends Omit<ApiRequestOptions, "body" | "method"> {
  baseUrl?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getMessages = (value: unknown): string[] | undefined => {
  if (
    !Array.isArray(value) ||
    value.some((message) => typeof message !== "string")
  ) {
    return undefined;
  }

  return value as string[];
};

const getFields = (value: unknown): Record<string, string[]> | undefined => {
  if (!isRecord(value)) return undefined;

  const fields: Record<string, string[]> = {};
  for (const [field, fieldValue] of Object.entries(value)) {
    const messages = getMessages(fieldValue);
    if (!messages) return undefined;
    fields[field] = messages;
  }

  return fields;
};

const getError = (payload: unknown, response: Response): AppError => {
  const error =
    isRecord(payload) && isRecord(payload.error) ? payload.error : payload;
  const details = isRecord(error) ? error : {};
  const statusCode =
    typeof details.statusCode === "number"
      ? details.statusCode
      : response.status;
  const message =
    typeof details.message === "string" ? details.message : response.statusText;

  return new AppError(statusCode, message, {
    code: typeof details.code === "string" ? details.code : undefined,
    field: typeof details.field === "string" ? details.field : undefined,
    fields: getFields(details.fields),
    details: details.details,
    source: "api",
    requestId:
      typeof details.requestId === "string" ? details.requestId : undefined,
  });
};

const prepareHeaders = (headersInit?: HeadersInit): Headers => {
  const headers = new Headers(headersInit);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return headers;
};

const prepareBody = (
  body: RequestBody | undefined,
  headers: Headers,
): BodyInit | null | undefined => {
  if (body === null || body === undefined) return body;

  if (body instanceof FormData) return body;

  if (typeof body === "object") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return JSON.stringify(body);
  }

  return body;
};

const getNextConfig = (
  method: string,
  url: string,
  customNext: NextFetchRequestConfig = {},
): NextFetchRequestConfig => {
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
    method.toUpperCase(),
  );
  const requestUrl = new URL(url, config.APP_URL);
  const defaultNextConfig = isMutation
    ? { revalidate: 0 }
    : {
        revalidate: 5 * 60,
        tags: [GLOBAL_CACHE_TAG, `${requestUrl.pathname}${requestUrl.search}`],
      };

  return { ...defaultNextConfig, ...customNext };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let payload: unknown = response.statusText;

    try {
      payload = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : await response.text();
    } catch {
      // Keep the response status text when an error body cannot be read.
    }

    throw getError(payload, response);
  }

  if (response.status === 204) return null as T;

  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : ((await response.text()) as T);
};

export const fetcher = async <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> => {
  const {
    body,
    headers: headersInit,
    method = "GET",
    next,
    ...restOptions
  } = options;
  const headers = prepareHeaders(headersInit);

  const response = await fetch(url, {
    method,
    headers,
    body: prepareBody(body, headers),
    next: getNextConfig(method, url, next),
    ...restOptions,
  });

  return handleResponse<T>(response);
};

export const createApiRequest = ({
  baseUrl,
  headers: defaultHeaders,
  next: defaultNext,
  query: defaultQuery,
  ...defaultOptions
}: ApiRequestDefaults = {}) => {
  const resolveUrl = (
    url: string,
    requestQuery?: Record<string, QueryValue>,
  ) => {
    const query = { ...defaultQuery, ...requestQuery };
    const hasQuery = Object.values(query).some(
      (value) => value !== null && value !== undefined,
    );

    if (!baseUrl && !hasQuery) return url;

    const resolvedUrl = new URL(url, baseUrl ?? config.APP_URL);
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        resolvedUrl.searchParams.set(key, String(value));
      }
    }

    return resolvedUrl.toString();
  };

  const request = <T>(
    method: RequestMethod,
    url: string,
    body?: RequestBody,
    options: ApiRequestOptions = {},
  ) => {
    const {
      headers: requestHeaders,
      next: requestNext,
      query,
      ...requestOptions
    } = options;
    const headers = new Headers(defaultHeaders);

    new Headers(requestHeaders).forEach((value, key) => {
      headers.set(key, value);
    });

    return fetcher<T>(resolveUrl(url, query), {
      ...defaultOptions,
      ...requestOptions,
      headers,
      next: { ...defaultNext, ...requestNext },
      method,
      body,
    });
  };

  return {
    GET: <T = unknown>(url: string, options?: ApiRequestOptions) =>
      request<T>("GET", url, undefined, options),
    POST: <T = unknown>(
      url: string,
      body?: RequestBody,
      options?: ApiRequestOptions,
    ) => request<T>("POST", url, body, options),
    PUT: <T = unknown>(
      url: string,
      body?: RequestBody,
      options?: ApiRequestOptions,
    ) => request<T>("PUT", url, body, options),
    PATCH: <T = unknown>(
      url: string,
      body?: RequestBody,
      options?: ApiRequestOptions,
    ) => request<T>("PATCH", url, body, options),
    DELETE: <T = unknown>(url: string, options?: ApiRequestOptions) =>
      request<T>("DELETE", url, undefined, options),
  };
};

export const apiRequest = createApiRequest();
