/**
 * Utility functions for making API calls
 */

// Import auth context (can't use useAuth hook directly here)
let getAuthHeaders = () => ({});

// Function to set the auth headers getter
export function setAuthHeadersGetter(getter) {
  getAuthHeaders = getter;
}

/**
 * Make a request to the API
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} - The response data
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const url = `${baseUrl}${endpoint}`;
  
  // Prepare request configuration
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle no content responses
    if (response.status === 204) return null;
    
    // Parse response based on content type
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') 
      ? await response.json() 
      : { message: await response.text() };

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Register a new staff member
 */
export async function registerStaff(staffData) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: staffData.email,
      password: staffData.password,
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      staffId: staffData.staffId,
    }),
  });
}

/**
 * Login a staff member
 */
export async function loginStaff(credentials) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });
}

/**
 * Get all staff members/users
 * @returns {Promise<Array>} - List of all users
 */
export async function getAllStaff() {
  return apiRequest('/api/users', { method: 'GET' });
}

// Alias for getAllStaff for better semantics
export const getAllUsers = getAllStaff;

/**
 * Update a staff member's status
 */
export async function updateStaffStatus(staffId, statusData) {
  return apiRequest(`/api/staff/${staffId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData),
  });
}

/**
 * Get the current user's profile
 */
export async function getUserProfile() {
  return apiRequest('/api/users/profile', { method: 'GET' });
}

/**
 * Get comments for a specific task
 */
export async function getTaskComments(taskId) {
  return apiRequest(`/tasks/${taskId}/comments`, { method: 'GET' });
}

/**
 * Get all tasks
 */
export async function getAllTasks() {
  return apiRequest('/api/tasks', { method: 'GET' });
}

/**
 * Get task statistics (counts by status)
 */
export async function getTaskStats() {
  const tasks = await getAllTasks();
  
  // Calculate statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter(task => task.status === 'pending').length,
    inProgress: tasks.filter(task => task.status === 'in-progress').length,
    review: tasks.filter(task => task.status === 'review').length,
    completed: tasks.filter(task => task.status === 'completed').length,
    byPriority: {
      low: tasks.filter(task => task.priority === 'low').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      high: tasks.filter(task => task.priority === 'high').length,
    },
    byAssignee: {}
  };
  
  // Count tasks by assignee
  tasks.forEach(task => {
    if (task.assignedTo) {
      const assigneeId = task.assignedTo.id;
      const assigneeName = `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;
      
      if (!stats.byAssignee[assigneeId]) {
        stats.byAssignee[assigneeId] = {
          name: assigneeName,
          staffId: task.assignedTo.staffId,
          count: 0
        };
      }
      
      stats.byAssignee[assigneeId].count++;
    }
  });
  
  return stats;
}

/**
 * Create a new task
 * @param {Object} taskData - The task data
 * @returns {Promise<any>} - The created task
 */
export async function createTask(taskData) {
  return apiRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

/**
 * Update a task
 * @param {number|string} taskId - The ID of the task to update
 * @param {Object} taskData - The updated task data
 * @returns {Promise<any>} - The updated task
 */
export async function updateTask(taskId, taskData) {
  return apiRequest(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(taskData),
  });
} 