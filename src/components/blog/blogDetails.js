"use client";

import { MessageCircleIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import * as z from "zod";
import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addCommentAction } from "@/actions/blogInteractions";
import { deleteBlogPostAction } from "@/actions/deleteBlogs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pusherClient } from "@/lib/pusher-client";

const schema = z.object({
  content: z.string().min(1, "Comment is required"),
});

function BlogDetails({ post, isAuthor }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Collapsible description state
  const [descExpanded, setDescExpanded] = useState(false);

  // ✅ progress bar states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressTimerRef = useRef(null);

  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const { toast } = useToast();
  const router = useRouter();

  // ✅ Extract plain text from HTML
  const plainTextFromHTML = useMemo(() => {
    if (!post?.content) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, "text/html");
    let text = doc.body.textContent || "";
    text = text.replace(/\s+/g, " ").trim();
    return text;
  }, [post?.content]);

  // ✅ Single description (ONE)
  const description = useMemo(() => {
    if (post?.description) return post.description;

    let text = plainTextFromHTML;

    if (
      post?.title &&
      text.toLowerCase().startsWith(post.title.toLowerCase())
    ) {
      text = text.slice(post.title.length).trim();
    }

    return text;
  }, [post?.description, plainTextFromHTML, post?.title]);

  useEffect(() => {
    if (!post?._id) return;

    const channel = pusherClient.subscribe("blogs");

    const handler = ({ postId }) => {
      if (postId === post._id) {
        router.refresh();
      }
    };

    channel.bind("changed", handler);

    return () => {
      channel.unbind("changed", handler);
      pusherClient.unsubscribe("blogs");
    };
  }, [router, post?._id]);

  // ✅ helper to start fake progress
  function startProgress() {
    setIsUploading(true);
    setUploadProgress(5);

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    progressTimerRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        // keep going until 90%
        if (prev >= 90) return 90;
        return prev + Math.floor(Math.random() * 8) + 3; // 3-10%
      });
    }, 250);
  }

  // ✅ helper to stop progress
  function stopProgress(finalValue = 100) {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    setUploadProgress(finalValue);

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
    }, 600);
  }

  async function onCommentSubmit(data) {
    setIsLoading(true);
    startProgress();

    try {
      const result = await addCommentAction({
        ...data,
        postId: post._id,
      });

      if (!result?.success) {
        throw new Error(result?.error || "Failed to add comment");
      }

      stopProgress(100);

      toast({
        title: "Success",
        description: "Comment added successfully",
      });

      reset();
      router.refresh();
    } catch (e) {
      stopProgress(0);

      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    const ok = confirm("Are you sure you want to delete this blog?");
    if (!ok) return;

    setIsDeleting(true);

    try {
      const result = await deleteBlogPostAction(post._id);

      if (!result?.success) {
        throw new Error(result?.error || "Failed to delete blog");
      }

      toast({
        title: "Deleted",
        description: "Blog deleted successfully",
      });

      router.push("/");
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const shortDesc =
    description?.length > 220 ? description.slice(0, 220) : description;
  const showToggle = (description?.length || 0) > 220;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 overflow-x-hidden">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post?.title}</h1>

        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>
              {post?.author?.username?.[0] || "U"}
            </AvatarFallback>
          </Avatar>

          <p className="text-xl font-medium">
            {post?.author?.username || "Unknown User"}
          </p>

          <div className="flex items-center space-x-4 ml-6">
            <Button variant="ghost" size="sm">
              <MessageCircleIcon className="h-5 w-5 mr-1" />
              {post?.comments?.length || 0}
            </Button>

            {isAuthor && (
              <div className="flex gap-2">
                <Link href={`/blog/${post._id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* COVER IMAGE */}
      {post?.coverImage && (
        <img
          src={post?.coverImage}
          className="w-full h-96 object-cover rounded-lg mb-6"
          alt={post.title}
        />
      )}

      {/* ✅ SINGLE DESCRIPTION ONLY (below cover image) */}
      {description && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-8">
          <p className="text-gray-700 text-lg break-words">
            {descExpanded ? description : shortDesc}
            {!descExpanded && showToggle ? "..." : ""}
          </p>

          {showToggle && (
            <Button
              type="button"
              variant="link"
              className="px-0 mt-2"
              onClick={() => setDescExpanded((v) => !v)}
            >
              {descExpanded ? "Read less" : "Read more"}
            </Button>
          )}
        </div>
      )}

      {/* COMMENT FORM */}
      <form onSubmit={handleSubmit(onCommentSubmit)} className="mt-8">
        <Textarea
          placeholder="Add a comment..."
          className="w-full mb-4"
          rows={4}
          {...register("content")}
        />

        {/* ✅ Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2 mb-4">
            <Progress value={uploadProgress} />
            <p className="text-xs text-gray-500">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Comment"}
        </Button>
      </form>

      {/* COMMENTS LIST */}
      <div className="my-8">
        <h3 className="text-xl font-bold mb-4">
          Comments {post?.comments?.length || 0}
        </h3>

        <div className="border rounded-lg p-4 space-y-4 max-h-[350px] overflow-y-auto">
          {post?.comments?.length ? (
            post.comments.map((comment, index) => {
              const name = comment?.author?.username || "Unknown User";

              return (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar>
                      <AvatarFallback>{name?.[0] || "U"}</AvatarFallback>
                    </Avatar>

                    <p className="font-medium">{name}</p>
                  </div>

                  <p className="break-words whitespace-pre-wrap">
                    {comment?.content}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlogDetails;
