"use client";

import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser } from "@/actions/register";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import React from "react";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data);

      if (result?.success) {
        toast.success("Registration successful");
        router.push("/login");
      } else {
        toast.error(result?.message || "Registration failed");
      }

      console.log("Registration result:", result);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">

        <div className="space-y-1">
          <div className="relative flex items-center">
            <User className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              {...register("username")}
              type="text"
              placeholder="Username"
              autoComplete="off"
              className={`pl-9 ${errors.username ? "ring-1 ring-red-500 border-red-400" : ""}`}
            />
          </div>
          {errors.username && (
            <p className="text-xs text-red-500">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="relative flex items-center">
            <Mail className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              {...register("email")}
              type="email"
              placeholder="Email"
              className={`pl-9 ${errors.email ? "ring-1 ring-red-500 border-red-400" : ""}`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="relative flex items-center">
            <Lock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`pl-9 pr-9 ${errors.password ? "ring-1 ring-red-500 border-red-400" : ""}`}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2 cursor-pointer" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </div>
    </form>
  );
}
