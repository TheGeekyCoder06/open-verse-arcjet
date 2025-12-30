"use server";

import { cookies } from "next/headers";

export async function logoutUser() {
  try {
    const store = await cookies();
    store.delete("auth_token");

    return {
      success: true,
      message: "Logout successful",
      status: 200,
    };
  } catch (err) {
    console.error("Logout failed:", err);
    return {
      success: false,
      message: "Internal server error during logout",
      status: 500,
    };
  }
}
