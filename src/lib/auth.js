import { jwtVerify } from "jose";

export async function verifyAuthToken(token) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return {
      userId: typeof payload.userId === "string" ? payload.userId : null,
      email: typeof payload.email === "string" ? payload.email : null,
      userName: typeof payload.userName === "string" ? payload.userName : null,
      isPremium: Boolean(payload.isPremium),
    };
  } catch (e) {
    console.error(e, "Error fetching token");
    return null;
  }
}
