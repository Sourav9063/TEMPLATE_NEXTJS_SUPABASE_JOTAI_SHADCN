# SEO: Sitemap And Robots In Next.js App Router

## robots.ts

`src/app/robots.ts` generates `/robots.txt`.

Use it to control what crawlers can index:

- `disallow: "/"` blocks all crawling, useful for auth-gated internal apps.
- `allow: "/"` allows public crawling.
- Path-specific rules can mix `allow` and `disallow`.

Auth-gated apps usually block all crawling:

```ts
rules: { userAgent: "*", disallow: "/" }
```

## sitemap.ts

`src/app/sitemap.ts` generates `/sitemap.xml`.

Each entry can include:

- `url`: absolute page URL.
- `lastModified`: freshness signal.
- `changeFrequency`: `"daily" | "weekly" | "monthly"` etc.
- `priority`: relative importance from `0` to `1`.

Minimal internal app sitemap:

```ts
[
  {
    url: appUrl,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  },
];
```

Do not include login or no-permission pages as content pages.

## Next.js Specifics

- Place `robots.ts` and `sitemap.ts` in `src/app/`.
- Use `MetadataRoute.Robots` and `MetadataRoute.Sitemap`.
- Set `metadataBase` in root layout.
- Use `NEXT_PUBLIC_APP_URL` so staging and production emit correct absolute URLs.

## Metadata Title Template

Root layout can set:

```ts
title: { default: "App Template", template: "%s | App Template" }
```

Pages can set:

```ts
export const metadata: Metadata = { title: "Dashboard" };
```

This renders `"Dashboard | App Template"`.
