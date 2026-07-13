import { NextResponse } from "next/server";
import { verifyMagicLink } from "@/action/auth";
import { getSafeRedirectPath } from "@/lib/utils/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const redirectUrl = getSafeRedirectPath(url.searchParams.get("redirect-url"));
  const result = await verifyMagicLink(token);

  if (!result.success) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", result.error.message);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(redirectUrl, url.origin));
}
