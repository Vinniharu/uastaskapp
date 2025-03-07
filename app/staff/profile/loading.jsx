import { DashboardLayout } from "@/app/components/DashboardLayout";
import { Card } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <Card className="md:col-span-1">
            <div className="p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse mb-4"></div>
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mt-2"></div>
              </div>
              
              <div className="space-y-3 pt-4 border-t mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mr-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          
          {/* Task Statistics Card */}
          <Card className="md:col-span-2">
            <div className="p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 animate-pulse"></div>
              </div>
            </div>
          </Card>
          
          {/* Account Details Card */}
          <Card className="md:col-span-3">
            <div className="p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 