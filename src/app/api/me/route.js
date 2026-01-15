import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDb from "@/db/dbConfig";
import User from "@/models/User";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    const decoded = await verifyAuthToken(token);

    if (!decoded?.userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectDb();

    const user = await User.findById(decoded.userId)
      .select("_id username email")
      .lean();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("API /me error:", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
