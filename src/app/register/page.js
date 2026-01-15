import RegisterForm from "@/components/auth/RegisterForm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function RegisterPage() {
  const token = (await cookies()).get("auth_token")?.value;
  if(token){
    redirect("/");
  }
  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Register to get started with the platform
          </p>

          <RegisterForm />

          <p className="mt-4 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium underline underline-offset-4 hover:text-foreground"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden md:block relative">
        <img
          src="/images/auth-illustration.jpg"
          alt="Register Illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
