import { cookies } from "next/headers";
import Header from "./header";
import connectDb from "@/db/dbConfig";
import User from "@/models/User";
import { verifyAuthToken } from "@/lib/auth";

export default async function CommonLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let user = null;

  if (token) {
    const decoded = await verifyAuthToken(token);

    if (decoded?.userId) {
      await connectDb();

      const dbUser = await User.findById(decoded.userId)
        .select("_id username email")
        .lean();

      if (dbUser) {
        user = {
          _id: dbUser._id.toString(),
          username: dbUser.username,
          email: dbUser.email,
        };
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {user ? <Header user={user} /> : null}

      <main className={user ? "pt-16" : ""}>{children}</main>
    </div>
  );
}
