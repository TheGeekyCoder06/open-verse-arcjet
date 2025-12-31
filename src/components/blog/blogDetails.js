"use client";

import { MessageCircleIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addCommentAction } from "@/actions/blogInteractions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const schema = z.object({
  content: z.string().min(1, "Comment is required"),
});

function BlogDetails({ post }) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const { toast } = useToast();
  const router = useRouter();

  async function onCommentSubmit(data) {
    setIsLoading(true);

    try {
      const result = await addCommentAction({
        ...data,
        postId: post._id,
      });

      if (!result?.success) {
        throw new Error(result?.error || "Failed to add comment");
      }

      toast({
        title: "Success",
        description: "Comment added successfully",
      });

      reset();
      router.refresh(); // 🔄 reload page -> fetch populated comments
    } catch (e) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
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
              {post?.comments?.length}
            </Button>
          </div>
        </div>
      </header>

      {/* COVER IMAGE */}
      {post?.coverImage && (
        <img
          src={post?.coverImage}
          className="w-full h-96 object-cover rounded-lg mb-8"
        />
      )}

      {/* CONTENT */}
      <article className="prose lg:prose-xl">
        <div dangerouslySetInnerHTML={{ __html: post?.content }} />
      </article>

      {/* COMMENT FORM */}
      <form onSubmit={handleSubmit(onCommentSubmit)} className="mt-8">
        <Textarea
          placeholder="Add a comment..."
          className="w-full mb-4"
          rows={4}
          {...register("content")}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Comment"}
        </Button>
      </form>

      {/* COMMENTS LIST */}
      <div className="my-8">
        <h3 className="text-xl font-bold mb-4">
          Comments {post?.comments?.length}
        </h3>

        {post?.comments?.map((comment, index) => {
          const name =
            comment?.author?.username || "Unknown User";

          return (
            <div key={index} className="border-b py-4">
              <div className="flex items-center space-x-2 mb-2">
                <Avatar>
                  <AvatarFallback>{name?.[0] || "U"}</AvatarFallback>
                </Avatar>

                <p className="font-medium">{name}</p>
              </div>

              <p>{comment?.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BlogDetails;