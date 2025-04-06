"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/app/components/DashboardLayout";
import { useAuthCheck } from "@/lib/auth-utils";
import { getUserProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, User, Mail, Calendar, Briefcase } from "lucide-react";

export default function StaffProfile() {
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

  // Fetch profile data
  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile();
      setProfileData(data);
      setError("");
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If not authenticated, don't render anything (handled by useAuthCheck)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500">Loading profile data...</p>
          </div>
        ) : profileData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Overview Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <User className="h-12 w-12 text-gray-500" />
                  </div>
                  <h2 className="text-xl font-bold">{profileData.firstName} {profileData.lastName}</h2>
                  <Badge variant={profileData.role === "admin" ? "admin" : "staff"} className="mt-2">
                    {profileData.role ? (profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)) : 'Staff'}
                  </Badge>
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{profileData.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">Staff ID: {profileData.staffId}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">Joined: {new Date(profileData.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant={profileData.isActive ? "success" : "outline"} className="mt-2">
                      {profileData.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Task Statistics Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Task Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Assigned Tasks</p>
                    <p className="text-3xl font-bold">{profileData.totalAssignedTasks}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Completed Tasks</p>
                    <p className="text-3xl font-bold">{profileData.completedTasks}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Pending Tasks</p>
                    <p className="text-3xl font-bold">{profileData.pendingTasks}</p>
                  </div>
                </div>
                
                {/* Completion Rate */}
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-medium">
                      {profileData.totalAssignedTasks > 0 
                        ? Math.round((profileData.completedTasks / profileData.totalAssignedTasks) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${profileData.totalAssignedTasks > 0 
                          ? Math.round((profileData.completedTasks / profileData.totalAssignedTasks) * 100) 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Account Details Card */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                    <p className="text-base">{profileData.firstName} {profileData.lastName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email Address</h3>
                    <p className="text-base">{profileData.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Staff ID</h3>
                    <p className="text-base">{profileData.staffId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
                    <p className="text-base">{profileData.role ? (profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)) : 'Staff'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Account Created</h3>
                    <p className="text-base">{new Date(profileData.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                    <p className="text-base">{new Date(profileData.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500">No profile data available.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 