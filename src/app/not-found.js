import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-sm text-muted-foreground">
        The page you’re looking for doesn’t exist.
      </p>

      <Button asChild>
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  );
}
