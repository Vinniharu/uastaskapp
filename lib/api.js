/**
 * Utility functions for making API calls
 */

// Import auth context (can't use useAuth hook directly here)
let getAuthHeaders = () => ({});

// Function to set the auth headers getter
export function setAuthHeadersGetter(getter) {
  getAuthHeaders = getter;
}

// Create or modify your api.js file
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth headers from the getter function
  const authHeaders = getAuthHeaders();
  
  // // Debug log
  // console.log('Making API request:', {
  //   url,
  //   authHeaders: authHeaders.Authorization ? 'Present' : 'Missing',
  // });

  // Set up default options
  const defaultOptions = {
    headers: {
      ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...authHeaders,
    },
  };

  // Merge the default options with the provided options
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  // Remove Content-Type header for FormData
  if (options.body instanceof FormData) {
    delete finalOptions.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      // Try to parse error response as JSON
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If not JSON, use status text
        errorData = { message: response.statusText };
      }
      
      // Enhanced error with additional info
      const error = new Error(errorData.message || `API Error (${response.status}): ${response.statusText}`);
      error.status = response.status;
      error.statusText = response.statusText;
      error.url = url;
      error.data = errorData;
      
      console.error('API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        headers: finalOptions.headers,
      });
      
      throw error;
    }
    
    // Check if the response has content before attempting to parse as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // For endpoints that don't return JSON (like 204 No Content)
      return { success: true, status: response.status };
    }
  } catch (error) {
    // If it's already a handled API error, re-throw it
    if (error.status) {
      throw error;
    }
    
    // Handle network errors
    console.error('Network error during API request:', error);
    const networkError = new Error('Network error. Please check your connection and try again.');
    networkError.originalError = error;
    throw networkError;
  }
};

/**
 * Register a new staff member with exact required format
 * @param {Object} staffData - Registration data with email, password, firstName, lastName, staffId
 * @returns {Promise<Object>} - Registration response with user data and token
 */
export async function registerStaff(staffData) {
  console.log("Calling register API with endpoint:", '/auth/register');
  
  // Verify the data structure matches exactly what's expected by the API
  const requestData = {
    email: staffData.email,
    password: staffData.password,
    firstName: staffData.firstName,
    lastName: staffData.lastName,
    staffId: staffData.staffId
  };
  
  try {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Registration API call successful");
    return result;
  } catch (error) {
    console.error("Registration API call failed:", {
      status: error.status,
      message: error.message,
      url: error.url
    });
    throw error;
  }
}

/**
 * Login a staff member
 */
export async function loginStaff(credentials) {
  return apiRequest('/auth/login', {
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
  return apiRequest('/staff-management', { method: 'GET' });
}

/**
 * Update a staff member's status
 */
export async function updateStaffStatus(staffId, statusData) {
  return apiRequest(`/staff-management/${staffId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData),
  });
}

/**
 * Get the current user's profile
 */
export async function getUserProfile() {
  return apiRequest('/users/profile', { method: 'GET' });
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
  return apiRequest('/tasks', { method: 'GET' });
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
  return apiRequest('/tasks', {
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
  return apiRequest(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(taskData),
  });
}

/**
 * Create a new staff member
 * @param {Object} staffData - The staff data
 * @returns {Promise<Object>} - The created staff member
 */
export async function createStaff(staffData) {
  return apiRequest('/staff-management', {
    method: 'POST',
    body: JSON.stringify({
      email: staffData.email,
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      staffId: staffData.staffId
    })
  });
}

/**
 * Get staff member by ID
 * @param {string|number} staffId - The ID of the staff member
 */
export async function getStaffById(staffId) {
  return apiRequest(`/staff-management/${staffId}`, { method: 'GET' });
}

/**
 * Upload staff profile picture
 * @param {string|number} staffId - The ID of the staff member
 * @param {FormData} formData - The FormData object containing the profile picture
 */
export async function uploadStaffProfilePicture(staffId, formData) {
  return apiRequest(`/staff-management/${staffId}/profile-picture`, {
    method: 'PATCH',
    body: formData,
  });
}

/**
 * Change staff password
 * @param {string|number} staffId - The ID of the staff member
 * @param {string} newPassword - The new password
 */
export async function changeStaffPassword(staffId, newPassword) {
  return apiRequest(`/staff-management/${staffId}/change-password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword }),
  });
}

/**
 * Reset staff password to default
 * @param {string|number} staffId - The ID of the staff member
 */
export async function resetStaffPassword(staffId) {
  return apiRequest(`/staff-management/${staffId}/reset-password`, {
    method: 'PATCH',
  });
}

/**
 * Get a task by ID
 * @param {string|number} taskId - The ID of the task to retrieve
 * @returns {Promise<Object>} - The task data
 */
export async function getTaskById(taskId) {
  return apiRequest(`/tasks/${taskId}`, { method: 'GET' });
}

/**
 * Get report logs for admin
 * @param {Object} params - Parameters for filtering logs
 * @param {string} [params.startDate] - Filter logs from this date (ISO format)
 * @param {string} [params.endDate] - Filter logs until this date (ISO format)
 * @param {string} [params.status] - Filter logs by status
 * @returns {Promise<Array>} - List of logs
 */
export async function getReportLogs(params = {}) {
  // Prepare query parameters
  const queryParams = new URLSearchParams();
  
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  if (params.status) {
    queryParams.append('status', params.status);
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/reports/logs${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(endpoint, { method: 'GET' });
}

/**
 * Create a new report log
 * @param {Object} logData - The log data
 * @param {string|Date} logData.date - The date of the log
 * @param {string} logData.task - The task name or ID
 * @param {string} logData.description - Detailed description
 * @param {string} logData.status - Status of the task
 * @param {string} logData.remark - Additional remarks
 * @returns {Promise<Object>} - The created log
 */
export async function createReportLog(logData) {
  return apiRequest('/reports/logs', {
    method: 'POST',
    body: JSON.stringify(logData),
  });
} 