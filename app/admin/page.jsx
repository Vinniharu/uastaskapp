"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Here you would typically handle authentication
    // For now, we'll just redirect to the dashboard
    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Task App Admin Login</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="userId" 
              className="text-sm font-medium text-gray-700"
            >
              User ID
            </label>
            <Input
              id="userId"
              type="text"
              required
              placeholder="Enter your user ID"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#111827] hover:bg-gray-900 text-white"
          >
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
} 