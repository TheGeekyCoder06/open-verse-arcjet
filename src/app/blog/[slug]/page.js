import { getBlogPostByIdAction } from "@/actions/blog";
import BlogDetails from "@/components/blog/blogDetails";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BlogDetailsPage({ params }) {
  const { slug } = await params;

  console.log("🔎 BLOG SLUG FROM URL:", slug);

  if (!slug) notFound();

  const data = await getBlogPostByIdAction(slug);

  console.log("📄 BLOG FETCH RESULT:", data);

  if (!data?.success || !data?.post) notFound();

  return <BlogDetails post={data.post} />;
}