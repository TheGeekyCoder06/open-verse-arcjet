import { NextResponse } from "next/server";
import { createBlogPostAction } from "@/actions/blog";
import { revalidatePath } from "next/cache";

export async function POST(req) {
  console.log("Received request to create blog post");

  try {
    const data = await req.json();
    const result = await createBlogPostAction(data);

    if (result?.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status || 400 }
      );
    }

    revalidatePath("/");

    return NextResponse.json(
      { success: true, post: result.post },
      { status: 200 }
    );
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}