import type { Metadata } from "next";
import { Suspense } from "react";
import { handleLogout } from "@/action/auth";
import { getUser } from "@/action/user";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodoDemo } from "./_component/todo-demo";
import { TodoDemoClient } from "./_component/todo-demo-client";

export const metadata: Metadata = {
  title: "Home",
  description: "Authenticated application home.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const user = await getUser();
  if (!user) return null;

  return (
    <main className="min-h-svh bg-muted/30 px-6 py-10">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">App Template</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Authenticated home
          </p>
        </div>
        <form action={handleLogout}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </div>
      <Card className="mx-auto mt-10 max-w-3xl">
        <CardHeader>
          <CardTitle>Authentication is working</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Signed in as {user.email}.</p>
          <p className="font-mono text-xs">User ID: {user.id}</p>
        </CardContent>
      </Card>
      <Card className="mx-auto mt-6 max-w-3xl">
        <CardHeader>
          <CardTitle>File upload</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload />
        </CardContent>
      </Card>
      <Suspense fallback={<TodoDemoLoading />}>
        <TodoDemo searchParams={searchParams} />
      </Suspense>
      <TodoDemoClient />
    </main>
  );
}

function TodoDemoLoading() {
  return (
    <Card className="mx-auto mt-6 max-w-3xl">
      <CardHeader>
        <CardTitle>Todos</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Loading todos…</p>
      </CardContent>
    </Card>
  );
}
