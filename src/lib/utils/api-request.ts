import { config } from "@/config";
import { GLOBAL_CACHE_TAG } from "@/constants/cache";
import { AppError } from "@/lib/utils/error";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type RequestBody =
  | Record<string, unknown>
  | FormData
  | Blob
  | ArrayBuffer
  | string
  | null;

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

export interface ResolvedRequestConfig
  extends Omit<RequestInit, "body" | "headers" | "method"> {
  url: string;
  method: string;
  headers: Headers;
  body?: BodyInit | null;
}

export interface ApiResponseContext {
  config: ResolvedRequestConfig;
  response: Response;
}

export interface ApiErrorContext {
  config: ResolvedRequestConfig;
  error: unknown;
  response?: Response;
}

type Interceptor<T> = (value: T) => T | Promise<T>;

export interface InterceptorManager<T> {
  use(interceptor: Interceptor<T>): number;
  eject(id: number): void;
}

interface InternalInterceptorManager<T> extends InterceptorManager<T> {
  hasInterceptors(): boolean;
  run(value: T): Promise<T>;
}

interface ApiRequestInterceptors {
  request: InternalInterceptorManager<ResolvedRequestConfig>;
  response: InternalInterceptorManager<ApiResponseContext>;
  error: InternalInterceptorManager<ApiErrorContext>;
}

interface PublicApiRequestInterceptors {
  request: InterceptorManager<ResolvedRequestConfig>;
  response: InterceptorManager<ApiResponseContext>;
  error: InterceptorManager<ApiErrorContext>;
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
  if (body === null || body === undefined) return undefined;

  if (body instanceof FormData) {
    headers.delete("Content-Type");
    return body;
  }

  if (body instanceof Blob) {
    if (body.type && !headers.has("Content-Type")) {
      headers.set("Content-Type", body.type);
    }
    return body;
  }

  if (body instanceof ArrayBuffer) return body;

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
  if (isMutation) {
    return { revalidate: 0, ...customNext };
  }

  const defaultTags = [
    GLOBAL_CACHE_TAG,
    `${requestUrl.pathname}${requestUrl.search}`,
  ];

  return {
    revalidate: 5 * 60,
    ...customNext,
    tags: [...new Set([...defaultTags, ...(customNext.tags ?? [])])],
  };
};

const mergeNextConfig = (
  defaultNext?: NextFetchRequestConfig,
  requestNext?: NextFetchRequestConfig,
): NextFetchRequestConfig => {
  const tags = [...(defaultNext?.tags ?? []), ...(requestNext?.tags ?? [])];

  return {
    ...defaultNext,
    ...requestNext,
    ...(tags.length > 0 ? { tags: [...new Set(tags)] } : {}),
  };
};

const createInterceptorManager = <T>(): InternalInterceptorManager<T> => {
  const interceptors = new Map<number, Interceptor<T>>();
  let nextId = 0;

  return {
    use(interceptor) {
      const id = nextId;
      nextId += 1;
      interceptors.set(id, interceptor);
      return id;
    },
    eject(id) {
      interceptors.delete(id);
    },
    hasInterceptors() {
      return interceptors.size > 0;
    },
    async run(initialValue) {
      let value = initialValue;

      for (const interceptor of interceptors.values()) {
        value = await interceptor(value);
      }

      return value;
    },
  };
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

const executeRequest = async <T = unknown>(
  url: string,
  options: FetchOptions = {},
  interceptors?: ApiRequestInterceptors,
): Promise<T> => {
  const {
    body,
    headers: headersInit,
    method = "GET",
    next,
    ...restOptions
  } = options;
  const headers = prepareHeaders(headersInit);
  const requestBody = prepareBody(body, headers);
  let requestConfig: ResolvedRequestConfig = {
    url,
    method,
    headers,
    body: requestBody,
    next,
    ...restOptions,
  };
  let errorResponse: Response | undefined;

  try {
    if (interceptors) {
      requestConfig = await interceptors.request.run(requestConfig);
    }

    requestConfig.next = getNextConfig(
      requestConfig.method,
      requestConfig.url,
      requestConfig.next,
    );

    const { url: requestUrl, ...requestOptions } = requestConfig;
    const response = await fetch(requestUrl, requestOptions);
    let responseContext = { config: requestConfig, response };

    if (interceptors) {
      responseContext = await interceptors.response.run(responseContext);
    }

    if (interceptors?.error.hasInterceptors()) {
      errorResponse = responseContext.response.clone();
    }

    return await handleResponse<T>(responseContext.response);
  } catch (error) {
    if (interceptors) {
      await interceptors.error.run({
        config: requestConfig,
        error,
        response: errorResponse,
      });
    }

    throw error;
  }
};

export const fetcher = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> => executeRequest<T>(url, options);

export const createApiRequest = ({
  baseUrl,
  headers: defaultHeaders,
  next: defaultNext,
  query: defaultQuery,
  ...defaultOptions
}: ApiRequestDefaults = {}) => {
  const interceptors: ApiRequestInterceptors = {
    request: createInterceptorManager<ResolvedRequestConfig>(),
    response: createInterceptorManager<ApiResponseContext>(),
    error: createInterceptorManager<ApiErrorContext>(),
  };
  const publicInterceptors: PublicApiRequestInterceptors = interceptors;

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

    return executeRequest<T>(
      resolveUrl(url, query),
      {
        ...defaultOptions,
        ...requestOptions,
        headers,
        next: mergeNextConfig(defaultNext, requestNext),
        method,
        body,
      },
      interceptors,
    );
  };

  return {
    interceptors: publicInterceptors,
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
