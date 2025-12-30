"use client";

import { Controller, useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { UploadButton } from "@uploadthing/react";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

import "react-quill-new/dist/quill.snow.css";
import "./quill-custom.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BLOG_CATEGORIES } from "@/lib/categories";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "category is required"),
  coverImage: z.string().min(1, "Image is required"),
});

const isSuspiciousContent = (data) => {
  const suspiciousPatterns = [
    /<script>/i,
    /javascript:/i,
    /onload=/i,
    /onclick=/i,
    /'.*OR.*'/i,
    /UNION SELECT/i,
  ];
  return suspiciousPatterns.some((p) => p.test(data.content));
};

function CreateBlogForm({ user }) {
  const [quillLoaded, setQuillLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const quillRef = useRef(null);

  const router = useRouter();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      coverImage: "",
    },
  });

  const title = watch("title");
  const category = watch("category");
  const content = watch("content");
  const coverImage = watch("coverImage");

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["blockquote", "code-block"],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  // ✅ FINAL SUBMIT HANDLER (with guaranteed redirect)
  const onBlogSubmit = async (data) => {
    console.log("Submitting blog with data:", data);
    if (!data.coverImage) {
      toast({
        title: "Image required",
        description: "Please upload a cover image before publishing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const suspicious = isSuspiciousContent(data);

      const res = await fetch("/api/create-blog-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-arcjet-suspicious": suspicious.toString(),
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result?.success) {
        toast({
          title: "Error",
          description: result?.error || "Failed to create blog",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Blog Published",
        description: "Your post has been published successfully",
      });

      router.push("/");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => setQuillLoaded(true), []);

  const isBtnDisabled = () => title === "" || category === "" || content === "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <p className="font-semibold">{user?.userName}</p>
        </div>
      </header>

      <main>
        {/* ✅ form submit now drives the handler */}
        <form onSubmit={handleSubmit(onBlogSubmit)}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="Title"
                className="text-4xl font-bold border-none outline-none mb-4 p-0 focus-visible:ring-0"
              />
            )}
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-2">{errors.title.message}</p>
          )}

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Category" />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {/* Upload Button */}
          <div className="flex items-center mb-6">
            <UploadButton
              endpoint="imageUploader"
              content={{
                button: (
                  <div className="flex gap-3 bg-black px-4 py-2 rounded-md items-center">
                    <PlusCircle className="h-4 w-4 text-white" />
                    <span className="text-[12px]">Add Cover Image</span>
                  </div>
                ),
              }}
              appearance={{ allowedContent: { display: "none" } }}
              className="mt-4 ut-button:bg-black ut-button:ut-readying:bg-black"
              onClientUploadComplete={(res) => {
                const file = res?.[0];

                // UploadThing v8+ returns ufsUrl (file.url is deprecated)
                const url = file?.ufsUrl || file?.url;

                if (url) {
                  setValue("coverImage", url, { shouldValidate: true });

                  toast({
                    title: "Image uploaded",
                    description: "Cover image added successfully",
                  });
                } else {
                  console.warn("No file URL returned:", file);
                }
              }}
              onUploadError={(error) => {
                toast({
                  title: "Error",
                  description: `Upload Failed: ${error.message}`,
                  variant: "destructive",
                });
              }}
            />
          </div>

          {coverImage && (
            <img
              src={coverImage}
              alt="Cover preview"
              className="mt-3 w-full max-h-64 object-cover rounded-md border"
            />
          )}

          {quillLoaded && (
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  modules={modules}
                  {...field}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Write your story..."
                  className="quill-editor"
                />
              )}
            />
          )}

          {/* ✅ Submit button INSIDE form */}
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className={"cursor-pointer"}
            >
              {isLoading ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateBlogForm;
