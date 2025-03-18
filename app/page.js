"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { isStaffLoggedIn, staffInfo } = useAuth();

  useEffect(() => {
    if (isStaffLoggedIn && staffInfo) {
      // If user is logged in, redirect to their dashboard based on role
      if (staffInfo.role === 'admin') {
        router.push("/admin/dashboard");
      } else {
        router.push("/staff/dashboard");
      }
    } else {
      // If not logged in, redirect to login page
      router.push("/staff/login");
    }
  }, [router, isStaffLoggedIn, staffInfo]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <img src="/mainlogo.jpg" alt="logo" width={100} height={100} className="animate-pulse"/>
    </div>
  );
}
