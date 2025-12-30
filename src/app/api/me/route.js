import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return Response.json({ user: null });
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    return Response.json({ user: null });
  }

  return Response.json({
    user: {
      id: payload.userId,
      email: payload.email,
    }
  });
}
