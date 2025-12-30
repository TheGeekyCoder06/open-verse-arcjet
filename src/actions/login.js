"use server";

import connectDb from "@/db/dbConfig";
import arcjetClient from "@/lib/arcjet";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { z } from "zod";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function loginUser(userData, req) {
  // 1) Validate input
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
    // 2) Arcjet protection check
    const decision = await arcjetClient.protect(
      req ?? new Request("https://app/login"),
      { email }
    );

    if (decision?.reason?.isRateLimit?.()) {
      return {
        success: false,
        message: "Too many login attempts. Try again later.",
        status: 429,
      };
    }

    if (decision?.action === "BLOCK") {
      return {
        success: false,
        message: "Request blocked by Arcjet",
        status: 403,
      };
    }

    // 3) DB connection
    await connectDb();

    // 4) Find user
    const user = await User.findOne({ email });
    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
        status: 401,
      };
    }

    // 5) Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        success: false,
        message: "Invalid email or password",
        status: 401,
      };
    }

    // 6) Create JWT
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // 7) Store cookie
    cookies().set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60,
      path: "/",
      sameSite: "strict",
    });

    // 8) Final success response
    return {
      success: true,
      message: "Login successful",
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
      status: 200,
    };

  } catch (error) {
    console.error("Login failed:", error);

    return {
      success: false,
      message: "Internal server error during login",
      status: 500,
    };
  }
}
