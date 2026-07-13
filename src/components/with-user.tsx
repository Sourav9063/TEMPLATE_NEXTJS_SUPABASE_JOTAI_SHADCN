import { redirect } from "next/navigation";
import { getUser } from "@/action/user";
import { AuthUserHydratorClient } from "@/components/auth-user-hydrator-client";
import { appRoutes } from "@/constants/app-route";
import { getSafeRedirectPath } from "@/lib/utils/redirect";

export async function WithUser({
  children,
  redirectUrl = appRoutes.Home,
}: {
  children: React.ReactNode;
  redirectUrl?: string;
}) {
  const user = await getUser();
  if (!user) {
    const safeRedirectUrl = getSafeRedirectPath(redirectUrl);
    redirect(
      `${appRoutes.LOGIN}?redirect-url=${encodeURIComponent(safeRedirectUrl)}`,
    );
  }
  return (
    <>
      <AuthUserHydratorClient user={user} />
      {children}
    </>
  );
}
