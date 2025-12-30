import CreateBlogForm from "@/components/blog/createBlog";
import { verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function CreateBlogPage() {
  const token = (await cookies()).get("token")?.value;
  const user = await verifyAuthToken(token);

  return <CreateBlogForm user={user} />;
}