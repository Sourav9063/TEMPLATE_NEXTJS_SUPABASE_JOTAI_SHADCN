"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import * as React from "react";

export interface QueryStateOptions {
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
}

export type SearchParamsLike = {
  get: (name: string) => string | null;
};

export type SearchParamsObjectConfig<T extends Record<string, string>> = {
  [Key in keyof T]: readonly [paramKey: string, defaultValue: T[Key]];
};

export function searchParamsToObject<T extends Record<string, string>>(
  searchParams: SearchParamsLike,
  config: SearchParamsObjectConfig<T>,
): T {
  return (Object.keys(config) as Array<keyof T>).reduce((result, key) => {
    const [paramKey, defaultValue] = config[key];
    result[key] = (searchParams.get(paramKey) ?? defaultValue) as T[typeof key];
    return result;
  }, {} as T);
}

let batchedParams: URLSearchParams | null = null;
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

export function useQueryState<T extends string = string>(
  key: string,
  defaultValue: T,
  options?: QueryStateOptions,
): [T, (value: T | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [optimisticValue, setOptimisticValue] = React.useState<
    T | null | undefined
  >(undefined);
  const urlValue = (searchParams.get(key) as T) ?? defaultValue;
  const previousUrlValue = React.useRef(urlValue);

  React.useEffect(() => {
    if (previousUrlValue.current !== urlValue) {
      previousUrlValue.current = urlValue;
      setOptimisticValue(undefined);
    }
  }, [urlValue]);

  const value =
    optimisticValue !== undefined
      ? (optimisticValue ?? defaultValue)
      : urlValue;

  const setValue = React.useCallback(
    (newValue: T | null) => {
      setOptimisticValue(newValue);
      if (!batchedParams) {
        const currentSearch =
          typeof window !== "undefined"
            ? window.location.search
            : searchParams.toString();
        batchedParams = new URLSearchParams(currentSearch);
      }
      if (newValue === null || newValue === "") batchedParams.delete(key);
      else batchedParams.set(key, newValue);

      if (batchTimeout) clearTimeout(batchTimeout);
      batchTimeout = setTimeout(() => {
        if (!batchedParams) return;
        const queryString = batchedParams.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;
        if (options?.shallow) window.history.replaceState(null, "", url);
        else if (options?.replace ?? true)
          router.replace(url, { scroll: options?.scroll ?? false });
        else router.push(url, { scroll: options?.scroll ?? false });
        batchedParams = null;
        batchTimeout = null;
      }, 0);
    },
    [key, options, pathname, router, searchParams],
  );

  return [value, setValue];
}
