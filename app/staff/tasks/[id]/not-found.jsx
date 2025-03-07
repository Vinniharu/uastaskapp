"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TaskNotFound() {
  const router = useRouter();

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
            Task not found. The task you're looking for may have been deleted or doesn't exist.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <h2 className="text-2xl font-bold">Task Not Found</h2>
          <p className="text-muted-foreground text-center max-w-md">
            We couldn't find the task you're looking for. It may have been deleted or you might not have permission to view it.
          </p>
          <Button 
            onClick={() => router.push("/staff/tasks")}
            className="mt-4"
          >
            Return to Tasks
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
} 