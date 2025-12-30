"use server";
import mongoose from "mongoose";
import { commentRules, searchRules } from "@/lib/arcjet";
import { verifyAuthToken } from "@/lib/auth";
import connectDb from "@/db/dbConfig";
import BlogPost from "@/models/BlogPost";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";


/* =======================
   COMMENT SCHEMA
======================= */

const commentSchema = z.object({
  content: z.string().min(1, "Comment is required"),
  postId: z.string().min(1, "Post Id is required"),
});

/* =======================
   ADD COMMENT ACTION
======================= */

export async function addCommentAction(data) {
  const token = (await cookies()).get("token")?.value;
  const user = await verifyAuthToken(token);

  if (!user) {
    return { error: "Unauth user", status: 401 };
  }

  const validate = commentSchema.safeParse(data);
  if (!validate.success) {
    return { error: validate.error.errors[0].message };
  }

  const { postId, content } = validate.data;

  try {
    const req = await request();
    const decision = await commentRules.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit())
        return { error: "Rate limit exceeded", status: 429 };
      if (decision.reason.isBot())
        return { error: "Bot activity detected" };
      return { error: "Request denied", status: 403 };
    }

    await connectDb();

    // ✅ Correct ID usage
    const post = await BlogPost.findById(postId);

    if (!post) {
      return { error: "Blog post not found" };
    }

    if (!post.comments) post.comments = [];

    // ✅ Store only author id (best practice)
    post.comments.push({
      content,
      author: user.userId,
      createdAt: new Date(),
    });

    await post.save();

    // Refresh blog details page
    revalidatePath(`/blog/${postId}`);

    return {
      success: true,
      message: "Comment added successfully",
    };

  } catch (err) {
    console.error(err);
    return { error: "Some error occurred!" };
  }
}

/* =======================
   SEARCH POSTS
======================= */

export async function searchPostsAction(query) {
  const token = (await cookies()).get("token")?.value;
  const user = await verifyAuthToken(token);

  if (!user) {
    return { error: "Unauth user", status: 401 };
  }

  try {
    const req = await request();
    const decision = await searchRules.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit())
        return { error: "Rate limit exceeded", status: 429 };
      if (decision.reason.isBot())
        return { error: "Bot activity detected" };
      return { error: "Request denied", status: 403 };
    }

    await connectDb();

    const posts = await BlogPost.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .populate("author", "name")
      .lean()
      .exec();

    const serializedPosts = posts.map((post) => ({
      _id: post._id.toString(),
      title: post.title,
      coverImage: post.coverImage,
      author: {
        _id: post.author._id.toString(),
        name: post.author.name,
      },
      category: post.category,
      createdAt: post.createdAt.toISOString(),
    }));

    return { success: true, posts: serializedPosts };

  } catch (err) {
    console.error(err);
    return {
      error:
        "Some error occurred while searching. Please try again!",
    };
  }
}
