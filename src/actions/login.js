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

  const { email, password } = validated.data;

  try {
    const requestObj =
      req instanceof Request
        ? req
        : new Request("https://app/login");

    const decision = await loginRules.protect(requestObj, {
      email, // required for validateEmail()
    });

    if (decision?.reason?.isRateLimit?.()) {
      return { success: false, message: "Too many login attempts.", status: 429 };
    }

    if (decision?.action === "BLOCK") {
      return { success: false, message: "Request blocked", status: 403 };
    }

    await connectDb();

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "Invalid email or password", status: 401 };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: "Invalid email or password", status: 401 };
    }

    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    const from = req?.nextUrl?.searchParams?.get("from") || "/";
    redirect(from);

  } catch (error) {
    console.error("Login failed:", error);
    return { success: false, message: "Internal server error", status: 500 };
  }
}