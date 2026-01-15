"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { updateBlogPostAction } from "@/actions/updateBlogs";
import { useUploadThing } from "@/lib/uploadThing";

const categories = [
  { label: "Technology", value: "technology" },
  { label: "Programming", value: "programming" },
  { label: "Web Development", value: "web-development" },
  { label: "Data Science", value: "data-science" },
  { label: "AI", value: "ai" },
  { label: "Cybersecurity", value: "cybersecurity" },
  { label: "Cloud Computing", value: "cloud-computing" },
  { label: "DevOps", value: "devops" },
  { label: "Blockchain", value: "blockchain" },
  { label: "Mobile Development", value: "mobile-development" },
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  content: z.string().min(1, "Description is required"),
});

export default function EditBlogForm({ post }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);

  // ✅ clean url saved to db
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");

  // ✅ preview always refreshes
  const [coverPreview, setCoverPreview] = useState(
    post?.coverImage ? `${post.coverImage}?v=${Date.now()}` : ""
  );

  // ✅ progress bar values
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onUploadBegin: () => {
      setUploadProgress(0);
    },
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: (res) => {
      const file = res?.[0];
      const url = file?.ufsUrl || file?.url;

      if (!url) {
        toast({
          title: "Upload Failed",
          description: "Upload finished but URL missing",
          variant: "destructive",
        });
        return;
      }

      const cleanUrl = url.split("?")[0];

      // ✅ store clean url for db
      setCoverImage(cleanUrl);

      // ✅ cache-bust preview ALWAYS
      setCoverPreview(`${cleanUrl}?v=${Date.now()}`);

      toast({
        title: "Uploaded",
        description: "Cover image updated",
      });
    },
    onUploadError: (error) => {
      toast({
        title: "Upload error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: post?.title ?? "",
      category: post?.category ?? "",
      content: post?.content ?? "",
    },
  });

  const selectedCategory = watch("category");

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    await startUpload([file]);
  }

  async function onSubmit(formData) {
    setIsSaving(true);

    try {
      if (!post?._id) throw new Error("Post ID missing");
      if (!coverImage) throw new Error("Cover image is required");

      const result = await updateBlogPostAction({
        postId: post._id,
        ...formData,
        coverImage: coverImage.split("?")[0],
      });

      if (!result?.success) {
        throw new Error(result?.error || "Failed to update blog");
      }

      toast({
        title: "Updated",
        description: "Blog updated successfully",
      });

      // ✅ redirect home
      router.push("/");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
      <h1 className="text-3xl font-bold mb-6">Edit Blog</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* TITLE */}
        <div>
          <label className="block font-medium mb-1">Title</label>
          <Input placeholder="Blog title" {...register("title")} />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* CATEGORY */}
        <div>
          <label className="block font-medium mb-1">Category</label>
          <Select
            value={selectedCategory}
            onValueChange={(value) =>
              setValue("category", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>

            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.category && (
            <p className="text-sm text-red-500 mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* COVER IMAGE UPLOAD AREA */}
        <div className="space-y-3">
          <label className="block font-medium mb-1">Cover Image</label>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl border border-dashed p-6 text-center hover:bg-muted/50 transition"
          >
            <p className="font-medium">Click to upload cover image</p>
            <p className="text-xs text-gray-500 mt-1">
              JPG / PNG / WEBP supported
            </p>
          </div>

          {/* ✅ progress bar works here */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-gray-500">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>

        {/* PREVIEW */}
        {coverPreview && (
          <div className="rounded-lg overflow-hidden border">
            <img
              key={coverPreview}
              src={coverPreview}
              alt={post?.title || "cover"}
              className="w-full h-52 object-cover"
            />
          </div>
        )}

        {/* CONTENT */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <Textarea
            rows={10}
            placeholder="Write your blog description..."
            {...register("content")}
          />
          {errors.content && (
            <p className="text-sm text-red-500 mt-1">
              {errors.content.message}
            </p>
          )}
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving || isUploading}>
            {isSaving ? "Saving..." : isUploading ? "Uploading..." : "Save Changes"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
            disabled={isSaving || isUploading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
