import Link from "next/link";

export default function NoPermissionPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">No permission</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account cannot access this page.
        </p>
        <Link className="mt-6 inline-block text-sm underline" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
