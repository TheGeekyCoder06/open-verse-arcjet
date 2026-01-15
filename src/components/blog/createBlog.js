"use client";

import { Controller, useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
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

  // ✅ Upload progress states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(""); // Uploading... | Upload Complete ✅
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileSize, setUploadFileSize] = useState(0);

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

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  const onBlogSubmit = async (data) => {
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

  const isBtnDisabled = () =>
    title === "" || category === "" || content === "" || isUploading;

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

          {/* ✅ Upload Button + Progress */}
          <div className="flex flex-col mb-6">
            <UploadButton
              endpoint="imageUploader"
              disabled={isUploading} // ✅ disable upload button
              content={{
                button: (
                  <div
                    className={`flex gap-3 px-4 py-2 rounded-md items-center ${
                      isUploading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-black"
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 text-white" />
                    <span className="text-[12px] text-white">
                      {isUploading ? "Uploading..." : "Add Cover Image"}
                    </span>
                  </div>
                ),
              }}
              appearance={{ allowedContent: { display: "none" } }}
              className="mt-4 ut-button:bg-black ut-button:ut-readying:bg-black"
              onUploadBegin={(fileName) => {
                setIsUploading(true);
                setUploadProgress(0);
                setUploadStatus("Uploading...");
                setUploadFileName(fileName || "");
                setUploadFileSize(0);
              }}
              onUploadProgress={(progress) => {
                setUploadProgress(progress);
              }}
              onClientUploadComplete={(res) => {
                const file = res?.[0];

                const url = file?.ufsUrl || file?.url;
                const name = file?.name || uploadFileName || "cover-image";
                const size = file?.size || 0;

                if (url) {
                  setValue("coverImage", url, { shouldValidate: true });

                  toast({
                    title: "Image uploaded",
                    description: "Cover image added successfully",
                  });
                }

                setUploadFileName(name);
                setUploadFileSize(size);

                setUploadProgress(100);
                setUploadStatus("Upload Complete ✅");

                setTimeout(() => {
                  setIsUploading(false);
                  setUploadProgress(0);
                  setUploadStatus("");
                }, 1500);
              }}
              onUploadError={(error) => {
                setIsUploading(false);
                setUploadProgress(0);
                setUploadStatus("");
                setUploadFileName("");
                setUploadFileSize(0);

                toast({
                  title: "Error",
                  description: `Upload Failed: ${error.message}`,
                  variant: "destructive",
                });
              }}
            />

            {/* ✅ Progress Area */}
            {(isUploading || uploadStatus) && (
              <div className="space-y-2 mt-3 border rounded-md p-3 bg-gray-50">
                {(uploadFileName || uploadFileSize) && (
                  <p className="text-xs text-gray-700 break-words">
                    <span className="font-medium">{uploadFileName}</span>
                    {uploadFileSize ? ` • ${formatFileSize(uploadFileSize)}` : ""}
                  </p>
                )}

                {isUploading && (
                  <>
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-gray-500">
                      Uploading... {uploadProgress}%
                    </p>
                  </>
                )}

                {!isUploading && uploadStatus === "Upload Complete ✅" && (
                  <p className="text-xs text-green-600 font-medium">
                    Upload Complete ✅
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Cover Preview */}
          {coverImage && (
            <img
              src={coverImage}
              alt="Cover preview"
              className="mt-3 w-full max-h-64 object-cover rounded-md border"
            />
          )}

          {/* Quill Editor */}
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

          {/* Submit button */}
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || isBtnDisabled()}
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
