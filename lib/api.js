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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth headers from the getter function
  const authHeaders = getAuthHeaders();
  
  // Enable debug logging to see API requests
  console.log('Making API request:', {
    url,
    method: options.method || 'GET',
    authHeaders: authHeaders.Authorization ? 'Present' : 'Missing',
  });

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
    console.log(`Sending ${finalOptions.method} request to ${url}`);
    
    const response = await fetch(url, finalOptions);
    
    console.log(`Response received from ${url}, status: ${response.status}`);
    
    if (!response.ok) {
      // Try to parse error response as JSON
      let errorData;
      try {
        errorData = await response.json();
        console.log('Error response data:', errorData);
      } catch (e) {
        // If not JSON, try to get text
        try {
          const textResponse = await response.text();
          console.log('Error response text:', textResponse);
          errorData = { message: textResponse || response.statusText };
        } catch (textError) {
          // If can't get text, use status text
          console.log('Error getting response text:', textError);
          errorData = { message: response.statusText };
        }
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
        method: finalOptions.method,
      });
      
      throw error;
    }
    
    // Check if the response has content before attempting to parse as JSON
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const jsonResponse = await response.json();
      console.log(`JSON response from ${url}:`, jsonResponse);
      return jsonResponse;
    } else {
      // For endpoints that don't return JSON (like 204 No Content)
      console.log(`Non-JSON response from ${url}, status: ${response.status}`);
      return { success: true, status: response.status };
    }
  } catch (error) {
    // If it's already a handled API error, re-throw it
    if (error.status) {
      throw error;
    }
    
    // Handle network errors
    console.error('Network error during API request:', error);
    const networkError = new Error(`Network error: ${error.message}. Please check your connection and try again.`);
    networkError.originalError = error;
    networkError.url = url;
    networkError.method = finalOptions.method;
    
    throw networkError;
  }
};

/**
 * Register a new staff member with exact required format
 * @param {Object|FormData} staffData - Registration data with email, password, firstName, lastName, staffId, phoneNumber, department, and profilePicture
 * @returns {Promise<Object>} - Registration response with user data and token
 */
export async function registerStaff(staffData) {
  console.log("Calling register API with endpoint:", '/auth/register');
  
  try {
    let formData;
    
    if (staffData instanceof FormData) {
      // Already FormData, but we need to check for naming inconsistencies
      formData = new FormData();
      
      // Copy all fields, correcting any name issues
      for (let [key, value] of staffData.entries()) {
        // Check if we need to rename profilePhoto to profilePicture
        if (key === 'profilePhoto') {
          console.log("Renaming field from profilePhoto to profilePicture");
          formData.append('profilePicture', value);
        } else {
          formData.append(key, value);
        }
      }
      
      console.log("Using corrected FormData for registration");
    } else {
      // Convert JSON object to FormData
      formData = new FormData();
      
      // Add required fields
      formData.append('email', staffData.email);
      formData.append('password', staffData.password);
      formData.append('firstName', staffData.firstName);
      formData.append('lastName', staffData.lastName);
      formData.append('staffId', staffData.staffId);
      
      // Add optional fields if present
      if (staffData.phoneNumber) {
        formData.append('phoneNumber', staffData.phoneNumber);
      }
      
      if (staffData.department) {
        formData.append('department', staffData.department);
      }
      
      // Handle profile picture field with correct name
      if (staffData.profilePicture instanceof File) {
        formData.append('profilePicture', staffData.profilePicture);
      } else if (staffData.profilePhoto instanceof File) {
        // Handle the case where it might be named profilePhoto
        console.log("Using profilePhoto field with profilePicture name");
        formData.append('profilePicture', staffData.profilePhoto);
      }
      
      console.log("Created FormData from object for registration");
    }
    
    // Log the form data fields for debugging
    console.log("FormData fields for registration:");
    for (let [key, value] of formData.entries()) {
      // Don't log the actual file data, just its presence
      const logValue = value instanceof File 
        ? `[File: ${value.name}, ${value.type}, ${value.size} bytes]` 
        : value;
      console.log(`${key}: ${logValue}`);
    }
    
    // Make the API request with FormData
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: formData
      // No need to set Content-Type - browser will set it with boundary
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
 * Login staff member
 * @param {Object} credentials - The login credentials
 * @param {string} credentials.email - The staff member's email or staff ID
 * @param {string} credentials.password - The staff member's password
 * @returns {Promise<Object>} - The login response
 */
export async function loginStaff(credentials) {
  // Check if the input is an email or staff ID
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email);
  
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      [isEmail ? 'email' : 'staffId']: credentials.email,
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
 * Delete a task
 * @param {number|string} taskId - The ID of the task to delete
 * @returns {Promise<any>} - The result of the delete operation
 */
export async function deleteTask(taskId) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

/**
 * Update a task's status
 * @param {number|string} taskId - The ID of the task to update
 * @param {string} status - The new status for the task
 * @returns {Promise<any>} - The updated task
 */
export async function updateTaskStatus(taskId, status) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Create a new staff member
 * @param {Object} staffData - The staff data including email, firstName, lastName, staffId, phoneNumber, department
 * @returns {Promise<Object>} - The created staff member
 */
export async function createStaff(staffData) {
  return apiRequest('/staff-management', {
    method: 'POST',
    body: JSON.stringify({
      email: staffData.email,
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      staffId: staffData.staffId,
      phoneNumber: staffData.phoneNumber,
      department: staffData.department
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
 * Delete a staff member
 * @param {string|number} staffId - The ID of the staff member to delete
 * @returns {Promise<Object>} - The result of the delete operation
 */
export async function deleteStaff(staffId) {
  if (!staffId) {
    console.error('Staff ID is required for deletion');
    throw new Error('Staff ID is required for deletion');
  }
  
  console.log(`Attempting to delete staff member with ID: ${staffId}`);
  
  try {
    // Use a direct fetch call instead of apiRequest to bypass any potential issues
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    const url = `${API_BASE_URL}/staff-management/${staffId}`;
    
    console.log(`Making direct DELETE request to: ${url}`);
    
    // Get auth headers
    const authHeaders = getAuthHeaders();
    
    // Make the direct fetch call
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...authHeaders
      }
    });
    
    console.log(`Delete response status: ${response.status}`);
    console.log(`Delete response statusText: ${response.statusText}`);
    
    // Handle non-ok responses
    if (!response.ok) {
      let errorMessage;
      
      try {
        // Try to parse as JSON
        const errorData = await response.json();
        console.error('Delete error response data:', errorData);
        errorMessage = errorData.message || `Server error: ${response.status} ${response.statusText}`;
      } catch (e) {
        // If not JSON, try to get text
        try {
          const textResponse = await response.text();
          console.error('Delete error response text:', textResponse);
          errorMessage = textResponse || `Server error: ${response.status} ${response.statusText}`;
        } catch (textError) {
          // If can't get text, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // If we got here, the call was successful
    let responseData;
    
    // Check if the response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
      console.log('Delete response data:', responseData);
    } else {
      // For endpoints that don't return JSON (like 204 No Content)
      responseData = { success: true, status: response.status };
      console.log('Delete successful with no content');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error deleting staff member:', {
      staffId,
      error: error.message,
      stack: error.stack
    });
    
    // Throw a more informative error
    throw new Error(`Failed to delete staff member: ${error.message}`);
  }
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
 * Get all report logs with optional filtering and pagination
 * @param {Object} params - Optional query parameters like page, limit, startDate, endDate, status, department, search
 * @returns {Promise<Array>} - The list of report logs
 */
export async function getReportLogs(params = {}) {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `/reports/logs${queryString ? `?${queryString}` : ''}`;
    
    console.log('Calling getReportLogs API endpoint:', endpoint);
    
    const response = await apiRequest(endpoint, { method: 'GET' });
    console.log('getReportLogs response:', response);
    
    return response;
  } catch (error) {
    console.error('Error in getReportLogs:', error);
    throw error;
  }
}

/**
 * Get a report log by ID
 * @param {string|number} logId - The ID of the report log to retrieve
 * @returns {Promise<Object>} - The report log data
 */
export async function getReportLogById(logId) {
  return apiRequest(`/reports/logs/${logId}`, { method: 'GET' });
}

/**
 * Create a new report log
 * @param {Object} logData - The report log data
 * @returns {Promise<Object>} - The created report log
 */
export async function createReportLog(logData) {
  return apiRequest('/reports/logs', {
    method: 'POST',
    body: JSON.stringify(logData),
  });
}

/**
 * Update an existing report log
 * @param {string|number} logId - The ID of the report log to update
 * @param {Object} logData - The updated report log data
 * @returns {Promise<Object>} - The updated report log
 */
export async function updateReportLog(logId, logData) {
  return apiRequest(`/reports/logs/${logId}`, {
    method: 'PATCH',
    body: JSON.stringify(logData),
  });
}

/**
 * Delete a report log
 * @param {string|number} logId - The ID of the report log to delete
 * @returns {Promise<Object>} - The result of the delete operation
 */
export async function deleteReportLog(logId) {
  return apiRequest(`/reports/logs/${logId}`, { method: 'DELETE' });
}

/**
 * Upload files for a report log
 * @param {string|number} logId - The ID of the log to attach files to
 * @param {FormData} formData - FormData containing the files
 * @returns {Promise<Object>} - The result of the upload operation with file data
 */
export async function uploadReportLogFiles(logId, formData) {
  // Use the endpoint with the logId as a query parameter
  console.log(`Uploading files for log ID: ${logId}`);
  console.log(`FormData contains files: ${formData.getAll('files').length}`);
  
  return apiRequest(`/reports/logs/files?logId=${logId}`, {
    method: 'POST',
    body: formData,
    // Do not add Content-Type header, the browser will set it correctly with the boundary
  });
}

/**
 * Delete a file from a report log
 * @param {string|number} fileId - The ID of the file to delete
 * @returns {Promise<Object>} - The result of the delete operation
 * @endpoint {{base_url}}/reports/logs/files/{fileId}
 */
export async function deleteReportLogFile(fileId) {
  console.log(`Deleting file with ID ${fileId} using endpoint: /reports/logs/files/${fileId}`);
  return apiRequest(`/reports/logs/files/${fileId}`, { method: 'DELETE' });
}

/**
 * Get all departments
 * @returns {Promise<Array>} - List of departments
 */
export async function getReportLogDepartments() {
  return apiRequest('/reports/logs/departments', { method: 'GET' });
}

/**
 * Export report logs to CSV
 * @param {Object} params - Optional query parameters for filtering
 * @returns {Promise<Blob>} - CSV file as a Blob
 */
export async function exportReportLogsToCSV(params = {}) {
  // Build query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  const endpoint = `/reports/logs/export${queryString ? `?${queryString}` : ''}`;
  
  // Use fetch directly for blob response
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = getAuthHeaders();
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...authHeaders,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to export CSV: ${errorText}`);
  }
  
  return response.blob();
}

/**
 * Update a staff member's information
 * @param {string|number} staffId - The ID of the staff member to update
 * @param {Object} staffData - The updated staff data
 * @returns {Promise<Object>} - The updated staff member data
 */
export async function updateStaff(staffId, staffData) {
  if (!staffId) {
    console.error('Staff ID is required for updating staff');
    throw new Error('Staff ID is required for updating staff');
  }
  
  console.log(`Updating staff member with ID: ${staffId}`, staffData);
  
  return apiRequest(`/staff-management/${staffId}`, {
    method: 'PATCH',
    body: JSON.stringify(staffData),
  });
}

/**
 * Get a staff member's profile image URL
 * @param {string|number} userId - The ID of the user whose profile image to retrieve
 * @returns {string} - The URL to the profile image
 */
export function getStaffProfileImageUrl(userId) {
  if (!userId) {
    console.warn('User ID is required to get profile image URL');
    return '';
  }
  
  // Build the URL using the API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  return `${API_BASE_URL}/users/profile-image/${userId}`;
}

/**
 * Fetch a staff member's profile image and convert to a displayable URL
 * @param {string|number} userId - The ID of the user whose profile image to retrieve
 * @returns {Promise<string>} - The image as a data URL that can be used in img src
 */
export async function fetchStaffProfileImage(userId) {
  if (!userId) {
    console.error('User ID is required to fetch profile image');
    throw new Error('User ID is required to fetch profile image');
  }
  
  try {
    // Build the URL using the API base URL
    const url = getStaffProfileImageUrl(userId);
    console.log(`Fetching profile image from: ${url}`);
    
    // Get auth headers
    const authHeaders = getAuthHeaders();
    
    // Make the direct fetch call
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeaders
      }
    });
    
    if (!response.ok) {
      // If image not found, don't treat as an error, just return empty string
      if (response.status === 404) {
        console.log(`No profile image found for user ID: ${userId}`);
        return '';
      }
      
      throw new Error(`Failed to fetch profile image: ${response.status} ${response.statusText}`);
    }
    
    // Get the blob and convert to a data URL
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`Error fetching profile image for user ID ${userId}:`, error);
    throw error;
  }
}