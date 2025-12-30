import { cookies } from "next/headers";
import Header from "./header";
import { verifyAuthToken } from "@/lib/auth";

export default async function CommonLayout({ children }) {
  const token = (await cookies()).get("token")?.value;
  const user = await verifyAuthToken(token);

  return (
    <div className="min-h-screen bg-white">
      {user && <Header user={user} />}
      {children}
    </div>
  );
}