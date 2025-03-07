"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useAuthCheck } from "@/lib/auth-utils";
import { getUserProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StaffDashboard() {
  const { staffInfo } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Check if user is authenticated, redirect to login if not
  const isAuthenticated = useAuthCheck();

  // Fetch profile data when component mounts if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [isAuthenticated]);

  // Fetch profile data from the API
  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile();
      if (data) {
        setProfileData(data);
        setError("");
      } else {
        // If API returns empty data, use staffInfo from auth context
        setProfileData(null);
        setError("No profile data available. Using session data instead.");
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile data. Using session data instead.");
      // If API call fails, we'll fall back to the session data
    } finally {
      setIsLoading(false);
    }
  };

  // If not authenticated, don't render anything (handled by useAuthCheck)
  if (!isAuthenticated) {
    return null;
  }

  // Use profile data from API if available, otherwise fall back to session data
  const userData = profileData || staffInfo;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          {userData && (
            <div className="text-gray-500">
              Welcome, {userData.fullName || `${userData.firstName} ${userData.lastName}`} 
              {userData.staffId && ` (Staff ID: ${userData.staffId})`}
              {userData.role && (
                <Badge variant={userData.role === "admin" ? "destructive" : "success"} className="ml-2">
                  {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {profileData ? (
                <div>
                  <p className="text-2xl font-bold">{profileData.totalAssignedTasks || 0}</p>
                  <p>tasks assigned to you</p>
                </div>
              ) : (
                <p>Loading task information...</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {profileData ? (
                <div>
                  <p className="text-2xl font-bold">{profileData.pendingTasks || 0}</p>
                  <p>tasks pending completion</p>
                </div>
              ) : (
                <p>Loading pending tasks...</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {profileData ? (
                <div>
                  <p className="text-2xl font-bold">{profileData.completedTasks || 0}</p>
                  <p>tasks completed</p>
                </div>
              ) : (
                <p>Loading completed tasks...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {userData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Profile</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/staff/profile")}
              >
                View Full Profile
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p>{userData.fullName || `${userData.firstName} ${userData.lastName}`}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Staff ID</p>
                    <p>{userData.staffId || "Not assigned"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p>{userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "Staff"}</p>
                  </div>
                </div>
                {profileData && profileData.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Created</p>
                    <p>{new Date(profileData.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {profileData && profileData.totalAssignedTasks > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm font-medium">
                    {Math.round((profileData.completedTasks / profileData.totalAssignedTasks) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${Math.round((profileData.completedTasks / profileData.totalAssignedTasks) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 