"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Settings,
  LogIn,
  LogOut,
  UserPlus,
    User,
  History
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/staff/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Tasks",
    icon: ListTodo,
    href: "/staff/tasks",
    color: "text-violet-500",
  },
  {
    label: "Task History",
    icon: History,
    href: "/staff/task-history",
    color: "text-blue-500",
  },
  {
    label: "Profile",
    icon: User,
    href: "/staff/profile",
    color: "text-blue-500",
    requiresAuth: true,
  }
];

export function Sidebar({ mobile, onClose }) {
  const { isStaffLoggedIn, logoutStaff } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    if (mobile && onClose) onClose();
    router.push("/staff/login");
  };

  const handleSignup = () => {
    if (mobile && onClose) onClose();
    router.push("/staff/signup");
  };

  const handleLogout = () => {
    logoutStaff();
    if (mobile && onClose) onClose();
  };

  return (
    <div className={cn(
      "space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white",
      mobile && "bg-[#111827]/95 backdrop-blur-sm"
    )}>
      <div className="px-3 py-2 flex-1">
        <Link 
          href="/" 
          className="flex items-center pl-3 mb-14"
          onClick={mobile ? onClose : undefined}
        >
          <h1 className="text-2xl font-bold">TaskApp</h1>
        </Link>
        <div className="space-y-1">
          {routes
            .filter(route => !route.requiresAuth || (route.requiresAuth && isStaffLoggedIn))
            .map((route) => (
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
      <div className="px-3 py-2 space-y-2">
        {!isStaffLoggedIn ? (
          <>
            <Button 
              className="w-full bg-white/10 hover:bg-white/20" 
              variant="ghost"
              onClick={handleLogin}
            >
              <LogIn className="h-5 w-5 mr-2" />
              Staff Login
            </Button>
            <Button 
              className="w-full bg-white/10 hover:bg-white/20" 
              variant="ghost"
              onClick={handleSignup}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Staff Signup
            </Button>
          </>
        ) : (
          <Button 
            className="w-full bg-white/10 hover:bg-white/20" 
            variant="ghost"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
} 