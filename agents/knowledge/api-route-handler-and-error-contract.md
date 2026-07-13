# API Route Handler And Error Contract

Keep HTTP transport concerns at the route boundary. API routes authenticate and
parse requests through `withApiHandler`, call services directly, and return
HTTP responses. Do not call Server Actions from API routes; actions add
Server Action transport and cache concerns.

```ts
export const POST = withApiHandler(async (_request, body, user) => {
  const item = await ItemService.createItem(user.id, body);
  return NextResponse.json(item, { status: 201 });
});
```

Services throw `AppError` for expected failures. The handler converts errors
to a stable response:

```json
{
  "success": false,
  "error": {
    "message": "Invalid item data.",
    "statusCode": 400,
    "fields": {
      "title": ["Title is required."]
    }
  }
}
```

Keep `fields` as `Record<string, string[]>` so the same error can render
inline in a form or be consumed by a REST client. Handle `204` responses with
an empty response body.

Database-backed features may keep one `snake_case` type across repository,
service, action, and UI when no separate domain vocabulary is needed. Add a
row/domain mapping only when the boundary materially improves the model.
