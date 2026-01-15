import { notFound, redirect } from "next/navigation";
import { getBlogPostByIdAction } from "@/actions/blog";
import { getCurrentUserAction } from "@/actions/getCurrentUser";
import EditBlogForm from "@/components/blog/EditBlogPost";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({ params }) {
  const { slug } = await params;

  if (!slug) notFound();

  const data = await getBlogPostByIdAction(slug);
  if (!data?.success || !data?.post) notFound();

  const currentUser = await getCurrentUserAction();
  const currentUserId = currentUser?.userId ?? null;

  const isAuthor =
    Boolean(currentUserId) && data.post.author?._id === currentUserId;

  if (!isAuthor) {
    redirect(`/blog/${slug}`);
  }

  return <EditBlogForm post={data.post} />;
}
