/**
 * Utility functions for handling network and API errors
 */

/**
 * Get a user-friendly error message based on the error object
 * @param {Error} err - The error object
 * @param {string} context - The context in which the error occurred (e.g., 'loading tasks', 'updating task')
 * @returns {string} A user-friendly error message
 */
export const getErrorMessage = (err, context = 'performing this action') => {
  // Network errors
  if (err.name === 'TypeError' && err.message.includes('fetch')) {
    return `Network error: Unable to connect to the server while ${context}. Please check your internet connection and try again.`;
  }
  
  if (err.message.includes('NetworkError') || err.message.includes('Network request failed')) {
    return `Network error: The connection to the server was lost while ${context}. Please check your internet connection and try again.`;
  }
  
  if (err.message.includes('timeout') || err.message.includes('Timeout')) {
    return `Network error: The request timed out while ${context}. Please try again later.`;
  }
  
  // HTTP status code errors
  if (err.message.includes('401')) {
    return `Authentication error: Your session may have expired. Please log in again.`;
  }
  
  if (err.message.includes('403')) {
    return `Authorization error: You don't have permission to ${context}.`;
  }
  
  if (err.message.includes('404')) {
    return `Resource not found: The requested resource could not be found.`;
  }
  
  if (err.message.includes('500')) {
    return `Server error: The server encountered an error while ${context}. Please try again later.`;
  }
  
  // Offline detection
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return `You appear to be offline. Please check your internet connection and try again.`;
  }
  
  // Default error message
  return `Failed while ${context}: ${err.message}`;
};

/**
 * Handle API response errors
 * @param {Response} response - The fetch API response object
 * @returns {Promise<void>} - Throws an error with appropriate message if response is not ok
 */
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (${response.status}):`, errorText);
    
    throw new Error(`Error: ${response.status} - ${errorText}`);
  }
  
  return response;
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} - The result of the function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed:`, err);
      lastError = err;
      
      // Don't retry for certain errors
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('404')) {
        throw err;
      }
      
      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}; 