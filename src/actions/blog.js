"use server";

import mongoose from "mongoose";
import connectDb from "@/db/dbConfig";
import BlogPost from "@/models/BlogPost";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { z } from "zod";
import { jwtVerify } from "jose";
import "@/models/User"; 
import { pusherServer } from "@/lib/pusher-server";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "category is required"),
  coverImage: z.string().min(1, "Image is required"),
});

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userId = payload?.userId;
    if (!userId || typeof userId !== "string") return null;

    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    return userId;
  } catch {
    return null;
  }
}

export async function createBlogPostAction(data) {
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

    const userId = await getCurrentUserId();

    if (!userId) {
      return { error: "Login required to create a blog post" };
    }

    const post = await BlogPost.create({
      title,
      content,
      author: new mongoose.Types.ObjectId(userId),
      coverImage,
      category,
      comments: [],
      upvotes: [],
    });

    await pusherServer.trigger("blogs", "changed", {
      type: "created",
      postId: post._id.toString(),
    });

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { error: "Invalid blog id", status: 400 };
    }

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
        ? {
            _id: post.author._id.toString(),
            username: post.author.username,
            email: post.author.email,
          }
        : { _id: "", username: "Unknown User", email: "" },

      comments:
        post.comments?.map((c) => ({
          content: c.content,
          author: c.author
            ? {
                _id: c.author._id.toString(),
                username: c.author.username,
                email: c.author.email,
              }
            : { _id: "", username: "Unknown User", email: "" },
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
      .populate("author", "username email")
      .lean()
      .exec();

    const serializedPosts = posts.map((post) => ({
      _id: post._id.toString(),
      title: post.title,
      coverImage: post.coverImage,
      author: post.author
        ? {
            _id: post.author._id.toString(),
            username: post.author.username,
            email: post.author.email,
          }
        : { _id: "", username: "Unknown User", email: "" },
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
