import "server-only";
import { cookies } from "next/headers";

export async function setCookie(
  values: Record<
    string,
    string | number | boolean | Record<string, unknown> | unknown[]
  >,
  maxAgeSeconds: number = 24 * 60 * 60,
) {
  const cookieStore = await cookies();
  for (const [name, value] of Object.entries(values)) {
    cookieStore.set(name, JSON.stringify(value), {
      maxAge: maxAgeSeconds,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
}

export async function getCookie(name: string) {
  const cookieStore = await cookies();
  const value = cookieStore.get(name)?.value;
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function deleteCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

export async function clearCookie() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name);
  }
}
