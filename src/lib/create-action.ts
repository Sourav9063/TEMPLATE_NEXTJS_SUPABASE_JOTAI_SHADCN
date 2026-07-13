import "server-only";

import { AppError, handleError } from "@/lib/utils/error";
import { getUser } from "@/lib/utils/server/get-user";

export type AuthenticatedUser = NonNullable<
  Awaited<ReturnType<typeof getUser>>
>;

type AuthCallback<TArgs extends unknown[], TReturn> = (
  user: AuthenticatedUser,
  ...args: TArgs
) => Promise<TReturn>;

type PublicCallback<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => Promise<TReturn>;

export const createAction = {
  public<TArgs extends unknown[], TReturn>(cb: PublicCallback<TArgs, TReturn>) {
    return (...args: TArgs) => handleError(() => cb(...args));
  },
  user<TArgs extends unknown[], TReturn>(cb: AuthCallback<TArgs, TReturn>) {
    return (...args: TArgs) =>
      handleError(async () => {
        const user = await getUser();
        if (!user) throw new AppError(401);
        return cb(user, ...args);
      });
  },
} as const;
