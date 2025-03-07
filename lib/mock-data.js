/**
 * Mock data for tasks
 */
export const mockTasks = [
  {
    id: "1",
    title: "Complete project documentation",
    description: "Write comprehensive documentation for the new feature",
    priority: "high",
    status: "in-progress",
    dateAdded: "2023-03-01",
    deadline: "2023-03-15",
    assignedTo: null, // Will be set dynamically based on the logged-in user
  },
  {
    id: "2",
    title: "Fix login bug",
    description: "Resolve the issue with login authentication",
    priority: "urgent",
    status: "pending",
    dateAdded: "2023-03-02",
    deadline: "2023-03-10",
    assignedTo: null, // Will be set dynamically based on the logged-in user
  },
  {
    id: "3",
    title: "Design new landing page",
    description: "Create mockups for the new landing page",
    priority: "medium",
    status: "in-progress",
    dateAdded: "2023-03-03",
    deadline: "2023-03-20",
    assignedTo: null, // Will be set dynamically based on the logged-in user
  },
  {
    id: "4",
    title: "Update user profile settings",
    description: "Add new fields to user profile settings",
    priority: "low",
    status: "completed",
    dateAdded: "2023-02-25",
    deadline: "2023-03-05",
    assignedTo: null, // Will be set dynamically based on the logged-in user
  },
  {
    id: "5",
    title: "Implement payment gateway",
    description: "Integrate Stripe payment gateway",
    priority: "high",
    status: "pending",
    dateAdded: "2023-03-04",
    deadline: "2023-03-25",
    assignedTo: null, // Will be set dynamically based on the logged-in user
  },
];

/**
 * Task status options
 * Note: Staff can only set tasks to pending, in-progress, or review statuses.
 * Only admins can mark tasks as completed after review.
 */
export const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { value: "review", label: "Under Review", color: "bg-purple-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" }, // Only available to admins
];

/**
 * Priority badges
 */
export const priorityBadges = {
  low: { variant: "outline", label: "Low" },
  medium: { variant: "default", label: "Medium" },
  high: { 
    variant: "destructive", 
    label: "High", 
    className: "bg-red-600 text-white font-semibold border border-red-700" 
  },
  urgent: { 
    variant: "destructive", 
    label: "Urgent", 
    className: "bg-red-600 text-white font-semibold border border-red-700 animate-pulse" 
  },
}; 