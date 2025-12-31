import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import BlogPost from "@/models/BlogPost";

export async function getPostById(id) {
  const token = cookies().get("token")?.value;
  const user = await verifyAuthToken(token);

  const post = await BlogPost.findById(id)
    .populate("author", "_id username")
    .lean();

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  const author = post.author ?? {};

  return {
    success: true,
    post: {
      ...post,
      _id: post._id.toString(),

      author: {
        _id: author?._id ? author._id.toString() : "",
        username: author?.username ?? "Unknown User",
      },

      currentUserId: user?.userId ?? null,
    },
  };
}
