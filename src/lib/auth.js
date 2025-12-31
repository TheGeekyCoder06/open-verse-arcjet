import { jwtVerify } from "jose";

export async function verifyAuthToken(token) {
  try {
    if (!token) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return payload;   // <-- return actual user payload
  } catch {
    return null;
  }
}