"use server";

import mongoose from "mongoose";
import connectDb from "@/db/dbConfig";
import BlogPost from "@/models/BlogPost";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher-server";

const updateBlogSchema = z.object({
  postId: z.string().min(1, "Post Id is required"),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  coverImage: z.string().min(1, "Cover image is required").optional(),
});

export async function updateBlogPostAction(data) {
  const validated = updateBlogSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0].message,
      status: 400,
    };
  }

  const { postId, title, content, category, coverImage } = validated.data;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return { success: false, error: "Invalid postId", status: 400 };
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const user = await verifyAuthToken(token);

    if (!user?.userId) {
      return { success: false, error: "Unauthorized", status: 401 };
    }

    await connectDb();

    const post = await BlogPost.findById(postId);
    if (!post) {
      return { success: false, error: "Blog post not found", status: 404 };
    }

    if (post.author?.toString() !== user.userId) {
      return {
        success: false,
        error: "Forbidden: You cannot edit this blog",
        status: 403,
      };
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;

    if (coverImage !== undefined) {
      post.coverImage = coverImage.split("?")[0]; // ✅ clean url
    }

    await post.save();

    // ✅ make sure these paths match your app routes
    revalidatePath("/");
    if (post.slug) revalidatePath(`/blog/${post.slug}`);

    await pusherServer.trigger("blogs", "changed", {
      type: "updated",
      postId: post._id.toString(),
    });

    return { success: true, message: "Blog updated successfully" };
  } catch (err) {
    console.error("updateBlogPostAction error:", err);
    return { success: false, error: "Failed to update blog", status: 500 };
  }
}
