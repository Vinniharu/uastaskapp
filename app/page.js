"use client";

import { DashboardLayout } from "./components/DashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/staff/login");
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your task management dashboard
        </p>
      </div>
    </DashboardLayout>
  );
}
