'use client';

import { User, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default function RegisterForm() {
  const [isLoading, setIsLoading] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    setIsLoading(true);
    console.log(data);
    setTimeout(() => setIsLoading(false), 800);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">

        {/* Username */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            {...register("username")}
            type="text"
            placeholder="Username"
            className={`pl-9 ${errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            autoComplete="off"
            />
          {errors.username && (
            <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            {...register("email")}
            type="email"
            placeholder="Email"
            className={`pl-9 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            {...register("password")}
            type="password"
            placeholder="Password"
            className={`pl-9 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </div>
    </form>
  );
}
