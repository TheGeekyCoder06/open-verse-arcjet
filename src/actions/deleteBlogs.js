"use server";

import mongoose from "mongoose";
import connectDb from "@/db/dbConfig";
import BlogPost from "@/models/BlogPost";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher-server";

export async function deleteBlogPostAction(postId) {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return { error: "Invalid postId", status: 400 };
  }

  try {
    const token = (await cookies()).get("auth_token")?.value;
    const user = await verifyAuthToken(token);

    if (!user?.userId) {
      return { error: "Unauthorized", status: 401 };
    }

    await connectDb();

    const post = await BlogPost.findById(postId);
    if (!post) {
      return { error: "Blog post not found", status: 404 };
    }

    if (post.author?.toString() !== user.userId) {
      return { error: "Forbidden: You cannot delete this blog", status: 403 };
    }

    await BlogPost.deleteOne({ _id: postId });

    revalidatePath("/");
    revalidatePath(`/blog/${postId}`);

    await pusherServer.trigger("blogs", "changed", {
      type: "deleted",
      postId,
    });

    return { success: true, message: "Blog deleted successfully" };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete blog", status: 500 };
  }
}
