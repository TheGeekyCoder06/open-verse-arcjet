"use server";

import connectDb from "@/db/dbConfig";
import arcjetClient from "@/lib/arcjet";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { z } from "zod";

const schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .transform((val) => val.trim().toLowerCase()),

  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.trim().toLowerCase()),

  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function registerUser(userData, req) {
  // 1) Validate input
  const validated = schema.safeParse(userData);
  if (!validated.success) {
    return {
      success: false,
      message: "Invalid input data",
      errors: validated.error.errors,
      status: 400,
    };
  }

  const { username, email, password } = validated.data;

  try {
    // 2) Arcjet protection check
    const decision = await arcjetClient.protect(
      req ?? new Request("https://app/register"),
      { email }
    );

    if (decision?.reason?.isRateLimit?.()) {
      return {
        success: false,
        message: "Too many requests. Please try again later.",
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

    // 4) Check duplicates (case-insensitive because we normalized to lowercase)
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existingUser) {
      return {
        success: false,
        message: "Username or email already in use",
        status: 409,
      };
    }

    // 5) Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6) Create user (username stored lowercase always)
    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // 7) Final success response
    return {
      success: true,
      message: "Account created successfully",
      user: { username, email },
      status: 201,
    };
  } catch (error) {
    console.error("Registration failed:", error);

    return {
      success: false,
      message: "Internal server error during registration",
      status: 500,
    };
  }
}
