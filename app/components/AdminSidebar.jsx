"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  History,
  Users,
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const adminRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Create Task",
    icon: PlusCircle,
    href: "/admin/create-task",
    color: "text-green-500",
  },
  {
    label: "Current Tasks",
    icon: ClipboardList,
    href: "/admin/current-tasks",
    color: "text-violet-500",
  },
  {
    label: "Task History",
    icon: History,
    href: "/admin/task-history",
    color: "text-amber-500",
  },
  {
    label: "Staff Management",
    icon: Users,
    href: "/admin/staff",
    color: "text-blue-500",
  },
];

export function AdminSidebar({ mobile, onClose }) {
  const router = useRouter();
  const { logoutStaff } = useAuth();
  
  const handleLogout = () => {
    logoutStaff();
    router.push("/staff/login");
    if (mobile && onClose) {
      onClose();
    }
  };
  
  return (
    <div className={cn(
      "space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white",
      mobile && "bg-[#111827]/95 backdrop-blur-sm"
    )}>
      <div className="px-3 py-2 flex-1">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center pl-3 mb-14"
          onClick={mobile ? onClose : undefined}
        >
          <div className="flex flex-col">
          <Image src={"/mainlogo.jpg"} alt="Office Logo" width={80} height={80}/>
            {/* <h1 className="text-2xl font-bold">TaskApp</h1> */}
            <span className="text-xs text-gray-400">Admin Dashboard</span>
          </div>
        </Link>
        <div className="space-y-1">
          {adminRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={mobile ? onClose : undefined}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                mobile && "text-base"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Logout Button */}
      <div className="px-6 py-3 border-t border-gray-700">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sm font-medium text-white hover:text-white hover:bg-white/10 rounded-lg transition"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3 text-red-400" />
          Logout
        </Button>
      </div>
    </div>
  );
} 