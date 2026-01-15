import { getBlogPostByIdAction } from "@/actions/blog";
import { getCurrentUserAction } from "@/actions/getCurrentUser";
import BlogDetails from "@/components/blog/blogDetails";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BlogDetailsPage({ params }) {
  const { slug } = await params; 

  if (!slug) notFound();

  const data = await getBlogPostByIdAction(slug);

  if (!data?.success || !data?.post) {
    notFound();
  }

  const currentUser = await getCurrentUserAction();
  const currentUserId = currentUser?.userId ?? null;

  const isAuthor =
    Boolean(currentUserId) &&
    String(data.post.author?._id) === String(currentUserId); 

  return <BlogDetails post={data.post} isAuthor={isAuthor} />;
}
