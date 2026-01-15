"use server";

import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";

export async function getCurrentUserAction() {
  const token = (await cookies()).get("auth_token")?.value; 
  const user = await verifyAuthToken(token);

  return {
    success: true,
    userId: user?.userId ?? null,
    username: user?.userName ?? null,
    email: user?.email ?? null,
  };
}
