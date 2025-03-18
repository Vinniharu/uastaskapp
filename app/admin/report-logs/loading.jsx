import { AdminLayout } from "@/app/components/AdminLayout";
import { Card } from "@/components/ui/card";

export default function ReportLogsLoading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-[150px] bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-[150px] bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-[150px] bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <Card>
          <div className="p-6">
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse mb-4"></div>
            
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
} 