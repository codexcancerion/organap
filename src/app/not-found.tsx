import Link from "next/link";
import { Button } from "@heroui/react";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 rounded-3xl bg-accent/10 text-accent mb-4 font-bold text-2xl">
        404
      </div>
      <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
      <p className="text-muted text-sm max-w-sm mt-1 mb-6">
        The page you requested could not be located or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button size="md" variant="primary">
            <Home size={16} />
            Return Home
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="md" variant="secondary">
            <ArrowLeft size={16} />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
