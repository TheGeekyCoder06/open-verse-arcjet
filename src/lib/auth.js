import { jwtVerify } from "jose";

export async function verifyAuthToken(token) {
  if (!token) {
    return { success: false, message: "No token provided" };
  }
  try {
    const {payload} = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return { success: true, payload };
  } catch (error) {
    return { success: false, message: "Invalid or expired token" };
  }
}
