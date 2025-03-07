"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  User, 
  ArrowLeft,
  FileText,
  AlertTriangle
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function CompletedTaskView({ task, onBack }) {
  // Remove the activeTab state and just use "details" as the only tab
  const [activeTab, setActiveTab] = useState("details");
  
  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-600 text-white font-semibold border border-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
      default:
        return "bg-green-100 text-green-800";
    }
  };
  
  // Check if task was completed after due date
  const wasCompletedLate = task.dueDate && new Date(task.updatedAt) > new Date(task.dueDate);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Task History
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={getPriorityBadge(task.priority)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </Badge>
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  Completed
                </Badge>
                {wasCompletedLate && (
                  <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Completed Late
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Remove the tabs list and just keep the details tab */}
          <div className="space-y-6">
            {/* Task Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-sm whitespace-pre-wrap p-3 bg-gray-50 rounded-md">
                {task.description || "No description provided"}
              </p>
            </div>
            
            {/* Task Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                <div className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {task.assignedTo ? 
                    `${task.assignedTo.firstName} ${task.assignedTo.lastName} (ID: ${task.assignedTo.id})` : 
                    'Unassigned'}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <div className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Created Date</h3>
                <div className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {formatDate(task.createdAt)}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Completed Date</h3>
                <div className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {formatDate(task.updatedAt)}
                </div>
              </div>
            </div>
            
            {/* Task Timeline */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Task Timeline</h3>
              <div className="border-l-2 border-gray-200 pl-4 space-y-4 py-2">
                <div className="relative">
                  <div className="absolute -left-[21px] h-4 w-4 rounded-full bg-blue-500"></div>
                  <p className="text-sm font-medium">Task Created</p>
                  <p className="text-xs text-gray-500">{formatDate(task.createdAt)}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] h-4 w-4 rounded-full bg-green-500"></div>
                  <p className="text-sm font-medium">Task Completed</p>
                  <p className="text-xs text-gray-500">{formatDate(task.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Remove the comments tab content */}
        </CardContent>
      </Card>
    </div>
  );
} 