import { cookies } from "next/headers";
import Header from "./header";
import { verifyAuthToken } from "@/lib/auth";

export default async function CommonLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const user = await verifyAuthToken(token);

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} />
      <main className="pt-16">{children}</main>
    </div>
  );
}
