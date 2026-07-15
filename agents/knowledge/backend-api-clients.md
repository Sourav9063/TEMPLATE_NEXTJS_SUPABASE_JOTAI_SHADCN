# Backend API Clients

Use `createApiRequest` from `src/lib/utils/api-request.ts` as the shared HTTP
transport for remote backends. It provides typed HTTP methods, JSON/FormData
and binary body handling, query serialization, cancellation through
`ApiRequestOptions.signal`, Next fetch caching, and `AppError` normalization
for failed responses.

## Boundary

Remote backend calls run on the server. The normal call path is:

```text
Server Action or incoming API route
  -> service (validation, authorization, business rules)
  -> server-only backend client
  -> remote backend
```

Do not call a secret-backed backend client from a Client Component. Do not
put outgoing remote calls in `src/app/api/`; that directory handles incoming
HTTP requests. Keep SQL and Supabase access in repositories; an external API
client is a separate server-only adapter.

## One client per backend

Each backend host and credential set gets a dedicated module under
`src/lib/utils/server/`. This follows the `strike-ui` pattern: one generic
request factory, then a configured `server-only` client for the Strike API.

Put host URLs and credentials in `src/config/server.ts`, never in
`src/config/index.ts` or any `NEXT_PUBLIC_*` variable.

```ts
// src/lib/utils/server/billing-api.ts
import "server-only";

import { config } from "@/config/server";
import { createApiRequest } from "@/lib/utils/api-request";

export const billingApi = createApiRequest({
  baseUrl: config.billing.HOST,
  headers: {
    Authorization: `Bearer ${config.billing.API_TOKEN}`,
  },
});
```

For cross-cutting client behavior, register Axios-style `request`, `response`,
or `error` interceptors on the configured server-only client. Each interceptor
must return its context so the next interceptor receives the transformed value.
Keep backend-specific signing, metrics, and activity logging out of the generic
request utility.

```ts
billingApi.interceptors.request.use((request) => {
  request.headers.set("X-Client-Version", "1");
  return request;
});

billingApi.interceptors.response.use(({ config, response }) => {
  recordBackendResponse(config.url, response.status);
  return { config, response };
});
```

`use` returns an interceptor ID. Call `eject(id)` when a temporary interceptor
must be removed. Use a wrapper only for behavior specific to one method or call.

Define backend endpoints as constants or route builders. Encode dynamic path
segments with `encodeURIComponent`; pass query parameters through the request
client instead of manually concatenating strings.

```ts
export const billingApiRoutes = {
  INVOICES: "/v1/invoices",
  INVOICE: (id: string) => `/v1/invoices/${encodeURIComponent(id)}`,
};

const result = await billingApi.GET<InvoiceList>(billingApiRoutes.INVOICES, {
  query: { customer_id: customerId, include_void: false },
});
```

## Service usage

Services validate input with Zod, enforce the local business rule, call the
server-only client, and map remote data to the local domain type when the
models differ. Server Actions and API routes must not call backend clients
directly.

```ts
export const InvoiceService = {
  async listInvoices(input: unknown): Promise<Invoice[]> {
    const parsed = listInvoicesSchema.parse(input);
    const response = await billingApi.GET<InvoiceList>(
      billingApiRoutes.INVOICES,
      { query: { customer_id: parsed.customer_id } },
    );

    return response.invoices.map(toInvoice);
  },
};
```

For a browser-facing endpoint, use the existing `withApiHandler` boundary,
then call the service. A Server Action follows the same service path. This
keeps session checks, HTTP parsing, cache invalidation, and remote transport
in their correct layers.

## Caching and errors

`GET` requests receive the shared global tag and a URL-specific tag by
default; configured and per-request tags are added without replacing those
defaults. Mutations use `revalidate: 0`. Override `next` per request when a
backend endpoint needs a different TTL:

```ts
await billingApi.GET<CurrencyList>(billingApiRoutes.CURRENCIES, {
  next: { revalidate: 24 * 60 * 60 },
});
```

After a successful local mutation that changes cached remote-backed data,
invalidate the narrow relevant tag in its Server Action or API route. Do not
clear cache from a reload effect, ordinary navigation, or a layout mount. Use
the global tag only when one write genuinely affects unrelated read surfaces.

Failed remote responses become `AppError` with API status, code, fields,
details, and request ID when supplied. Preserve that structured error through
services and transport boundaries; only remap fields when a local form needs
a different field path.

## Public backends

For a genuinely public backend with no secret headers, `apiRequest` can be
used with an absolute public URL from a Server Action or Server Component.
Still keep data validation and domain mapping in a service. Do not use this
exception for a backend that depends on a service token, private host, or
user credential.
