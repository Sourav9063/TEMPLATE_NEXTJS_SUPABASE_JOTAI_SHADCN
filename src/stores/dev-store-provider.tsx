"use client";

import "jotai-devtools/styles.css";

import { createStore, Provider } from "jotai";
import { DevTools } from "jotai-devtools";
import { useRef } from "react";
import type { StoreProviderProps } from "@/stores/provider";

export function DevelopmentStoreProvider({ children }: StoreProviderProps) {
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  return (
    <Provider store={storeRef.current}>
      <DevTools store={storeRef.current} position="top-left" />
      {children}
    </Provider>
  );
}
