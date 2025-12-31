"use server";
import mongoose from "mongoose";
import connectDb from "@/db/dbConfig";
import BlogPost from "@/models/BlogPost";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import User from "@/models/User";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "category is required"),
  coverImage: z.string().min(1, "Image is required"),
});

export async function createBlogPostAction(data) {
  // 🟢 PUBLIC — no auth required
  const validateFields = blogPostSchema.safeParse(data);

  if (!validateFields.success) {
    return {
      error: validateFields.error.errors[0].message,
    };
  }

  const { title, coverImage, content, category } = validateFields.data;

  try {
    const headersList = await headers();
    const isSuspicious = headersList.get("x-arcjet-suspicious") === "true";

    if (isSuspicious) {
      console.warn("Suspicious content flagged, but not blocked");
    }

    await connectDb();

    const post = new BlogPost({
      title,
      content,
      author: data.userId || null, // 👈 public / optional user
      coverImage,
      category,
      comments: [],
      upvotes: [],
    });

    await post.save();
    revalidatePath("/");

    return {
      success: true,
      post: {
        _id: post._id.toString(),
        title: post.title,
        coverImage: post.coverImage,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      error: "Failed to create blog post",
    };
  }
}

export async function getBlogPostByIdAction(id) {
  try {
    await connectDb();

    const post = await BlogPost.findById(id)
      .populate("author", "username email")
      .populate("comments.author", "username email")
      .lean()
      .exec();

    if (!post) {
      return { error: "Blog not found", status: 404 };
    }

    const serializedPost = {
      _id: post._id.toString(),
      title: post.title,
      content: post.content,
      coverImage: post.coverImage,
      category: post.category,
      author: post.author
        ? { _id: post.author._id.toString(), name: post.author.name }
        : { _id: "", name: "Unknown User" },
      comments:
        post.comments?.map((c) => ({
          content: c.content,
          author: c.author
            ? { _id: c.author._id.toString(), name: c.author.name }
            : { _id: "", name: "Unknown User" },
          createdAt: c.createdAt,
        })) ?? [],
      createdAt: post.createdAt.toISOString(),
    };

    return { success: true, post: serializedPost };
  } catch (err) {
    console.error(err);
    return { error: "Failed to fetch blog details" };
  }
}

export async function getBlogPostsAction() {
  try {
    await connectDb();

    const posts = await BlogPost.find()
      .sort({ createdAt: -1 })
      .populate("author", "name")
      .lean()
      .exec();

    const serializedPosts = posts.map((post) => ({
      _id: post._id.toString(),
      title: post.title,
      coverImage: post.coverImage,
      author: post.author
        ? { _id: post.author._id.toString(), name: post.author.name }
        : { _id: "", name: "Unknown User" },
      category: post.category,
      createdAt: post.createdAt.toISOString(),
    }));

    return {
      success: true,
      posts: serializedPosts,
    };
  } catch (err) {
    console.error(err);
    return { error: "Failed to fetch blogs" };
  }
}
