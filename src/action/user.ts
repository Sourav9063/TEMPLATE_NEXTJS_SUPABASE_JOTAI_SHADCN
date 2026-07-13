"use server";

import { getUser as getParsedUser } from "@/lib/utils/server/get-user";

export async function getUser() {
  return getParsedUser();
}
