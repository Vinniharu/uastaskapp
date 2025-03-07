"use client";

import { useEffect } from "react";
import { DashboardLayout } from "@/app/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TaskError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Task detail error:", error);
  }, [error]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2"
          onClick={() => router.push("/staff/tasks")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "Something went wrong while loading the task."}
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <h2 className="text-2xl font-bold">Error Loading Task</h2>
          <p className="text-muted-foreground text-center max-w-md">
            We encountered an error while trying to load this task. This could be due to a network issue or a problem with our servers.
          </p>
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={() => reset()}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/staff/tasks")}
            >
              Return to Tasks
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 