"use client";

import { useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useEffect } from "react";
import { type ClientAuthUser, userAtom } from "@/stores/user-store";

export function AuthUserHydratorClient({
  user,
}: {
  user: ClientAuthUser | null;
}) {
  const setUser = useSetAtom(userAtom);

  useHydrateAtoms([[userAtom, user]]);

  useEffect(() => {
    setUser(user);
  }, [setUser, user]);

  return null;
}
