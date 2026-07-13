import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { checkPermission, checkReviewerPermission } from "@/action/permission";
import { appRoutes } from "@/constants/app-route";
import { PERMISSIONS_LIST } from "@/constants/permissions";
import { getSafeRedirectPath } from "@/lib/utils/redirect";

export async function ReviewerGuard({
  children,
  redirectUrl = appRoutes.Home,
}: {
  children: ReactNode;
  redirectUrl?: string;
}) {
  if (!(await checkPermission(PERMISSIONS_LIST))) {
    redirect(
      `${appRoutes.LOGIN}?redirect-url=${encodeURIComponent(getSafeRedirectPath(redirectUrl))}`,
    );
  }

  if (!(await checkReviewerPermission())) {
    redirect(appRoutes.NO_PERMISSION);
  }

  return <>{children}</>;
}
