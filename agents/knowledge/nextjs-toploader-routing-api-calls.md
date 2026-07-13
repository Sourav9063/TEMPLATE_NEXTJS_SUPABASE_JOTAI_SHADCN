# nextjs-toploader Routing And API Calls

## Package

Installed package:

```json
"nextjs-toploader": "^3.9.17"
```

Use it for visible progress during App Router navigation, server action mutations, client-side API calls, and mixed flows where mutation succeeds then route changes.

## Root Setup

`src/app/layout.tsx` mounts loader once inside `<body>`.

```tsx
import NextTopLoader from "nextjs-toploader";

<NextTopLoader
  color="var(--primary)"
  height={2}
  showSpinner={false}
  shadow={false}
/>
```

Rules:

- Mount once in root layout.
- Keep before app providers/children.
- Do not use `PagesTopLoader`; repo uses App Router.

## Routing Pattern

For programmatic navigation from Client Components, import router from `nextjs-toploader/app`, not `next/navigation`.

```tsx
"use client";

import { useRouter } from "nextjs-toploader/app";

export function SomeClientComponent() {
  const router = useRouter();

  return <button onClick={() => router.push("/")}>Open</button>;
}
```

Supported methods match Next App Router:

- `router.push(href, options?)`
- `router.replace(href, options?)`
- `router.back()`
- `router.forward()`
- `router.refresh()`

## Server Action Mutations

For non-navigation mutations, use `useTopLoader`.

```tsx
"use client";

import { useTopLoader } from "nextjs-toploader";

export function SaveButton() {
  const topLoader = useTopLoader();

  async function onSave() {
    topLoader.start();
    try {
      await saveAction();
    } finally {
      topLoader.done();
    }
  }

  return <button onClick={onSave}>Save</button>;
}
```

Use `finally` so loader always stops after success or failure.

## Link Navigation

Regular `<Link>` navigation works automatically with the root loader.

```tsx
import Link from "next/link";

<Link href="/">Dashboard</Link>;
```
