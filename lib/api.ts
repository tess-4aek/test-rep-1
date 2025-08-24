import { BASE_URL } from './baseUrl';

export interface ApiError extends Error {
  code?: string;
  status?: number;
}

export interface PostJSONOptions {
  timeoutMs?: number;
}

/**
 * Make a POST request with JSON body and proper error handling
 */
export async function postJSON<T = any>(
  path: string, 
  data: any, 
  options: PostJSONOptions = {}
): Promise<T> {
  const { timeoutMs = 10000 } = options;
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    console.log(`🌐 POST ${BASE_URL}${path}`);
    
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      const error = new Error('Invalid response format') as ApiError;
      error.status = response.status;
      throw error;
    }
    
    if (!response.ok) {
      console.error(`❌ API Error (${response.status}):`, responseData);
      const error = new Error(responseData.message || 'Request failed') as ApiError;
      error.code = responseData.code;
      error.status = response.status;
      throw error;
    }
    
    console.log(`✅ POST ${path} success`);
    return responseData;
    
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`⏰ Request timeout after ${timeoutMs}ms`);
      const timeoutError = new Error('Request timed out. Please check your connection.') as ApiError;
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    
    if (error.message === 'Network request failed') {
      console.error('🚫 Network request failed - check BASE_URL and server status');
      const networkError = new Error('Network error. Please check your connection and try again.') as ApiError;
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }
    
    // Re-throw API errors as-is
    if (error.code || error.status) {
      throw error;
    }
    
    // Wrap unknown errors
    console.error('💥 Unexpected error:', error);
    const unknownError = new Error('An unexpected error occurred') as ApiError;
    unknownError.code = 'UNKNOWN_ERROR';
    throw unknownError;
  }
}