"use server";

import connectDb from "@/db/dbConfig";
import { loginRules } from "@/lib/arcjet";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { z } from "zod";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  from: z.string().optional(), // ✅ pass this from client if needed
});

export async function loginUser(userData, req) {
  const validated = loginSchema.safeParse(userData);

  if (!validated.success) {
    return {
      success: false,
      message: "Invalid login credentials",
      errors: validated.error.errors,
      status: 400,
    };
  }

  const { email, password, from } = validated.data;

  try {
    // Arcjet protection
    const requestObj =
      req instanceof Request
        ? req
        : new Request("https://app/login", {
            headers: { "user-agent": "next-server-action" },
          });

    const decision = await loginRules.protect(requestObj, { email });

    if (decision?.reason?.isRateLimit?.()) {
      return { success: false, message: "Too many login attempts.", status: 429 };
    }

    if (decision?.action === "BLOCK") {
      return { success: false, message: "Request blocked", status: 403 };
    }

    await connectDb();

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "Invalid email", status: 401 };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: "Incorrect password", status: 401 }; // ✅
    }

    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // ✅ keep await cookies() as you want
    const cookieStore = await cookies();

    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    redirect(from || "/");
  } catch (error) {
    // Next redirect throws internal error; rethrow it
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;

    console.error("Login failed:", error);
    return { success: false, message: "Internal server error", status: 500 };
  }
}
