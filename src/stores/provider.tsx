"use client";

import { Provider } from "jotai";
import dynamic from "next/dynamic";

export type StoreProviderProps = Readonly<{
  children?: React.ReactNode;
}>;

const DevelopmentStoreProvider =
  process.env.NODE_ENV !== "production"
    ? dynamic(
        () =>
          import("@/stores/dev-store-provider").then(
            (module) => module.DevelopmentStoreProvider,
          ),
        { ssr: false },
      )
    : null;

export function StoreProvider({ children }: StoreProviderProps) {
  if (DevelopmentStoreProvider) {
    return <DevelopmentStoreProvider>{children}</DevelopmentStoreProvider>;
  }

  return <Provider>{children}</Provider>;
}
